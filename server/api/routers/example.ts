/**
 * Example tRPC router that contains two endpoints.
 * 
 * To add a new tRPC route, you need to modify `root.ts` to include the new router.
 */

import z from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

/** Example public endpoint. */
const hello = publicProcedure
    .output(z.string())
    .query(async () => {
        return "Hello, world!";
    });

/** Example protected endpoint. */
const protectedHello = protectedProcedure
    .output(z.string())
    .query(async ({ ctx }) => {
        return `Hello, User #${ctx.subject.id}!`;
    });

/**
 * Router for all example-related APIs.
 */
export const exampleApiRouter = createTRPCRouter({
    hello: hello,
    protectedHello: protectedHello,
});