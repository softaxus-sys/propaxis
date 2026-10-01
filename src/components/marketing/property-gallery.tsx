"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Owns every interactive piece of a listing's photos: the clickable hero image, the
 * thumbnail strip, and the full-screen lightbox they open into (prev/next, keyboard
 * arrows, Escape to close, a click-to-jump filmstrip) — a PropertyFinder-style viewer,
 * built from scratch rather than a dependency since this project has no dialog
 * primitive yet. `children` is the price/badge/stats overlay already built server-side
 * in the page — this component only adds the image behavior around it.
 */
export function PropertyGallery({
  images,
  alt,
  children,
}: {
  images: string[];
  alt: string;
  children: React.ReactNode;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  // "Fit" shrinks a tall/large photo down to fit the screen (losing detail on very
  // large images); zoomed shows it at natural size inside a scrollable area instead,
  // so nothing about the photo is ever actually inaccessible, just scrolled to.
  const [isZoomed, setIsZoomed] = useState(false);

  const close = useCallback(() => setOpenIndex(null), []);
  const showPrev = useCallback(() => {
    setOpenIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length));
  }, [images.length]);
  const showNext = useCallback(() => {
    setOpenIndex((i) => (i === null ? null : (i + 1) % images.length));
  }, [images.length]);

  // Reset zoom on every open/navigate — a zoomed-in scroll position from the previous
  // photo would otherwise carry over and make the next one look cut off too.
  useEffect(() => {
    setIsZoomed(false);
  }, [openIndex]);

  useEffect(() => {
    if (openIndex === null) return;

    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [openIndex, close, showPrev, showNext]);

  const hero = images[0];

  return (
    <>
      <div
        role={hero ? "button" : undefined}
        tabIndex={hero ? 0 : undefined}
        onClick={hero ? () => setOpenIndex(0) : undefined}
        onKeyDown={hero ? (e) => (e.key === "Enter" || e.key === " ") && setOpenIndex(0) : undefined}
        aria-label={hero ? `View all ${images.length} photos` : undefined}
        className={cn(
          "relative overflow-hidden rounded-2xl bg-gradient-to-br from-ink-800 to-ink-950 bg-cover bg-center p-8 text-white",
          hero && "cursor-pointer",
        )}
        style={
          hero
            ? { backgroundImage: `linear-gradient(to top, rgba(10,15,31,0.85), rgba(10,15,31,0.35)), url(${hero})` }
            : undefined
        }
      >
        {hero && (
          // CSS background-image (needed for the gradient-overlay styling) has no alt
          // text and isn't crawlable by Google Images on its own — this sr-only <img>
          // carries the real description without changing how the hero looks.
          // eslint-disable-next-line @next/next/no-img-element -- external, dynamically-sourced photo
          <img src={hero} alt={alt} className="sr-only" />
        )}
        {children}
        {hero && (
          <span className="absolute bottom-4 end-4 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
            <Expand className="h-3.5 w-3.5" /> {images.length} photo{images.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">
          {images.slice(1, 7).map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setOpenIndex(i + 1)}
              className="h-20 overflow-hidden rounded-lg sm:h-24"
              aria-label={`View photo ${i + 2} of ${images.length}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- external, dynamically-sourced photos (agency uploads, Vrodux-synced signed URLs); see docs/ARCHITECTURE.md §7.2 */}
              <img
                src={url}
                alt={`${alt} — photo ${i + 2} of ${images.length}`}
                className="h-full w-full object-cover transition hover:opacity-80"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {openIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          className="fixed inset-0 z-50 flex flex-col bg-black/95"
          onClick={close}
        >
          <div className="flex shrink-0 items-center justify-between p-4 text-white">
            <span className="text-sm text-sand-300">
              {openIndex + 1} / {images.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsZoomed((z) => !z);
                }}
                aria-label={isZoomed ? "Zoom out" : "Zoom in"}
                className="rounded-full p-2 hover:bg-white/10"
              >
                {isZoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
              </button>
              <button type="button" onClick={close} aria-label="Close" className="rounded-full p-2 hover:bg-white/10">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* min-h-0 is load-bearing here: without it, a flex child won't shrink below
              its content's intrinsic size, so a tall photo pushes this box (and the
              arrows centered within it) taller than the viewport instead of the photo
              scaling down to fit — exactly the cut-off/misplaced-arrows bug this fixes. */}
          <div className="relative min-h-0 flex-1" onClick={(e) => e.stopPropagation()}>
            {images.length > 1 && !isZoomed && (
              <button
                type="button"
                onClick={showPrev}
                aria-label="Previous photo"
                className="absolute start-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 sm:start-4"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            <div className={cn("h-full w-full", isZoomed ? "overflow-auto" : "flex items-center justify-center overflow-hidden p-4")}>
              {/* eslint-disable-next-line @next/next/no-img-element -- external, dynamically-sourced photos */}
              <img
                src={images[openIndex]}
                alt={`${alt} — photo ${openIndex + 1} of ${images.length}`}
                onClick={() => setIsZoomed((z) => !z)}
                className={cn(
                  "rounded-lg",
                  isZoomed
                    ? "w-auto max-w-none cursor-zoom-out"
                    : "max-h-full max-w-full cursor-zoom-in object-contain",
                )}
              />
            </div>

            {images.length > 1 && !isZoomed && (
              <button
                type="button"
                onClick={showNext}
                aria-label="Next photo"
                className="absolute end-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 sm:end-4"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {images.length > 1 && (
            <div
              className="flex shrink-0 gap-2 overflow-x-auto p-4 pt-0"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setOpenIndex(i)}
                  className={cn(
                    "h-14 w-20 shrink-0 overflow-hidden rounded-md ring-2 transition",
                    i === openIndex ? "ring-bronze-400" : "ring-transparent opacity-60 hover:opacity-100",
                  )}
                  aria-label={`Go to photo ${i + 1}`}
                  aria-current={i === openIndex}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- external, dynamically-sourced photos */}
                  <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
