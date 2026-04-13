import SidebarModules from "@/components/sidebarModules";
import type { SidebarNavItem } from "@/components/sidebarModules";
import SidebarDiscussions from "@/components/sidebarDiscussions";
import type { DiscussionNavItem } from "@/components/sidebarDiscussions";
import CohortAccessGuard from "@/components/CohortAccessGuard";
import { getDiscussionSidebarContext } from "@/utils/sidebarContext";
import { api } from "@/utils/trpc/api";
import { useRouter } from "next/router";
import { useEffect, useLayoutEffect, useState } from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function ModuleDiscussions() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [sidebarContext, setSidebarContext] = useState<
    "modules" | "discussions"
  >("modules");

  const cohortSlug =
    typeof router.query.cohort_slug === "string"
      ? router.query.cohort_slug
      : "";

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
    cohortSlug && moduleSlug
      ? `/cohorts/${cohortSlug}/${moduleSlug}`
      : "/cohorts";

  const baseCohortPath = cohortSlug ? `/cohorts/${cohortSlug}` : "/cohorts";
  const modulesQuery = api.modules.list.useQuery(
    { cohortSlug },
    { enabled: !!cohortSlug },
  );
  const moduleQuery = api.modules.bySlug.useQuery(
    { slug: moduleSlug, cohortSlug },
    { enabled: !!cohortSlug && !!moduleSlug },
  );

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
    discussionItems.find((item) => item.moduleSlug === moduleSlug)?.id ?? 0;

  return (
    <CohortAccessGuard cohortSlug={cohortSlug}>
      <div className="flex min-h-[calc(100vh-7rem)] w-full">
        {mounted &&
          (sidebarContext === "discussions" ? (
            <SidebarDiscussions
              items={discussionItems}
              activeId={activeDiscussionId}
            />
          ) : (
            <SidebarModules items={sidebarItems} activeId={1} />
          ))}
        <div className="flex min-h-[calc(100vh-7rem)] flex-1 flex-col items-center justify-center bg-zinc-50">
          <h1 className="text-3xl font-bold text-black">
            {moduleQuery.data?.title ?? "Module Discussion"}
          </h1>
          <p className="text-black">
            {moduleQuery.data
              ? `This is the discussion page for ${moduleQuery.data.title}.`
              : "This is the discussion page for this module."}
          </p>
        </div>
      </div>
    </CohortAccessGuard>
  );
}
