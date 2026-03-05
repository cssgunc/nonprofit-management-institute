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


const hasCohortMembership = protectedProcedure
  .input(z.object({ userId: z.string(), }))
  .output(CohortSchema)
  .query(async ({ ctx }) => {
    const userId = ctx.subject.id;
    const membership = await db.query.cohort_memberships.findFirst({
      where: eq(cohort_memberships.profiles_id, userId),
    });
    if (!membership) throw new TRPCError({ code: "NOT_FOUND", message: "No cohort membership found for user" });
    const cohort = await db.query.cohorts.findFirst({
      where: eq(cohorts.id, membership?.cohort_id ?? -1),
    });
    if (!cohort) throw new TRPCError({ code: "NOT_FOUND", message: "Cohort not found" });
    return cohort;
  });

  const joinCohort = protectedProcedure
  .input(z.object({ accessHash: z.string(), }))
  .output(CohortSchema)
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.subject.id;
    const cohort = await db.query.cohorts.findFirst({
      where: eq(cohorts.access_hash, input.accessHash),
    });
    if (!cohort) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid access code" });
    const existingMembership = await db.query.cohort_memberships.findFirst({
      where: eq(cohort_memberships.profiles_id, userId),
    });

    if (existingMembership) throw new TRPCError({code: "CONFLICT", message: "User already belongs to a cohort",});
    await db.insert(cohort_memberships).values({
      profiles_id: userId,
      cohort_id: cohort.id,
    });
    return cohort;
  });

export const cohortsApiRouter = createTRPCRouter({
  hasCohortMembership,
  joinCohort
});
