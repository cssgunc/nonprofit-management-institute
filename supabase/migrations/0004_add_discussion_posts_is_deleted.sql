ALTER TABLE "discussion_posts"
ADD COLUMN IF NOT EXISTS "is_deleted" boolean NOT NULL DEFAULT false;
