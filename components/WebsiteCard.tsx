"use client";

import { useState } from "react";
import { ExternalLink, Globe, Trash2 } from "lucide-react";
import type { Resource } from "@/server/api/routers/resources";

type Props = {
  resource: Resource;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
};

export default function WebsiteCard({
  resource,
  isAdmin = false,
  onDelete,
}: Props) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const displayUrl = resource.url
    ? resource.url.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : "";

  return (
    <>
      <div className="motion-rise group relative flex items-center justify-between gap-4 rounded-xl border border-[rgba(40,132,164,0.1)] bg-[linear-gradient(180deg,#ffffff_0%,#fbf8f3_100%)] px-5 py-4 shadow-[0_10px_24px_rgba(61,52,45,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(61,52,45,0.08)]">
        {/* Left: icon + text */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[rgba(0,138,171,0.1)]">
            <Globe
              className="h-4.5 w-4.5 text-[var(--brand-teal)]"
              strokeWidth={1.8}
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">
              {resource.title}
            </p>
            {displayUrl && (
              <p className="truncate text-xs text-zinc-400">{displayUrl}</p>
            )}
          </div>
        </div>

        {/* Right: open link + optional delete */}
        <div className="flex shrink-0 items-center gap-1">
          <a
            href={resource.url ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${resource.title}`}
            className="rounded-full p-1.5 text-zinc-400 transition hover:bg-[rgba(0,138,171,0.08)] hover:text-[var(--brand-teal)]"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          {isAdmin && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              aria-label={`Remove ${resource.title}`}
              className="cursor-pointer rounded-full p-1.5 text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/35 px-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[rgba(40,132,164,0.12)] bg-[rgba(255,253,248,0.98)] p-5 shadow-[0_24px_70px_rgba(61,52,45,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900">
              Delete resource?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              This will remove{" "}
              <span className="font-medium text-gray-800">
                {resource.title}
              </span>
              . This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="cursor-pointer rounded-full px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete?.(resource.id);
                  setIsDeleteModalOpen(false);
                }}
                className="cursor-pointer rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
