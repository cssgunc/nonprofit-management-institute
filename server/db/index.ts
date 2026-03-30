/**
 * This file exports a `db` object, which serves as the primary reference to the
 * database and the Drizzle ORM.
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/server/db/schema";

const rawConnectionString = process.env.DATABASE_URL;
if (!rawConnectionString) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

// Normalize common problematic copy/paste quote characters and trim whitespace
const connectionString = rawConnectionString
  .trim()
  .replace(/^\u201C|\u201D|\u2018|\u2019|\u00AB|\u00BB/g, "")
  .replace(/\u201C$|\u201D$|\u2018$|\u2019$|\u00AB$|\u00BB$/g, "");

if (!/^postgres(?:ql)?:\/\//i.test(connectionString)) {
  throw new Error(`Invalid DATABASE_URL format: ${connectionString}`);
}

export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
