"use client";

import { useState, useEffect } from "react";
import { FileText, Download, Trash2 } from "lucide-react";

function usePdfThumbnail(fileUrl: string) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!fileUrl) return;

    let cancelled = false;

    const generateThumbnail = async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

        const pdf = await pdfjs.getDocument(fileUrl).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        const canvasContext = canvas.getContext("2d");

        if (!canvasContext) {
          throw new Error("Unable to create canvas context");
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext, viewport }).promise;

        if (!cancelled) {
          setThumbnailUrl(canvas.toDataURL("image/png"));
        }
      } catch (err) {
        console.error("Thumbnail generation failed:", err);
        if (!cancelled) {
          setThumbnailUrl(null);
        }
      }
    };

    void generateThumbnail();

    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  return thumbnailUrl;
}

type ResourceProps = {
  title: string;
  fileUrl: string;
  thumbnailUrl?: string;
  isAdmin?: boolean;
  onRemove?: () => void;
};

export default function Resource({
  title,
  fileUrl,
  thumbnailUrl,
  isAdmin = false,
  onRemove,
}: ResourceProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const generatedThumbnail = usePdfThumbnail(fileUrl);
  const preview = thumbnailUrl ?? generatedThumbnail;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = title || "document.pdf";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDeleteModalOpen(false);
  };

  const handleConfirmDelete = () => {
    onRemove?.();
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="flex flex-col w-60 gap-2">
      {/* PDF Preview */}
      <div className="group relative w-full aspect-[3/4] rounded-md overflow-hidden bg-gray-100 border border-gray-200 shadow-sm transition-shadow duration-200 hover:shadow-md">
        {preview ? (
          <img
            src={preview}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gray-50">
            <FileText className="w-10 h-10 text-gray-400" strokeWidth={1.5} />
            <span className="text-xs text-gray-400 text-center px-2 leading-tight">
              PDF Preview
            </span>
          </div>
        )}

        {/* Hover overlay with download shortcut */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button
            onClick={handleDownload}
            aria-label={`Download ${title}`}
            className="cursor-pointer bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-md transition-transform duration-150 hover:scale-110 active:scale-95"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        {/* Title */}
        <p
          className="min-w-0 flex-1 text-base font-medium text-gray-800 leading-snug line-clamp-2"
          title={title}
        >
          {title}
        </p>

        {/* Admin-only remove button; not visible to students */}
        {isAdmin && (
          <button
            onClick={handleDeleteClick}
            aria-label={`Remove ${title}`}
            className="cursor-pointer shrink-0 rounded-md p-1 text-red-500 transition-colors duration-150 hover:bg-red-50 hover:text-red-700 active:scale-95"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </button>
        )}
      </div>

      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Delete resource confirmation"
          onClick={handleCloseModal}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900">
              Delete resource?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              This will remove{" "}
              <span className="font-medium text-gray-800">{title}</span>. This
              action cannot be undone.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseModal}
                className="cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="cursor-pointer rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}