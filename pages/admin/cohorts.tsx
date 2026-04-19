import { useState } from "react";
import { api } from "@/utils/trpc/api";
import { toast } from "sonner";

export default function AdminCohortsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [accessHash, setAccessHash] = useState("");

  const utils = api.useUtils();

  const createCohort = api.cohorts.createCohort.useMutation({
    onSuccess: () => {
      toast.success("Cohort created successfully");
      setIsModalOpen(false);
      setSlug("");
      setAccessHash("");
      utils.cohorts.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create cohort");
    },
  });

  const handleCreate = () => {
    if (!slug.trim() || !accessHash.trim()) return;
    createCohort.mutate({ slug: slug.trim(), accessHash: accessHash.trim() });
  };

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col items-center bg-[#f5f5f5] px-6 py-10">
      <h1 className="mb-8 text-3xl font-bold text-black">Select Cohort</h1>

      {/* Placeholder: cohort list will be built by another ticket */}
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-center text-zinc-400">
          Cohort page being implemented in another ticket. For now, use the
          button below to create a new cohort.
        </p>

        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-full bg-[#0090b1] px-12 py-2.5 text-lg font-medium text-white transition hover:bg-[#007a97]"
          >
            Create New Cohort
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
            <h2 className="mb-6 text-center text-2xl font-bold text-black">
              New Cohort
            </h2>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-semibold text-black">
                Cohort Name
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-black focus:border-[#0090b1] focus:outline-none focus:ring-1 focus:ring-[#0090b1]"
                placeholder="e.g., fall-2026"
              />
            </div>

            <div className="mb-6">
              <label className="mb-1 block text-sm font-semibold text-black">
                Cohort Access Code
              </label>
              <input
                type="text"
                value={accessHash}
                onChange={(e) => setAccessHash(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-black focus:border-[#0090b1] focus:outline-none focus:ring-1 focus:ring-[#0090b1]"
                placeholder="e.g., my-access-code"
              />
            </div>

            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleCreate}
                disabled={
                  createCohort.isPending || !slug.trim() || !accessHash.trim()
                }
                className="rounded-full bg-[#0090b1] px-12 py-2.5 font-medium text-white transition hover:bg-[#007a97] disabled:opacity-50"
              >
                {createCohort.isPending ? "Creating..." : "Create"}
              </button>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSlug("");
                  setAccessHash("");
                }}
                className="text-sm text-black transition hover:text-zinc-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
