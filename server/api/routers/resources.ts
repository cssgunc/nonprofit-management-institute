import z from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import {
  cohort_memberships,
  cohorts,
  modules,
  profiles,
  resources,
} from "@/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const ResourceTypeEnum = z.enum([
  "handout",
  "recording",
  "link",
]);

export type ResourceType = z.infer<typeof ResourceTypeEnum>;

export type Resource = {
  id: string;
  moduleSlug: string;
  title: string;
  type: ResourceType;
  url?: string | null;
  cohortId: string | null;
  created_by: string;
};

type Viewer = {
  role: "admin" | "student";
  cohortId: string | null;
};

/**
 * Takes a userID and ensures its existence in profiles database and cohort_memberships database
 */
async function getViewer(userId: string): Promise<Viewer> {
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
  }

  const [membership] = await db
    .select({ cohortId: cohort_memberships.cohort_id })
    .from(cohort_memberships)
    .where(eq(cohort_memberships.profiles_id, userId))
    .limit(1);

  return {
    role: profile.role,
    cohortId:
      membership?.cohortId !== null && membership?.cohortId !== undefined
        ? String(membership.cohortId)
        : null,
  };
}

function isStudent(viewer: Viewer): boolean {
  return viewer.role === "student";
}

function isAdmin(viewer: Viewer): boolean {
  return viewer.role === "admin";
}

function assertAdmin(viewer: Viewer): void {
  if (!isAdmin(viewer)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
  }
}

/**
 * Returns true when the viewer is allowed to see a resource.
 * - Global resources (cohortId === null) are visible to everyone.
 * - Admins can see everything.
 * - Students can only see resources whose cohort matches their own.
 */
function userCanAccessCohortScopedResource(viewer: Viewer, cohortId: string | null): boolean {
  if (!cohortId) return true;
  if (isAdmin(viewer)) return true;
  return viewer.cohortId === cohortId;
}

/**
 * Helper that finds and returns a module from slug
 */
async function findModuleBySlugOrThrow(moduleSlug: string) {
  const [mod] = await db
    .select({ id: modules.id, slug: modules.slug, is_locked: modules.is_locked })
    .from(modules)
    .where(eq(modules.slug, moduleSlug))
    .limit(1);

  if (!mod) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Module not found" });
  }

  return mod;
}

function assertStudentNotLockedFromModule(viewer: Viewer, isLocked: boolean | null | undefined): void {
  if (isStudent(viewer) && isLocked === true) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Module is locked" });
  }
}

function parseResourceIdOrThrow(id: string): number {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid resource id" });
  }
  return parsed;
}

async function assertCohortIdValidOrNull(cohortId: string | null): Promise<void> {
  if (cohortId === null) return;
  const parsed = Number(cohortId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid cohortId" });
  }

  const [cohort] = await db
    .select({ id: cohorts.id })
    .from(cohorts)
    .where(eq(cohorts.id, parsed))
    .limit(1);

  if (!cohort) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid cohortId" });
  }
}

function mapResourceRowToDto(
  row: {
    id: number;
    title: string;
    type: "handout" | "recording" | "link";
    url: string | null;
    cohortId: number | null;
    created_by: string | null;
  },
  moduleSlug: string,
): Resource {
  return {
    id: String(row.id),
    moduleSlug,
    title: row.title,
    type: row.type,
    url: row.url,
    cohortId: row.cohortId !== null ? String(row.cohortId) : null,
    created_by: row.created_by ?? "",
  };
}

