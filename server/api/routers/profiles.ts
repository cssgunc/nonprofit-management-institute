import z from "zod";
import { eq, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { db } from "@/server/db";
import { profiles } from "@/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { NewUser } from "@/server/models/inputs";

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

/**
 * Creates a new user based on the name and handle provided.
 *
 * This endpoint is used whenever a new user authenticates with Supabase Auth
 * so that we can have a profile entry in our database for that user.
 */
const handleNewUser = protectedProcedure //COMPLETED AND TESTED
  .input(NewUser)
  .mutation(async ({ ctx, input }) => {
    const { subject } = ctx;
    const { full_name, role, organization } = input;

    // YOUR IMPLEMENTATION HERE...

    const user = await db.query.profiles.findFirst({
      where: eq(profiles.id, subject.id),
    });

    if (!user) {
      await db.insert(profiles).values([
        {
          id: subject.id,
          full_name: full_name, // Pulling from input, not subject
          role: role, // Pulling from input, not subject
          is_active: true, // Added missing required field
          organization: organization,
        },
      ]);
    }

    return;
  });

export const profilesApiRouter = createTRPCRouter({
  me,
  updateMe,
  getById,
  list,
  handleNewUser,
});
