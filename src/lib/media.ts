/**
 * Bundled fallback media.
 *
 * Site media is admin-managed: uploads live in core-api and are served from
 * `/api/v1/site/media` (see lib/site-content.ts). These files exist so a fresh
 * install — or one where core-api is briefly unreachable — still renders a
 * finished-looking page instead of black bands.
 *
 * `python -m scripts.bootstrap seed-media` imports them into the admin store on
 * first setup, after which an admin edits them at /admin/media like anything
 * else they upload.
 */

export interface Asset {
  src: string;
  poster: string;
  alt: string;
  /** Unsplash search terms, used by `npm run fetch:media`. */
  query: string;
  /** Per-asset scrim override; falls back to the slot default. */
  overlay?: number | null;
  credit?: string | null;
}

export interface SlideSet {
  id: string;
  slides: Asset[];
  /** Milliseconds each slide holds before crossfading. */
  interval: number;
  /** 0-1 scrim darkness. Higher where Paper text sits directly on the media. */
  overlay: number;
}

function still(name: string, query: string, alt: string): Asset {
  const path = `/media/${name}.jpg`;
  return { src: path, poster: path, query, alt };
}

export const ASSETS = {
  campusWalk: still(
    "campus-walk",
    "students walking university campus autumn",
    "Students with backpacks walking a campus path in autumn",
  ),
  campusBuilding: still(
    "campus-building",
    "university building architecture brick",
    "A red-brick university building behind a tree",
  ),
  campusLawn: still(
    "campus-lawn",
    "two students studying outdoors campus lawn",
    "Two students studying together on a campus lawn",
  ),
  libraryStudy: still(
    "library-study",
    "study group students laptop library",
    "A study group gathered around a laptop",
  ),
  libraryCelebrate: still(
    "library-celebrate",
    "students celebrating success library",
    "Students celebrating together in a library",
  ),
  studyDesk: still(
    "study-desk",
    "notebooks notes coffee desk study",
    "Notebooks, handwritten notes and coffee on a desk",
  ),
} satisfies Record<string, Asset>;

const A = ASSETS;

/** Keyed by the slot names core-api uses, so resolution is a lookup. */
export const FALLBACK_SETS: Record<string, SlideSet> = {
  hero: {
    id: "hero",
    interval: 8000,
    overlay: 0.6,
    slides: [A.campusWalk, A.campusBuilding, A.campusLawn],
  },
  closing: {
    id: "closing",
    interval: 10000,
    overlay: 0.66,
    slides: [A.libraryCelebrate, A.campusLawn],
  },
  mentor_card: {
    id: "mentor_card",
    interval: 11000,
    overlay: 0.58,
    slides: [A.campusLawn, A.libraryStudy],
  },
  footer: {
    id: "footer",
    interval: 13000,
    overlay: 0.78,
    slides: [A.campusBuilding, A.studyDesk],
  },
  signin: {
    id: "signin",
    interval: 9000,
    overlay: 0.55,
    slides: [A.campusWalk, A.libraryStudy, A.campusBuilding],
  },
  community: {
    id: "community",
    interval: 12000,
    overlay: 0.7,
    slides: [A.libraryCelebrate, A.campusWalk],
  },
};

export const FALLBACK_GALLERY: Asset[] = [
  A.campusWalk,
  A.libraryStudy,
  A.campusLawn,
  A.libraryCelebrate,
  A.campusBuilding,
  A.studyDesk,
];
