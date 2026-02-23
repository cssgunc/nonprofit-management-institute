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
const list = publicProcedure.output(z.array(ModuleSummary)).query(async () => {
  const sortedModules = [...mockModules].sort(
    (a, b) => a.module_index - b.module_index,
  );

  return sortedModules;
});

/**
 * Get module by slug.
 */
const bySlug = protectedProcedure
  .input(ModuleBySlugInput)
  .output(ModuleDetail)
  .query(async ({ ctx, input }) => {
    const { slug } = input;

    const foundModule = mockModules.find((m) => m.slug === slug);

    if (!foundModule) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Module with slug "${slug}" not found`,
      });
    }

    const viewer = getMockViewerFromSubject(ctx.subject);

    if (foundModule.locked && viewer.role === "student") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "This module is locked",
      });
    }

    return foundModule;
  });

/**
 * Router for all module-related APIs.
 */
export const modulesApiRouter = createTRPCRouter({
  list,
  bySlug,
});
