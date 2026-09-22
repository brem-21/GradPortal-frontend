"use client";

import { useState } from "react";
import { Field, TextInput } from "./form";
import { cx } from "./ui";

/**
 * Profile picture input with a live preview.
 *
 * Google and LinkedIn both return a picture with the OIDC claims, so most
 * people arrive with this already filled and simply confirm it. The URL field
 * is the fallback for anyone whose provider returned nothing — there is no
 * avatar object storage wired up, so a link is what we can honestly support.
 */
export function AvatarField({ initial }: { initial: string | null }) {
  const [url, setUrl] = useState(initial ?? "");
  const [broken, setBroken] = useState(false);

  const showPreview = url.trim().length > 0 && !broken;

  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="shrink-0">
        {showPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="Your profile picture"
            onError={() => setBroken(true)}
            referrerPolicy="no-referrer"
            className="h-20 w-20 rounded-pill object-cover ring-1 ring-mist"
          />
        ) : (
          <div
            className={cx(
              "flex h-20 w-20 items-center justify-center rounded-pill",
              "bg-paper text-[11px] text-smoke ring-1 ring-dashed ring-smoke",
            )}
          >
            No photo
          </div>
        )}
      </div>

      <div className="min-w-[260px] flex-1">
        <Field
          label="Picture URL"
          hint={
            initial
              ? "Taken from your sign-in provider. Replace it with another link if you prefer."
              : "Your provider did not return a picture. Paste a direct link to a photo of yourself."
          }
        >
          <TextInput
            name="avatar_url"
            type="url"
            required
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              setBroken(false);
            }}
            placeholder="https://…"
          />
        </Field>
        {broken ? (
          <p className="mt-2 text-[12px] text-ember">
            That link did not load an image. Check it points directly at a file.
          </p>
        ) : null}
      </div>
    </div>
  );
}
