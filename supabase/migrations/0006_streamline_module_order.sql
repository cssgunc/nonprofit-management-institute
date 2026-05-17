-- Align the NPMI modules with the current learning sequence.
-- Use temporary negative indexes first to avoid unique module_index collisions.
UPDATE "modules"
SET "module_index" = -"module_index"
WHERE "slug" IN (
  'module-1-introduction',
  'module-3-governance',
  'module-5-programs',
  'module-4-finance',
  'module-2-fundraising-basics',
  'module-6-operations'
);

UPDATE "modules"
SET
  "module_index" = 1,
  "title" = 'Orientation',
  "description" = 'Overview and orientation'
WHERE "slug" = 'module-1-introduction';

UPDATE "modules"
SET
  "module_index" = 2,
  "title" = 'Board Governance',
  "description" = 'Board roles and governance'
WHERE "slug" = 'module-3-governance';

UPDATE "modules"
SET
  "module_index" = 3,
  "title" = 'Program Design, Management, and Evaluation',
  "description" = 'Program design, management, and evaluation'
WHERE "slug" = 'module-5-programs';

UPDATE "modules"
SET
  "module_index" = 4,
  "title" = 'Strategic Planning',
  "description" = 'Strategic planning for nonprofit organizations'
WHERE "slug" = 'module-4-finance';

UPDATE "modules"
SET
  "module_index" = 5,
  "title" = 'Fundraising & Financial Management',
  "description" = 'Fundraising and nonprofit financial management'
WHERE "slug" = 'module-2-fundraising-basics';

UPDATE "modules"
SET
  "module_index" = 6,
  "title" = 'Human Resources',
  "description" = 'Human resources, policies, and operations'
WHERE "slug" = 'module-6-operations';
