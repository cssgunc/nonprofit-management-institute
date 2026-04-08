import SidebarModules from "@/components/sidebarModules";
import type { SidebarNavItem } from "@/components/sidebarModules";
import { useRouter } from "next/router";

export default function DiscussionPage() {
  const router = useRouter();

  const cohortSlug =
    typeof router.query.cohort_slug === "string" ? router.query.cohort_slug : "";

  const baseCohortPath = cohortSlug ? `/cohorts/${cohortSlug}` : "/cohorts";

  const sidebarItems: SidebarNavItem[] = [
    {
			id: 0,
			title: "Recording",
      href: `${baseCohortPath}/dashboard`,
		},
		{
			id: 1,
			title: "Discussions",
      href: `${baseCohortPath}/discussion`,
		},
		{
			id: 2,
			title: "Materials",
      href: `${baseCohortPath}/contact`,
		},
  ];

  return (
    <>
      <SidebarModules items={sidebarItems} activeId={1} />
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black">
        <h1 className="text-3xl font-bold text-black dark:text-white">
          Discussion
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          This is the discussion page for the cohort.
        </p>
      </div>
    </>
  );
}
