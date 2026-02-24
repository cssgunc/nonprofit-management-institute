/**
 * This file defines the entire database schema - including all tables and relations.
 *
 * To configure the Supabase database using this schema as a guide, use the command:
 * ```
 * npx drizzle-kit push
 * ```
 */
import { check, integer, pgTable, serial, text, timestamp, boolean} from "drizzle-orm/pg-core";
import { relations, sql} from "drizzle-orm";
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

config({ path: '../../.env' });

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle({ client });

export const profiles = pgTable('profiles', {
    id: serial('id').primaryKey(), // foreign key to auth.users.id (don't think I can do this yet).
    role: text('role').notNull(),
    name: text('name').notNull(),
    boolean: boolean('is_active'),
});

export const cohorts = pgTable('cohorts', {
    id: serial('id').primaryKey(),
    is_active: boolean('is_active'),
});

export const cohort_memberships = pgTable('cohort_membershps', {
    cohort_id: serial('cohort_id').references(() => cohorts.id),
    // still need to do user_id
});

export const modules = pgTable('modules', {
    id: serial('id').primaryKey(),
    module_index: integer('module_index').notNull().unique(),
},
    (table) => [
        check("module_index_check", sql`0 < ${table.module_index} <= 6`),
    ]
);