/**
 * This file defines the entire database schema - including all tables and relations.
 *
 * To configure the Supabase database using this schema as a guide, use the command:
 * ```
 * npx drizzle-kit push
 * ```
 */
import {
  pgTable,
  text,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export {}