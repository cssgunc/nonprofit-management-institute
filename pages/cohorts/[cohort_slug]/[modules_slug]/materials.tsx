import SidebarModules from "@/components/sidebarModules";
import type { SidebarNavItem } from "@/components/sidebarModules";
import CohortAccessGuard from "@/components/CohortAccessGuard";
import WebsiteCard from "@/components/WebsiteCard";
import DocumentCard from "@/components/DocumentCard";
import {
  AddWebsiteModal,
  AddDocumentModal,
  AddHandoutModal,
  useToast,
} from "@/components/AddResourceModals";
import { api } from "@/utils/trpc/api";
import { TRPCClientError } from "@trpc/client";
import { AlertCircle, Lock, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

type OpenModal = "website" | "document" | "handout" | null;

export default function ModuleMaterials() {
  const router = useRouter();
  const { show: showToast, Toast } = useToast();

  // 1. Fetch user profile and determine admin status (matching Dashboard logic)
  const profileQuery = api.profiles.me.useQuery(undefined, {
    retry: false,
  });
  const isAdmin = profileQuery.isSuccess && profileQuery.data?.role === "admin";

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

  const [openModal, setOpenModal] = useState<OpenModal>(null);

  // Module query
  const {
    data: module,
    isLoading: isModuleLoading,
    error: moduleError,
  } = api.modules.bySlug.useQuery(
    { slug: moduleSlug, cohortSlug },
    { enabled: !!moduleSlug && !!cohortSlug, retry: false },
  );

  const enabled = !!moduleSlug && !!module;

  // Per-section resource queries
  const { data: websites, isLoading: websitesLoading } =
    api.resources.listByModuleSlug.useQuery(
      { moduleSlug, type: "link" },
      { enabled, retry: false },
    );

  const { data: documents, isLoading: documentsLoading } =
    api.resources.listByModuleSlug.useQuery(
      { moduleSlug, type: "document" },
      { enabled, retry: false },
    );

  const { data: handouts, isLoading: handoutsLoading } =
    api.resources.listByModuleSlug.useQuery(
      { moduleSlug, type: "handout" },
      { enabled, retry: false },
    );

  const utils = api.useUtils();

  // Delete mutation — invalidates the relevant query
  const deleteResource = api.resources.delete.useMutation({
    onSuccess: async (deleted) => {
      if (deleted.type === "link") {
        await utils.resources.listByModuleSlug.invalidate({
          moduleSlug,
          type: "link",
        });
      } else if (deleted.type === "document") {
        await utils.resources.listByModuleSlug.invalidate({
          moduleSlug,
          type: "document",
        });
      } else {
        await utils.resources.listByModuleSlug.invalidate({
          moduleSlug,
          type: "handout",
        });
      }
    },
  });

  const sidebarItems: SidebarNavItem[] = [
    { id: 0, title: "Recording", href: `${baseModulePath}/module` },
    { id: 1, title: "Discussions", href: `${baseModulePath}/discussions` },
    { id: 2, title: "Materials", href: `${baseModulePath}/materials` },
  ];

  // Loading state
  if (isModuleLoading) {
    return (
      <CohortAccessGuard cohortSlug={cohortSlug}>
        <div className="flex min-h-[calc(100vh-7rem)] w-full">
          <SidebarModules items={sidebarItems} activeId={2} />
          <div className="flex min-h-[calc(100vh-7rem)] flex-1 items-center justify-center bg-zinc-50">
            <p className="text-sm text-gray-400">Loading...</p>
          </div>
        </div>
      </CohortAccessGuard>
    );
  }

  // Error state
  if (moduleError) {
    const code =
      moduleError instanceof TRPCClientError
        ? moduleError.data?.code
        : undefined;

    return (
      <CohortAccessGuard cohortSlug={cohortSlug}>
        <div className="flex min-h-[calc(100vh-7rem)] w-full">
          <SidebarModules items={sidebarItems} activeId={2} />
          <div className="flex min-h-[calc(100vh-7rem)] flex-1 flex-col items-center justify-center gap-3 bg-zinc-50">
            {code === "FORBIDDEN" ? (
              <Lock className="h-8 w-8 text-gray-400" strokeWidth={1.5} />
            ) : (
              <AlertCircle
                className="h-8 w-8 text-gray-400"
                strokeWidth={1.5}
              />
            )}
            <p className="font-medium text-gray-600">
              {code === "FORBIDDEN"
                ? "This module is locked."
                : code === "NOT_FOUND"
                  ? "Module not found."
                  : "Something went wrong."}
            </p>
            {code === "FORBIDDEN" && (
              <p className="text-sm text-gray-400">
                You do not have access to this module yet.
              </p>
            )}
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
      </CohortAccessGuard>
    );
  }

  // Shared modal props
  const modalProps = {
    moduleSlug,
    cohortSlug,
    onClose: () => setOpenModal(null),
  };

  return (
    <CohortAccessGuard cohortSlug={cohortSlug}>
      <div className="flex min-h-[calc(100vh-7rem)] w-full">
        <SidebarModules items={sidebarItems} activeId={2} />

        <div className="flex min-h-[calc(100vh-7rem)] flex-1 flex-col bg-zinc-50">
          {/* Page header */}
          <div className="px-8 py-5">
            <h1 className="text-3xl font-bold text-black pt-2.5">
              Additional Resources
            </h1>
          </div>

          {/* Sections */}
          <div className="flex flex-1 flex-col gap-10 px-8 py-8">
            {/* Websites */}
            <section>
              <SectionHeader
                title="Websites"
                isAdmin={isAdmin}
                onAdd={() => setOpenModal("website")}
              />
              {websitesLoading ? (
                <SectionSkeleton type="list" />
              ) : !websites?.length ? (
                <SectionEmpty
                  label="websites"
                  isAdmin={isAdmin}
                  onAdd={() => setOpenModal("website")}
                />
              ) : (
                <div className="flex flex-col gap-2">
                  {websites.map((r) => (
                    <WebsiteCard
                      key={r.id}
                      resource={r}
                      isAdmin={isAdmin}
                      onDelete={(id) => deleteResource.mutate({ id })}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Documents */}
            <section>
              <SectionHeader
                title="Documents"
                isAdmin={isAdmin}
                onAdd={() => setOpenModal("document")}
              />
              {documentsLoading ? (
                <SectionSkeleton type="grid" />
              ) : !documents?.length ? (
                <SectionEmpty
                  label="documents"
                  isAdmin={isAdmin}
                  onAdd={() => setOpenModal("document")}
                />
              ) : (
                <div className="flex flex-wrap gap-4">
                  {documents.map((r) => (
                    <DocumentCard
                      key={r.id}
                      resource={r}
                      isAdmin={isAdmin}
                      onDelete={(id) => deleteResource.mutate({ id })}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Handouts */}
            <section>
              <SectionHeader
                title="Handout"
                isAdmin={isAdmin}
                onAdd={() => setOpenModal("handout")}
              />
              {handoutsLoading ? (
                <SectionSkeleton type="grid" />
              ) : !handouts?.length ? (
                <SectionEmpty
                  label="handouts"
                  isAdmin={isAdmin}
                  onAdd={() => setOpenModal("handout")}
                />
              ) : (
                <div className="flex flex-wrap gap-4">
                  {handouts.map((r) => (
                    <DocumentCard
                      key={r.id}
                      resource={r}
                      isAdmin={isAdmin}
                      onDelete={(id) => deleteResource.mutate({ id })}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Per-section modals */}
      {isAdmin && openModal === "website" && (
        <AddWebsiteModal
          {...modalProps}
          onSuccess={() => showToast("Website added successfully.")}
        />
      )}
      {isAdmin && openModal === "document" && (
        <AddDocumentModal
          {...modalProps}
          onSuccess={() => showToast("Document added successfully.")}
        />
      )}
      {isAdmin && openModal === "handout" && (
        <AddHandoutModal
          {...modalProps}
          onSuccess={() => showToast("Handout added successfully.")}
        />
      )}

      {/* Success toast */}
      <Toast />
    </CohortAccessGuard>
  );
}

// Sub-components

function SectionHeader({
  title,
  isAdmin,
  onAdd,
}: {
  title: string;
  isAdmin: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      {isAdmin && (
        <button
          onClick={onAdd}
          className="cursor-pointer inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      )}
    </div>
  );
}

function SectionEmpty({
  label,
  isAdmin,
  onAdd,
}: {
  label: string;
  isAdmin: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center gap-2 py-2 text-sm text-zinc-400">
      <span>No {label} yet.</span>
      {isAdmin && (
        <button
          onClick={onAdd}
          className="cursor-pointer text-zinc-500 underline underline-offset-2 hover:text-zinc-700"
        >
          Add one
        </button>
      )}
    </div>
  );
}

function SectionSkeleton({ type }: { type: "list" | "grid" }) {
  if (type === "list") {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-14 w-full animate-pulse rounded-lg bg-zinc-200"
          />
        ))}
      </div>
    );
  }
  return (
    <div className="flex gap-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-[224px] w-[168px] animate-pulse rounded-md bg-zinc-200"
        />
      ))}
    </div>
  );
}
