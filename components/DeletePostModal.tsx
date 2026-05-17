import { Loader2, Trash2, X } from "lucide-react";

type DeletePostModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
};

export default function DeletePostModal({
  open,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeletePostModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/35 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      onClick={isDeleting ? undefined : onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-[rgba(220,38,38,0.12)] bg-[rgba(255,253,248,0.98)] shadow-[0_24px_70px_rgba(61,52,45,0.18)] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[rgba(40,132,164,0.1)] bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-900">Delete post?</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Close"
            className="cursor-pointer rounded-full p-1.5 text-zinc-400 transition hover:bg-[rgba(40,132,164,0.08)] hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm leading-relaxed text-zinc-700">
            Are you sure you want to delete this post?
          </p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            The post will be replaced with a deleted-post message, and replies
            will stay visible.
          </p>
        </div>

        <div className="flex justify-end gap-3 border-t border-[rgba(40,132,164,0.1)] bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="cursor-pointer rounded-full px-5 py-2.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(220,38,38,0.18)] transition hover:bg-red-700 hover:shadow-[0_14px_28px_rgba(220,38,38,0.24)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
