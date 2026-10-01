"use client";

import { useState } from "react";
import { X } from "lucide-react";

/**
 * Shows a listing's already-uploaded photos with per-photo removal, submitting the
 * surviving set as repeated `keepImages` hidden inputs — the server action reads
 * `formData.getAll("keepImages")` for "what stays" and merges it with whatever new
 * files came through `ImageFileInput` alongside this, rather than this component
 * trying to also handle new uploads itself (kept as two separate, simple pieces).
 */
export function ExistingImagesManager({ images, name = "keepImages" }: { images: string[]; name?: string }) {
  const [kept, setKept] = useState(images);

  if (images.length === 0) return null;

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-ink-950">Current photos</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {kept.map((url) => (
          <div key={url} className="group relative aspect-square overflow-hidden rounded-lg">
            <input type="hidden" name={name} value={url} />
            {/* eslint-disable-next-line @next/next/no-img-element -- external, already-uploaded photo */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => setKept((prev) => prev.filter((u) => u !== url))}
              aria-label="Remove photo"
              className="absolute end-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
