import { useRouter } from "next/router";
import { VideoOff, Lock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { api } from "@/utils/trpc/api";
import { TRPCClientError } from "@trpc/client";
import SidebarModules from "@/components/sidebarModules";
import type { SidebarNavItem } from "@/components/sidebarModules";
import CohortAccessGuard from "@/components/CohortAccessGuard";

function parseYouTubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);

    // Already an embed URL
    if (
      parsed.hostname === "www.youtube.com" &&
      parsed.pathname.startsWith("/embed/")
    ) {
      return url;
    }

    // Standard watch URL: youtube.com/watch?v=VIDEO_ID
    if (
      (parsed.hostname === "www.youtube.com" ||
        parsed.hostname === "youtube.com") &&
      parsed.pathname === "/watch"
    ) {
      const videoId = parsed.searchParams.get("v");
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    // Short URL: youtu.be/VIDEO_ID
    if (parsed.hostname === "youtu.be") {
      const videoId = parsed.pathname.slice(1);
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    return null;
  } catch {
    return null;
  }
}

export default function ModulePage() {
  const router = useRouter();
  const { cohort_slug, modules_slug } = router.query;
  const slug = modules_slug as string;
  const cohortSlug = cohort_slug as string;
  const baseModulePath =
    cohortSlug && slug ? `/cohorts/${cohortSlug}/${slug}` : "/cohorts";

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

  const {
    data: module,
    isLoading: moduleLoading,
    error: moduleError,
  } = api.modules.bySlug.useQuery(
    { slug, cohortSlug },
    { enabled: !!slug && !!cohortSlug, retry: false },
  );

  const { data: recordings, isLoading: recordingsLoading } =
    api.resources.listByModuleSlug.useQuery(
      { moduleSlug: slug, type: "recording" },
      { enabled: !!slug && !!cohortSlug, retry: false },
    );

  const isLoading = moduleLoading || recordingsLoading;

  const recording = recordings?.[0];
  const embedUrl = recording?.url ? parseYouTubeEmbedUrl(recording.url) : null;

  if (isLoading) {
    return (
      <CohortAccessGuard cohortSlug={cohortSlug}>
        <div className="flex min-h-[calc(100vh-7rem)] w-full">
          <SidebarModules items={sidebarItems} activeId={0} />
          <div className="flex min-h-[calc(100vh-7rem)] flex-1 items-center justify-center">
            <p className="text-gray-400 text-sm">Loading...</p>
          </div>
        </div>
      </CohortAccessGuard>
    );
  }

  if (moduleError) {
    const code =
      moduleError instanceof TRPCClientError
        ? moduleError.data?.code
        : undefined;

    if (code === "FORBIDDEN") {
      return (
        <CohortAccessGuard cohortSlug={cohortSlug}>
          <div className="flex min-h-[calc(100vh-7rem)] w-full">
            <SidebarModules items={sidebarItems} activeId={0} />
            <div className="flex min-h-[calc(100vh-7rem)] flex-1 flex-col items-center justify-center gap-3">
              <Lock className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
              <p className="text-gray-600 font-medium">
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
        </CohortAccessGuard>
      );
    }

    if (code === "NOT_FOUND") {
      return (
        <CohortAccessGuard cohortSlug={cohortSlug}>
          <div className="flex min-h-[calc(100vh-7rem)] w-full">
            <SidebarModules items={sidebarItems} activeId={0} />
            <div className="flex min-h-[calc(100vh-7rem)] flex-1 flex-col items-center justify-center gap-3">
              <AlertCircle
                className="w-8 h-8 text-gray-400"
                strokeWidth={1.5}
              />
              <p className="text-gray-600 font-medium">Module not found.</p>
              <p className="text-sm text-gray-400">
                This module does not exist or has been removed.
              </p>
              <Link
                href={cohortSlug ? `/cohorts/${cohortSlug}/dashboard` : "/"}
                className="mt-2 inline-flex items-center justify-center rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </CohortAccessGuard>
      );
    }

    return (
      <CohortAccessGuard cohortSlug={cohortSlug}>
        <div className="flex min-h-[calc(100vh-7rem)] w-full">
          <SidebarModules items={sidebarItems} activeId={0} />
          <div className="flex min-h-[calc(100vh-7rem)] flex-1 flex-col items-center justify-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-400" strokeWidth={1.5} />
            <p className="text-gray-600 font-medium">Something went wrong.</p>
            <p className="text-sm text-gray-400">
              Failed to load this module. Please try again.
            </p>
            <Link
              href={cohortSlug ? `/cohorts/${cohortSlug}/dashboard` : "/"}
              className="mt-2 inline-flex items-center justify-center rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </CohortAccessGuard>
    );
  }

  if (!module) {
    return (
      <CohortAccessGuard cohortSlug={cohortSlug}>
        <div className="flex min-h-[calc(100vh-7rem)] w-full">
          <SidebarModules items={sidebarItems} activeId={0} />
          <div className="flex min-h-[calc(100vh-7rem)] flex-1 flex-col items-center justify-center gap-3">
            <AlertCircle className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
            <p className="text-gray-600 font-medium">Module not found.</p>
            <Link
              href={cohortSlug ? `/cohorts/${cohortSlug}/dashboard` : "/"}
              className="mt-2 inline-flex items-center justify-center rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </CohortAccessGuard>
    );
  }

  return (
    <CohortAccessGuard cohortSlug={cohortSlug}>
      <div className="flex min-h-[calc(100vh-7rem)] w-full">
        <SidebarModules items={sidebarItems} activeId={0} />
        <div className="flex min-h-[calc(100vh-7rem)] flex-1 justify-center bg-zinc-50">
          <div className="flex w-full max-w-4xl flex-col gap-8 p-8">
            <h1 className="text-3xl font-bold text-gray-900">{module.title}</h1>

            {embedUrl ? (
              <div className="w-full aspect-video rounded-lg overflow-hidden shadow-md bg-black">
                <iframe
                  src={embedUrl}
                  title={module.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            ) : (
              <div className="w-full aspect-video rounded-lg bg-gray-100 border border-gray-200 flex flex-col items-center justify-center gap-3">
                <VideoOff
                  className="w-10 h-10 text-gray-400"
                  strokeWidth={1.5}
                />
                <p className="text-sm text-gray-400">
                  No video has been published for this module yet.
                </p>
              </div>
            )}

            {module.description && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Description
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  {module.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </CohortAccessGuard>
  );
}
