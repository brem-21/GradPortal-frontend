"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Arrow, SectionLabel, cx } from "./ui";
import type { Asset } from "@/lib/media";

/**
 * Horizontally scrolling photo gallery of campus and study life.
 *
 * Scroll-snap does the work, so it stays usable with a trackpad, a touch swipe,
 * the arrow buttons and the keyboard, and needs no carousel library.
 */
export function CommunityGallery({
  photos,
  title = "The community",
  label = "Where this leads",
  blurb,
}: {
  photos: Asset[];
  title?: string;
  label?: string;
  blurb?: string;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const syncEdges = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setAtStart(track.scrollLeft <= 4);
    setAtEnd(track.scrollLeft + track.clientWidth >= track.scrollWidth - 4);
  }, []);

  useEffect(() => {
    syncEdges();
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener("scroll", syncEdges, { passive: true });
    window.addEventListener("resize", syncEdges);
    return () => {
      track.removeEventListener("scroll", syncEdges);
      window.removeEventListener("resize", syncEdges);
    };
  }, [syncEdges]);

  const scrollBy = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: "smooth" });
  };

  if (photos.length === 0) return null;

  return (
    <section className="py-16">
      <div className="mb-8 flex items-end justify-between gap-6">
        <div>
          <SectionLabel>{label}</SectionLabel>
          <h2 className="heading">{title}</h2>
          {blurb ? (
            <p className="prose-column mt-3 text-[15px] text-pewter">{blurb}</p>
          ) : null}
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            disabled={atStart}
            aria-label="Previous photographs"
            className="rounded-pill border border-mist p-2 text-ink transition-colors hover:border-ink disabled:opacity-30 disabled:hover:border-mist"
          >
            <Arrow className="rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            disabled={atEnd}
            aria-label="More photographs"
            className="rounded-pill border border-mist p-2 text-ink transition-colors hover:border-ink disabled:opacity-30 disabled:hover:border-mist"
          >
            <Arrow />
          </button>
        </div>
      </div>

      <ul
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {photos.map((asset, index) => (
          <li
            key={asset.poster}
            className={cx(
              "shrink-0 snap-start overflow-hidden rounded-image",
              index % 3 === 0 ? "w-[78vw] sm:w-[440px]" : "w-[62vw] sm:w-[320px]",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset.poster}
              alt={asset.alt}
              loading="lazy"
              className="aspect-[4/3] h-full w-full object-cover transition-transform duration-700 hover:scale-[1.04]"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
