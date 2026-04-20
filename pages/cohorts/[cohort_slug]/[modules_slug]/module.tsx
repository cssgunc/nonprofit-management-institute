import { useRouter } from "next/router";
import { useState } from "react";
import { VideoOff, Lock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { api } from "@/utils/trpc/api";
import { TRPCClientError } from "@trpc/client";
import SidebarModules from "@/components/sidebarModules";
import type { SidebarNavItem } from "@/components/sidebarModules";
import CohortAccessGuard from "@/components/CohortAccessGuard";
import { toast } from "sonner";

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
  const [isEditing, setIsEditing] = useState(false);
  const [editUrl, setEditUrl] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const utils = api.useUtils();

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

  const profileQuery = api.profiles.me.useQuery(undefined, {
    retry: false,
  });
  const isAdmin = profileQuery.isSuccess && profileQuery.data.role === "admin";
  const updateModule = api.modules.update.useMutation();
  const upsertRecording = api.resources.upsertRecording.useMutation();
  const isSaving = updateModule.isPending || upsertRecording.isPending;

  const isLoading = moduleLoading || recordingsLoading;

  const recording =
    module && recordings
      ? (recordings.find(
          (item) => item.cohortId === String(module.cohort_id),
        ) ??
        recordings.find((item) => item.cohortId === null) ??
        recordings[0])
      : undefined;
  const displayUrl = isEditing ? editUrl : (recording?.url ?? "");
  const embedUrl = displayUrl ? parseYouTubeEmbedUrl(displayUrl) : null;
  const hasEditChanges =
    editUrl !== (recording?.url ?? "") ||
    editDescription !== (module?.description ?? "");

  const enterEditMode = () => {
    setEditUrl(recording?.url ?? "");
    setEditDescription(module?.description ?? "");
    setIsEditing(true);
  };

  const cancelEditMode = () => {
    setEditUrl(recording?.url ?? "");
    setEditDescription(module?.description ?? "");
    setIsEditing(false);
  };

  const saveChanges = async () => {
    if (!module) return;

    if (!hasEditChanges) {
      toast.info("Make a change before saving.");
      return;
    }

    try {
      await updateModule.mutateAsync({
        moduleId: module.id,
        description: editDescription,
      });
      await upsertRecording.mutateAsync({
        moduleId: module.id,
        cohortId: module.cohort_id,
        url: editUrl,
      });
      await Promise.all([
        utils.modules.bySlug.invalidate({ slug, cohortSlug }),
        utils.resources.listByModuleSlug.invalidate({
          moduleSlug: slug,
          type: "recording",
        }),
      ]);
      toast.success("Module updated.");
      setIsEditing(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update module.",
      );
    }
  };

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
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold text-gray-900">
                {module.title}
              </h1>
              {isAdmin &&
                (isEditing ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={cancelEditMode}
                      disabled={isSaving}
                      className="rounded-full px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveChanges}
                      disabled={isSaving}
                      aria-disabled={!hasEditChanges}
                      className={`rounded-full bg-[#007997] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#006b85] disabled:cursor-not-allowed disabled:opacity-70 ${
                        !hasEditChanges ? "cursor-not-allowed opacity-70" : ""
                      }`}
                    >
                      {isSaving ? "Saving..." : "Done"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={enterEditMode}
                    className="shrink-0 rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-white hover:text-zinc-950"
                  >
                    Edit
                  </button>
                ))}
            </div>

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

            {isEditing && (
              <label className="flex items-center gap-3 text-sm font-semibold text-gray-800">
                <span className="shrink-0">URL:</span>
                <input
                  type="url"
                  value={editUrl}
                  onChange={(event) => setEditUrl(event.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-normal text-zinc-800 outline-none transition focus:border-[var(--brand-teal)] focus:ring-2 focus:ring-[rgba(0,138,171,0.16)]"
                />
              </label>
            )}

            {(module.description || isEditing) && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Description
                </h2>
                {isEditing ? (
                  <textarea
                    value={editDescription}
                    onChange={(event) =>
                      setEditDescription(event.target.value)
                    }
                    rows={8}
                    className="w-full resize-y rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm leading-relaxed text-zinc-800 outline-none transition focus:border-[var(--brand-teal)] focus:ring-2 focus:ring-[rgba(0,138,171,0.16)]"
                  />
                ) : (
                  <p className="text-gray-700 leading-relaxed">
                    {module.description}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </CohortAccessGuard>
  );
}
