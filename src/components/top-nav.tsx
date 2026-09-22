"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cx } from "./ui";
import type { UserRole } from "@/types/api";

const BASE_TABS = [
  { href: "/overview", label: "Home" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/saved", label: "My list" },
  { href: "/documents", label: "Documents" },
  { href: "/evaluate", label: "Evaluation" },
  { href: "/assistant", label: "Assistant" },
  { href: "/mentors", label: "Mentors" },
  { href: "/mentorship", label: "Mentorship" },
];

function Avatar({ src, name }: { src: string | null; name: string | null }) {
  const initials = (name ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt=""
        className="h-7 w-7 rounded-pill object-cover ring-1 ring-mist"
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-pill bg-mist text-[11px] font-medium text-pewter">
      {initials || "?"}
    </span>
  );
}

/**
 * Persistent portal navigation.
 *
 * The wordmark is the way home from anywhere — it goes to /overview rather than
 * the marketing page, because for a signed-in person the overview *is* home.
 * A separate "Home" tab makes that explicit for anyone who does not think to
 * click a logo.
 */
export function TopNav({
  role,
  unread,
  fullName,
  avatarUrl,
  signOutAction,
}: {
  role: UserRole;
  unread: number;
  fullName: string | null;
  avatarUrl: string | null;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  const tabs = [...BASE_TABS];
  if (role === "mentor" || role === "admin") {
    tabs.push({ href: "/submit", label: "Post an opportunity" });
  }
  if (role === "admin") {
    tabs.push({ href: "/admin/sources", label: "Sources" });
    tabs.push({ href: "/admin/media", label: "Media" });
    tabs.push({ href: "/admin/stories", label: "Stories" });
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cx(
        "sticky top-0 z-40 bg-paper/95 backdrop-blur-sm transition-shadow duration-300",
        scrolled && "border-b border-mist",
      )}
    >
      <div className="page-shell flex h-16 items-center justify-between gap-6">
        {/* Wordmark — the way home from anywhere. */}
        <Link
          href="/overview"
          aria-label="GradPortal home"
          className="shrink-0 text-[17px] font-light tracking-[-0.4px] text-ink transition-opacity hover:opacity-65"
        >
          GradPortal
        </Link>

        <nav className="hidden flex-1 items-center gap-5 overflow-x-auto lg:flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive(tab.href) ? "page" : undefined}
              className={cx(
                "shrink-0 whitespace-nowrap text-[13px] transition-colors duration-200",
                isActive(tab.href) ? "text-ink" : "text-smoke hover:text-pewter",
              )}
            >
              {tab.label}
              <span
                className={cx(
                  "mt-1 block h-px transition-colors",
                  isActive(tab.href) ? "bg-ember" : "bg-transparent",
                )}
                aria-hidden="true"
              />
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-4">
          <Link
            href="/notifications"
            aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
            className="relative text-[13px] text-pewter transition-colors hover:text-ink"
          >
            Alerts
            {unread > 0 ? (
              <span className="ml-1.5 inline-flex min-w-[17px] items-center justify-center rounded-pill bg-ember px-1.5 py-0.5 text-[10px] font-medium leading-none text-paper">
                {unread > 99 ? "99+" : unread}
              </span>
            ) : null}
          </Link>

          <Link href="/profile" aria-label="Your profile" className="hidden sm:block">
            <Avatar src={avatarUrl} name={fullName} />
          </Link>

          <form action={signOutAction} className="hidden sm:block">
            <button
              type="submit"
              className="text-[13px] text-pewter transition-colors hover:text-ink"
            >
              Sign out
            </button>
          </form>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="inline-flex h-8 items-center gap-2 rounded-pill bg-char px-3 text-[12px] font-medium text-paper lg:hidden"
          >
            Menu
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
              {menuOpen ? (
                <path d="M3.5 3.5l9 9m0-9l-9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              ) : (
                <path d="M2 4.5h12M2 8h12M2 11.5h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="page-shell border-t border-mist pb-6 pt-4 lg:hidden">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
            {tabs.map((tab) => (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  className={cx(
                    "block py-2 text-[15px] transition-colors",
                    isActive(tab.href) ? "text-ember" : "text-ink hover:text-pewter",
                  )}
                >
                  {tab.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/profile" className="block py-2 text-[15px] text-ink">
                Profile
              </Link>
            </li>
          </ul>
          <form action={signOutAction} className="mt-4 border-t border-mist pt-4">
            <button type="submit" className="text-[13px] text-pewter">
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </header>
  );
}
