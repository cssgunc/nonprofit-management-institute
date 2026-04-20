CREATE TABLE "discussion_likes" (
  "post_id" integer NOT NULL REFERENCES "discussion_posts"("id"),
  "profile_id" uuid NOT NULL REFERENCES "profiles"("id"),
  PRIMARY KEY ("post_id", "profile_id")
);
