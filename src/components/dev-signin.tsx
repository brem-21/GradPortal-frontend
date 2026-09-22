"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { signInAsDemo, signInAsDevUser } from "@/lib/auth-actions";
import { Arrow, cx } from "./ui";

const DEMO_ACCOUNTS = [
  {
    email: "admin@gradportal.example.com",
    name: "Ama Boateng",
    role: "Community admin",
    can: "Everything, plus ingestion sources, site media and success stories",
  },
  {
    email: "mentor@gradportal.example.com",
    name: "Kwesi Mensah",
    role: "Mentor",
    can: "Appears in the directory, takes mentorship requests, posts opportunities",
  },
  {
    email: "student@gradportal.example.com",
    name: "Efua Owusu",
    role: "Applicant",
    can: "Not yet onboarded — good for testing the first-run flow",
  },
];

function Pending({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <>{pending ? "Signing in…" : children}</>;
}

/**
 * Password-less sign-in for validating the app before OAuth is registered.
 *
 * Rendered only when the server says the provider exists, and labelled loudly
 * so it can never be mistaken for a real authentication path.
 */
export function DevSignIn({ callbackUrl = "/overview" }: { callbackUrl?: string }) {
  const [custom, setCustom] = useState("");

  return (
    <section className="rounded-card border border-ember/40 p-5">
      <div className="mb-1 flex items-center gap-2">
        <span className="rounded-pill bg-ember px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-paper">
          Development only
        </span>
      </div>
      <h2 className="mb-1 text-[18px] text-ink">Sign in without OAuth</h2>
      <p className="mb-5 text-[12px] leading-relaxed text-pewter">
        No password is checked. This exists so the app can be exercised before
        Google and LinkedIn are registered, and it is unavailable in a production
        build. Turn off <code className="text-[11px]">ALLOW_DEV_SIGNIN</code> once
        OAuth works.
      </p>

      <ul className="mb-5 space-y-2">
        {DEMO_ACCOUNTS.map((account) => (
          <li key={account.email}>
            <form action={signInAsDemo.bind(null, account.email, callbackUrl)}>
              <button
                type="submit"
                className={cx(
                  "group flex w-full items-center gap-3 rounded-card border border-mist px-4 py-3",
                  "text-left transition-colors duration-200 hover:border-ink",
                )}
              >
                <span className="flex-1">
                  <span className="block text-[14px] text-ink">
                    <Pending>
                      {account.name}
                      <span className="text-pewter"> · {account.role}</span>
                    </Pending>
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-relaxed text-smoke">
                    {account.can}
                  </span>
                </span>
                <Arrow className="text-ink group-hover:translate-x-1" />
              </button>
            </form>
          </li>
        ))}
      </ul>

      <form
        action={signInAsDevUser.bind(null, callbackUrl)}
        className="flex items-center gap-2 border-t border-mist pt-4"
      >
        <input
          type="email"
          name="email"
          required
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          placeholder="you@example.com"
          className="min-w-0 flex-1 rounded-small border border-mist bg-paper px-3 py-2 text-[13px] text-ink placeholder:text-smoke focus:border-ink focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded-button bg-char px-4 py-2 text-[12px] font-medium text-paper transition-colors hover:bg-ink"
        >
          <Pending>Sign in</Pending>
        </button>
      </form>
      <p className="mt-2 text-[11px] leading-relaxed text-smoke">
        Any address creates an account on first sign-in. Grant it admin with{" "}
        <code className="text-[10px]">python -m scripts.bootstrap make-admin &lt;email&gt;</code>
        <br />
        Reserved domains (<code className="text-[10px]">.test</code>,{" "}
        <code className="text-[10px]">.local</code>,{" "}
        <code className="text-[10px]">.invalid</code>) are rejected — the API&rsquo;s
        email validator will not accept them.
      </p>
    </section>
  );
}
