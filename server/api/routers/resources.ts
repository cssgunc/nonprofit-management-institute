import z from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { mockModules, mockCohorts, mockResources } from "@/server/mock/data";
import { getMockViewerFromSubject, type Viewer } from "@/server/mock/viewers";

/**
 * Resource "type" validation.
 * Includes mock-data types (handout, recording) alongside the production domain types.
 * Trim to match the real DB enum once the schema is finalized.
 */

const ResourceTypeEnum = z.enum([
    "link",
    "file",
    "video",
    "doc",
    "assignment",
    "handout",
    "recording",
]);

export type ResourceType = z.infer<typeof ResourceTypeEnum>;

/**
 * Router-level Resource shape.
 * Uses moduleSlug (human-readable) instead of moduleId (FK) for convenience.
 */

export type Resource = {
    id: string;
    moduleSlug: string;
    title: string;
    type: ResourceType;
    url?: string | null;
    cohortId: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
};

/**
 * In-memory store seeded from mock data.
 * Supports create/update/delete in dev even without a real DB.
 * module_id is mapped to moduleSlug via mockModules for router compatibility.
 */
const resourceStore: Resource[] = mockResources.map((r) => {
    const mod = mockModules.find((m) => m.id === r.module_id);
    const now = new Date().toISOString();
    return {
        id: r.id,
        moduleSlug: mod?.slug ?? r.module_id,
        title: r.title,
        type: r.type as ResourceType,
        url: r.url ?? null,
        cohortId: r.cohort_id,
        created_by: r.created_by,
        created_at: now,
        updated_at: now,
    };
});


// Access-control helpers

function isAdmin(viewer: Viewer): boolean {
    return viewer.role === "admin";
}

function isStudent(viewer: Viewer): boolean {
    return viewer.role === "student";
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

function assertAdmin(viewer: Viewer): void {
    if (!isAdmin(viewer)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
    }
}

function findModuleBySlugOrThrow(moduleSlug: string) {
    const mod = mockModules.find((m) => m.slug === moduleSlug);
    if (!mod) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Module not found"});
    }
    return mod;
}

function assertStudentNotLocked(viewer: Viewer, moduleSlug: string): void {
    const mod = findModuleBySlugOrThrow(moduleSlug);
    if (isStudent(viewer) && mod.locked === true) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Module is locked" });
    }
}

function assertCohortIdValidOrNull(cohortId: string | null): void {
    if (cohortId === null) return;
    const exists = mockCohorts.some((c) => c.id === cohortId);
    if (!exists) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid cohortId" });
    }
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
        .query(({ ctx, input }) => {
            const viewer = getMockViewerFromSubject(ctx.subject);

            assertStudentNotLocked(viewer, input.moduleSlug);

            let rows = resourceStore.filter((r) => r.moduleSlug === input.moduleSlug);

            if (input.type) {
                rows = rows.filter((r) => r.type === input.type);
            }

            // Cohort-scoped enforcement
            rows = rows.filter((r) => userCanAccessCohortScopedResource(viewer, r.cohortId));

            return rows;
        }),

    /**
     * resources.byId() -> Resource
     * - NOT_FOUND if missing
     * - Enforce module lock for students
     * - Enforce cohort-scoped visibility for non-admins
     */
    byId: protectedProcedure
        .input(z.object({ id: z.string().min(1) }))
        .query(({ ctx, input }) => {
            const viewer = getMockViewerFromSubject(ctx.subject);

            const row = resourceStore.find((r) => r.id === input.id);
            if (!row) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
            }

            assertStudentNotLocked(viewer, row.moduleSlug);

            if (!userCanAccessCohortScopedResource(viewer, row.cohortId)) {
                throw new TRPCError({ code: "FORBIDDEN" });
            }

            return row;
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
        .mutation(({ ctx, input }) => {
            const viewer = getMockViewerFromSubject(ctx.subject);
            assertAdmin(viewer);

            // Ensure the module exists before attaching a resource to it
            findModuleBySlugOrThrow(input.moduleSlug);
            assertCohortIdValidOrNull(input.cohortId);

            const now = new Date().toISOString();
            const newRow: Resource = {
                id: `res_${Math.random().toString(16).slice(2)}_${Date.now()}`,
                moduleSlug: input.moduleSlug,
                title: input.title.trim(),
                type: input.type,
                url: input.url ?? null,
                cohortId: input.cohortId,
                created_by: ctx.subject.id,
                created_at: now,
                updated_at: now,
            };

            resourceStore.push(newRow);
            return newRow;
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
        .mutation(({ ctx, input }) => {
            const viewer = getMockViewerFromSubject(ctx.subject);
            assertAdmin(viewer);

            const idx = resourceStore.findIndex((r) => r.id === input.id);
            if (idx === -1) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
            }

            if (input.cohortId !== undefined) {
                assertCohortIdValidOrNull(input.cohortId);
            }

            const existing = resourceStore[idx]!;
            const updated: Resource = {
                ...existing,
                title: input.title !== undefined ? input.title.trim() : existing.title,
                type: input.type ?? existing.type,
                url: input.url !== undefined ? input.url : existing.url,
                cohortId: input.cohortId !== undefined ? input.cohortId : existing.cohortId,
                updated_at: new Date().toISOString(),
            };

            resourceStore[idx] = updated;
            return updated;
        }),

    /**
     * resources.delete()
     * - Admin-only
     * - NOT_FOUND if missing
     * - Deletes the row
     */
    delete: protectedProcedure
        .input(z.object({ id: z.string().min(1) }))
        .mutation(({ ctx, input }) => {
            const viewer = getMockViewerFromSubject(ctx.subject);
            assertAdmin(viewer);

            const idx = resourceStore.findIndex((r) => r.id === input.id);
            if (idx === -1) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
            }

            const [deleted] = resourceStore.splice(idx, 1);
            return deleted;
        }),
});
