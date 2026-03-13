import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { db } from "@/server/db";
import { cohorts, cohort_memberships } from "@/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const CohortSchema = z.object({
  id: z.number(),
  is_active: z.boolean().nullable(),
  access_hash: z.string(),
  slug: z.string().nullable(),
});

export const cohortsApiRouter = createTRPCRouter({
  hasCohortMembership: protectedProcedure
    .output(CohortSchema.nullable())
    .query(async ({ ctx }) => {
      const userId = ctx.subject.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const membership = await db.query.cohort_memberships.findFirst({
        where: eq(cohort_memberships.profiles_id, userId),
      });

      if (!membership?.cohort_id) return null;

      const cohort = await db.query.cohorts.findFirst({
        where: eq(cohorts.id, membership.cohort_id),
      });

      if (!cohort) return null;

      return CohortSchema.parse(cohort);
    }),

  joinCohort: protectedProcedure
    .input(
      z.object({
        accessHash: z.string().min(1),
        userId: z.string().uuid(),
      })
    )
    .output(CohortSchema)
    .mutation(async ({ input, ctx }) => {
      console.log("joinCohort input:", input);
      console.log("ctx.subject:", ctx.subject);
      const { accessHash, userId } = input;

      const cohort = await db.query.cohorts.findFirst({
        where: eq(cohorts.access_hash, accessHash),
      });

      if (!cohort) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invalid access code" });
      }

      const existingMembership = await db.query.cohort_memberships.findFirst({
        where: eq(cohort_memberships.profiles_id, userId),
      });

      if (existingMembership) {
        throw new TRPCError({ code: "CONFLICT", message: "User already belongs to a cohort" });
      }

      await db.insert(cohort_memberships).values({
        profiles_id: userId,
        cohort_id: cohort.id,
      });

      return CohortSchema.parse(cohort);
    }),
});