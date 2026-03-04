/**
 * This file defines the entire database schema - including all tables and relations.
 *
 * To configure the Supabase database using this schema as a guide, use the command:
 * ```
 * npx drizzle-kit push
 * ```
 */
import { pgTable, uuid, text, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  role: text("role", { enum: ["admin", "student"] }).notNull(),
  full_name: text("full_name").notNull(),
  is_active: boolean("is_active").notNull(),
  organization: text("organization"),
});
