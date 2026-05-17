import SidebarModules from "@/components/sidebarModules";
import type { SidebarNavItem } from "@/components/sidebarModules";
import CohortAccessGuard from "@/components/CohortAccessGuard";
import WebsiteCard from "@/components/WebsiteCard";
import DocumentCard from "@/components/DocumentCard";
import {
  AddWebsiteModal,
  AddDocumentModal,
  AddHandoutModal,
} from "@/components/AddResourceModals";
import { api } from "@/utils/trpc/api";
import { TRPCClientError } from "@trpc/client";
import { AlertCircle, Lock, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { toast } from "sonner";

type OpenModal = "website" | "document" | "handout" | null;

export default function ModuleMaterials() {
  const router = useRouter();

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
          <div className="flex min-h-[calc(100vh-7rem)] flex-1 items-center justify-center">
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
          <div className="flex min-h-[calc(100vh-7rem)] flex-1 flex-col items-center justify-center gap-3">
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
          <div className="flex min-h-[calc(100vh-7rem)] flex-1 flex-col items-center justify-center gap-3">
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

        <div className="flex min-h-[calc(100vh-7rem)] flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-7 px-6 py-8">
            <div className="motion-rise space-y-2">
              <h1 className="text-3xl font-bold text-black">
                Additional Resources
              </h1>
              <p className="text-sm text-zinc-600">
                Websites, documents, and handouts for this module.
              </p>
            </div>

            {/* Websites */}
            <section className="motion-rise motion-delay-1 rounded-[1.4rem] border border-[rgba(40,132,164,0.1)] bg-[rgba(255,253,248,0.76)] px-5 py-5 shadow-[0_18px_44px_rgba(61,52,45,0.06)]">
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
                <div className="flex flex-col gap-3">
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
            <section className="motion-rise motion-delay-2 rounded-[1.4rem] border border-[rgba(40,132,164,0.1)] bg-[rgba(255,253,248,0.76)] px-5 py-5 shadow-[0_18px_44px_rgba(61,52,45,0.06)]">
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
                <div className="flex flex-wrap gap-5">
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
            <section className="motion-rise motion-delay-3 rounded-[1.4rem] border border-[rgba(40,132,164,0.1)] bg-[rgba(255,253,248,0.76)] px-5 py-5 shadow-[0_18px_44px_rgba(61,52,45,0.06)]">
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
                <div className="flex flex-wrap gap-5">
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
          onSuccess={() => toast.success("Website added.")}
        />
      )}
      {isAdmin && openModal === "document" && (
        <AddDocumentModal
          {...modalProps}
          onSuccess={() => toast.success("Document added.")}
        />
      )}
      {isAdmin && openModal === "handout" && (
        <AddHandoutModal
          {...modalProps}
          onSuccess={() => toast.success("Handout added.")}
        />
      )}

      {/* Success toast */}
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
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      {isAdmin && (
        <button
          onClick={onAdd}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#007997] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(0,121,151,0.18)] transition hover:bg-[#006b85] hover:shadow-[0_14px_28px_rgba(0,121,151,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007997] focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" strokeWidth={2.2} />
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
    <div className="rounded-xl border border-dashed border-[rgba(40,132,164,0.16)] bg-white/70 px-5 py-6 text-center text-sm text-zinc-500">
      <span>No {label} yet.</span>
      {isAdmin && (
        <button
          onClick={onAdd}
          className="ml-2 cursor-pointer font-semibold text-[var(--brand-teal)] underline underline-offset-4 hover:text-[#007997]"
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
            className="h-16 w-full animate-pulse rounded-xl bg-[rgba(40,132,164,0.1)]"
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
          className="h-[224px] w-[168px] animate-pulse rounded-xl bg-[rgba(40,132,164,0.1)]"
        />
      ))}
    </div>
  );
}
