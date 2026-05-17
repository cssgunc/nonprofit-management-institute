import { z } from "zod";
import { eq, and, count, sql, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { db } from "@/server/db";
import {
  cohorts,
  cohort_memberships,
  profiles,
  resources,
  discussions_post,
  cohort_modules,
  modules,
} from "@/server/db/schema";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { supabaseAdmin } from "@/server/lib/supabaseAdmin";
import { discussion_likes } from "@/server/db/schema";
import path from "path";

/**
 * Extracts the storage path from a Supabase public URL.
 * e.g. "https://xxx.supabase.co/storage/v1/object/public/avatars/user-123/photo.png"
 * → "user-123/photo.png"
 * Returns null if the URL doesn't belong to the given bucket.
 */
function extractStoragePath(url: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  return idx !== -1 ? decodeURIComponent(url.slice(idx + marker.length)) : null;
}

const CohortSchema = z.object({
  id: z.number(),
  is_active: z.boolean().nullable(),
  access_hash: z.string(),
  slug: z.string().nullable(),
});

const CohortWithStatsSchema = z.object({
  id: z.number(),
  slug: z.string().nullable(),
  is_active: z.boolean().nullable(),
  member_count: z.number(),
  recent_logins: z.number(),
});

async function requireAdmin(userId: string) {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
  });
  if (!profile || profile.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
}

