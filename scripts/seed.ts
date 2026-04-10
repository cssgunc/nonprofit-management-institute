import "dotenv/config";
import { client } from "../server/db";

type ModuleSeed = {
  module_index: number;
  slug: string;
  title: string;
  description?: string | null;
};

type ModuleRow = {
  id: number;
  module_index: number;
  slug: string;
};

type ResourceSeed = {
  module_id: number;
  cohort_id: number;
  type: "handout" | "recording" | "link";
  title: string;
  description?: string | null;
  url?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  created_by: string;
};

type ResourceRow = {
  id: number;
};

type ProfileRow = {
  id: string;
};

type CohortRow = {
  id: number;
};

type DiscussionSeed = {
  module_id: number;
  cohort_id: number;
  author_id: string;
  parent_post_id?: number | null;
  body: string;
  created_at: string;
};

type DiscussionRow = {
  id: number;
};

type ModuleIndexRow = {
  module_index: number;
};

const MODULES: ModuleSeed[] = [
  {
    module_index: 1,
    slug: "module-1-introduction",
    title: "Introduction",
    description: "Overview and orientation",
  },
  {
    module_index: 2,
    slug: "module-2-fundraising-basics",
    title: "Fundraising Basics",
    description: "Principles of fundraising",
  },
  {
    module_index: 3,
    slug: "module-3-governance",
    title: "Governance & Board",
    description: "Board roles and governance",
  },
  {
    module_index: 4,
    slug: "module-4-finance",
    title: "Finance & Budgeting",
    description: "Basic nonprofit finance",
  },
  {
    module_index: 5,
    slug: "module-5-programs",
    title: "Programs & Impact",
    description: "Program design and measurement",
  },
  {
    module_index: 6,
    slug: "module-6-operations",
    title: "Operations & HR",
    description: "Operations, policies, and HR",
  },
];

const DUMMY_PROFILE_ID = "00000000-0000-0000-0000-000000000001";

async function upsertModules() {
  for (const m of MODULES) {
    await client`
			INSERT INTO modules (module_index, slug, title, description)
			VALUES (${m.module_index}, ${m.slug}, ${m.title}, ${m.description ?? null})
			ON CONFLICT (module_index) DO UPDATE
			SET slug = EXCLUDED.slug,
					title = EXCLUDED.title,
					description = EXCLUDED.description
		`;
  }

  const rows = (await client`
  SELECT id, module_index, slug
  FROM modules
  ORDER BY module_index
`) as ModuleRow[];

  if (rows.length !== 6) {
    throw new Error(`Expected 6 modules after seeding, found ${rows.length}`);
  }

  console.log(
    "Modules upserted:",
    rows.map((r) => `${r.module_index}:${r.slug}`).join(", "),
  );
}

async function findOrCreateProfile() {
  const existing = (await client`
    SELECT id FROM profiles WHERE id = ${DUMMY_PROFILE_ID}
  `) as ProfileRow[];
  if (existing.length) return existing[0].id;

  await client`
		INSERT INTO profiles (id, role, full_name, is_active, organization, avatar_url)
		VALUES (${DUMMY_PROFILE_ID}, 'student', 'Seed User', true, 'Seed Org', null)
		ON CONFLICT (id) DO NOTHING
	`;

  return DUMMY_PROFILE_ID;
}

async function findOrCreateCohort(
  slug: string,
  accessHash: string,
  isActive = true,
) {
  const existing = (await client`
    SELECT id FROM cohorts WHERE slug = ${slug} LIMIT 1
  `) as CohortRow[];
  if (existing.length) return existing[0].id;

  const res = (await client`
		INSERT INTO cohorts (is_active, access_hash, slug)
		VALUES (${isActive}, ${accessHash}, ${slug})
		RETURNING id
	`) as CohortRow[];

  return res[0].id;
}

async function findOrCreateResource(resource: ResourceSeed) {
  const exists = (await client`
		SELECT id FROM resources
		WHERE module_id = ${resource.module_id}
			AND cohort_id = ${resource.cohort_id}
			AND title = ${resource.title}
			AND type = ${resource.type}
		LIMIT 1
	`) as ResourceRow[];
  if (exists.length) return exists[0].id;

  const inserted = (await client`
		INSERT INTO resources (module_id, cohort_id, type, title, description, url, mime_type, size_bytes, created_by)
		VALUES (${resource.module_id}, ${resource.cohort_id}, ${resource.type}, ${resource.title}, ${resource.description ?? null}, ${resource.url ?? null}, ${resource.mime_type ?? null}, ${resource.size_bytes ?? null}, ${resource.created_by})
		RETURNING id
	`) as ResourceRow[];
  return inserted[0].id;
}

