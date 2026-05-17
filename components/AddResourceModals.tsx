"use client";

import { useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Upload, FileText, Loader2 } from "lucide-react";
import { api } from "@/utils/trpc/api";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";

// ---------------------------------------------------------------------------
// Supabase lazy client
// ---------------------------------------------------------------------------

const BUCKET = "module-resources";

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/35 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-[rgba(40,132,164,0.12)] bg-[rgba(255,253,248,0.98)] shadow-[0_24px_70px_rgba(61,52,45,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[rgba(40,132,164,0.1)] bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-full p-1.5 text-zinc-400 transition hover:bg-[rgba(40,132,164,0.08)] hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] focus-visible:ring-offset-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

function ModalFooter({
  onCancel,
  onSave,
  isSaving,
  saveLabel,
}: {
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
  saveLabel?: string;
}) {
  return (
    <div className="flex justify-end gap-3 border-t border-[rgba(40,132,164,0.1)] bg-white px-6 py-4">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSaving}
        className="cursor-pointer rounded-full px-5 py-2.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[var(--brand-teal)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(0,138,171,0.18)] transition hover:bg-[#007997] hover:shadow-[0_14px_28px_rgba(0,138,171,0.24)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            {saveLabel ?? "Save"}
          </>
        )}
      </button>
    </div>
  );
}

function TitleField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="res-title"
        className="text-sm font-semibold text-zinc-700"
      >
        Title
      </label>
      <input
        id="res-title"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Enter a title"}
        className="rounded-xl border border-[rgba(40,132,164,0.18)] bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-[var(--brand-teal)] focus:ring-2 focus:ring-[rgba(0,138,171,0.16)]"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// File drop zone + upload helper (shared by Documents & Handouts)
// ---------------------------------------------------------------------------

type UploadedFile = {
  url: string;
  mimeType: string;
  sizeBytes: number;
};

function useFileUpload(moduleSlug: string, cohortSlug: string) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptFile = (file: File) => {
    if (!file.type.includes("pdf") && !file.name.endsWith(".pdf")) return;
    if (file.size > 50 * 1024 * 1024) {
      setFileError("File must be under 50MB.");
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) acceptFile(file);
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) acceptFile(file);
  };

  const upload = async (): Promise<UploadedFile> => {
    if (!selectedFile) throw new Error("No file selected.");
    const supabase = createSupabaseComponentClient();
    const ext = selectedFile.name.split(".").pop() ?? "pdf";

    // Always scoped to cohortSlug — never falls back to "global"
    const storagePath = `${cohortSlug}/${moduleSlug}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    setUploadProgress(0);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, selectedFile, { upsert: false });

    if (uploadError) throw new Error(uploadError.message);

    setUploadProgress(100);

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

    return {
      url: data.publicUrl,
      mimeType: selectedFile.type || "application/pdf",
      sizeBytes: selectedFile.size,
    };
  };

  // Call this if the DB insert fails after a successful upload
  const deleteOrphan = async (url: string) => {
    const supabase = createSupabaseComponentClient();
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return;
    const path = decodeURIComponent(url.slice(idx + marker.length));
    await supabase.storage.from(BUCKET).remove([path]);
  };

  const DropZone = () => (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-zinc-700">File</span>

      {selectedFile ? (
        <div className="flex items-center justify-between rounded-xl border border-[rgba(40,132,164,0.14)] bg-white px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-[var(--brand-teal)]" />
            <span className="truncate text-sm text-gray-700">
              {selectedFile.name}
            </span>
            <span className="shrink-0 text-xs text-zinc-400">
              ({(selectedFile.size / 1024).toFixed(0)} KB)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedFile(null)}
            className="ml-3 shrink-0 cursor-pointer text-xs font-semibold text-zinc-400 hover:text-zinc-700"
          >
            Remove
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 transition ${
            dragOver
              ? "border-[var(--brand-teal)] bg-[rgba(0,138,171,0.06)]"
              : "border-[rgba(40,132,164,0.18)] bg-white hover:border-[rgba(0,138,171,0.38)] hover:bg-[rgba(0,138,171,0.04)]"
          }`}
        >
          <Upload
            className={`h-7 w-7 transition-colors ${
              dragOver
                ? "text-[var(--brand-teal)]"
                : "text-[var(--brand-teal)]/60"
            }`}
            strokeWidth={1.5}
          />
          <div className="text-center">
            <p className="text-sm font-semibold text-zinc-700">
              Drop PDF here or{" "}
              <span className="text-[var(--brand-teal)] underline underline-offset-4">
                browse
              </span>
            </p>
            <p className="mt-0.5 text-xs text-zinc-400">PDF only · max 50MB</p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {uploadProgress !== null && uploadProgress < 100 && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[rgba(0,138,171,0.1)]">
          <div
            className="h-full rounded-full bg-[var(--brand-teal)] transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}
    </div>
  );

  return { selectedFile, upload, deleteOrphan, DropZone, uploadProgress };
}

// // ---------------------------------------------------------------------------
// // Toast (lightweight inline, no extra dependency)
// // ---------------------------------------------------------------------------

// export function useToast() {
//   const [message, setMessage] = useState<string | null>(null);

//   const show = (msg: string) => {
//     setMessage(msg);
//     setTimeout(() => setMessage(null), 3000);
//   };

//   const Toast = () =>
//     message ? (
//       <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-zinc-900 px-5 py-3 text-sm font-medium text-white shadow-lg">
//         {message}
//       </div>
//     ) : null;

