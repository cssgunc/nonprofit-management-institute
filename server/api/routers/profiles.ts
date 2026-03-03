import z from "zod";
import { eq, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { db } from "@/server/db";
import { profiles } from "@/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const ProfileSchema = z.object({
  id: z.string(),
  role: z.enum(["admin", "student"]),
  full_name: z.string(),
  is_active: z.boolean(),
});

async function fetchProfile(userId: string) {
  const [row] = await db.select().from(profiles).where(eq(profiles.id, userId));
  if (!row) throw new TRPCError({ code: "NOT_FOUND" });
  return row;
}

async function requireAdmin(userId: string) {
  const profile = await fetchProfile(userId);
  if (profile.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return profile;
}

const me = protectedProcedure.output(ProfileSchema).query(async ({ ctx }) => {
  return fetchProfile(ctx.subject.id);
});

const updateMe = protectedProcedure
  .input(
    z.object({
      full_name: z.string().optional(),
      is_active: z.boolean().optional(),
    }),
  )
  .output(ProfileSchema)
  .mutation(async ({ ctx, input }) => {
    const [updated] = await db
      .update(profiles)
      .set(input)
      .where(eq(profiles.id, ctx.subject.id))
      .returning();
    if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
    return updated;
  });

const getById = protectedProcedure
  .input(z.object({ userId: z.string() }))
  .output(ProfileSchema)
  .query(async ({ ctx, input }) => {
    await requireAdmin(ctx.subject.id);
    const [row] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, input.userId));
    if (!row) throw new TRPCError({ code: "NOT_FOUND" });
    return row;
  });

const list = protectedProcedure
  .input(z.object({ isActive: z.boolean().optional() }).optional())
  .output(z.array(ProfileSchema))
  .query(async ({ ctx, input }) => {
    await requireAdmin(ctx.subject.id);
    const baseQuery = db.select().from(profiles);
    const filtered =
      input?.isActive !== undefined
        ? baseQuery.where(eq(profiles.is_active, input.isActive))
        : baseQuery;
    return filtered.orderBy(asc(profiles.full_name), asc(profiles.id));
  });

export const profilesApiRouter = createTRPCRouter({
  me,
  updateMe,
  getById,
  list,
});
