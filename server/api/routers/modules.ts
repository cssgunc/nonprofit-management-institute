import z from "zod";
import { TRPCError } from "@trpc/server";
import { eq, asc, and } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "@/server/db";
import {
  modules,
  profiles,
  cohorts,
  cohort_modules,
  cohort_memberships,
} from "@/server/db/schema";

const ModuleSummary = z.object({
  id: z.number(),
  module_index: z.number(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  is_active: z.boolean(),
});

const ModuleDetail = ModuleSummary.extend({
  cohort_id: z.number(),
});

const CohortSlugInput = z.object({
  cohortSlug: z.string(),
});

const ModuleBySlugInput = z.object({
  slug: z.string(),
  cohortSlug: z.string(),
});

/** Resolve a cohort by its slug, throws NOT_FOUND if missing. */
async function resolveCohort(cohortSlug: string) {
  const [cohort] = await db
    .select()
    .from(cohorts)
    .where(eq(cohorts.slug, cohortSlug))
    .limit(1);
  if (!cohort) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Cohort "${cohortSlug}" not found`,
    });
  }
  return cohort;
}

/** Get the caller's role, defaults to "student". */
async function getRole(userId: string) {
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return profile?.role ?? "student";
}

/** Ensure the caller can access the given cohort. Admins are allowed globally. */
async function requireCohortAccess(userId: string, cohortId: number) {
  const role = await getRole(userId);

  if (role === "admin") {
    return role;
  }

  const [membership] = await db
    .select({ cohort_id: cohort_memberships.cohort_id })
    .from(cohort_memberships)
    .where(
      and(
        eq(cohort_memberships.profiles_id, userId),
        eq(cohort_memberships.cohort_id, cohortId),
      ),
    )
    .limit(1);

  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this cohort",
    });
  }

  return role;
}

/**
 * List all modules for a cohort, ordered by module_index.
 * Callers receive active status so the UI can show locked modules differently.
 */
const list = protectedProcedure
  .input(CohortSlugInput)
  .output(z.array(ModuleSummary))
  .query(async ({ ctx, input }) => {
    const cohort = await resolveCohort(input.cohortSlug);
    await requireCohortAccess(ctx.subject.id, cohort.id);

    const rows = await db
      .select({
        id: modules.id,
        module_index: modules.module_index,
        slug: modules.slug,
        title: modules.title,
        description: modules.description,
        is_active: cohort_modules.is_active,
      })
      .from(modules)
      .innerJoin(
        cohort_modules,
        and(
          eq(cohort_modules.module_id, modules.id),
          eq(cohort_modules.cohort_id, cohort.id),
        ),
      )
      .orderBy(asc(modules.module_index));

    const result = rows.map((row) => ({
      id: row.id,
      module_index: row.module_index,
      slug: row.slug,
      title: row.title,
      description: row.description ?? null,
      is_active: row.is_active,
    }));

    return result;
  });

/**
 * Get module by slug within a cohort.
 * Non-admins cannot access inactive modules.
 */
const bySlug = protectedProcedure
  .input(ModuleBySlugInput)
  .output(ModuleDetail)
  .query(async ({ ctx, input }) => {
    const cohort = await resolveCohort(input.cohortSlug);
    const role = await requireCohortAccess(ctx.subject.id, cohort.id);

    const [foundModule] = await db
      .select({
        id: modules.id,
        module_index: modules.module_index,
        slug: modules.slug,
        title: modules.title,
        description: modules.description,
        is_active: cohort_modules.is_active,
      })
      .from(modules)
      .innerJoin(
        cohort_modules,
        and(
          eq(cohort_modules.module_id, modules.id),
          eq(cohort_modules.cohort_id, cohort.id),
        ),
      )
      .where(eq(modules.slug, input.slug))
      .limit(1);

    if (!foundModule) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Module with slug "${input.slug}" not found in this cohort`,
      });
    }

    if (!foundModule.is_active && role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "This module is not available",
      });
    }

    return {
      id: foundModule.id,
      module_index: foundModule.module_index,
      slug: foundModule.slug,
      title: foundModule.title,
      description: foundModule.description ?? null,
      is_active: foundModule.is_active,
      cohort_id: cohort.id,
    };
  });

const UpdateModuleStatusOutput = z.object({
  slug: z.string(),
  is_active: z.boolean(),
});

/**
 * Update a module's is_active status within a cohort. Admin only.
 */
const updateModuleStatus = protectedProcedure
  .input(
    z.object({
      slug: z.string(),
      cohortSlug: z.string(),
      isActive: z.boolean(),
    }),
  )
  .output(UpdateModuleStatusOutput)
  .mutation(async ({ ctx, input }) => {
    const cohort = await resolveCohort(input.cohortSlug);
    const role = await requireCohortAccess(ctx.subject.id, cohort.id);

    if (role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can update module status",
      });
    }

    const [mod] = await db
      .select({ id: modules.id })
      .from(modules)
      .where(eq(modules.slug, input.slug))
      .limit(1);

    if (!mod) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Module with slug "${input.slug}" not found`,
      });
    }

    const [updated] = await db
      .update(cohort_modules)
      .set({ is_active: input.isActive })
      .where(
        and(
          eq(cohort_modules.cohort_id, cohort.id),
          eq(cohort_modules.module_id, mod.id),
        ),
      )
      .returning();

    if (!updated) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Module is not associated with this cohort`,
      });
    }

    return {
      slug: input.slug,
      is_active: updated.is_active,
    };
  });

/**
 * Router for all module-related APIs.
 */
export const modulesApiRouter = createTRPCRouter({
  list,
  bySlug,
  updateModuleStatus,
});
