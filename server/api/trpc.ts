import createApiClient from "@/utils/supabase/clients/api";
import { initTRPC, TRPCError } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import superjson from "superjson";
import { ZodError } from "zod";
import { Subject } from "../models/auth";

/** Define the context */
interface CreateContextOptions {
  subject: Subject | null;
}

const createInnerTRPCContext = ({ subject }: CreateContextOptions) => {
  return {
    subject,
  };
};

export const createTRPCContext = async ({
  req,
  res,
}: CreateNextContextOptions) => {
  const supabase = createApiClient(req, res);
  const { data: userData } = await supabase.auth.getClaims();
  return createInnerTRPCContext({
    subject: userData
      ? {
          id: userData.claims.sub,
        }
      : null,
  });
};

/**
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * This middleware helps catch unwanted waterfalls by simulating network latency that would
 * occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

/**
 * Public (unauthenticated) procedure
 *
 * Standard API routes can be defined using the public procedure stem.  With this procedure, the
 * user does not have to be authenticated.
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Protected (authenticated) procedure
 *
 * Protected API routes, which should be usable only by signed-in users,
 * can be defined using the protected procedure stem. With this procedure, the user must be
 * authenticated or else an `unauthorized` error will be thrown. The authenticated user is also
 * rovided to the procedure as context.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.subject) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        // infers the `subject` as non-nullable at this point since it is
        // a guarantee that the user is signed in
        subject: ctx.subject!,
      },
    });
  });
