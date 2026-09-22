"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "./ui";
import type { SlideSet } from "@/lib/media";

/**
 * Crossfading background slideshow.
 *
 * Behaviour that matters:
 * - Only the active slide animates; the rest sit at opacity 0 so the GPU is not
 *   compositing three moving layers at once.
 * - Playback pauses when the section scrolls out of view and when the tab is
 *   hidden. A landing page that keeps three videos decoding off-screen drains a
 *   laptop battery for nothing.
 * - `prefers-reduced-motion` drops to a single static poster with no crossfade
 *   and no Ken Burns. Full-bleed drifting motion is a genuine vestibular trigger.
 * - Video is muted and `playsInline`, without which iOS Safari refuses autoplay
 *   and opens the clip fullscreen instead.
 */
export function MediaSlideshow({
  set,
  className,
  kenBurns = true,
}: {
  set: SlideSet;
  className?: string;
  kenBurns?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [visible, setVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  // Stop work the viewer cannot see.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "120px" },
    );
    observer.observe(node);

    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Advance the slide.
  useEffect(() => {
    if (reduceMotion || !visible || set.slides.length < 2) return;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % set.slides.length),
      set.interval,
    );
    return () => window.clearInterval(timer);
  }, [reduceMotion, visible, set.interval, set.slides.length]);

  // Only the visible, active video plays.
  useEffect(() => {
    videoRefs.current.forEach((video, position) => {
      if (!video) return;
      if (position === index && visible && !reduceMotion) {
        // A rejected play() promise is normal (autoplay policy); ignore it.
        void video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [index, visible, reduceMotion]);

  const slides = reduceMotion ? set.slides.slice(0, 1) : set.slides;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cx("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {slides.map((slide, position) => {
        const active = position === index;
        const isVideo = slide.src.endsWith(".mp4") || slide.src.endsWith(".webm");
        return (
          <div
            key={slide.src + position}
            className={cx(
              "absolute inset-0 transition-opacity duration-[1600ms] ease-in-out",
              active ? "opacity-100" : "opacity-0",
            )}
          >
            {isVideo && !reduceMotion ? (
              <video
                ref={(element) => {
                  videoRefs.current[position] = element;
                }}
                className={cx(
                  "h-full w-full object-cover",
                  kenBurns && active && "animate-kenburns",
                )}
                src={slide.src}
                poster={slide.poster}
                muted
                loop
                playsInline
                preload={position === 0 ? "auto" : "metadata"}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className={cx(
                  "h-full w-full object-cover",
                  kenBurns && active && !reduceMotion && "animate-kenburns",
                )}
                src={slide.poster ?? slide.src}
                alt=""
                loading={position === 0 ? "eager" : "lazy"}
              />
            )}
          </div>
        );
      })}

      {/* Scrim. Flat black at varying opacity — no gradient, per the system. */}
      <div
        className="absolute inset-0 bg-midnight"
        style={{ opacity: set.overlay }}
      />
    </div>
  );
}

/** Small dot row so the rotation reads as deliberate rather than as a glitch. */
export function SlideIndicator({
  count,
  interval,
  className,
}: {
  count: number;
  interval: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(query.matches);
  }, []);

  useEffect(() => {
    if (reduceMotion || count < 2) return;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % count),
      interval,
    );
    return () => window.clearInterval(timer);
  }, [count, interval, reduceMotion]);

  if (count < 2 || reduceMotion) return null;

  return (
    <div className={cx("flex items-center gap-2", className)}>
      {Array.from({ length: count }).map((_, position) => (
        <span
          key={position}
          className={cx(
            "h-px transition-all duration-700",
            position === index ? "w-8 bg-paper" : "w-4 bg-paper/35",
          )}
        />
      ))}
    </div>
  );
}
