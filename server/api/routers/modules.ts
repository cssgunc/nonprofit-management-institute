import z from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { mockModules } from "@/server/mock/data";
import { getMockViewerFromSubject } from "@/server/mock/viewers";

const ModuleSummary = z.object({
  id: z.string(),
  module_index: z.number(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  locked: z.boolean(),
});

const ModuleDetail = ModuleSummary;

const ModuleBySlugInput = z.object({
  slug: z.string(),
});

/**
 * List all modules ordered by module_index.
 * Returns locked modules in list, but they cannot be opened unless user is admin.
 */
const list = publicProcedure
  .output(z.array(ModuleSummary))
  .query(async () => {
    // Sort modules by module_index ascending
    const sortedModules = [...mockModules].sort(
      (a, b) => a.module_index - b.module_index
    );

    // Map to snake_case format
    return sortedModules.map((module) => ({
      id: module.id,
      module_index: module.module_index,
      slug: module.slug,
      title: module.title,
      description: module.description,
      locked: module.locked,
    }));
  });

/**
 * Get module by slug.
 * - Returns module if exists and accessible
 * - Throws NOT_FOUND if slug does not exist
 * - For students, throws FORBIDDEN if locked = true
 * - For admins, returns module regardless of locked status
 */
const bySlug = protectedProcedure
  .input(ModuleBySlugInput)
  .output(ModuleDetail)
  .query(async ({ ctx, input }) => {
    const { slug } = input;

    // Find module by slug
    const module = mockModules.find((m) => m.slug === slug);

    if (!module) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Module with slug "${slug}" not found`,
      });
    }

    // Get viewer info to check role
    const viewer = getMockViewerFromSubject(ctx.subject);

    // If module is locked and user is a student, throw FORBIDDEN
    if (module.locked && viewer.role === "student") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "This module is locked",
      });
    }

    // Return module detail in snake_case format
    return {
      id: module.id,
      module_index: module.module_index,
      slug: module.slug,
      title: module.title,
      description: module.description,
      locked: module.locked,
    };
  });

/**
 * Router for all module-related APIs.
 */
export const modulesRouter = createTRPCRouter({
  list,
  bySlug,
});