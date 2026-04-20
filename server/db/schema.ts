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
import { AnyPgColumn } from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  role: text("role", { enum: ["admin", "student"] }).notNull(),
  full_name: text("full_name").notNull(),
  is_active: boolean("is_active").notNull(),
  email: text("email"),
  jobRole: text("job_role"),
  organization: text("organization"),
  avatarUrl: text("avatar_url"),
});

export const cohorts = pgTable("cohorts", {
  id: serial("id").primaryKey(),
  is_active: boolean("is_active"),
  access_hash: text("access_hash").notNull(),
  slug: varchar("slug"),
});

export const cohort_memberships = pgTable("cohort_memberships", {
  cohort_id: integer("cohort_id").references(() => cohorts.id),
  profiles_id: uuid("profiles_id").references(() => profiles.id),
});

export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  module_index: integer("module_index").notNull().unique(),
  slug: varchar("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
});

export const cohort_modules = pgTable(
  "cohort_modules",
  {
    cohort_id: integer("cohort_id")
      .notNull()
      .references(() => cohorts.id),
    module_id: integer("module_id")
      .notNull()
      .references(() => modules.id),
    is_active: boolean("is_active").notNull().default(true),
  },
  (t) => [primaryKey({ columns: [t.cohort_id, t.module_id] })],
);

export const resourceTypeEnum = pgEnum("resource_type", [
  "handout",
  "recording",
  "link",
  "document"
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

export const discussions_post = pgTable("discussion_posts", {
  id: serial("id").primaryKey(),
  module_id: integer("module_id").references(() => modules.id),
  cohort_id: integer("cohort_id").references(() => cohorts.id),
  author_id: uuid("author_id").references(() => profiles.id),
  parent_post_id: integer("parent_post_id").references(
    (): AnyPgColumn => discussions_post.id,
  ),
  body: text("body"),
  created_at: timestamp("created_at"),
  edited_at: timestamp("edited_at"),
  is_deleted: boolean("is_deleted").$default(() => false),
});

export const discussion_likes = pgTable(
  "discussion_likes",
  {
    post_id: integer("post_id")
      .notNull()
      .references(() => discussions_post.id),
    profile_id: uuid("profile_id")
      .notNull()
      .references(() => profiles.id),
  },
  (t) => [primaryKey({ columns: [t.post_id, t.profile_id] })],
);
