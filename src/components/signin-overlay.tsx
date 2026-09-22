"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DevSignIn } from "./dev-signin";
import { ProviderButtons } from "./provider-buttons";
import { cx } from "./ui";

interface SignInContextValue {
  open: () => void;
  close: () => void;
  isOpen: boolean;
}

const SignInContext = createContext<SignInContextValue | null>(null);

export function useSignIn(): SignInContextValue {
  const context = useContext(SignInContext);
  if (!context) throw new Error("useSignIn must be used inside <SignInProvider>");
  return context;
}

/**
 * Sign-in as an overlay rather than a navigation.
 *
 * Clicking sign in blurs the page behind a scrim and lifts the panel forward, so
 * the visitor keeps their place on the landing page instead of losing context to
 * a full page load. /signin still exists as a real route for direct links and
 * for the middleware redirect.
 */
export interface SignInConfig {
  google: boolean;
  linkedin: boolean;
  dev: boolean;
}

export function SignInProvider({
  children,
  callbackUrl = "/overview",
  config,
}: {
  children: React.ReactNode;
  callbackUrl?: string;
  config: SignInConfig;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    // Lock the page behind the scrim so the background does not scroll under it.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [isOpen, close]);

  return (
    <SignInContext.Provider value={{ open, close, isOpen }}>
      {/* The blur is applied to the page content, not the overlay, so the
          backdrop genuinely defocuses rather than just darkening. */}
      <div
        className={cx(
          "transition-[filter,transform] duration-500 ease-out",
          isOpen && "pointer-events-none scale-[1.015] blur-[14px]",
        )}
        aria-hidden={isOpen}
      >
        {children}
      </div>

      {isOpen ? (
        <SignInPanel onClose={close} callbackUrl={callbackUrl} config={config} />
      ) : null}
    </SignInContext.Provider>
  );
}

function SignInPanel({
  onClose,
  callbackUrl,
  config,
}: {
  onClose: () => void;
  callbackUrl: string;
  config: SignInConfig;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sign in to GradPortal"
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8"
    >
      <button
        type="button"
        aria-label="Close sign in"
        onClick={onClose}
        className="animate-scrim-in absolute inset-0 cursor-default bg-midnight/55"
      />

      <div className="animate-fade-up relative max-h-[90vh] w-full max-w-[460px] overflow-y-auto rounded-card border border-paper/15 bg-paper p-8 md:p-10">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-5 top-5 text-smoke transition-colors hover:text-ink"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M3.5 3.5l9 9m0-9l-9 9"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <p className="section-label">Sign in or create an account</p>
        <h2 className="heading mb-2">Continue to the portal</h2>
        <p className="mb-7 text-[13px] leading-relaxed text-pewter">
          Signing in creates your account. You will choose the opportunity types
          and fields you care about next.
        </p>

        <ProviderButtons
          callbackUrl={callbackUrl}
          tone="light"
          google={config.google}
          linkedin={config.linkedin}
        />

        {config.dev ? (
          <div className="mt-5">
            <DevSignIn callbackUrl={callbackUrl} />
          </div>
        ) : null}

        <p className="mt-7 border-t border-mist pt-5 text-[12px] leading-relaxed text-smoke">
          Your provider refresh token is stored encrypted and used only for the
          enquiry emails you write and send yourself. Nothing is ever sent on your
          behalf.
        </p>
      </div>
    </div>
  );
}

/** Any element can open the panel. Used by the hero and the nav. */
export function SignInTrigger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { open } = useSignIn();
  return (
    <button type="button" onClick={open} className={className}>
      {children}
    </button>
  );
}
