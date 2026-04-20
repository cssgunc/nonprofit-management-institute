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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Make a Post</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-6 py-5">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your thoughts with the cohort..."
            className="min-h-[120px] w-full resize-none rounded-md border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={createPost.isPending}
            className="cursor-pointer rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePost}
            disabled={createPost.isPending}
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
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
