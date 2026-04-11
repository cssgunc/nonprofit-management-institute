CREATE TABLE "cohort_modules" (
  "cohort_id" integer NOT NULL REFERENCES "cohorts"("id"),
  "module_id" integer NOT NULL REFERENCES "modules"("id"),
  "is_active" boolean NOT NULL DEFAULT true,
  PRIMARY KEY ("cohort_id", "module_id")
);

-- Seed: link all existing cohorts to all existing modules as active
INSERT INTO "cohort_modules" ("cohort_id", "module_id", "is_active")
SELECT c.id, m.id, true
FROM "cohorts" c
CROSS JOIN "modules" m;

-- Clean up old columns from modules table
ALTER TABLE "modules" DROP COLUMN IF EXISTS "is_locked";
ALTER TABLE "modules" DROP COLUMN IF EXISTS "is_active";