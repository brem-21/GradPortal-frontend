import { cx } from "./ui";

/**
 * Line icons at a 1.25 stroke, matching the hairlines the Aker system uses
 * everywhere else. Deliberately plain — the photography carries the page.
 */
const PATHS: Record<string, React.ReactNode> = {
  home: <path d="M3 8.5 10 3l7 5.5V16a1 1 0 0 1-1 1h-4v-5H8v5H4a1 1 0 0 1-1-1V8.5Z" />,
  search: (
    <>
      <circle cx="9" cy="9" r="5.5" />
      <path d="m13.2 13.2 3.3 3.3" />
    </>
  ),
  bookmark: <path d="M5 3h10v14l-5-3.5L5 17V3Z" />,
  folder: <path d="M2.5 5.5A1.5 1.5 0 0 1 4 4h3.6l1.5 2H16a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 16 16H4a1.5 1.5 0 0 1-1.5-1.5v-9Z" />,
  gavel: (
    <>
      <path d="M3 17h8" />
      <path d="M7 13.5 13.5 7" />
      <path d="m10.5 4 5.5 5.5-2 2L8.5 6l2-2Z" />
    </>
  ),
  users: (
    <>
      <circle cx="7.5" cy="7" r="2.75" />
      <path d="M2.5 16c0-2.6 2.2-4.5 5-4.5s5 1.9 5 4.5" />
      <path d="M13 11.7c2.1.3 3.6 2 3.6 4.3" />
      <circle cx="14" cy="7.5" r="2.25" />
    </>
  ),
  message: <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4h11A1.5 1.5 0 0 1 17 5.5v7a1.5 1.5 0 0 1-1.5 1.5H8l-4 3v-3H4.5A1.5 1.5 0 0 1 3 12.5v-7Z" />,
  plus: (
    <>
      <path d="M10 4v12" />
      <path d="M4 10h12" />
    </>
  ),
  rss: (
    <>
      <path d="M4 4a12 12 0 0 1 12 12" />
      <path d="M4 9.5a6.5 6.5 0 0 1 6.5 6.5" />
      <circle cx="4.75" cy="15.25" r="1.25" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4" width="14" height="12" rx="1.5" />
      <circle cx="7.5" cy="8" r="1.25" />
      <path d="m3.5 14 4-4 3.5 3.5L13.5 11l3 3" />
    </>
  ),
  quote: <path d="M7 5C5 6 4 7.8 4 10v5h5v-5H6.5c0-1.6.6-2.8 2-3.5L7 5Zm8 0c-2 1-3 2.8-3 5v5h5v-5h-2.5c0-1.6.6-2.8 2-3.5L15 5Z" />,
  bell: (
    <>
      <path d="M10 3a4.5 4.5 0 0 0-4.5 4.5c0 3.2-1 4.4-1.5 5h12c-.5-.6-1.5-1.8-1.5-5A4.5 4.5 0 0 0 10 3Z" />
      <path d="M8.25 15a1.75 1.75 0 0 0 3.5 0" />
    </>
  ),
  sparkle: (
    <>
      <path d="M10 3.5 11.4 8 16 9.4 11.4 10.8 10 15.4 8.6 10.8 4 9.4 8.6 8 10 3.5Z" />
      <path d="M15.5 3.5v2.4M14.3 4.7h2.4" />
    </>
  ),
  settings: (
    <>
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 2.5v1.8M10 15.7v1.8M17.5 10h-1.8M4.3 10H2.5M15.3 4.7l-1.3 1.3M6 14l-1.3 1.3M15.3 15.3 14 14M6 6 4.7 4.7" />
    </>
  ),
  user: (
    <>
      <circle cx="10" cy="7" r="3" />
      <path d="M4 16.5c0-3 2.7-5 6-5s6 2 6 5" />
    </>
  ),
  logout: (
    <>
      <path d="M12 6V4.5A1.5 1.5 0 0 0 10.5 3h-6A1.5 1.5 0 0 0 3 4.5v11A1.5 1.5 0 0 0 4.5 17h6a1.5 1.5 0 0 0 1.5-1.5V14" />
      <path d="M14 7.5 16.5 10 14 12.5M7.5 10h9" />
    </>
  ),
};

export function NavIcon({ name, className }: { name: string; className?: string }) {
  const path = PATHS[name] ?? PATHS.home;
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cx("shrink-0", className)}
    >
      {path}
    </svg>
  );
}
