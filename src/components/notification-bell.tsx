"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { markAllReadAction, markReadAction } from "@/lib/actions";
import { NavIcon } from "./nav-icon";
import { cx } from "./ui";
import { formatRelative, titleCase } from "@/lib/format";
import type { Notification } from "@/types/api";

const URGENT = new Set(["deadline_reminder", "outreach_failed"]);

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

      {open ? (
        <div className="animate-fade-up absolute right-0 top-full z-50 mt-2 w-[340px] overflow-hidden rounded-card border border-mist bg-paper">
          <div className="flex items-center justify-between border-b border-mist px-4 py-3">
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

          <div className="max-h-[380px] overflow-y-auto">
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
            className="block border-t border-mist px-4 py-3 text-center text-[12px] text-pewter transition-colors hover:text-ink"
          >
            See all notifications →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
