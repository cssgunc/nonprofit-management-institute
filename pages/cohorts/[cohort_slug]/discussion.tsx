import SidebarDiscussions, {
  discussionsSidebarItems,
} from "@/components/sidebarDiscussions";
import { useRouter } from "next/router";

export default function DiscussionPage() {
  const router = useRouter();

  const cohortSlug =
    typeof router.query.cohort_slug === "string" ? router.query.cohort_slug : "";

  const baseCohortPath = cohortSlug ? `/cohorts/${cohortSlug}` : "/cohorts";

  const discussionItems = discussionsSidebarItems.map((item) => ({
    ...item,
    href: item.moduleSlug
      ? `${baseCohortPath}/${item.moduleSlug}/discussions`
      : `${baseCohortPath}/discussion`,
  }));

  return (
    <>
      <SidebarDiscussions items={discussionItems} activeId={0} />
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
