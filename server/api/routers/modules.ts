import z from "zod";
import { TRPCError } from "@trpc/server";
import { eq, asc } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { db } from "@/server/db";
import { modules, profiles } from "@/server/db/schema";

const ModuleSummary = z.object({
  id: z.number(),
  module_index: z.number(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  locked: z.boolean(),
  is_active: z.boolean(),
});

const ModuleDetail = ModuleSummary;

const ModuleBySlugInput = z.object({
  slug: z.string(),
});

/**
 * List all modules ordered by module_index.
 * Returns locked modules in list, but they cannot be opened unless user is admin.
 */
const list = publicProcedure.output(z.array(ModuleSummary)).query(async () => {
  const rows = await db
    .select()
    .from(modules)
    .orderBy(asc(modules.module_index));

  return rows.map((row) => ({
    id: row.id,
    module_index: row.module_index,
    slug: row.slug,
    title: row.title,
    description: row.description ?? null,
    locked: row.is_locked ?? false,
    is_active: row.is_active ?? true,
  }));
});

/**
 * Get module by slug.
 */
const bySlug = protectedProcedure
  .input(ModuleBySlugInput)
  .output(ModuleDetail)
  .query(async ({ ctx, input }) => {
    const { slug } = input;

    const [foundModule] = await db
      .select()
      .from(modules)
      .where(eq(modules.slug, slug))
      .limit(1);

    if (!foundModule) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Module with slug "${slug}" not found`,
      });
    }

    const [profile] = await db
      .select({ role: profiles.role })
      .from(profiles)
      .where(eq(profiles.id, ctx.subject.id))
      .limit(1);

    const role = profile?.role ?? "student";

    if (foundModule.is_locked && role === "student") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "This module is locked",
      });
    }

    return {
      id: foundModule.id,
      module_index: foundModule.module_index,
      slug: foundModule.slug,
      title: foundModule.title,
      description: foundModule.description ?? null,
      locked: foundModule.is_locked ?? false,
      is_active: foundModule.is_active ?? true,
    };
  });

/**
 * Update a module's is_active status. Admin only.
 */
const updateModuleStatus = protectedProcedure
  .input(z.object({ slug: z.string(), isActive: z.boolean() }))
  .mutation(async ({ ctx, input }) => {
    const [profile] = await db
      .select({ role: profiles.role })
      .from(profiles)
      .where(eq(profiles.id, ctx.subject.id))
      .limit(1);

    if (!profile || profile.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can update module status",
      });
    }

    const [updated] = await db
      .update(modules)
      .set({ is_active: input.isActive })
      .where(eq(modules.slug, input.slug))
      .returning();

    if (!updated) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Module with slug "${input.slug}" not found`,
      });
    }

    return {
      slug: updated.slug,
      isActive: updated.is_active ?? true,
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
