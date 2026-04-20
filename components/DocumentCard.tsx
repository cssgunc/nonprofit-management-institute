"use client";

import { useState, useEffect } from "react";
import { FileText, Download, Trash2 } from "lucide-react";
import type { Resource } from "@/server/api/routers/resources";

// ── PDF thumbnail hook ────────────────────────────────────────────────────────

function usePdfThumbnail(fileUrl: string | null | undefined) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!fileUrl) return;
    let cancelled = false;

    const generate = async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

        const pdf = await pdfjs.getDocument(fileUrl).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport }).promise;

        if (!cancelled) setThumbnailUrl(canvas.toDataURL("image/png"));
      } catch {
        if (!cancelled) setThumbnailUrl(null);
      }
    };

    void generate();
    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  return thumbnailUrl;
}

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
  resource: Resource;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
};

export default function DocumentCard({
  resource,
  isAdmin = false,
  onDelete,
}: Props) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const thumbnail = usePdfThumbnail(resource.url);

  const handleDownload = () => {
    if (!resource.url) return;
    const link = document.createElement("a");
    link.href = resource.url;
    link.download = resource.title || "document.pdf";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="flex w-[168px] flex-col gap-2">
        {/* Thumbnail card */}
        <div className="group relative aspect-[3/4] w-full overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 shadow-sm transition-shadow duration-200 hover:shadow-md">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={resource.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-white">
              <FileText className="h-8 w-8 text-zinc-300" strokeWidth={1.5} />
              <span className="px-2 text-center text-[11px] leading-tight text-zinc-400">
                PDF Preview
              </span>
            </div>
          )}

          {/* Download overlay on hover */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/10 group-hover:opacity-100">
            <button
              onClick={handleDownload}
              aria-label={`Download ${resource.title}`}
              className="cursor-pointer rounded-full bg-white/90 p-2 shadow-md transition-transform duration-150 hover:scale-110 hover:bg-white active:scale-95"
            >
              <Download className="h-4 w-4 text-gray-800" />
            </button>
          </div>
        </div>

        {/* Title row */}
        <div className="flex items-start justify-between gap-1.5">
          <p
            className="min-w-0 flex-1 text-sm font-medium leading-snug text-gray-800 line-clamp-2"
            title={resource.title}
          >
            {resource.title}
          </p>
          {isAdmin && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              aria-label={`Remove ${resource.title}`}
              className="mt-0.5 cursor-pointer shrink-0 rounded-md p-1 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 active:scale-95"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
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
