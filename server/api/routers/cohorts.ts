import { z } from "zod";
import { eq, and, count, sql } from "drizzle-orm";
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

      // Delete dependent rows first
      await db
        .delete(discussions_post)
        .where(eq(discussions_post.cohort_id, input.id));

      await db.delete(resources).where(eq(resources.cohort_id, input.id));

      await db
        .delete(cohort_memberships)
        .where(eq(cohort_memberships.cohort_id, input.id));

      await db.delete(cohorts).where(eq(cohorts.id, input.id));
    }),
});