export const cohortsApiRouter = createTRPCRouter({
  list: protectedProcedure
    .output(z.array(CohortSchema))
    .query(async ({ ctx }) => {
      const [profile] = await db
        .select({ role: profiles.role })
        .from(profiles)
        .where(eq(profiles.id, ctx.subject.id))
        .limit(1);

      if (!profile || profile.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can list cohorts",
        });
      }

      const rows = await db.select().from(cohorts);
      return rows.map((r) => CohortSchema.parse(r));
    }),

  createCohort: protectedProcedure
    .input(
      z.object({
        slug: z
          .string()
          .trim()
          .min(1)
          .regex(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            "Slug must be lowercase letters, digits, and hyphens (e.g. fall-2026)",
          ),
        accessHash: z.string().trim().min(1),
      }),
    )
    .output(CohortSchema)
    .mutation(async ({ ctx, input }) => {
      const [profile] = await db
        .select({ role: profiles.role })
        .from(profiles)
        .where(eq(profiles.id, ctx.subject.id))
        .limit(1);

      if (!profile || profile.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can create cohorts",
        });
      }

      const existingSlug = await db.query.cohorts.findFirst({
        where: eq(cohorts.slug, input.slug),
      });
      if (existingSlug) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A cohort with this slug already exists",
        });
      }

      const existingHash = await db.query.cohorts.findFirst({
        where: eq(cohorts.access_hash, input.accessHash),
      });
      if (existingHash) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A cohort with this access code already exists",
        });
      }

      // create the Cohort
      const [inserted] = await db
        .insert(cohorts)
        .values({
          slug: input.slug,
          access_hash: input.accessHash,
          is_active: true,
        })
        .returning();

      if (!inserted) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create cohort",
        });
      }

      // add the Admin to the Cohort Membership
      await db.insert(cohort_memberships).values({
        profiles_id: ctx.subject.id,
        cohort_id: inserted.id,
      });

      // fetch the existing global modules
      const existingModules = await db.select({ id: modules.id }).from(modules);

      // ensure modules exist in the DB to link to
      if (existingModules.length > 0) {
        // create the bridge links in cohort_modules so this cohort can see them
        await db.insert(cohort_modules).values(
          existingModules.map((mod) => ({
            cohort_id: inserted.id,
            module_id: mod.id,
            is_active: true, // or false, depending on if you want them hidden by default
          })),
        );
      } else {
        console.warn(
          "No global modules found in the database to link to the new cohort.",
        );
      }

      return CohortSchema.parse(inserted);
    }),

  hasCohortMembership: publicProcedure
    .input(z.object({ userId: z.string().uuid().optional() }))
    .output(CohortSchema.nullable())
    .query(async ({ ctx, input }) => {
      if (!ctx.subject) {
        console.log("No ctx.subject, returning null");
        return null;
      }

      const userId = input.userId || ctx.subject.id;
      if (ctx.subject.id !== userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const membership = await db.query.cohort_memberships.findFirst({
        where: eq(cohort_memberships.profiles_id, userId),
      });

      if (!membership?.cohort_id) {
        console.log("No membership, returning null");
        return null;
      }

      const cohort = await db.query.cohorts.findFirst({
        where: and(
          eq(cohorts.id, membership.cohort_id),
          eq(cohorts.is_active, true),
        ),
      });

      if (!cohort || !cohort.slug) {
        console.log("Cohort not valid, returning null");
        return null;
      }

      return CohortSchema.parse(cohort);
    }),

  bySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .output(CohortSchema)
    .query(async ({ input }) => {
      const cohort = await db.query.cohorts.findFirst({
        where: eq(cohorts.slug, input.slug),
      });

      if (!cohort) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Cohort with slug "${input.slug}" not found`,
        });
      }

      return CohortSchema.parse(cohort);
    }),

  joinCohort: protectedProcedure
    .input(
      z.object({
        accessHash: z.string().min(1),
        userId: z.string().uuid(),
      }),
    )
    .output(CohortSchema)
    .mutation(async ({ input, ctx }) => {
      const { accessHash, userId } = input;

      const cohort = await db.query.cohorts.findFirst({
        where: eq(cohorts.access_hash, accessHash),
      });

      if (!cohort) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid access code",
        });
      }

      if (cohort.is_active !== true) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cohort is not active",
        });
      }

      if (!cohort.slug) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Cohort is not properly configured",
        });
      }

      // Get user profile to check role
      const userProfile = await db.query.profiles.findFirst({
        where: eq(profiles.id, userId),
      });

      if (!userProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User profile not found",
        });
      }

      const existingMembership = await db.query.cohort_memberships.findFirst({
        where: eq(cohort_memberships.profiles_id, userId),
      });

      // If user is a student and already has a membership, prevent joining
      if (userProfile.role === "student" && existingMembership) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Students can only belong to one cohort",
        });
      }

      // Check if user is already a member of this specific cohort
      const existingMembershipForCohort =
        await db.query.cohort_memberships.findFirst({
          where: and(
            eq(cohort_memberships.profiles_id, userId),
            eq(cohort_memberships.cohort_id, cohort.id),
          ),
        });

      if (existingMembershipForCohort) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User is already a member of this cohort",
        });
      }

      await db.insert(cohort_memberships).values({
        profiles_id: userId,
        cohort_id: cohort.id,
      });

      return CohortSchema.parse(cohort);
    }),

  getAllCohorts: protectedProcedure
    .output(z.array(CohortWithStatsSchema))
    .query(async ({ ctx }) => {
      await requireAdmin(ctx.subject.id);

      const allCohorts = await db.select().from(cohorts);

      const results = await Promise.all(
        allCohorts.map(async (cohort) => {
          const [memberCountRow] = await db
            .select({ count: count() })
            .from(cohort_memberships)
            .innerJoin(
              profiles,
              eq(profiles.id, cohort_memberships.profiles_id),
            )
            .where(
              and(
                eq(cohort_memberships.cohort_id, cohort.id),
                eq(profiles.role, "student"),
              ),
            );

          // Query auth.users via raw SQL to get last_sign_in_at
          const recentLoginsResult = await db.execute(sql`
            SELECT COUNT(DISTINCT cm.profiles_id)::int AS recent_count
            FROM cohort_memberships cm
            JOIN profiles p ON p.id = cm.profiles_id
            JOIN auth.users u ON u.id = cm.profiles_id
            WHERE cm.cohort_id = ${cohort.id}
              AND p.role = 'student'
              AND u.last_sign_in_at > NOW() - INTERVAL '14 days'
          `);

          const recentLogins =
            (recentLoginsResult[0] as { recent_count: number } | undefined)
              ?.recent_count ?? 0;

          return {
            id: cohort.id,
            slug: cohort.slug ?? null,
            is_active: cohort.is_active ?? null,
            member_count: memberCountRow?.count ?? 0,
            recent_logins: recentLogins,
          };
        }),
      );

      return results;
    }),

  setActiveStatus: protectedProcedure
    .input(z.object({ id: z.number(), is_active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.subject.id);

      await db
        .update(cohorts)
        .set({ is_active: input.is_active })
        .where(eq(cohorts.id, input.id));
    }),

  deleteCohort: protectedProcedure
  .input(z.object({ id: z.number() }))
  .mutation(async ({ ctx, input }) => {
    await requireAdmin(ctx.subject.id);

    // Fetch the cohort slug for storage cleanup
    const [cohort] = await db
      .select({ slug: cohorts.slug })
      .from(cohorts)
      .where(eq(cohorts.id, input.id))
      .limit(1);

    if (!cohort) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Cohort not found" });
    }

    // 1. Collect file-backed resource URLs before deleting rows
    const cohortResources = await db
      .select({ url: resources.url, type: resources.type })
      .from(resources)
      .where(eq(resources.cohort_id, input.id));

    const urlPaths = cohortResources
      .filter((r) => r.url && r.type !== "link")
      .map((r) => {
        const marker = `/storage/v1/object/public/module-resources/`;
        const idx = r.url!.indexOf(marker);
        return idx !== -1
          ? decodeURIComponent(r.url!.slice(idx + marker.length))
          : null;
      })
      .filter((p): p is string => p !== null);

    // 2. Delete known files from storage
    if (urlPaths.length > 0) {
      const { error } = await supabaseAdmin.storage
        .from("module-resources")
        .remove(urlPaths);
      if (error) {
        console.error("Failed to delete resource files from storage:", error.message);
      }
    }

    // 3. Sweep the cohort's storage folder for any orphaned files
    // (files uploaded to storage but whose DB row was never created or already deleted)
    if (cohort.slug) {
      const sweepFolder = async (folderPath: string) => {
        const { data: items } = await supabaseAdmin.storage
          .from("module-resources")
          .list(folderPath, { limit: 1000 });

        if (!items || items.length === 0) return;

        const filePaths: string[] = [];
        for (const item of items) {
          const fullPath = `${folderPath}/${item.name}`;
          if (item.metadata) {
            // It's a file
            filePaths.push(fullPath);
          } else {
            // It's a subfolder — recurse
            await sweepFolder(fullPath);
          }
        }

        if (filePaths.length > 0) {
          await supabaseAdmin.storage
            .from("module-resources")
            .remove(filePaths);
        }
      };

      await sweepFolder(cohort.slug);
    }

    
    const studentProfiles = await db
        .select({ avatarUrl: profiles.avatarUrl, role: profiles.role })
        .from(cohort_memberships)
        .innerJoin(profiles, eq(profiles.id, cohort_memberships.profiles_id))
        .where(
          and(
            eq(cohort_memberships.cohort_id, input.id),
            eq(profiles.role, "student"),
          )
        );

      console.log("Student profiles found:", studentProfiles.length);
      console.log("Avatar URLs:", studentProfiles.map((p) => p.avatarUrl));

      const avatarPaths = studentProfiles
  .filter((p) => p.avatarUrl !== null)
  .map((p) => {
    const url = p.avatarUrl!;
    const marker = `/storage/v1/object/public/avatars/`;
    const idx = url.indexOf(marker);
    // If it's a full URL, extract the path; otherwise use the value as-is
    return idx !== -1
      ? decodeURIComponent(url.slice(idx + marker.length))
      : url;
  });

console.log("Final avatar paths to delete:", avatarPaths);

if (avatarPaths.length > 0) {
  const { error } = await supabaseAdmin.storage
    .from("avatars")
    .remove(avatarPaths);
  if (error) {
    console.error("Failed to delete student avatars from storage:", error.message);
  }
}
    

    // 4. Delete DB rows in dependency order
    const posts = await db
      .select({ id: discussions_post.id })
      .from(discussions_post)
      .where(eq(discussions_post.cohort_id, input.id));

    if (posts.length > 0) {
      await db
        .delete(discussion_likes)
        .where(inArray(discussion_likes.post_id, posts.map((p) => p.id)));
    }

    await db.delete(discussions_post).where(eq(discussions_post.cohort_id, input.id));
    await db.delete(resources).where(eq(resources.cohort_id, input.id));
    await db.delete(cohort_memberships).where(eq(cohort_memberships.cohort_id, input.id));
    await db.delete(cohort_modules).where(eq(cohort_modules.cohort_id, input.id));
    await db.delete(cohorts).where(eq(cohorts.id, input.id));
  }),
});