async function findOrCreateDiscussion(post: DiscussionSeed) {
  const parentPostId = post.parent_post_id ?? null;

  const exists = (await client`
		SELECT id FROM discussion_posts
		WHERE module_id = ${post.module_id}
			AND cohort_id = ${post.cohort_id}
			AND author_id = ${post.author_id}
			AND body = ${post.body}
			AND coalesce(parent_post_id, 0) = coalesce(${parentPostId}, 0)
		LIMIT 1
	`) as DiscussionRow[];
  if (exists.length) return exists[0].id;

  const inserted = (await client`
		INSERT INTO discussion_posts (module_id, cohort_id, author_id, parent_post_id, body, created_at)
		VALUES (${post.module_id}, ${post.cohort_id}, ${post.author_id}, ${parentPostId}, ${post.body}, ${post.created_at})
		RETURNING id
	`) as DiscussionRow[];
  return inserted[0].id;
}

async function main() {
  try {
    console.log("Starting seed...");

    // 1) Modules
    await upsertModules();

    // 2) Profile
    const profileId = await findOrCreateProfile();
    console.log("Profile ensured:", profileId);

    // 3) Cohorts
    const cohortA = await findOrCreateCohort(
      "fall-2026",
      "seed-access-hash-1",
      true,
    );
    const cohortB = await findOrCreateCohort(
      "spring-2026",
      "seed-access-hash-2",
      true,
    );
    console.log("Cohorts ensured:", cohortA, cohortB);

    // 4) Cohort-module links
    const allModules = (await client`
      SELECT id FROM modules ORDER BY module_index
    `) as { id: number }[];
    for (const cohortId of [cohortA, cohortB]) {
      for (const mod of allModules) {
        await client`
          INSERT INTO cohort_modules (cohort_id, module_id, is_active)
          VALUES (${cohortId}, ${mod.id}, true)
          ON CONFLICT (cohort_id, module_id) DO NOTHING
        `;
      }
    }
    console.log("Cohort-module links ensured.");

    // 5) Resources - create a sample of each enum type
    const modulesRows = (await client`
      SELECT id, module_index FROM modules ORDER BY module_index
    `) as Pick<ModuleRow, "id" | "module_index">[];
    const firstModuleId = modulesRows[0].id;
    const secondModuleId = modulesRows[1].id;

    await findOrCreateResource({
      module_id: firstModuleId,
      cohort_id: cohortA,
      type: "handout",
      title: "Orientation Packet",
      description: "PDF handout for orientation",
      url: "https://example.com/handout.pdf",
      mime_type: "application/pdf",
      size_bytes: 1024,
      created_by: profileId,
    });

    await findOrCreateResource({
      module_id: firstModuleId,
      cohort_id: cohortA,
      type: "recording",
      title: "Session 1 Recording",
      description: "Zoom recording",
      url: "https://example.com/recording.mp4",
      mime_type: "video/mp4",
      size_bytes: 1024 * 1024,
      created_by: profileId,
    });

    await findOrCreateResource({
      module_id: secondModuleId,
      cohort_id: cohortB,
      type: "link",
      title: "Reference Article",
      description: "Useful article",
      url: "https://example.com/article",
      created_by: profileId,
    });

    console.log("Resources ensured.");

    // 6) Discussion posts - top-level and a reply
    const now = new Date().toISOString();

    const top1: DiscussionSeed = {
      module_id: firstModuleId,
      cohort_id: cohortA,
      author_id: profileId,
      parent_post_id: null,
      body: "Welcome to the course! Feel free to introduce yourself.",
      created_at: now,
    };

    const top1Id = await findOrCreateDiscussion(top1);

    const reply1: DiscussionSeed = {
      module_id: firstModuleId,
      cohort_id: cohortA,
      author_id: profileId,
      parent_post_id: top1Id,
      body: "Thanks! Excited to be here.",
      created_at: new Date(Date.now() + 1000).toISOString(),
    };

    await findOrCreateDiscussion(reply1);

    console.log("Discussion posts ensured.");

    // Final verification for modules
    const finalModules = (await client`
      SELECT module_index FROM modules ORDER BY module_index
    `) as ModuleIndexRow[];
    const indices = finalModules.map((r) => r.module_index);
    if (
      indices.length !== 6 ||
      ![1, 2, 3, 4, 5, 6].every((v, i) => v === indices[i])
    ) {
      throw new Error("Modules are not present or not ordered as 1..6");
    }

    console.log("Seed complete");
  } catch (err) {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  } finally {
    try {
      await client.end();
    } catch {}
  }
}

void main();
