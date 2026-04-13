import z from "zod";
import { eq, isNull, asc, desc, and } from "drizzle-orm";
import { db } from "@/server/db";
import { discussions_post } from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

async function fetchPost(post_id: number) {
  const [row] = await db
    .select()
    .from(discussions_post)
    .where(eq(discussions_post.id, post_id));
  if (!row) throw new TRPCError({ code: "NOT_FOUND" });
  return row;
}

async function checkAdmin(user_id: string): Promise<boolean> {
  const result = await db.query.profiles.findFirst({
    where: (profiles, { eq }) => eq(profiles.id, user_id),
    columns: { role: true },
  });
  return result?.role === "admin";
}

type PostRow = typeof discussions_post.$inferSelect;
type PostNode = PostRow & { children: PostNode[] };

function buildTree(postId: number, allPosts: PostRow[]): PostNode {
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

function collectSubtreeIds(rootId: number, allPosts: PostRow[]): number[] {
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

  // Returns only top-level posts for a module slug, sorted createdAt DESC
  listThreadsByModuleSlug: publicProcedure
    .input(z.object({ moduleSlug: z.string() }))
    .query(async ({ input }) => {
      const module = await db.query.modules.findFirst({
        where: (modules, { eq }) => eq(modules.slug, input.moduleSlug),
        columns: { id: true },
      });
      if (!module) throw new TRPCError({ code: "NOT_FOUND" });

      return db
        .select()
        .from(discussions_post)
        .where(
          and(
            eq(discussions_post.module_id, module.id),
            isNull(discussions_post.parent_post_id),  // top-level threads only
          )
        )
        .orderBy(desc(discussions_post.created_at));
    }),

  // Returns immediate children only (not recursive), sorted createdAt ASC
  listRepliesByParentPostId: publicProcedure
    .input(z.object({ parentPostId: z.number().int() }))
    .query(async ({ input }) => {
      // Ensure the parent exists
      await fetchPost(input.parentPostId);

      return db
        .select()
        .from(discussions_post)
        .where(eq(discussions_post.parent_post_id, input.parentPostId))
        .orderBy(asc(discussions_post.created_at));
    }),

  // Returns the top-level post as root with all replies recursively nested,
  // replies sorted createdAt ASC at each level
  getThread: publicProcedure
    .input(z.object({ postId: z.number().int() }))
    .query(async ({ input }) => {
      const root = await fetchPost(input.postId);
      if (root.parent_post_id !== null) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "postId must be a top-level post",
        });
      }

      // Fetch all posts in the module, then filter to just this thread's subtree
      const allModulePosts = await db
        .select()
        .from(discussions_post)
        .where(eq(discussions_post.module_id, root.module_id!))
        .orderBy(asc(discussions_post.created_at));

      const subtreeIds = new Set(collectSubtreeIds(root.id, allModulePosts));
      const subtreePosts = allModulePosts.filter((p) => subtreeIds.has(p.id));

      return buildTree(root.id, subtreePosts);
    }),

  createPost: protectedProcedure
    .input(
      z.object({
        module_id: z.number().int().optional(),
        cohort_id: z.number().int().optional(),
        parent_post_id: z.number().int().nullable().optional(),
        body: z.string().min(1).max(10000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.parent_post_id) {
        // New thread
        if (!input.module_id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "module_id is required when creating a thread",
          });
        }
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
        // Reply — inherit module/cohort from parent, validate if caller supplied module_id
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
      })
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
        .set({ is_deleted: true, body: "Deleted" })
        .where(eq(discussions_post.id, input.post_id));
    }),
});