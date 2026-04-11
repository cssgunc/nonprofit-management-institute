import SidebarModules from "@/components/sidebarModules";
import type { SidebarNavItem } from "@/components/sidebarModules";
import SidebarDiscussions, {
	discussionsSidebarItems,
} from "@/components/sidebarDiscussions";
import { getDiscussionSidebarContext } from "@/utils/sidebarContext";
import { useRouter } from "next/router";
import { useEffect, useLayoutEffect, useState } from "react";

const useIsomorphicLayoutEffect =
	typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function ModuleDiscussions() {
	const router = useRouter();
	const [mounted, setMounted] = useState(false);
	const [sidebarContext, setSidebarContext] = useState<"modules" | "discussions">(
		"modules",
	);

	const cohortSlug =
		typeof router.query.cohort_slug === "string" ? router.query.cohort_slug : "";

	const moduleSlug =
		typeof router.query.modules_slug === "string"
			? router.query.modules_slug
			: "";

	useIsomorphicLayoutEffect(() => {
		const storedContext = getDiscussionSidebarContext();

		if (storedContext) {
			setSidebarContext(storedContext);
		}

		setMounted(true);
	}, []);

	const baseModulePath =
		cohortSlug && moduleSlug ? `/cohorts/${cohortSlug}/${moduleSlug}` : "/cohorts";

	const baseCohortPath = cohortSlug ? `/cohorts/${cohortSlug}` : "/cohorts";

	const sidebarItems: SidebarNavItem[] = [
		{
			id: 0,
			title: "Recording",
			href: `${baseModulePath}/module`,
		},
		{
			id: 1,
			title: "Discussions",
			href: `${baseModulePath}/discussions`,
		},
		{
			id: 2,
			title: "Materials",
			href: `${baseModulePath}/materials`,
		},
	];

	const discussionItems = discussionsSidebarItems.map((item) => ({
		...item,
		href: item.moduleSlug
			? `${baseCohortPath}/${item.moduleSlug}/discussions`
			: `${baseCohortPath}/discussion`,
	}));

	const activeDiscussionId =
		discussionItems.find((item) => item.moduleSlug === moduleSlug)?.id ?? 0;

	return (
		<>
			{mounted && (sidebarContext === "discussions" ? (
				<SidebarDiscussions
					items={discussionItems}
					activeId={activeDiscussionId}
				/>
			) : (
				<SidebarModules items={sidebarItems} activeId={1} />
			))}
			<div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black">
				<h1 className="text-3xl font-bold text-black dark:text-white">
					Module Discussion
				</h1>
				<p className="text-zinc-600 dark:text-zinc-400">
					This is the discussion page for this module.
				</p>
			</div>
		</>
	);
}