import z from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { discussions_post } from "@/server/db/schema"
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { createGzip } from "zlib";

const DiscussionsSchema = z.object({
    id: z.number().int(),
    module_id: z.number().int(),
    cohort_id: z.number().int(),
    author_id: z.string().uuid(),
    parent_post_id: z.number().int(),
    body: z.string(),
    created_at: z.date(),
    edited_at: z.date().nullable(),
    is_deleted: z.boolean(),
});


async function fetchPost(post_id: number) {
    const [row] = await db.select().from(discussions_post).where(eq(discussions_post.id, post_id));
    if (!row) throw new TRPCError({ code: "NOT_FOUND" });
    return row;
}

async function checkAdmin(user_id: string) {
    const admin_status = await db.query.profiles.findFirst({
        where: (profiles, { eq }) => eq (profiles.id, user_id),
        columns: {
            role: true,
        },
    })
    return admin_status?.role === "admin"
}

const discussionsRouter = createTRPCRouter({    
    updatePost: protectedProcedure
        .input( z.object({
            post_id: z.number().int(),
            body: z.string().min(1).max(10000),
        }),
    )
    .mutation( async({ctx, input}) => {
        const post = await fetchPost(input.post_id);

        const author_id = ctx.subject.id === post.author_id;
        const admin = checkAdmin(ctx.subject.id);

        if (!author_id && !admin) {
            throw new TRPCError({ code: "UNAUTHORIZED"})
        }

        await db
            .update(discussions_post)
            .set({ body: input.body})
            .where(eq(discussions_post.id, input.post_id));

    }),
    
    deletePost: protectedProcedure
        .input( z.object({
            post_id: z.number().int()
        }),
    )
    .mutation( async({ctx, input}) => {
        const post = await fetchPost(input.post_id);
        if (post.is_deleted) {
            throw new TRPCError ({ code: "NOT_FOUND" });
        }

        const author_id = ctx.subject.id === post.author_id;
        const admin = checkAdmin(ctx.subject.id);

        if (!author_id && !admin) {
            throw new TRPCError({ code: "UNAUTHORIZED"})
        }

        await db
            .update(discussions_post)
            .set({ is_deleted: true, body: "Deleted"})
            .where(eq(discussions_post.id, input.post_id));

    }),
    
    createPost: publicProcedure
        .input(z.object({
            module_id: z.number().int().optional(),
            cohort_id: z.number().int().optional(),
            parent_post_id: z.number().int().nullable().optional(),
            body: z.string().min(1).max(10000),
        }),
    )
    .mutation(async({ctx, input}) => {
        if (!input.parent_post_id) {
            await db.insert(discussions_post).values({
                module_id: input.module_id,
                cohort_id: input.cohort_id,
                author_id: ctx.subject?.id,
                parent_post_id: null,
                body: input.body,
                created_at: new Date(),
                edited_at: new Date(),
                is_deleted: false,
            })
        } else {
            const parent_post = await fetchPost(input.parent_post_id);
            await db.insert(discussions_post).values({
                module_id: parent_post.module_id,
                cohort_id: parent_post.cohort_id,
                author_id: ctx.subject?.id,
                parent_post_id: input.parent_post_id,
                body: input.body,
                created_at: new Date(),
                edited_at: new Date(),
                is_deleted: false,
            })
        }
    })

    
});