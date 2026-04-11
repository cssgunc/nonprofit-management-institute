import SidebarDiscussions from "@/components/sidebarDiscussions";
import type { DiscussionNavItem } from "@/components/sidebarDiscussions";
import { useRouter } from "next/router";
import { useEffect, useLayoutEffect, useState } from "react";
import { api } from "@/utils/trpc/api";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function DiscussionPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useIsomorphicLayoutEffect(() => {
    setMounted(true);
  }, []);

  const cohortSlug =
    typeof router.query.cohort_slug === "string"
      ? router.query.cohort_slug
      : "";

  const selectedModuleSlug =
    typeof router.query.modules_slug === "string"
      ? router.query.modules_slug
      : "";

  const baseCohortPath = cohortSlug ? `/cohorts/${cohortSlug}` : "/cohorts";

  const modulesQuery = api.modules.list.useQuery(
    { cohortSlug },
    { enabled: !!cohortSlug },
  );

  const discussionItems: DiscussionNavItem[] = [
    { id: 0, title: "General", href: `${baseCohortPath}/discussion` },
    ...((modulesQuery.data ?? []).map((module) => ({
      id: module.id,
      title: module.title,
      href: `${baseCohortPath}/${module.slug}/discussions`,
      moduleSlug: module.slug,
    })) satisfies DiscussionNavItem[]),
  ];

  const activeDiscussionId =
    discussionItems.find((item) => item.moduleSlug === selectedModuleSlug)
      ?.id ?? 0;

  return (
    <div className="flex min-h-[calc(100vh-7rem)] w-full">
      {mounted && (
        <SidebarDiscussions
          items={discussionItems}
          activeId={activeDiscussionId}
        />
      )}
      <div className="flex min-h-[calc(100vh-7rem)] flex-1 flex-col items-center justify-center bg-zinc-50">
        <h1 className="text-3xl font-bold text-black">
          Discussion
        </h1>
        <p className="text-black">
          This is the discussion page for the cohort.
        </p>
      </div>
    </div>
  );
}
