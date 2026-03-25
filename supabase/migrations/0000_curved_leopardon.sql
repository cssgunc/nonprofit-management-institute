CREATE TYPE "public"."resource_type" AS ENUM('handout', 'recording', 'link');--> statement-breakpoint
CREATE TABLE "cohort_memberships" (
	"cohort_id" integer,
	"profiles_id" uuid
);
--> statement-breakpoint
CREATE TABLE "cohorts" (
	"id" serial PRIMARY KEY NOT NULL,
	"is_active" boolean,
	"access_hash" text NOT NULL,
	"slug" varchar
);
--> statement-breakpoint
CREATE TABLE "discussion_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"module_id" integer,
	"cohort_id" integer,
	"author_id" uuid,
	"parent_post_id" integer,
	"body" text,
	"created_at" timestamp,
	"edited_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"module_index" integer NOT NULL,
	"slug" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"is_locked" boolean,
	CONSTRAINT "modules_module_index_unique" UNIQUE("module_index"),
	CONSTRAINT "modules_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"role" text NOT NULL,
	"full_name" text NOT NULL,
	"is_active" boolean NOT NULL,
	"organization" text,
	"avatar_url" text
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"module_id" integer,
	"cohort_id" integer,
	"type" "resource_type" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"url" text,
	"mime_type" varchar,
	"size_bytes" integer,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "cohort_memberships" ADD CONSTRAINT "cohort_memberships_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_memberships" ADD CONSTRAINT "cohort_memberships_profiles_id_profiles_id_fk" FOREIGN KEY ("profiles_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_posts" ADD CONSTRAINT "discussion_posts_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_posts" ADD CONSTRAINT "discussion_posts_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_posts" ADD CONSTRAINT "discussion_posts_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_posts" ADD CONSTRAINT "discussion_posts_parent_post_id_discussion_posts_id_fk" FOREIGN KEY ("parent_post_id") REFERENCES "public"."discussion_posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;