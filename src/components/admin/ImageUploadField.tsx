"use client";

import { useRef, useState, useTransition } from "react";
import { uploadImageAction } from "@/actions/media";

interface ImageUploadFieldProps {
  label: string;
  /** One of the keys in CONTEXT_PERMISSIONS (src/actions/media.ts) — decides which permission gates this specific upload. */
  context: "team" | "practice-areas" | "insights/cover" | "insights/content";
  value: string | null;
  onChange: (url: string) => void;
  helpText?: string;
}

// Deliberately a plain file input + preview, not a full drag-and-drop
// widget — the plan doesn't call for one, and this keeps the component's
// only dependency the existing uploadImageAction (no new drag-drop package).
export function ImageUploadField({ label, context, value, onChange, helpText }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const formData = new FormData();
    formData.set("file", file);
    formData.set("context", context);
    if (value) formData.set("previousUrl", value);

    startTransition(async () => {
      const result = await uploadImageAction(formData);
      if (!result.success || !result.url) {
        setError(result.error ?? "Upload failed.");
        return;
      }
      onChange(result.url);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-[13px] font-semibold text-ink-900">{label}</label>

      {value && (
        // eslint-disable-next-line @next/next/no-img-element -- admin-only preview of a freshly-uploaded Supabase Storage URL, not a next/image candidate here
        <img
          src={value}
          alt=""
          className="mb-2 h-32 w-32 rounded-md border border-gray-300 object-cover"
        />
      )}

      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          disabled={isPending}
          className="text-small text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-navy-100 file:px-3 file:py-2 file:text-[13px] file:font-semibold file:text-navy-700 hover:file:bg-navy-100/80"
        />
        {isPending && <span className="text-[13px] text-gray-500">Uploading…</span>}
      </div>

      {helpText && !error && <p className="mt-1 text-[12px] text-gray-500">{helpText}</p>}
      {error && <p className="mt-1 text-[12px] text-error">{error}</p>}

      {value && !isPending && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="mt-1 text-[12px] font-medium text-navy-700 hover:text-gold-700"
        >
          Remove image
        </button>
      )}
    </div>
  );
}
