import SidebarModules from "@/components/sidebarModules";
import type { SidebarNavItem } from "@/components/sidebarModules";
import { useRouter } from "next/router";

export default function ModuleMaterials() {
  const router = useRouter();

  const cohortSlug =
    typeof router.query.cohort_slug === "string"
      ? router.query.cohort_slug
      : "";

  const moduleSlug =
    typeof router.query.modules_slug === "string"
      ? router.query.modules_slug
      : "";

  const baseModulePath =
    cohortSlug && moduleSlug
      ? `/cohorts/${cohortSlug}/${moduleSlug}`
      : "/cohorts";

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

  return (
    <>
      <SidebarModules items={sidebarItems} activeId={2} />
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black">
        <h1 className="text-3xl font-bold text-black dark:text-white">
          Materials
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          This page is intentionally blank for now.
        </p>
      </div>
    </>
  );
}
