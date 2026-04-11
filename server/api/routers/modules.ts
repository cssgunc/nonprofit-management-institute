import z from "zod";
import { TRPCError } from "@trpc/server";
import { eq, asc } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { db } from "@/server/db";
import { modules } from "@/server/db/schema";

const ModuleSummary = z.object({
  id: z.number(),
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
 */
const list = publicProcedure.output(z.array(ModuleSummary)).query(async () => {
  const rows = await db
    .select({
      id: modules.id,
      module_index: modules.module_index,
      slug: modules.slug,
      title: modules.title,
      description: modules.description,
    })
    .from(modules)
    .orderBy(asc(modules.module_index));

  return rows.map((row) => ({
    id: row.id,
    module_index: row.module_index,
    slug: row.slug,
    title: row.title,
    description: row.description ?? null,
    locked: false,
  }));
});

/**
 * Get module by slug.
 */
const bySlug = protectedProcedure
  .input(ModuleBySlugInput)
  .output(ModuleDetail)
  .query(async ({ input }) => {
    const { slug } = input;

    const [foundModule] = await db
      .select({
        id: modules.id,
        module_index: modules.module_index,
        slug: modules.slug,
        title: modules.title,
        description: modules.description,
      })
      .from(modules)
      .where(eq(modules.slug, slug))
      .limit(1);

    if (!foundModule) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Module with slug "${slug}" not found`,
      });
    }

    return {
      id: foundModule.id,
      module_index: foundModule.module_index,
      slug: foundModule.slug,
      title: foundModule.title,
      description: foundModule.description ?? null,
      locked: false,
    };
  });

/**
 * Router for all module-related APIs.
 */
export const modulesApiRouter = createTRPCRouter({
  list,
  bySlug,
});
