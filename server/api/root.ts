/**
 * Configuration for the server-side tRPC API, including the primary API router.
 * Configuration of the server-side tRPC API.
 */

import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { exampleApiRouter } from "./routers/example";
import { resourcesRouter } from "./routers/resources";

// [NOTE]
// To expose a new API, add a new router here.

/** Primary router for the API server. */
export const appRouter = createTRPCRouter({
  example: exampleApiRouter,
  resources: resourcesRouter
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
