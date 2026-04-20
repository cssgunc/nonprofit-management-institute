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
      <div className="group relative flex items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white px-5 py-4 shadow-sm transition-shadow duration-200 hover:shadow-md">
        {/* Left: icon + text */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-zinc-100">
            <Globe className="h-4.5 w-4.5 text-zinc-500" strokeWidth={1.5} />
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
            className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          {isAdmin && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              aria-label={`Remove ${resource.title}`}
              className="cursor-pointer rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl"
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
                className="cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete?.(resource.id);
                  setIsDeleteModalOpen(false);
                }}
                className="cursor-pointer rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
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