//   return { show, Toast };
// }

// ---------------------------------------------------------------------------
// AddWebsiteModal
// ---------------------------------------------------------------------------

type BaseModalProps = {
  moduleSlug: string;
  cohortSlug: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function AddWebsiteModal({
  moduleSlug,
  cohortSlug,
  onClose,
  onSuccess,
}: BaseModalProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const utils = api.useUtils();

  const create = api.resources.create.useMutation({
    onSuccess: async () => {
      await utils.resources.listByModuleSlug.invalidate({
        moduleSlug,
        cohortSlug,
        type: "link",
      });
      onSuccess();
      onClose();
    },
    onError: (err) => setError(err.message ?? "Failed to save."),
  });

  const handleSave = () => {
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!url.trim()) {
      setError("URL is required.");
      return;
    }
    create.mutate({
      moduleSlug,
      title: title.trim(),
      type: "link",
      url: url.trim(),
      cohortSlug,
    });
  };

  return (
    <ModalShell title="New Website" onClose={onClose}>
      <div className="flex flex-col gap-5 px-6 py-5">
        <TitleField
          value={title}
          onChange={setTitle}
          placeholder="e.g. Company Website"
        />

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="res-url"
            className="text-sm font-semibold text-zinc-700"
          >
            URL
          </label>
          <input
            id="res-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="rounded-xl border border-[rgba(40,132,164,0.18)] bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-[var(--brand-teal)] focus:ring-2 focus:ring-[rgba(0,138,171,0.16)]"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <ModalFooter
        onCancel={onClose}
        onSave={handleSave}
        isSaving={create.isPending}
        saveLabel="Save Website"
      />
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// AddDocumentModal
// ---------------------------------------------------------------------------

export function AddDocumentModal({
  moduleSlug,
  cohortSlug,
  onClose,
  onSuccess,
}: BaseModalProps) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusLabel, setStatusLabel] = useState("Saving...");

  const { selectedFile, upload, deleteOrphan, DropZone } = useFileUpload(
    moduleSlug,
    cohortSlug,
  );
  const utils = api.useUtils();
  const uploadedUrlRef = useRef<string | null>(null);

  const create = api.resources.create.useMutation({
    onSuccess: async () => {
      await utils.resources.listByModuleSlug.invalidate({
        moduleSlug,
        cohortSlug,
        type: "document",
      });
      onSuccess();
      onClose();
    },
    onError: async (err) => {
      if (uploadedUrlRef.current) {
        await deleteOrphan(uploadedUrlRef.current);
        uploadedUrlRef.current = null;
      }
      setError(err.message ?? "Failed to save.");
      setIsSaving(false);
    },
  });

  const handleSave = async () => {
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!selectedFile) {
      setError("Please select a file.");
      return;
    }

    setIsSaving(true);
    try {
      setStatusLabel("Uploading file...");
      const { url } = await upload();
      uploadedUrlRef.current = url;
      setStatusLabel("Saving...");
      create.mutate({
        moduleSlug,
        title: title.trim(),
        type: "document",
        url,
        cohortSlug,
      });
    } catch (err) {
      if (uploadedUrlRef.current) {
        await deleteOrphan(uploadedUrlRef.current);
        uploadedUrlRef.current = null;
      }
      setError(err instanceof Error ? err.message : "Upload failed.");
      setIsSaving(false);
    }
  };

  return (
    <ModalShell title="New Document" onClose={onClose}>
      <div className="flex flex-col gap-5 px-6 py-5">
        <TitleField
          value={title}
          onChange={setTitle}
          placeholder="e.g. Week 3 Slides"
        />
        <DropZone />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <ModalFooter
        onCancel={onClose}
        onSave={handleSave}
        isSaving={isSaving}
        saveLabel={isSaving ? statusLabel : "Save Document"}
      />
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// AddHandoutModal
// ---------------------------------------------------------------------------

export function AddHandoutModal({
  moduleSlug,
  cohortSlug,
  onClose,
  onSuccess,
}: BaseModalProps) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusLabel, setStatusLabel] = useState("Saving...");

  const { selectedFile, upload, DropZone } = useFileUpload(
    moduleSlug,
    cohortSlug,
  );
  const utils = api.useUtils();

  const create = api.resources.create.useMutation({
    onSuccess: async () => {
      await utils.resources.listByModuleSlug.invalidate({
        moduleSlug,
        cohortSlug,
        type: "handout",
      });
      onSuccess();
      onClose();
    },
    onError: (err) => {
      setError(err.message ?? "Failed to save.");
      setIsSaving(false);
    },
  });

  const handleSave = async () => {
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!selectedFile) {
      setError("Please select a file.");
      return;
    }

    setIsSaving(true);
    try {
      setStatusLabel("Uploading file...");
      const { url } = await upload();
      setStatusLabel("Saving...");
      create.mutate({
        moduleSlug,
        title: title.trim(),
        type: "handout",
        url,
        cohortSlug,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setIsSaving(false);
    }
  };

  return (
    <ModalShell title="New Handout" onClose={onClose}>
      <div className="flex flex-col gap-5 px-6 py-5">
        <TitleField
          value={title}
          onChange={setTitle}
          placeholder="e.g. Exercise Sheet"
        />
        <DropZone />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <ModalFooter
        onCancel={onClose}
        onSave={handleSave}
        isSaving={isSaving}
        saveLabel={isSaving ? statusLabel : "Save Handout"}
      />
    </ModalShell>
  );
}
