"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { NavIcon } from "./nav-icon";
import { NotificationBell } from "./notification-bell";
import { useConfirm } from "./confirm-dialog";
import { cx } from "./ui";
import { groupsForRole } from "@/lib/navigation";
import type { UserRole } from "@/types/api";

const STORAGE_KEY = "gradportal.sidebar.collapsed";

function Avatar({
  src,
  name,
  size = 28,
}: {
  src: string | null;
  name: string | null;
  size?: number;
}) {
  const initials =
    (name ?? "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        className="shrink-0 rounded-pill object-cover ring-1 ring-mist"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-pill bg-mist text-[11px] font-medium text-pewter"
      style={{ width: size, height: size }}
    >
      {initials}
    </span>
  );
}

/**
 * Collapsible left sidebar.
 *
 * Replaces the top bar: a portal with fifteen destinations needs vertical room
 * and grouping, which a horizontal strip cannot give without scrolling. The
 * collapsed state persists per browser, because whichever the person prefers
 * they prefer it every visit.
 */
export function Sidebar({
  role,
  unread,
  fullName,
  email,
  avatarUrl,
  signOutAction,
}: {
  role: UserRole;
  unread: number;
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const confirm = useConfirm();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* private mode; default to expanded */
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  // Close the profile menu on an outside click or Escape.
  useEffect(() => {
    if (!profileOpen) return;
    const onDown = (event: MouseEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) setProfileOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [profileOpen]);

  async function handleSignOut() {
    setProfileOpen(false);
    const confirmed = await confirm({
      title: "Sign out?",
      body:
        "Any draft email or unsent message on this screen will be lost. Your documents, shortlist and conversations are saved.",
      confirmLabel: "Sign out",
      tone: "danger",
    });
    if (confirmed) await signOutAction();
  }

  const groups = groupsForRole(role);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const width = collapsed ? "lg:w-[68px]" : "lg:w-[236px]";

  const nav = (
    <>
      <div
        className={cx(
          "flex h-16 shrink-0 items-center border-b border-mist",
          collapsed ? "justify-center px-2" : "justify-between px-5",
        )}
      >
        {collapsed ? (
          <Link href="/overview" aria-label="GradPortal home" className="text-[17px] font-light">
            G
          </Link>
        ) : (
          <>
            <Link
              href="/overview"
              aria-label="GradPortal home"
              className="text-[17px] font-light tracking-[-0.4px] transition-opacity hover:opacity-65"
            >
              GradPortal
            </Link>
            <NotificationBell unread={unread} />
          </>
        )}
      </div>

      {collapsed ? (
        <div className="flex justify-center border-b border-mist py-3">
          <NotificationBell unread={unread} />
        </div>
      ) : null}

      <nav className="flex-1 overflow-y-auto py-5 [scrollbar-width:thin]">
        {groups.map((group) => (
          <div key={group.label} className="mb-6">
            {!collapsed ? (
              <p className="section-label mb-2 px-5">{group.label}</p>
            ) : (
              <div className="mx-auto mb-3 h-px w-6 bg-mist" aria-hidden="true" />
            )}
            <ul>
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={collapsed ? `${item.label} — ${item.hint}` : undefined}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cx(
                      "group relative flex items-center gap-3 transition-colors duration-200",
                      collapsed ? "justify-center px-2 py-2.5" : "px-5 py-2.5",
                      isActive(item.href)
                        ? "text-ink"
                        : "text-pewter hover:bg-mist/50 hover:text-ink",
                    )}
                  >
                    {isActive(item.href) ? (
                      <span
                        className="absolute inset-y-1 left-0 w-[2px] rounded-r bg-ember"
                        aria-hidden="true"
                      />
                    ) : null}
                    <NavIcon name={item.icon} />
                    {!collapsed ? (
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] leading-tight">
                          {item.label}
                        </span>
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Profile menu */}
      <div ref={profileRef} className="relative shrink-0 border-t border-mist">
        {profileOpen ? (
          <div className="animate-fade-up absolute bottom-full left-3 right-3 mb-2 overflow-hidden rounded-card border border-mist bg-paper py-1.5">
            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-ink transition-colors hover:bg-mist/60"
            >
              <NavIcon name="user" className="text-pewter" />
              Profile
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-ink transition-colors hover:bg-mist/60"
            >
              <NavIcon name="settings" className="text-pewter" />
              Settings
            </Link>
            <div className="my-1.5 h-px bg-mist" />
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] text-ember transition-colors hover:bg-mist/60"
            >
              <NavIcon name="logout" />
              Sign out
            </button>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setProfileOpen((open) => !open)}
          aria-expanded={profileOpen}
          aria-haspopup="menu"
          title={collapsed ? (fullName ?? email) : undefined}
          className={cx(
            "flex w-full items-center gap-3 py-4 transition-colors hover:bg-mist/50",
            collapsed ? "justify-center px-2" : "px-5",
          )}
        >
          <Avatar src={avatarUrl} name={fullName ?? email} />
          {!collapsed ? (
            <>
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-[13px] text-ink">
                  {fullName ?? email.split("@")[0]}
                </span>
                <span className="block truncate text-[11px] capitalize text-smoke">
                  {role === "admin" ? "Community admin" : role}
                </span>
              </span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                aria-hidden="true"
                className={cx(
                  "shrink-0 text-smoke transition-transform duration-200",
                  profileOpen && "rotate-180",
                )}
              >
                <path d="m3 7.5 3-3 3 3" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              </svg>
            </>
          ) : null}
        </button>
      </div>

      <button
        type="button"
        onClick={toggleCollapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={cx(
          "hidden shrink-0 items-center gap-2 border-t border-mist py-3 text-[11px] text-smoke transition-colors hover:text-ink lg:flex",
          collapsed ? "justify-center px-2" : "px-5",
        )}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d={collapsed ? "M5 3.5 8.5 7 5 10.5" : "M9 3.5 5.5 7 9 10.5"}
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
        {!collapsed ? "Collapse" : null}
      </button>
    </>
  );

  return (
    <>
      {/* Mobile bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-mist bg-paper/95 px-4 backdrop-blur-sm lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="inline-flex h-8 items-center gap-2 rounded-pill bg-char px-3 text-[12px] font-medium text-paper"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M2 4.5h12M2 8h12M2 11.5h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          Menu
        </button>
        <Link href="/overview" className="text-[15px] font-light tracking-[-0.3px]">
          GradPortal
        </Link>
        <NotificationBell unread={unread} />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="animate-scrim-in absolute inset-0 cursor-default bg-midnight/50 backdrop-blur-sm"
          />
          <aside className="animate-fade-in relative flex h-full w-[264px] flex-col border-r border-mist bg-paper">
            {nav}
          </aside>
        </div>
      ) : null}

      <aside
        className={cx(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-mist bg-paper transition-[width] duration-300 lg:flex",
          width,
        )}
      >
        {nav}
      </aside>
    </>
  );
}
