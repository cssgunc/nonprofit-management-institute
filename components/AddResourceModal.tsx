"use client";

import { useState, useCallback, useRef } from "react";
import { X, Plus, Upload, Globe, FileText, Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { api } from "@/utils/trpc/api";

// Lazy getter - only called when an upload is triggered, not on module load.
// This prevents "supabaseKey is required" crashes when env vars aren't present
// during SSR or before the modal is ever opened.
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Add them to your .env.local file.",
    );
  }
  return createClient(url, key);
}

// TODO: Replace with your actual Supabase storage bucket name
const BUCKET_NAME = "YOUR_BUCKET_NAME";

type Section = "website" | "document" | "handout";

type SectionMeta = {
  label: string;
  dbType: "link" | "recording" | "handout";
  icon: React.ReactNode;
};

const SECTION_META: Record<Section, SectionMeta> = {
  website: {
    label: "Website",
    dbType: "link",
    icon: <Globe className="h-4 w-4" />,
  },
  document: {
    label: "Document",
    dbType: "recording",
    icon: <FileText className="h-4 w-4" />,
  },
  handout: {
    label: "Handout",
    dbType: "handout",
    icon: <FileText className="h-4 w-4" />,
  },
};

type Props = {
  moduleSlug: string;
  cohortId: string | null;
  defaultSection?: Section;
  onClose: () => void;
  onCreated: () => void;
};

export default function AddResourceModal({
  moduleSlug,
  cohortId,
  defaultSection = "website",
  onClose,
  onCreated,
}: Props) {
  const [section, setSection] = useState<Section>(defaultSection);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createResource = api.resources.create.useMutation({
    onSuccess: () => {
      onCreated();
      onClose();
    },
    onError: (err) => {
      setError(err.message ?? "Failed to create resource.");
      setIsSubmitting(false);
    },
  });

  const acceptFile = (file: File) => {
    if (!file.type.includes("pdf") && !file.name.endsWith(".pdf")) {
      setError("Only PDF files are supported.");
      return;
    }
    setSelectedFile(file);
    setError(null);
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

  const uploadFileToSupabase = async (file: File): Promise<string> => {
    const supabase = getSupabaseClient();
    const ext = file.name.split(".").pop() ?? "pdf";
    const storagePath = `${moduleSlug}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    setUploadProgress(0);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file, { upsert: false });

    if (uploadError) throw new Error(uploadError.message);

    setUploadProgress(100);

    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      let finalUrl: string | null = null;

      if (section === "website") {
        if (!url.trim()) {
          setError("URL is required.");
          setIsSubmitting(false);
          return;
        }
        finalUrl = url.trim();
      } else {
        if (!selectedFile) {
          setError("Please select a file to upload.");
          setIsSubmitting(false);
          return;
        }
        finalUrl = await uploadFileToSupabase(selectedFile);
      }

      createResource.mutate({
        moduleSlug,
        title: title.trim(),
        type: SECTION_META[section].dbType,
        url: finalUrl,
        cohortId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setIsSubmitting(false);
    }
  };

  const isFileSection = section === "document" || section === "handout";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Add resource"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            Add Resource
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-5 px-6 py-5">
          {/* Section picker */}
          <div className="flex gap-2">
            {(Object.keys(SECTION_META) as Section[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSection(s);
                  setError(null);
                  setSelectedFile(null);
                  setUrl("");
                }}
                className={`cursor-pointer inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  section === s
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
                }`}
              >
                {SECTION_META[s].icon}
                {SECTION_META[s].label}
              </button>
            ))}
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="resource-title"
              className="text-sm font-medium text-gray-700"
            >
              Title
            </label>
            <input
              id="resource-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                section === "website"
                  ? "e.g. Company Website"
                  : section === "document"
                    ? "e.g. Week 3 Slides"
                    : "e.g. Exercise Sheet"
              }
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
            />
          </div>

          {/* Website: URL input */}
          {section === "website" && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="resource-url"
                className="text-sm font-medium text-gray-700"
              >
                URL
              </label>
              <input
                id="resource-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              />
            </div>
          )}

          {/* Document / Handout: drag-and-drop */}
          {isFileSection && (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-gray-700">File</span>

              {selectedFile ? (
                <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-zinc-400" />
                    <span className="truncate text-sm text-gray-700">
                      {selectedFile.name}
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
                    <p className="mt-0.5 text-xs text-zinc-400">
                      PDF files only
                    </p>
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
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="cursor-pointer rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {uploadProgress !== null && uploadProgress < 100
                  ? "Uploading..."
                  : "Saving..."}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add Resource
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
