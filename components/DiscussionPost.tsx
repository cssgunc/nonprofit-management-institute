import React, { useState } from "react";
import { Edit2, Trash2 } from "lucide-react";

// Types

export type Author = {
  name: string;
  avatarUrl?: string | null;
  badge?: string;
  colorIndex?: number;
};

export type Post = {
  id: string | number;
  author: Author;
  content: string;
  createdAt: string | number | Date;
  replies?: Post[];
};

export type DiscussionPostProps = {
  post: Post;
  isReply?: boolean;
  onReply?: (post: Post) => void;
  onEdit?: (id: string | number, newContent: string) => void;
  onDelete?: (id: string | number) => void;
  children?: React.ReactNode;
};

// utility functions

function relativeTime(from: string | number | Date): string {
  const then = new Date(from).getTime();
  const now = Date.now();
  const diff = Math.floor((now - then) / 1000);

  if (isNaN(diff) || diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((s) => s[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = [
  "bg-violet-200 text-violet-800",
  "bg-sky-200 text-sky-800",
  "bg-emerald-200 text-emerald-800",
  "bg-amber-200 text-amber-800",
  "bg-rose-200 text-rose-800",
] as const;

// Sub-components in main Discussion Post component

function Avatar({
  name,
  avatarUrl,
  colorIndex = 0,
}: {
  name: string;
  avatarUrl?: string | null;
  colorIndex?: number;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`${name} avatar`}
        className="h-9 w-9 rounded-full object-cover ring-2 ring-white"
      />
    );
  }
  return (
    <div
      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ring-2 ring-white ${
        AVATAR_COLORS[colorIndex % AVATAR_COLORS.length]
      }`}
    >
      {initials(name)}
    </div>
  );
}

// Discussion Post Component

export default function DiscussionPost({
  post,
  isReply = false,
  onReply,
  onEdit,
  onDelete,
  children,
}: DiscussionPostProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.content);

  const handleSaveEdit = () => {
    onEdit?.(post.id, editText);
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditText(post.content);
  };

  return (
    <article
      className={`group w-full py-3 ${
        isReply ? "ml-8 border-l-2 border-zinc-100 pl-4" : ""
      }`}
    >
      {/* Header: avatar + name on left, edit/delete + date on right */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Avatar
            name={post.author.name}
            avatarUrl={post.author.avatarUrl}
            colorIndex={post.author.colorIndex}
          />
          <span className="text-sm font-semibold text-zinc-900">
            {post.author.name}
          </span>
          {post.author.badge && (
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700">
              {post.author.badge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Edit / Delete — revealed on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label="Edit post"
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete?.(post.id)}
              aria-label="Delete post"
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <time className="text-xs text-zinc-400">
            {relativeTime(post.createdAt)}
          </time>
        </div>
      </div>

      {/* Content */}
      {editing ? (
        <div className="space-y-2 mb-2">
          <textarea
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveEdit}
              className="rounded-lg bg-violet-600 px-3 py-1 text-xs font-medium text-white hover:bg-violet-700 transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded-lg border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap mb-2">
          {post.content}
        </p>
      )}

      {/* Reply link */}
      <button
        type="button"
        onClick={() => onReply?.(post)}
        className="text-xs text-zinc-500 hover:text-blue-600 font-medium transition-colors"
      >
        Reply
      </button>

      {/* Nested replies */}
      {children && <div className="mt-1">{children}</div>}
    </article>
  );
}
