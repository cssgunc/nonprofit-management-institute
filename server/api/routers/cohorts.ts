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
} from "@/server/db/schema";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "../trpc";

const CohortSchema = z.object({
  id: z.number(),
  is_active: z.boolean().nullable(),
  access_hash: z.string(),
  slug: z.string().nullable(),
});

const CohortWithStatsSchema = z.object({
  id: z.number(),
  name: z.string().nullable(),
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

      if (userProfile.role === "student" && existingMembership) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Students can only belong to one cohort",
        });
      }

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
            .innerJoin(profiles, eq(profiles.id, cohort_memberships.profiles_id))
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
            name: cohort.name ?? null,
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

      await db
        .delete(resources)
        .where(eq(resources.cohort_id, input.id));

      await db
        .delete(cohort_memberships)
        .where(eq(cohort_memberships.cohort_id, input.id));

      await db.delete(cohorts).where(eq(cohorts.id, input.id));
    }),
});
