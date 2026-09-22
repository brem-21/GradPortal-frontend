"use client";

import { useEffect, useState } from "react";
import { Arrow, SectionLabel, Tag, cx } from "./ui";
import type { Story } from "@/lib/site-content";

/**
 * Rotating success stories, managed by admins at /admin/stories.
 *
 * Renders nothing when there are none. An empty section is better than
 * placeholder testimonials: a fabricated quote presented as genuine is
 * deceptive advertising, and core-api refuses to publish a story until consent
 * is recorded against it.
 */
export function SuccessStories({
  stories,
  tone = "light",
}: {
  stories: Story[];
  tone?: "light" | "dark";
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (paused || reduceMotion || stories.length < 2) return;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % stories.length),
      7000,
    );
    return () => window.clearInterval(timer);
  }, [paused, reduceMotion, stories.length]);

  useEffect(() => {
    // An admin deleting a story must not leave the carousel past the end.
    if (index >= stories.length) setIndex(0);
  }, [index, stories.length]);

  if (stories.length === 0) return null;

  const story = stories[Math.min(index, stories.length - 1)];
  const dark = tone === "dark";

  return (
    <section
      className="py-16"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mb-8 flex items-end justify-between gap-6">
        <div>
          <SectionLabel className={dark ? "text-mist" : undefined}>
            Where people ended up
          </SectionLabel>
          <h2 className={cx("heading", dark && "text-paper")}>Success stories</h2>
        </div>
        {stories.length > 1 ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setIndex((current) => (current - 1 + stories.length) % stories.length)
              }
              aria-label="Previous story"
              className={cx(
                "rounded-pill border p-2 transition-colors",
                dark
                  ? "border-paper/25 text-paper hover:border-paper"
                  : "border-mist text-ink hover:border-ink",
              )}
            >
              <Arrow className="rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => setIndex((current) => (current + 1) % stories.length)}
              aria-label="Next story"
              className={cx(
                "rounded-pill border p-2 transition-colors",
                dark
                  ? "border-paper/25 text-paper hover:border-paper"
                  : "border-mist text-ink hover:border-ink",
              )}
            >
              <Arrow />
            </button>
          </div>
        ) : null}
      </div>

      <figure
        key={story.id}
        className={cx(
          "animate-fade-up rounded-card p-8",
          dark ? "bg-paper/5 ring-1 ring-inset ring-paper/15" : "bg-mist",
        )}
      >
        <blockquote
          className={cx(
            "prose-column font-serif text-[18px] leading-[1.5]",
            dark ? "text-paper" : "text-ink",
          )}
        >
          &ldquo;{story.quote}&rdquo;
        </blockquote>

        <figcaption className="mt-7 flex flex-wrap items-center gap-4">
          {story.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={story.photo_url}
              alt=""
              className="h-11 w-11 rounded-pill object-cover"
            />
          ) : (
            <span
              className={cx(
                "flex h-11 w-11 items-center justify-center rounded-pill text-[13px] font-medium",
                dark ? "bg-paper/15 text-paper" : "bg-paper text-pewter",
              )}
              aria-hidden="true"
            >
              {story.initials}
            </span>
          )}
          <span className="min-w-0">
            <span className={cx("block text-[15px]", dark ? "text-paper" : "text-ink")}>
              {story.link_url ? (
                <a
                  href={story.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-ember hover:underline"
                >
                  {story.name}
                </a>
              ) : (
                story.name
              )}
            </span>
            <span className={cx("block text-[12px]", dark ? "text-mist" : "text-pewter")}>
              {[story.outcome, story.institution].filter(Boolean).join(" · ")}
            </span>
          </span>
          {story.field ? (
            <Tag tone={dark ? "paper" : "outline"} className="ml-auto">
              {story.field.replace(/_/g, " ")}
            </Tag>
          ) : null}
        </figcaption>
      </figure>

      {stories.length > 1 ? (
        <div className="mt-6 flex items-center gap-2">
          {stories.map((entry, position) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setIndex(position)}
              aria-label={`Story ${position + 1}`}
              aria-current={position === index}
              className={cx(
                "h-px transition-all duration-500",
                position === index
                  ? dark
                    ? "w-10 bg-paper"
                    : "w-10 bg-ink"
                  : dark
                    ? "w-5 bg-paper/30"
                    : "w-5 bg-mist",
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
