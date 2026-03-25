import "dotenv/config";
import { client } from "../server/db";

type ModuleSeed = {
	module_index: number;
	slug: string;
	title: string;
	description?: string | null;
	is_locked?: boolean | null;
};

const MODULES: ModuleSeed[] = [
	{ module_index: 1, slug: "module-1-introduction", title: "Introduction", description: "Overview and orientation", is_locked: false },
	{ module_index: 2, slug: "module-2-fundraising-basics", title: "Fundraising Basics", description: "Principles of fundraising", is_locked: false },
	{ module_index: 3, slug: "module-3-governance", title: "Governance & Board", description: "Board roles and governance", is_locked: false },
	{ module_index: 4, slug: "module-4-finance", title: "Finance & Budgeting", description: "Basic nonprofit finance", is_locked: false },
	{ module_index: 5, slug: "module-5-programs", title: "Programs & Impact", description: "Program design and measurement", is_locked: false },
	{ module_index: 6, slug: "module-6-operations", title: "Operations & HR", description: "Operations, policies, and HR", is_locked: false },
];

const DUMMY_PROFILE_ID = "00000000-0000-0000-0000-000000000001";

async function upsertModules() {
	for (const m of MODULES) {
		await client`
			INSERT INTO modules (module_index, slug, title, description, is_locked)
			VALUES (${m.module_index}, ${m.slug}, ${m.title}, ${m.description ?? null}, ${m.is_locked ?? null})
			ON CONFLICT (module_index) DO UPDATE
			SET slug = EXCLUDED.slug,
					title = EXCLUDED.title,
					description = EXCLUDED.description,
					is_locked = EXCLUDED.is_locked
		`;
	}

	const rows = await client`SELECT id, module_index, slug FROM modules ORDER BY module_index`;
	if (rows.length !== 6) {
		throw new Error(`Expected 6 modules after seeding, found ${rows.length}`);
	}
	console.log("Modules upserted: ", rows.map((r: any) => `${r.module_index}:${r.slug}`).join(", "));
}

async function findOrCreateProfile() {
	const existing = await client`SELECT id FROM profiles WHERE id = ${DUMMY_PROFILE_ID}`;
	if (existing.length) return existing[0].id;

	await client`
		INSERT INTO profiles (id, role, full_name, is_active, organization, avatar_url)
		VALUES (${DUMMY_PROFILE_ID}, 'student', 'Seed User', true, 'Seed Org', null)
		ON CONFLICT (id) DO NOTHING
	`;

	return DUMMY_PROFILE_ID;
}

async function findOrCreateCohort(slug: string, accessHash: string, isActive = true) {
	const existing = await client`SELECT id FROM cohorts WHERE slug = ${slug} LIMIT 1`;
	if (existing.length) return existing[0].id;

	const res = await client`
		INSERT INTO cohorts (is_active, access_hash, slug)
		VALUES (${isActive}, ${accessHash}, ${slug})
		RETURNING id
	`;

	return res[0].id;
}

async function findOrCreateResource(resource: any) {
	const exists = await client`
		SELECT id FROM resources
		WHERE module_id = ${resource.module_id}
			AND cohort_id = ${resource.cohort_id}
			AND title = ${resource.title}
			AND type = ${resource.type}
		LIMIT 1
	`;
	if (exists.length) return exists[0].id;

	const inserted = await client`
		INSERT INTO resources (module_id, cohort_id, type, title, description, url, mime_type, size_bytes, created_by)
		VALUES (${resource.module_id}, ${resource.cohort_id}, ${resource.type}, ${resource.title}, ${resource.description ?? null}, ${resource.url ?? null}, ${resource.mime_type ?? null}, ${resource.size_bytes ?? null}, ${resource.created_by})
		RETURNING id
	`;
	return inserted[0].id;
}

async function findOrCreateDiscussion(post: any) {
	const exists = await client`
		SELECT id FROM discussion_posts
		WHERE module_id = ${post.module_id}
			AND cohort_id = ${post.cohort_id}
			AND author_id = ${post.author_id}
			AND body = ${post.body}
			AND coalesce(parent_post_id, 0) = coalesce(${post.parent_post_id}, 0)
		LIMIT 1
	`;
	if (exists.length) return exists[0].id;

	const inserted = await client`
		INSERT INTO discussion_posts (module_id, cohort_id, author_id, parent_post_id, body, created_at)
		VALUES (${post.module_id}, ${post.cohort_id}, ${post.author_id}, ${post.parent_post_id ?? null}, ${post.body}, ${post.created_at})
		RETURNING id
	`;
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
		const cohortA = await findOrCreateCohort("fall-2026", "seed-access-hash-1", true);
		const cohortB = await findOrCreateCohort("spring-2026", "seed-access-hash-2", true);
		console.log("Cohorts ensured:", cohortA, cohortB);

		// 4) Resources - create a sample of each enum type
		const modulesRows = await client`SELECT id, module_index FROM modules ORDER BY module_index`;
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

		// 5) Discussion posts - top-level and a reply
		const now = new Date().toISOString();

		const top1 = {
			module_id: firstModuleId,
			cohort_id: cohortA,
			author_id: profileId,
			parent_post_id: null,
			body: "Welcome to the course! Feel free to introduce yourself.",
			created_at: now,
		};

		const top1Id = await findOrCreateDiscussion(top1);

		const reply1 = {
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
		const finalModules = await client`SELECT module_index FROM modules ORDER BY module_index`;
		const indices = finalModules.map((r: any) => r.module_index);
		if (indices.length !== 6 || ![1, 2, 3, 4, 5, 6].every((v, i) => v === indices[i])) {
			throw new Error("Modules are not present or not ordered as 1..6");
		}

		console.log("Seed complete");
	} catch (err) {
		console.error("Seed failed:", err);
		process.exitCode = 1;
	} finally {
		try {
			await (client as any).end();
		} catch {}
	}
}

void main();
