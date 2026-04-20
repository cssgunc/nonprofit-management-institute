import { useState } from "react";
import { useRouter } from "next/router";
import { Eye, Trash2, Users } from "lucide-react";
import { api } from "@/utils/trpc/api";

type CohortRowProps = {
  id: number;
  slug: string | null;
  is_active: boolean | null;
  member_count: number;
  recent_logins: number;
  onDeleted: () => void;
  onToggled: () => void;
};

export default function CohortRow({
  id,
  slug,
  is_active,
  member_count,
  recent_logins,
  onDeleted,
  onToggled,
}: CohortRowProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const setActive = api.cohorts.setActiveStatus.useMutation({
    onSuccess: onToggled,
  });

  const deleteCohort = api.cohorts.deleteCohort.useMutation({
    onSuccess: () => {
      setShowDeleteDialog(false);
      onDeleted();
    },
  });

  const handleRowClick = () => {
    if (is_active && slug) {
      router.push(`/cohorts/${slug}/dashboard`);
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActive.mutate({ id, is_active: !is_active });
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    deleteCohort.mutate({ id });
  };

  const displayName = slug ?? `Cohort ${id}`;

  return (
    <>
      <div
        className={`motion-rise flex flex-col gap-4 rounded-xl border border-[rgba(40,132,164,0.1)] bg-[linear-gradient(180deg,#ffffff_0%,#fbf8f3_100%)] px-5 py-4 shadow-[0_10px_24px_rgba(61,52,45,0.05)] transition duration-200 md:flex-row md:items-center md:justify-between ${
          is_active
            ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(61,52,45,0.08)]"
            : "opacity-70"
        }`}
        onClick={handleRowClick}
      >
        {/* Left: cohort name */}
        <div className="min-w-0">
          <p
            className={`truncate text-base font-semibold ${
              is_active ? "text-zinc-900" : "text-zinc-500"
            }`}
          >
            {displayName}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-[var(--brand-teal)]" />
              {member_count} {member_count === 1 ? "member" : "members"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5 text-[var(--brand-teal)]" />
              {recent_logins} viewed in last 14 days
            </span>
          </div>
        </div>

        {/* Right: stats + status + toggle + delete */}
        <div
          className="flex shrink-0 items-center gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Active / Inactive indicator */}
          {is_active ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(180,190,53,0.16)] px-3 py-1 text-sm font-semibold text-[#647018]">
              <span className="h-2 w-2 rounded-full bg-[var(--brand-lime)]" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-sm font-semibold text-zinc-500">
              <span className="h-2 w-2 rounded-full bg-zinc-400" />
              Inactive
            </span>
          )}

          {/* Toggle switch */}
          <button
            type="button"
            role="switch"
            aria-checked={!!is_active}
            onClick={handleToggle}
            disabled={setActive.isPending}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007997] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              is_active ? "bg-[#007997]" : "bg-gray-300"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                is_active ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>

          {/* Delete button */}
          <button
            type="button"
            onClick={handleDeleteClick}
            className="cursor-pointer rounded-full p-1.5 text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
            aria-label="Delete cohort"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/35 px-4 backdrop-blur-[2px]"
          onClick={() => setShowDeleteDialog(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[rgba(40,132,164,0.12)] bg-[rgba(255,253,248,0.98)] p-6 shadow-[0_24px_70px_rgba(61,52,45,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-2 text-lg font-semibold text-gray-900">
              Delete cohort?
            </h2>
            <p className="mb-6 text-sm text-gray-500">
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-800">{displayName}</span>?
              This action cannot be undone and will remove all members and
              content associated with this cohort.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteDialog(false)}
                className="cursor-pointer rounded-full px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteCohort.isPending}
                className="cursor-pointer rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteCohort.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
