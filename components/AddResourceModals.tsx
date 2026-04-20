"use client";

import { useState, useCallback, useRef } from "react";
import { X, Plus, Upload, FileText, Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
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
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
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
    <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSaving}
        className="cursor-pointer rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className="cursor-pointer inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
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
      <label htmlFor="res-title" className="text-sm font-medium text-gray-700">
        Title
      </label>
      <input
        id="res-title"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Enter a title"}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
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

function useFileUpload(moduleSlug: string, cohortId: string | null) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptFile = (file: File) => {
    if (!file.type.includes("pdf") && !file.name.endsWith(".pdf")) return;
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
    const cohortSegment = cohortId ? `cohort-${cohortId}` : "global";
    const storagePath = `${cohortSegment}/${moduleSlug}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    setUploadProgress(0);

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, selectedFile, { upsert: false });

    if (error) throw new Error(error.message);

    setUploadProgress(100);

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

    return {
      url: data.publicUrl,
      mimeType: selectedFile.type || "application/pdf",
      sizeBytes: selectedFile.size,
    };
  };

  const DropZone = () => (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-gray-700">File</span>

      {selectedFile ? (
        <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-zinc-400" />
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
            className="cursor-pointer ml-3 shrink-0 text-xs text-zinc-400 hover:text-zinc-600"
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
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 transition-colors ${
            dragOver
              ? "border-zinc-400 bg-zinc-50"
              : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
          }`}
        >
          <Upload
            className={`h-7 w-7 transition-colors ${
              dragOver ? "text-zinc-500" : "text-zinc-300"
            }`}
            strokeWidth={1.5}
          />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">
              Drop PDF here or{" "}
              <span className="text-zinc-900 underline underline-offset-2">
                browse
              </span>
            </p>
            <p className="mt-0.5 text-xs text-zinc-400">PDF files only</p>
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
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-zinc-900 transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}
    </div>
  );

  return { selectedFile, upload, DropZone, uploadProgress };
}

// ---------------------------------------------------------------------------
// Toast (lightweight inline, no extra dependency)
// ---------------------------------------------------------------------------

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);

  const show = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const Toast = () =>
    message ? (
      <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-zinc-900 px-5 py-3 text-sm font-medium text-white shadow-lg">
        {message}
      </div>
    ) : null;

  return { show, Toast };
}

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
            className="text-sm font-medium text-gray-700"
          >
            URL
          </label>
          <input
            id="res-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
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

  const { selectedFile, upload, DropZone } = useFileUpload(
    moduleSlug,
    cohortSlug,
  );
  const utils = api.useUtils();

  const create = api.resources.create.useMutation({
    onSuccess: async () => {
      await utils.resources.listByModuleSlug.invalidate({
        moduleSlug,
        type: "recording",
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
      const { url, mimeType, sizeBytes } = await upload();
      setStatusLabel("Saving...");
      create.mutate({
        moduleSlug,
        title: title.trim(),
        type: "recording",
        url,
        cohortSlug,
      });
    } catch (err) {
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
      const { url, mimeType, sizeBytes } = await upload();
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
