import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { db } from "@/server/db";
import { cohorts, cohort_memberships, profiles } from "@/server/db/schema";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";

const CohortSchema = z.object({
  id: z.number(),
  is_active: z.boolean().nullable(),
  access_hash: z.string(),
  slug: z.string().nullable(),
});

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
});
