import SidebarModules from "@/components/sidebarModules";
import type { SidebarNavItem } from "@/components/sidebarModules";
import CohortAccessGuard from "@/components/CohortAccessGuard";
import { api } from "@/utils/trpc/api";
import { TRPCClientError } from "@trpc/client";
import { AlertCircle, Lock } from "lucide-react";
import Link from "next/link";
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

  const {
    data: module,
    isLoading,
    error: moduleError,
  } = api.modules.bySlug.useQuery(
    { slug: moduleSlug, cohortSlug },
    { enabled: !!moduleSlug && !!cohortSlug, retry: false },
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

  return (
    <CohortAccessGuard cohortSlug={cohortSlug}>
      {isLoading ? (
        <div className="flex min-h-[calc(100vh-7rem)] w-full">
          <SidebarModules items={sidebarItems} activeId={2} />
          <div className="flex min-h-[calc(100vh-7rem)] flex-1 items-center justify-center bg-zinc-50">
            <p className="text-sm text-gray-400">Loading...</p>
          </div>
        </div>
      ) : moduleError ? (
        (() => {
          const code =
            moduleError instanceof TRPCClientError
              ? moduleError.data?.code
              : undefined;

          if (code === "FORBIDDEN") {
            return (
              <div className="flex min-h-[calc(100vh-7rem)] w-full">
                <SidebarModules items={sidebarItems} activeId={2} />
                <div className="flex min-h-[calc(100vh-7rem)] flex-1 flex-col items-center justify-center gap-3 bg-zinc-50">
                  <Lock className="h-8 w-8 text-gray-400" strokeWidth={1.5} />
                  <p className="font-medium text-gray-600">
                    This module is locked.
                  </p>
                  <p className="text-sm text-gray-400">
                    You do not have access to this module yet.
                  </p>
                  <Link
                    href={cohortSlug ? `/cohorts/${cohortSlug}/dashboard` : "/"}
                    className="mt-2 inline-flex items-center justify-center rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                  >
                    Back to Dashboard
                  </Link>
                </div>
              </div>
            );
          }

          return (
            <div className="flex min-h-[calc(100vh-7rem)] w-full">
              <SidebarModules items={sidebarItems} activeId={2} />
              <div className="flex min-h-[calc(100vh-7rem)] flex-1 flex-col items-center justify-center gap-3 bg-zinc-50">
                <AlertCircle
                  className="h-8 w-8 text-gray-400"
                  strokeWidth={1.5}
                />
                <p className="font-medium text-gray-600">
                  {code === "NOT_FOUND"
                    ? "Module not found."
                    : "Something went wrong."}
                </p>
                <Link
                  href={cohortSlug ? `/cohorts/${cohortSlug}/dashboard` : "/"}
                  className="mt-2 inline-flex items-center justify-center rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          );
        })()
      ) : !module ? (
        <div className="flex min-h-[calc(100vh-7rem)] w-full">
          <SidebarModules items={sidebarItems} activeId={2} />
          <div className="flex min-h-[calc(100vh-7rem)] flex-1 flex-col items-center justify-center gap-3 bg-zinc-50">
            <AlertCircle className="h-8 w-8 text-gray-400" strokeWidth={1.5} />
            <p className="font-medium text-gray-600">Module not found.</p>
            <Link
              href={cohortSlug ? `/cohorts/${cohortSlug}/dashboard` : "/"}
              className="mt-2 inline-flex items-center justify-center rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex min-h-[calc(100vh-7rem)] w-full">
          <SidebarModules items={sidebarItems} activeId={2} />
          <div className="flex min-h-[calc(100vh-7rem)] flex-1 flex-col items-center justify-center bg-zinc-50">
            <h1 className="text-3xl font-bold text-black">Materials</h1>
            <p className="text-black">
              This page is intentionally blank for now.
            </p>
          </div>
        </div>
      )}
    </CohortAccessGuard>
  );
}
