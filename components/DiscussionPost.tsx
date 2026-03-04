import React from "react";
import { Edit2, Trash2, CornerUpLeft } from "lucide-react";

type Author = {
  name: string;
  avatarUrl?: string | null;
};

type Props = {
  id?: string | number;
  author: Author;
  content: string;
  createdAt: string | number | Date;
  isReply?: boolean;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  children?: React.ReactNode;
};

function relativeTime(from: string | number | Date) {
  const then = new Date(from).getTime();
  const now = Date.now();
  const diff = Math.floor((now - then) / 1000); // seconds

  if (isNaN(diff)) return "just now";
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff} sec${diff === 1 ? "" : "s"} ago`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((s) => s[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function DiscussionPost({
  author,
  content,
  createdAt,
  isReply = false,
  onReply,
  onEdit,
  onDelete,
  children,
}: Props) {
  return (
    <article
      className={`w-full rounded-md ${
        isReply ? "ml-6 border-l-2 border-zinc-200 pl-4" : ""
      } py-3`}
      aria-labelledby={author.name}
    >
      <header className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {author.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={author.avatarUrl}
              alt={`${author.name} avatar`}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium text-zinc-700">
              {initials(author.name)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {author.name}
              </h3>
              <span className="text-xs text-zinc-500">•</span>
              <time className="text-xs text-zinc-500">
                {relativeTime(createdAt)}
              </time>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onReply}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                aria-label="Reply"
              >
                <CornerUpLeft className="h-4 w-4" />
                Reply
              </button>

              <button
                type="button"
                onClick={onEdit}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
                aria-label="Edit"
              >
                <Edit2 className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={onDelete}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-2 text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
            {content}
          </div>
        </div>
      </header>

      {children && <div className="mt-3">{children}</div>}
    </article>
  );
}
