import { FileText, Download, Trash2 } from "lucide-react";
import { useState } from "react";

type ResourceProps = {
  title: string;
  fileUrl: string;
  isAdmin?: boolean;
  onRemove?: () => void;
};

export default function Resource({
  title,
  fileUrl,
  isAdmin = false,
  onRemove,
}: ResourceProps) {
  const [previewError, setPreviewError] = useState(false);
  const previewUrl = `${fileUrl}#page=1&view=FitH&toolbar=0&navpanes=0&scrollbar=0`;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = title || "document.pdf";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRemove = () => {
    onRemove?.();
  };

  return (
    <div className="group flex flex-col w-60 gap-2">
      {/* PDF Preview */}
      <div className="relative w-full aspect-[3/4] rounded-md overflow-hidden bg-gray-100 border border-gray-200 shadow-sm transition-shadow duration-200 group-hover:shadow-md">
        {!previewError ? (
          <embed
            src={previewUrl}
            type="application/pdf"
            className="w-full h-full pointer-events-none select-none"
            onError={() => setPreviewError(true)}
          />
        ) : (
          /* Fallback when embed fails */
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
            onClick={handleRemove}
            aria-label={`Remove ${title}`}
            className="cursor-pointer shrink-0 rounded-md p-1 text-red-500 transition-colors duration-150 hover:bg-red-50 hover:text-red-700 active:scale-95"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </button>
        )}
      </div>
    </div>
  );
}