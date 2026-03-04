/**
 * This file defines the entire database schema - including all tables and relations.
 *
 * To configure the Supabase database using this schema as a guide, use the command:
 * ```
 * npx drizzle-kit push
 * ```
 */
import {
  uuid,
  check,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  varchar,
  pgEnum,
  primaryKey,
  pgSchema,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  role: text("role", { enum: ["admin", "student"] }).notNull(),
  full_name: text("full_name").notNull(),
  is_active: boolean("is_active").notNull(),
  organization: text("organization"),
});

export const cohorts = pgTable("cohorts", {
  id: serial("id").primaryKey(),
  is_active: boolean("is_active"),
  access_hash: text("access_hash").notNull(),
  slug: varchar("slug"),
});

export const cohort_memberships = pgTable("cohort_memberships", {
  cohort_id: integer("cohort_id").references(() => cohorts.id),
  profiles_id: uuid("profiles_id").references(() => profiles.id),// foreign key to auth.user.id (issue #1 isn't finished yet).
});

export const modules = pgTable(
  "modules",
  {
    id: serial("id").primaryKey(),
    module_index: integer("module_index").notNull().unique(),
    slug: varchar("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description"),
    is_locked: boolean("is_locked"),
  }
);

export const resourceTypeEnum = pgEnum("resource_type", [
  "handout",
  "recording",
  "link",
]);

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  module_id: integer("module_id").references(() => modules.id),
  cohort_id: integer("cohort_id").references(() => cohorts.id),
  type: resourceTypeEnum("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url"),
  mime_type: varchar("mime_type"),
  size_bytes: integer("size_bytes"),
  created_by: uuid("created_by").references(() => profiles.id),
});

export const discussions_post: any = pgTable("discussion_posts", {
  id: serial("id").primaryKey(),
  module_id: integer("module_id").references(() => modules.id),
  cohort_id: integer("cohort_id").references(() => cohorts.id),
  author_id: uuid("author_id").references(() => profiles.id),
  parent_post_id: integer("parent_post_id").references(
    () => discussions_post.id,
  ),
  body: text("body"),
  created_at: timestamp("created_at"),
  edited_at: timestamp("edited_at"),
});