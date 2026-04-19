import z from "zod";
import { eq, isNull, asc, desc, and, inArray, count } from "drizzle-orm";
import { db } from "@/server/db";
import {
  cohort_memberships,
  cohort_modules,
  cohorts,
  discussion_likes,
  discussions_post,
  modules,
  profiles,
} from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";

async function fetchPost(post_id: number) {
  const [row] = await db
    .select()
    .from(discussions_post)
    .where(eq(discussions_post.id, post_id));
  if (!row) throw new TRPCError({ code: "NOT_FOUND" });
  return row;
}

async function resolveCohortBySlug(cohortSlug: string) {
  const [cohort] = await db
    .select({ id: cohorts.id, slug: cohorts.slug })
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

async function checkAdmin(user_id: string): Promise<boolean> {
  const result = await db.query.profiles.findFirst({
    where: (profiles, { eq }) => eq(profiles.id, user_id),
    columns: { role: true },
  });
  return result?.role === "admin";
}

async function requireCohortAccess(userId: string, cohortId: number) {
  if (await checkAdmin(userId)) {
    return;
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
}

async function requireModuleDiscussionAccess(
  userId: string,
  cohortId: number,
  moduleId: number,
) {
  const isAdmin = await checkAdmin(userId);

  await requireCohortAccess(userId, cohortId);

  const [cohortModule] = await db
    .select({ is_active: cohort_modules.is_active })
    .from(cohort_modules)
    .where(
      and(
        eq(cohort_modules.cohort_id, cohortId),
        eq(cohort_modules.module_id, moduleId),
      ),
    )
    .limit(1);

  if (!cohortModule) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Module is not available in this cohort",
    });
  }

  if (!cohortModule.is_active && !isAdmin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This module is not available",
    });
  }
}

type PostRow = typeof discussions_post.$inferSelect;
type PostWithAuthor = PostRow & {
  author_full_name: string | null;
  author_avatar_url: string | null;
  author_role: "admin" | "student" | null;
  like_count: number;
  viewer_has_liked: boolean;
};
type PostNode = PostWithAuthor & { children: PostNode[] };

async function enrichPostsWithLikes(
  posts: Array<
    Omit<PostWithAuthor, "like_count" | "viewer_has_liked"> & {
      like_count?: number;
      viewer_has_liked?: boolean;
    }
  >,
  viewerId: string,
): Promise<PostWithAuthor[]> {
  if (posts.length === 0) {
    return [];
  }

  const postIds = posts.map((post) => post.id);

  const likeCounts = await db
    .select({
      post_id: discussion_likes.post_id,
      like_count: count(discussion_likes.profile_id),
    })
    .from(discussion_likes)
    .where(inArray(discussion_likes.post_id, postIds))
    .groupBy(discussion_likes.post_id);

  const viewerLikes = await db
    .select({ post_id: discussion_likes.post_id })
    .from(discussion_likes)
    .where(
      and(
        eq(discussion_likes.profile_id, viewerId),
        inArray(discussion_likes.post_id, postIds),
      ),
    );

  const likeCountMap = new Map<number, number>(
    likeCounts.map((row) => [row.post_id, Number(row.like_count)]),
  );

  const viewerLikedSet = new Set<number>(
    viewerLikes.map((row) => row.post_id),
  );

  return posts.map((post) => ({
    ...post,
    like_count: likeCountMap.get(post.id) ?? 0,
    viewer_has_liked: viewerLikedSet.has(post.id),
  }));
}

function buildTree(postId: number, allPosts: PostWithAuthor[]): PostNode {
  const post = allPosts.find((p) => p.id === postId);
  if (!post) throw new TRPCError({ code: "NOT_FOUND" });

  const children = allPosts
    .filter((p) => p.parent_post_id === postId)
    .sort((a, b) => {
      const aTime = a.created_at?.getTime() ?? 0;
      const bTime = b.created_at?.getTime() ?? 0;
      return aTime - bTime;
    })
    .map((child) => buildTree(child.id, allPosts));

  return { ...post, children };
}

function collectSubtreeIds(
  rootId: number,
  allPosts: PostWithAuthor[],
): number[] {
  const ids: number[] = [rootId];
  const queue = [rootId];
  while (queue.length) {
    const current = queue.shift()!;
    const children = allPosts
      .filter((p) => p.parent_post_id === current)
      .map((p) => p.id);
    ids.push(...children);
    queue.push(...children);
  }
  return ids;
}

