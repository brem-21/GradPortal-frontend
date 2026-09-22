"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cx } from "./ui";

const MENU = [
  {
    href: "/overview",
    title: "Overview",
    description: "Your matches, deadlines and activity at a glance",
    photo: "/media/tide.jpg",
  },
  {
    href: "/opportunities",
    title: "Opportunities",
    description: "Programmes, scholarships, assistantships and research posts",
    photo: "/media/coastline.jpg",
  },
  {
    href: "/mentors",
    title: "Mentors",
    description: "People who have made the move and will talk you through it",
    photo: "/media/code.jpg",
  },
  {
    href: "/profile",
    title: "Profile",
    description: "What you are looking for, and how contacts see you",
    photo: "/media/tide.jpg",
  },
];

/**
 * The compact dark pill in the top-right that opens a two-column card menu.
 * Fixed position over both light sections and hero photography.
 */
export function NavPill({ tone = "dark" }: { tone?: "dark" | "dark-on-photo" }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className={cx(
          "fixed right-4 top-6 z-50 inline-flex h-8 items-center gap-[10px] rounded-pill bg-char px-[13px] md:right-6",
          "text-[12px] font-medium tracking-[0.12px] text-paper transition-opacity duration-200 hover:opacity-85",
          tone === "dark-on-photo" && "bg-char/90 backdrop-blur-sm",
        )}
      >
        <span>GRADPORTAL</span>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          {open ? (
            <path
              d="M3.5 3.5l9 9m0-9l-9 9"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M2 4.5h12M2 8h12M2 11.5h12"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          )}
        </svg>
      </button>

      {open ? (
        <div className="fixed inset-0 z-40 bg-midnight/95 backdrop-blur-sm">
          <div className="page-shell flex h-full flex-col justify-center pt-20">
            <p className="section-label mb-6 text-smoke">Go to</p>
            <div className="grid gap-4 md:grid-cols-2">
              {MENU.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="group flex items-stretch gap-4 rounded-card bg-char p-4 transition-colors duration-200 hover:bg-iron"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.photo}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="hidden aspect-[4/3] w-28 shrink-0 rounded-image object-cover opacity-80 transition-opacity duration-300 group-hover:opacity-100 sm:block"
                  />
                  <div className="flex flex-1 flex-col justify-center">
                    <p className="text-[15px] font-normal text-paper">{item.title}</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-mist">
                      {item.description}
                    </p>
                  </div>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                    className="mt-1 shrink-0 text-paper transition-transform duration-200 group-hover:translate-x-1"
                  >
                    <path
                      d="M2.5 8h11m0 0L9 3.5M13.5 8 9 12.5"
                      stroke="currentColor"
                      strokeWidth="1.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
