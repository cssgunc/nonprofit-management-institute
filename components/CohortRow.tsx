import { useState } from "react";
import { useRouter } from "next/router";
import { Trash2 } from "lucide-react";
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
  member_count: _member_count,
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
        className={`flex items-center justify-between border-b border-gray-200 px-6 py-4 ${
          is_active ? "cursor-pointer hover:bg-gray-50" : ""
        }`}
        onClick={handleRowClick}
      >
        {/* Left: cohort name */}
        <span
          className={`text-base font-medium ${
            is_active
              ? "border-b border-gray-700 text-gray-900"
              : "text-gray-400"
          }`}
        >
          {displayName}
        </span>

        {/* Right: stats + status + toggle + delete */}
        <div
          className="flex items-center gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* View count */}
          <span className="text-sm text-gray-500">
            {recent_logins} viewed in last 14 days
          </span>

          {/* Active / Inactive indicator */}
          {is_active ? (
            <span className="flex items-center gap-1 text-sm font-medium text-green-600">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Active
            </span>
          ) : (
            <span className="text-sm font-medium text-gray-400">Inactive</span>
          )}

          {/* Toggle switch */}
          <button
            type="button"
            role="switch"
            aria-checked={!!is_active}
            onClick={handleToggle}
            disabled={setActive.isPending}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
              is_active ? "bg-green-500" : "bg-gray-300"
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
            className="text-gray-400 transition-colors hover:text-gray-700"
            aria-label="Delete cohort"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowDeleteDialog(false)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
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
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteCohort.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
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