export const discussionsRouter = createTRPCRouter({
  listGeneralThreads: protectedProcedure
    .input(z.object({ cohortSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      const cohort = await resolveCohortBySlug(input.cohortSlug);
      await requireCohortAccess(ctx.subject.id, cohort.id);

      const rows = await db
        .select({
          id: discussions_post.id,
          module_id: discussions_post.module_id,
          cohort_id: discussions_post.cohort_id,
          author_id: discussions_post.author_id,
          parent_post_id: discussions_post.parent_post_id,
          body: discussions_post.body,
          created_at: discussions_post.created_at,
          edited_at: discussions_post.edited_at,
          is_deleted: discussions_post.is_deleted,
          author_full_name: profiles.full_name,
          author_avatar_url: profiles.avatarUrl,
          author_role: profiles.role,
        })
        .from(discussions_post)
        .leftJoin(profiles, eq(profiles.id, discussions_post.author_id))
        .where(
          and(
            isNull(discussions_post.module_id),
            eq(discussions_post.cohort_id, cohort.id),
            isNull(discussions_post.parent_post_id),
          ),
        )
        .orderBy(desc(discussions_post.created_at));

      return enrichPostsWithLikes(rows, ctx.subject.id);
    }),

  listThreadsByModuleSlug: protectedProcedure
    .input(z.object({ moduleSlug: z.string(), cohortSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      const cohort = await resolveCohortBySlug(input.cohortSlug);
      const foundModule = await db.query.modules.findFirst({
        where: (modules, { eq }) => eq(modules.slug, input.moduleSlug),
        columns: { id: true },
      });
      if (!foundModule) throw new TRPCError({ code: "NOT_FOUND" });

      await requireModuleDiscussionAccess(
        ctx.subject.id,
        cohort.id,
        foundModule.id,
      );

      const rows = await db
        .select({
          id: discussions_post.id,
          module_id: discussions_post.module_id,
          cohort_id: discussions_post.cohort_id,
          author_id: discussions_post.author_id,
          parent_post_id: discussions_post.parent_post_id,
          body: discussions_post.body,
          created_at: discussions_post.created_at,
          edited_at: discussions_post.edited_at,
          is_deleted: discussions_post.is_deleted,
          author_full_name: profiles.full_name,
          author_avatar_url: profiles.avatarUrl,
          author_role: profiles.role,
        })
        .from(discussions_post)
        .leftJoin(profiles, eq(profiles.id, discussions_post.author_id))
        .where(
          and(
            eq(discussions_post.module_id, foundModule.id),
            eq(discussions_post.cohort_id, cohort.id),
            isNull(discussions_post.parent_post_id),
          ),
        )
        .orderBy(desc(discussions_post.created_at));

      return enrichPostsWithLikes(rows, ctx.subject.id);
    }),

  listRepliesByParentPostId: protectedProcedure
    .input(z.object({ parentPostId: z.number().int(), cohortSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      const cohort = await resolveCohortBySlug(input.cohortSlug);
      const parent = await fetchPost(input.parentPostId);

      if (parent.cohort_id !== cohort.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (parent.module_id !== null) {
        await requireModuleDiscussionAccess(
          ctx.subject.id,
          cohort.id,
          parent.module_id,
        );
      } else {
        await requireCohortAccess(ctx.subject.id, cohort.id);
      }

      const rows = await db
        .select({
          id: discussions_post.id,
          module_id: discussions_post.module_id,
          cohort_id: discussions_post.cohort_id,
          author_id: discussions_post.author_id,
          parent_post_id: discussions_post.parent_post_id,
          body: discussions_post.body,
          created_at: discussions_post.created_at,
          edited_at: discussions_post.edited_at,
          is_deleted: discussions_post.is_deleted,
          author_full_name: profiles.full_name,
          author_avatar_url: profiles.avatarUrl,
          author_role: profiles.role,
        })
        .from(discussions_post)
        .leftJoin(profiles, eq(profiles.id, discussions_post.author_id))
        .where(
          and(
            eq(discussions_post.parent_post_id, input.parentPostId),
            eq(discussions_post.cohort_id, cohort.id),
          ),
        )
        .orderBy(asc(discussions_post.created_at));

      return enrichPostsWithLikes(rows, ctx.subject.id);
    }),

  getThread: protectedProcedure
    .input(z.object({ postId: z.number().int(), cohortSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      const cohort = await resolveCohortBySlug(input.cohortSlug);
      const root = await fetchPost(input.postId);

      if (root.cohort_id !== cohort.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (root.parent_post_id !== null) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "postId must be a top-level post",
        });
      }

      if (root.module_id !== null) {
        await requireModuleDiscussionAccess(
          ctx.subject.id,
          cohort.id,
          root.module_id,
        );
      } else {
        await requireCohortAccess(ctx.subject.id, cohort.id);
      }

      const allModulePostsRaw = await db
        .select({
          id: discussions_post.id,
          module_id: discussions_post.module_id,
          cohort_id: discussions_post.cohort_id,
          author_id: discussions_post.author_id,
          parent_post_id: discussions_post.parent_post_id,
          body: discussions_post.body,
          created_at: discussions_post.created_at,
          edited_at: discussions_post.edited_at,
          is_deleted: discussions_post.is_deleted,
          author_full_name: profiles.full_name,
          author_avatar_url: profiles.avatarUrl,
          author_role: profiles.role,
        })
        .from(discussions_post)
        .leftJoin(profiles, eq(profiles.id, discussions_post.author_id))
        .where(
          root.module_id === null
            ? and(
                isNull(discussions_post.module_id),
                eq(discussions_post.cohort_id, cohort.id),
              )
            : and(
                eq(discussions_post.module_id, root.module_id),
                eq(discussions_post.cohort_id, cohort.id),
              ),
        )
        .orderBy(asc(discussions_post.created_at));

        const allModulePosts = await enrichPostsWithLikes(
          allModulePostsRaw,
          ctx.subject.id,
        );

      const subtreeIds = new Set(collectSubtreeIds(root.id, allModulePosts));
      const subtreePosts = allModulePosts.filter((p) => subtreeIds.has(p.id));

      return buildTree(root.id, subtreePosts);
    }),

  likePost: protectedProcedure
    .input(z.object({ post_id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const post = await fetchPost(input.post_id);
      if (post.cohort_id == null) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      await requireCohortAccess(ctx.subject.id, post.cohort_id);

      await db
        .insert(discussion_likes)
        .values({
          post_id: input.post_id,
          profile_id: ctx.subject.id,
        })
        .onConflictDoNothing();

      return { post_id: input.post_id };
    }),

  unlikePost: protectedProcedure
    .input(z.object({ post_id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const post = await fetchPost(input.post_id);
      if (post.cohort_id == null) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      await requireCohortAccess(ctx.subject.id, post.cohort_id);

      await db
        .delete(discussion_likes)
        .where(
          and(
            eq(discussion_likes.post_id, input.post_id),
            eq(discussion_likes.profile_id, ctx.subject.id),
          ),
        );

      return { post_id: input.post_id };
    }),

  createPost: protectedProcedure
    .input(
      z.object({
        module_id: z.number().int().optional(),
        cohort_id: z.number().int().optional(),
        parent_post_id: z.number().int().nullable().optional(),
        body: z.string().min(1).max(10000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.parent_post_id == null) {
        if (!input.module_id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "module_id is required when creating a thread",
          });
        }
        if (!input.cohort_id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "cohort_id is required when creating a thread",
          });
        }

        const [module] = await db
          .select({ id: modules.id })
          .from(modules)
          .where(eq(modules.id, input.module_id))
          .limit(1);
        if (!module) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Module not found",
          });
        }

        const [cohort] = await db
          .select({ id: cohorts.id })
          .from(cohorts)
          .where(eq(cohorts.id, input.cohort_id))
          .limit(1);
        if (!cohort) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Cohort not found",
          });
        }

        const [cohortModule] = await db
          .select({
            cohort_id: cohort_modules.cohort_id,
            module_id: cohort_modules.module_id,
          })
          .from(cohort_modules)
          .where(
            and(
              eq(cohort_modules.cohort_id, input.cohort_id),
              eq(cohort_modules.module_id, input.module_id),
            ),
          )
          .limit(1);
        if (!cohortModule) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "module_id is not available in the specified cohort",
          });
        }

        await requireCohortAccess(ctx.subject.id, input.cohort_id);

        await db.insert(discussions_post).values({
          module_id: input.module_id,
          cohort_id: input.cohort_id,
          author_id: ctx.subject.id,
          parent_post_id: null,
          body: input.body,
          created_at: new Date(),
          edited_at: null,
          is_deleted: false,
        });
      } else {
        const parent = await fetchPost(input.parent_post_id);
        if (parent.is_deleted) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot reply to a deleted post",
          });
        }
        if (input.module_id && input.module_id !== parent.module_id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "module_id does not match the parent post's module",
          });
        }
        if (input.cohort_id && input.cohort_id !== parent.cohort_id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "cohort_id does not match the parent post's cohort",
          });
        }
        if (parent.cohort_id == null) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot reply to a post without a cohort",
          });
        }

        await requireCohortAccess(ctx.subject.id, parent.cohort_id);

        await db.insert(discussions_post).values({
          module_id: parent.module_id,
          cohort_id: parent.cohort_id,
          author_id: ctx.subject.id,
          parent_post_id: input.parent_post_id,
          body: input.body,
          created_at: new Date(),
          edited_at: null,
          is_deleted: false,
        });
      }
    }),

  updatePost: protectedProcedure
    .input(
      z.object({
        post_id: z.number().int(),
        body: z.string().min(1).max(10000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const post = await fetchPost(input.post_id);
      if (post.is_deleted) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const isAuthor = ctx.subject.id === post.author_id;
      const isAdmin = await checkAdmin(ctx.subject.id);
      if (!isAuthor && !isAdmin) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      await db
        .update(discussions_post)
        .set({ body: input.body, edited_at: new Date() })
        .where(eq(discussions_post.id, input.post_id));
    }),

  deletePost: protectedProcedure
    .input(z.object({ post_id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const post = await fetchPost(input.post_id);
      if (post.is_deleted) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const isAuthor = ctx.subject.id === post.author_id;
      const isAdmin = await checkAdmin(ctx.subject.id);
      if (!isAuthor && !isAdmin) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      await db
        .update(discussions_post)
        .set({ is_deleted: true, body: "[This post has been deleted.]" })
        .where(eq(discussions_post.id, input.post_id));
    }),
});