// Router
export const resourcesRouter = createTRPCRouter({
  /**
   * resources.listByModuleSlug() -> Resource[]
   * - If viewer is student and module locked -> FORBIDDEN
   * - If type provided, filter by type
   * - Enforce cohort-scoped visibility for non-admins
   */
  listByModuleSlug: protectedProcedure
    .input(
      z.object({
        moduleSlug: z.string().min(1),
        type: ResourceTypeEnum.optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const viewer = await getViewer(ctx.subject.id);

      const foundModule = await findModuleBySlugOrThrow(input.moduleSlug);
      assertStudentNotLockedFromModule(viewer, foundModule.is_locked);

      const baseWhere = and(
        eq(resources.module_id, foundModule.id),
        input.type ? eq(resources.type, input.type) : undefined,
      );

      const rows = await db
        .select({
          id: resources.id,
          title: resources.title,
          type: resources.type,
          url: resources.url,
          cohortId: resources.cohort_id,
          created_by: resources.created_by,
        })
        .from(resources)
        .where(baseWhere);

      return rows
        .filter((r) =>
          userCanAccessCohortScopedResource(
            viewer,
            r.cohortId !== null ? String(r.cohortId) : null,
          ),
        )
        .map((r) => mapResourceRowToDto(r, foundModule.slug));
    }),

  /**
   * resources.byId() -> Resource
   * - NOT_FOUND if missing
   * - Enforce module lock for students
   * - Enforce cohort-scoped visibility for non-admins
   */
  byId: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const viewer = await getViewer(ctx.subject.id);
      const resourceId = parseResourceIdOrThrow(input.id);

      const [row] = await db
        .select({
          id: resources.id,
          title: resources.title,
          type: resources.type,
          url: resources.url,
          cohortId: resources.cohort_id,
          created_by: resources.created_by,
          moduleSlug: modules.slug,
          moduleLocked: modules.is_locked,
        })
        .from(resources)
        .leftJoin(modules, eq(resources.module_id, modules.id))
        .where(eq(resources.id, resourceId))
        .limit(1);

      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
      }

      assertStudentNotLockedFromModule(viewer, row.moduleLocked);

      if (!userCanAccessCohortScopedResource(viewer, row.cohortId !== null ? String(row.cohortId) : null)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return mapResourceRowToDto(
        {
          id: row.id,
          title: row.title,
          type: row.type,
          url: row.url,
          cohortId: row.cohortId,
          created_by: row.created_by,
        },
        row.moduleSlug ?? "",
      );
    }),

  /**
   * resources.create()
   * - Admin-only -> FORBIDDEN
   * - Validates: title nonempty, type valid, cohortId null or valid FK
   * - Sets created_by = ctx.profile.id
   * - Inserts row
   */
  create: protectedProcedure
    .input(
      z.object({
        moduleSlug: z.string().min(1),
        title: z.string().trim().min(1, "Title cannot be empty"),
        type: ResourceTypeEnum,
        url: z.string().url().optional().nullable(),
        cohortId: z.string().min(1).nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const viewer = await getViewer(ctx.subject.id);
      assertAdmin(viewer);

      // Ensure the module exists before attaching a resource to it
      const foundModule = await findModuleBySlugOrThrow(input.moduleSlug);
      await assertCohortIdValidOrNull(input.cohortId);

      const cohortIdAsInt = input.cohortId !== null ? Number(input.cohortId) : null;

      const [inserted] = await db
        .insert(resources)
        .values({
          module_id: foundModule.id,
          title: input.title.trim(),
          type: input.type,
          url: input.url ?? null,
          cohort_id: cohortIdAsInt,
          created_by: ctx.subject.id,
        })
        .returning({
          id: resources.id,
          title: resources.title,
          type: resources.type,
          url: resources.url,
          cohortId: resources.cohort_id,
          created_by: resources.created_by,
        });

      if (!inserted) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create resource" });
      }

      return mapResourceRowToDto(inserted, foundModule.slug);
    }),

  /**
   * resources.update()
   * - Admin-only
   * - NOT_FOUND if missing
   * - Validates: title nonempty (if provided), type valid (if provided),
   *              cohortId null or valid FK (if provided)
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        title: z.string().trim().min(1).optional(),
        type: ResourceTypeEnum.optional(),
        url: z.string().url().optional().nullable(),
        cohortId: z.string().min(1).nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const viewer = await getViewer(ctx.subject.id);
      assertAdmin(viewer);

      const resourceId = parseResourceIdOrThrow(input.id);

      const [exists] = await db
        .select({
          id: resources.id,
          title: resources.title,
          type: resources.type,
          url: resources.url,
          cohortId: resources.cohort_id,
          created_by: resources.created_by,
          moduleSlug: modules.slug,
        })
        .from(resources)
        .leftJoin(modules, eq(resources.module_id, modules.id))
        .where(eq(resources.id, resourceId))
        .limit(1);

      if (!exists) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
      }

      if (input.cohortId !== undefined) {
        await assertCohortIdValidOrNull(input.cohortId);
      }

      const [updated] = await db
        .update(resources)
        .set({
          title: input.title !== undefined ? input.title.trim() : exists.title,
          type: input.type ?? exists.type,
          url: input.url !== undefined ? input.url : exists.url,
          cohort_id:
            input.cohortId !== undefined
              ? input.cohortId !== null
                ? Number(input.cohortId)
                : null
              : exists.cohortId,
        })
        .where(eq(resources.id, resourceId))
        .returning({
          id: resources.id,
          title: resources.title,
          type: resources.type,
          url: resources.url,
          cohortId: resources.cohort_id,
          created_by: resources.created_by,
        });

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
      }

      return mapResourceRowToDto(updated, exists.moduleSlug ?? "");
    }),

  /**
   * resources.delete()
   * - Admin-only
   * - NOT_FOUND if missing
   * - Deletes the row
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const viewer = await getViewer(ctx.subject.id);
      assertAdmin(viewer);

      const resourceId = parseResourceIdOrThrow(input.id);

      const [deleted] = await db
        .delete(resources)
        .where(eq(resources.id, resourceId))
        .returning({
          id: resources.id,
          title: resources.title,
          type: resources.type,
          url: resources.url,
          cohortId: resources.cohort_id,
          created_by: resources.created_by,
          moduleId: resources.module_id,
        });

      if (!deleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
      }

      let moduleSlug = "";
      if (deleted.moduleId !== null) {
        const [foundModule] = await db
          .select({ slug: modules.slug })
          .from(modules)
          .where(eq(modules.id, deleted.moduleId))
          .limit(1);
        moduleSlug = foundModule?.slug ?? "";
      }

      return mapResourceRowToDto(
        {
          id: deleted.id,
          title: deleted.title,
          type: deleted.type,
          url: deleted.url,
          cohortId: deleted.cohortId,
          created_by: deleted.created_by,
        },
        moduleSlug,
      );
    }),
});
