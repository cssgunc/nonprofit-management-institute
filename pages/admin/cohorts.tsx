import { useEffect, useState } from "react";
import { api } from "@/utils/trpc/api";
import { toast } from "sonner";
import CohortRow from "@/components/CohortRow";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/router";

export default function AdminCohortsPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [accessHash, setAccessHash] = useState("");
  const profileQuery = api.profiles.me.useQuery(undefined, {
    retry: false,
  });
  const membershipQuery = api.cohorts.hasCohortMembership.useQuery(
    {},
    {
      retry: false,
      enabled: profileQuery.isSuccess && profileQuery.data.role !== "admin",
    },
  );
  const isAdmin = profileQuery.isSuccess && profileQuery.data.role === "admin";

  const {
    data: cohorts,
    isLoading,
    refetch,
  } = api.cohorts.getAllCohorts.useQuery(undefined, {
    enabled: isAdmin,
    retry: false,
  });

  const utils = api.useUtils();

  useEffect(() => {
    if (profileQuery.isError) {
      router.replace("/login");
      return;
    }

    if (!profileQuery.isSuccess || profileQuery.data.role === "admin") {
      return;
    }

    if (membershipQuery.isLoading) {
      return;
    }

    if (membershipQuery.data?.slug) {
      router.replace(`/cohorts/${membershipQuery.data.slug}/dashboard`);
      return;
    }

    router.replace("/cohort-access");
  }, [
    membershipQuery.data?.slug,
    membershipQuery.isLoading,
    profileQuery.data?.role,
    profileQuery.isError,
    profileQuery.isSuccess,
    router,
  ]);

  const createCohort = api.cohorts.createCohort.useMutation({
    onSuccess: () => {
      toast.success("Cohort created successfully");
      setIsModalOpen(false);
      setSlug("");
      setAccessHash("");
      utils.cohorts.getAllCohorts.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create cohort");
    },
  });

  const handleCreate = () => {
    if (!slug.trim() || !accessHash.trim()) return;
    createCohort.mutate({ slug: slug.trim(), accessHash: accessHash.trim() });
  };

  if (profileQuery.isLoading || !isAdmin) {
    return (
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center px-6">
        <div className="motion-rise w-full max-w-xl rounded-[1.4rem] border border-[rgba(40,132,164,0.1)] bg-[rgba(255,253,248,0.82)] p-8 text-center shadow-[0_18px_44px_rgba(61,52,45,0.06)]">
          <h1 className="text-2xl font-semibold text-black">
            Checking admin access...
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-7rem)] px-5 py-8 md:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-7">
        <div className="motion-rise flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-black">Cohorts</h1>
            <p className="text-sm text-zinc-600">
              Manage cohort access, availability, and activity.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#007997] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(0,121,151,0.18)] transition hover:bg-[#006b85] hover:shadow-[0_14px_28px_rgba(0,121,151,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007997] focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" strokeWidth={2.2} />
            Create New Cohort
          </button>
        </div>

        <section className="motion-rise motion-delay-1 rounded-[1.4rem] border border-[rgba(40,132,164,0.1)] bg-[rgba(255,253,248,0.76)] p-4 shadow-[0_18px_44px_rgba(61,52,45,0.06)] md:p-5">
          {isLoading ? (
            <div className="rounded-xl border border-[rgba(40,132,164,0.1)] bg-white/75 px-6 py-10 text-center text-sm text-zinc-500">
              Loading cohorts...
            </div>
          ) : !cohorts || cohorts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[rgba(40,132,164,0.16)] bg-white/70 px-6 py-10 text-center text-sm text-zinc-500">
              No cohorts found.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {cohorts.map((cohort) => (
                <CohortRow
                  key={cohort.id}
                  id={cohort.id}
                  slug={cohort.slug}
                  is_active={cohort.is_active}
                  member_count={cohort.member_count}
                  recent_logins={cohort.recent_logins}
                  onDeleted={() => refetch()}
                  onToggled={() => refetch()}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/35 px-4 backdrop-blur-[2px]"
          onClick={() => {
            setIsModalOpen(false);
            setSlug("");
            setAccessHash("");
          }}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-[rgba(40,132,164,0.12)] bg-[rgba(255,253,248,0.98)] shadow-[0_24px_70px_rgba(61,52,45,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[rgba(40,132,164,0.1)] bg-white px-6 py-4">
              <h2 className="text-lg font-semibold text-zinc-900">
                New Cohort
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setSlug("");
                  setAccessHash("");
                }}
                aria-label="Close"
                className="cursor-pointer rounded-full p-1.5 text-zinc-400 transition hover:bg-[rgba(40,132,164,0.08)] hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007997] focus-visible:ring-offset-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-5 px-6 py-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-zinc-700">
                  Cohort Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) =>
                    setSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                    )
                  }
                  className="w-full rounded-xl border border-[rgba(40,132,164,0.18)] bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-[#007997] focus:ring-2 focus:ring-[rgba(0,121,151,0.16)]"
                  placeholder="e.g., fall-2026"
                />
                <p className="mt-1.5 text-xs text-zinc-500">
                  Lowercase letters, digits, and hyphens only. Used in the URL.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-zinc-700">
                  Cohort Access Code
                </label>
                <input
                  type="text"
                  value={accessHash}
                  onChange={(e) => setAccessHash(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(40,132,164,0.18)] bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-[#007997] focus:ring-2 focus:ring-[rgba(0,121,151,0.16)]"
                  placeholder="e.g., my-access-code"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[rgba(40,132,164,0.1)] bg-white px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setSlug("");
                  setAccessHash("");
                }}
                disabled={createCohort.isPending}
                className="cursor-pointer rounded-full px-5 py-2.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={
                  createCohort.isPending || !slug.trim() || !accessHash.trim()
                }
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#007997] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(0,121,151,0.18)] transition hover:bg-[#006b85] hover:shadow-[0_14px_28px_rgba(0,121,151,0.24)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createCohort.isPending ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
