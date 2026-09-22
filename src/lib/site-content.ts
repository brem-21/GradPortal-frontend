import type { SlideSet } from "@/lib/media";
import { FALLBACK_SETS, FALLBACK_GALLERY } from "@/lib/media";

/**
 * Site media and success stories, as managed by admins.
 *
 * These endpoints are public: the landing page renders them to signed-out
 * visitors, so requiring a token would mean the marketing page could not show
 * its own backgrounds. Media is served from core-api, so slide URLs are
 * absolute against it rather than the Next.js origin.
 */

const CORE_API = (process.env.API_BASE_URL ?? "http://localhost:8000/api/v1").replace(
  /\/api\/v1\/?$/,
  "",
);

export interface Slide {
  id: string;
  src: string;
  poster: string | null;
  kind: "image" | "gif" | "video";
  alt: string;
  credit: string | null;
  overlay: number | null;
}

export interface RemoteSlideSet {
  slot: string;
  label: string;
  slides: Slide[];
  interval_ms: number;
  overlay: number;
}

export interface SiteMedia {
  sets: Record<string, RemoteSlideSet>;
  gallery: Slide[];
}

export interface Story {
  id: string;
  name: string;
  outcome: string;
  field: string | null;
  quote: string;
  institution: string | null;
  country: string | null;
  link_url: string | null;
  photo_url: string | null;
  initials: string;
}

function absolutise(slide: Slide): Slide {
  const fix = (value: string | null) =>
    value && value.startsWith("/media/") ? `${CORE_API}${value}` : value;
  return { ...slide, src: fix(slide.src) ?? slide.src, poster: fix(slide.poster) };
}

/**
 * Media is revalidated rather than fetched per request: an admin upload should
 * appear within a minute, but the landing page must not make a round trip to
 * core-api for every anonymous visitor.
 */
export async function getSiteMedia(): Promise<SiteMedia> {
  try {
    const response = await fetch(`${CORE_API}/api/v1/site/media`, {
      next: { revalidate: 60, tags: ["site-media"] },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) throw new Error(String(response.status));
    const payload = (await response.json()) as SiteMedia;
    return {
      sets: Object.fromEntries(
        Object.entries(payload.sets).map(([slot, set]) => [
          slot,
          { ...set, slides: set.slides.map(absolutise) },
        ]),
      ),
      gallery: payload.gallery.map(absolutise),
    };
  } catch {
    // core-api being down must not blank the landing page.
    return { sets: {}, gallery: [] };
  }
}

export async function getSiteStories(): Promise<Story[]> {
  try {
    const response = await fetch(`${CORE_API}/api/v1/site/stories`, {
      next: { revalidate: 60, tags: ["site-stories"] },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) throw new Error(String(response.status));
    const stories = (await response.json()) as Story[];
    return stories.map((story) => ({
      ...story,
      photo_url:
        story.photo_url && story.photo_url.startsWith("/media/")
          ? `${CORE_API}${story.photo_url}`
          : story.photo_url,
    }));
  } catch {
    return [];
  }
}

/**
 * Resolve a slot to something renderable.
 *
 * Falls back to the files bundled in /public/media when an admin has not
 * populated the slot, so a fresh install still looks finished rather than
 * showing black bands.
 */
export function resolveSet(media: SiteMedia, slot: string): SlideSet {
  const remote = media.sets[slot];
  if (remote && remote.slides.length > 0) {
    return {
      id: slot,
      interval: remote.interval_ms,
      overlay: remote.overlay,
      slides: remote.slides.map((slide) => ({
        src: slide.src,
        poster: slide.poster ?? slide.src,
        alt: slide.alt,
        query: "",
        overlay: slide.overlay,
      })),
    };
  }
  return FALLBACK_SETS[slot] ?? FALLBACK_SETS.hero;
}

export function resolveGallery(media: SiteMedia) {
  if (media.gallery.length > 0) {
    return media.gallery.map((slide) => ({
      src: slide.src,
      poster: slide.poster ?? slide.src,
      alt: slide.alt,
      query: "",
      credit: slide.credit,
    }));
  }
  return FALLBACK_GALLERY;
}
