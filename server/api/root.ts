/**
 * Configuration for the server-side tRPC API, including the primary API router.
 * Configuration of the server-side tRPC API.
 */

import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { exampleApiRouter } from "./routers/example";
import { profilesApiRouter } from "./routers/profiles";
import { cohortsApiRouter } from "./routers/cohorts";
import { cohorts } from "../db/schema";

// [NOTE]
// To expose a new API, add a new router here.

/** Primary router for the API server. */
export const appRouter = createTRPCRouter({
  example: exampleApiRouter,
  profiles: profilesApiRouter,
  cohorts: cohortsApiRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
