"use client";

import { useRef, useState } from "react";
import { X, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A native multi-file <input> with preview thumbnails and per-file removal — plain
 * forms elsewhere in this codebase submit File objects straight through FormData to a
 * server action (no separate upload-on-select step), so this keeps that pattern
 * rather than introducing a different upload architecture just for images.
 *
 * Removing one file from a native multi-file input isn't otherwise possible (browsers
 * don't let you edit a FileList) — this rebuilds the input's file list via
 * DataTransfer each time one is removed, which is the standard technique for it.
 */
export function ImageFileInput({
  name,
  maxFiles = 12,
  accept = "image/jpeg,image/png,image/webp,image/gif,image/avif",
}: {
  name: string;
  maxFiles?: number;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);

  function applyFiles(next: File[]) {
    setFiles(next);
    if (inputRef.current) {
      const dt = new DataTransfer();
      next.forEach((f) => dt.items.add(f));
      inputRef.current.files = dt.files;
    }
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    applyFiles([...files, ...selected].slice(0, maxFiles));
  }

  function removeAt(index: number) {
    applyFiles(files.filter((_, i) => i !== index));
  }

  return (
    <div>
      <input ref={inputRef} type="file" name={name} accept={accept} multiple onChange={onChange} className="hidden" />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={files.length >= maxFiles}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-sand-300 py-6 text-sm text-sand-600 hover:border-ink-700 hover:text-ink-950",
          files.length >= maxFiles && "cursor-not-allowed opacity-50",
        )}
      >
        <Upload className="h-4 w-4" />
        {files.length === 0 ? "Add photos" : `Add more (${files.length}/${maxFiles})`}
      </button>

      {files.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {files.map((file, i) => (
            <div key={`${file.name}-${i}`} className="group relative aspect-square overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview, not a storable/optimizable remote image */}
              <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label="Remove photo"
                className="absolute end-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
