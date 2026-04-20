import { useState } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { api } from "@/utils/trpc/api";

type CreatePostModalProps = {
  open: boolean;
  onClose: () => void;
  moduleSlug?: string;
  cohortSlug: string;
  moduleId?: number;
  cohortId?: number;
};

export default function CreatePostModal({
  open,
  onClose,
  moduleSlug,
  cohortSlug,
  moduleId,
  cohortId: cohortId,
}: CreatePostModalProps) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const utils = api.useUtils();

  const createPost = api.discussions.createPost.useMutation({
    onSuccess: async () => {
      // Conditionally invalidate based on whether this is a module or general post
      if (moduleSlug) {
        await utils.discussions.listThreadsByModuleSlug.invalidate({
          moduleSlug,
          cohortSlug,
        });
      } else {
        await utils.discussions.listGeneralThreads.invalidate({
          cohortSlug,
        });
      }

      setBody("");
      setError(null);
      onClose();
    },
    onError: (err) => {
      setError(err.message ?? "Failed to create post.");
    },
  });

  const handlePost = () => {
    setError(null);
    if (!body.trim()) {
      setError("Post content cannot be empty.");
      return;
    }

    createPost.mutate({
      body: body.trim(),
      module_id: moduleId,
      cohort_id: cohortId,
      parent_post_id: null,
    });
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/35 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-[rgba(40,132,164,0.12)] bg-[rgba(255,253,248,0.98)] shadow-[0_24px_70px_rgba(61,52,45,0.18)] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[rgba(40,132,164,0.1)] bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-900">Make a Post</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-full p-1.5 text-zinc-400 transition hover:bg-[rgba(40,132,164,0.08)] hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] focus-visible:ring-offset-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-6 py-5">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your thoughts with the cohort..."
            className="min-h-[140px] w-full resize-none rounded-xl border border-[rgba(40,132,164,0.18)] bg-white px-4 py-3 text-sm leading-relaxed text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-[var(--brand-teal)] focus:ring-2 focus:ring-[rgba(0,138,171,0.16)]"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 border-t border-[rgba(40,132,164,0.1)] bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={createPost.isPending}
            className="cursor-pointer rounded-full px-5 py-2.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePost}
            disabled={createPost.isPending}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[var(--brand-teal)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(0,138,171,0.18)] transition hover:bg-[#007997] hover:shadow-[0_14px_28px_rgba(0,138,171,0.24)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createPost.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Post
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
