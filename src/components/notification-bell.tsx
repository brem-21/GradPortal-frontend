"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { markAllReadAction, markReadAction } from "@/lib/actions";
import { NavIcon } from "./nav-icon";
import { cx } from "./ui";
import { formatRelative, titleCase } from "@/lib/format";
import type { Notification } from "@/types/api";

const URGENT = new Set(["deadline_reminder", "outreach_failed"]);

const PANEL_WIDTH = 340;
const VIEWPORT_MARGIN = 12;

/**
 * Bell with an unread dot, opening a panel of recent notifications.
 *
 * The list is fetched when the panel opens rather than with the page: it is
 * secondary information, and loading it on every render would add a round trip
 * to every navigation for something most visits never look at.
 */
export function NotificationBell({ unread }: { unread: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // The bell renders in the sidebar (236px wide, 68px collapsed) and in the
  // mobile header, so a panel positioned relative to it would spill out of its
  // container or off-screen. It is placed against the viewport instead.
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);

  const place = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const maxLeft = window.innerWidth - PANEL_WIDTH - VIEWPORT_MARGIN;
    // Prefer hanging off the bell's left edge; fall back to its right edge when
    // the bell sits in a narrow left rail and there is no room that way.
    const preferred = rect.right - PANEL_WIDTH;
    const left = preferred < VIEWPORT_MARGIN ? rect.left : preferred;
    setAnchor({
      top: rect.bottom + 8,
      left: Math.max(VIEWPORT_MARGIN, Math.min(left, maxLeft)),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open || items !== null) return;
    setLoading(true);
    fetch("/api/notifications?limit=8")
      .then((response) => (response.ok ? response.json() : { items: [] }))
      .then((payload) => setItems(payload.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [open, items]);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function openAndRefresh() {
    setOpen((current) => {
      if (!current) setItems(null); // refetch each time it opens
      return !current;
    });
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={openAndRefresh}
        aria-expanded={open}
        aria-label={
          unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
        }
        className={cx(
          "relative inline-flex h-9 w-9 items-center justify-center rounded-pill transition-colors",
          open ? "bg-mist text-ink" : "text-pewter hover:bg-mist/60 hover:text-ink",
        )}
      >
        <NavIcon name="bell" />
        {unread > 0 ? (
          <>
            <span
              className="absolute right-1.5 top-1.5 h-2 w-2 rounded-pill bg-ember ring-2 ring-paper"
              aria-hidden="true"
            />
            <span
              className="absolute right-1.5 top-1.5 h-2 w-2 animate-ping rounded-pill bg-ember"
              aria-hidden="true"
            />
          </>
        ) : null}
      </button>

      {open && anchor ? (
        <div
          style={{ top: anchor.top, left: anchor.left, width: PANEL_WIDTH }}
          className="animate-fade-up fixed z-[130] flex max-h-[min(70vh,520px)] flex-col overflow-hidden rounded-card border border-mist bg-paper">
          <div className="flex shrink-0 items-center justify-between border-b border-mist px-4 py-3">
            <span className="text-[13px] text-ink">
              Notifications
              {unread > 0 ? <span className="text-smoke"> · {unread} new</span> : null}
            </span>
            {unread > 0 ? (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await markAllReadAction();
                    setItems(null);
                    router.refresh();
                  })
                }
                className="text-[12px] text-pewter transition-colors hover:text-ink"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
            {loading ? (
              <p className="px-4 py-8 text-center text-[13px] text-smoke">Loading…</p>
            ) : !items || items.length === 0 ? (
              <p className="px-4 py-10 text-center text-[13px] text-pewter">
                Nothing yet. New matches, deadlines and replies land here.
              </p>
            ) : (
              <ul>
                {items.map((notification) => {
                  const body = (
                    <div
                      className={cx(
                        "border-b border-mist px-4 py-3 transition-colors hover:bg-mist/40",
                        !notification.read_at && "bg-mist/25",
                      )}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        {!notification.read_at ? (
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-pill bg-ember"
                            aria-hidden="true"
                          />
                        ) : null}
                        <span
                          className={cx(
                            "text-[10px] uppercase tracking-wide",
                            URGENT.has(notification.type) ? "text-ember" : "text-smoke",
                          )}
                        >
                          {titleCase(notification.type)}
                        </span>
                        <span className="ml-auto text-[11px] text-smoke">
                          {formatRelative(notification.created_at)}
                        </span>
                      </div>
                      <p className="text-[13px] leading-snug text-ink">
                        {notification.title}
                      </p>
                      {notification.body ? (
                        <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-pewter">
                          {notification.body}
                        </p>
                      ) : null}
                    </div>
                  );

                  return (
                    <li key={notification.id}>
                      {notification.link ? (
                        <Link
                          href={notification.link}
                          onClick={() => {
                            if (!notification.read_at) {
                              startTransition(async () => {
                                await markReadAction(notification.id);
                              });
                            }
                            setOpen(false);
                          }}
                          className="block"
                        >
                          {body}
                        </Link>
                      ) : (
                        body
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block shrink-0 border-t border-mist px-4 py-3 text-center text-[12px] text-pewter transition-colors hover:text-ink"
          >
            See all notifications →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
