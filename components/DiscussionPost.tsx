import React, { useState } from "react";
import {
  Edit2,
  Trash2,
  MoreHorizontal,
  MessageCircle,
  Star,
} from "lucide-react";

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
  isDeleted?: boolean;
  replyCount?: number;
  replies?: Post[];
};

export type DiscussionPostProps = {
  post: Post;
  isReply?: boolean;
  canManage?: boolean;
  onReply?: (post: Post) => void;
  onEdit?: (id: string | number, newContent: string) => void;
  onDelete?: (id: string | number) => void;
  children?: React.ReactNode;
};

// Utility Functions

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

function countAllReplies(replies: Post[]): number {
  return replies.reduce(
    (acc, r) => acc + 1 + countAllReplies(r.replies ?? []),
    0,
  );
}

const AVATAR_COLORS = [
  "bg-zinc-300 text-zinc-700",
  "bg-violet-200 text-violet-800",
  "bg-sky-200 text-sky-800",
  "bg-emerald-200 text-emerald-800",
  "bg-amber-200 text-amber-800",
  "bg-rose-200 text-rose-800",
] as const;

// Determining Avatar symbol

function Avatar({
  name,
  avatarUrl,
  colorIndex = 0,
  size = "md",
}: {
  name: string;
  avatarUrl?: string | null;
  colorIndex?: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "lg"
      ? "h-12 w-12 text-sm"
      : size === "sm"
        ? "h-7 w-7 text-[10px]"
        : "h-10 w-10 text-xs";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`${name} avatar`}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0`}
      />
    );
  }
  return (
    <div
      className={`flex ${sizeClass} items-center justify-center rounded-full font-semibold flex-shrink-0 ${
        AVATAR_COLORS[colorIndex % AVATAR_COLORS.length]
      }`}
    >
      {initials(name)}
    </div>
  );
}

// Nested Layout of Replies

function ReplyPost({
  post,
  isLast = false,
  canManage = false,
  onReply,
  onEdit,
  onDelete,
  children,
}: DiscussionPostProps & { isLast?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.content);
  const isDeleted = post.isDeleted === true;

  const handleSaveEdit = () => {
    onEdit?.(post.id, editText);
    setEditing(false);
  };

  return (
    <div className="motion-rise flex">
      {/* L-shaped connector line */}
      <div className="flex flex-col flex-shrink-0" style={{ width: 40 }}>
        {/* top vertical segment, down to the elbow */}
        <div
          className="border-l border-b border-zinc-200"
          style={{ height: 24, width: 20, borderBottomLeftRadius: 4 }}
        />
        {/* bottom vertical continuation (if not last reply) */}
        {!isLast ? (
          <div
            className="border-l border-zinc-200 flex-1"
            style={{ marginLeft: 0 }}
          />
        ) : (
          <div className="flex-1" />
        )}
      </div>

      {/* Reply body */}
      <div className="flex-1 pb-4 group">
        <div className="flex gap-3 items-start">
          <Avatar
            name={post.author.name}
            avatarUrl={post.author.avatarUrl}
            colorIndex={post.author.colorIndex}
            size="md"
          />

          <div className="flex-1 min-w-0">
            {/* Name + date stacked */}
            <span className="text-sm font-semibold text-zinc-900">
              {post.author.name}
            </span>
            {post.author.badge &&
              (post.author.badge === "Admin" ? (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  <span>Admin</span>
                </span>
              ) : (
                <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                  {post.author.badge}
                </span>
              ))}
            <div className="text-xs text-zinc-400">
              {relativeTime(post.createdAt)}
            </div>

            {/* Content */}
            {isDeleted ? (
              <p className="mt-1 text-sm italic text-zinc-500 leading-relaxed">
                [This post has been deleted.]
              </p>
            ) : editing ? (
              <div className="mt-2 space-y-2">
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
                    onClick={() => {
                      setEditing(false);
                      setEditText(post.content);
                    }}
                    className="rounded-lg border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            )}

            {/* Actions: edit/delete on hover (left), Reply right-aligned */}
            <div className="flex items-center justify-between mt-2">
              {canManage && !isDeleted ? (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    aria-label="Edit"
                    className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete?.(post.id)}
                    aria-label="Delete"
                    className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div />
              )}
              {onReply && !isDeleted ? (
                <button
                  type="button"
                  onClick={() => onReply(post)}
                  className="text-sm text-zinc-500 hover:text-zinc-800 font-medium transition-colors"
                >
                  Reply
                </button>
              ) : (
                <div />
              )}
            </div>
          </div>
        </div>

        {/* Nested deeper replies */}
        {children && <div className="mt-2">{children}</div>}
      </div>
    </div>
  );
}

// Main Discussion Post

function TopLevelPost({
  post,
  canManage = false,
  onReply,
  onEdit,
  onDelete,
  children,
}: DiscussionPostProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.content);
  const [menuOpen, setMenuOpen] = useState(false);
  const isDeleted = post.isDeleted === true;

  const handleSaveEdit = () => {
    onEdit?.(post.id, editText);
    setEditing(false);
  };

  const replyCount =
    post.replyCount ?? (post.replies ? countAllReplies(post.replies) : 0);

  return (
    <article className="motion-rise rounded-xl border border-zinc-200 bg-white p-5">
      {/* Header row */}
      <div className="flex items-start gap-3">
        <Avatar
          name={post.author.name}
          avatarUrl={post.author.avatarUrl}
          colorIndex={post.author.colorIndex}
          size="lg"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-zinc-900">
                  {post.author.name}
                </span>
                {post.author.badge &&
                  (post.author.badge === "Admin" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      <span>Admin</span>
                    </span>
                  ) : (
                    <span className="text-sm text-zinc-500">
                      {post.author.badge}
                    </span>
                  ))}
              </div>
              <time className="text-xs text-zinc-400">
                {relativeTime(post.createdAt)}
              </time>
            </div>

            {/* ⋯ dropdown menu */}
            {canManage && !isDeleted && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-label="More options"
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-9 z-20 w-32 rounded-lg border border-zinc-100 bg-white shadow-lg py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(true);
                          setMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50"
                      >
                        <Edit2 className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onDelete?.(post.id);
                          setMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mt-3 ml-1">
        {isDeleted ? (
          <p className="text-sm italic text-zinc-500 leading-relaxed">
            [This post has been deleted.]
          </p>
        ) : editing ? (
          <div className="space-y-2">
            <textarea
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={4}
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
                onClick={() => {
                  setEditing(false);
                  setEditText(post.content);
                }}
                className="rounded-lg border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        )}
      </div>

      {/* Reply count pill */}
      {!isDeleted && (
        <button
          type="button"
          onClick={() => onReply?.(post)}
          title={replyCount === 1 ? "1 reply" : `${replyCount} replies`}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-zinc-500 transition-colors hover:border-green-200 hover:bg-green-50 hover:text-green-700"
        >
          <MessageCircle className="h-3.5 w-3.5 flex-shrink-0 fill-current" />
          <span className="text-xs font-semibold">{replyCount}</span>
          <span className="text-xs font-normal">
            {replyCount === 1 ? "reply" : "replies"}
          </span>
        </button>
      )}

      {/* Nested replies */}
      {children && (
        <div className="mt-3 border-t border-zinc-100 pt-3">{children}</div>
      )}
    </article>
  );
}

// Discussion Post Export

export default function DiscussionPost({
  post,
  isReply = false,
  canManage = false,
  onReply,
  onEdit,
  onDelete,
  children,
}: DiscussionPostProps) {
  if (isReply) {
    return (
      <ReplyPost
        post={post}
        canManage={canManage}
        onReply={onReply}
        onEdit={onEdit}
        onDelete={onDelete}
      >
        {children}
      </ReplyPost>
    );
  }

  return (
    <TopLevelPost
      post={post}
      canManage={canManage}
      onReply={onReply}
      onEdit={onEdit}
      onDelete={onDelete}
    >
      {children}
    </TopLevelPost>
  );
}
