"use client";

import { useRouter } from "next/navigation";
import { useActionState, useRef, useState, useTransition } from "react";
import { IDLE } from "@/lib/action-state";
import { createStoryAction, deleteStoryAction, updateStoryAction } from "@/lib/actions";
import { Field, FormMessage, Select, SubmitButton, TextArea, TextInput, Toggle } from "@/components/form";
import { GhostButton, Hairline, SectionLabel, Tag, cx } from "@/components/ui";
import { FIELD_OPTIONS } from "@/lib/options";
import type { AdminStory } from "@/types/api";

const CORE_ORIGIN = process.env.NEXT_PUBLIC_CORE_ORIGIN ?? "http://localhost:8000";

function photoUrl(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("/media/") ? `${CORE_ORIGIN}${url}` : url;
}

/** Uploads the photo first so the admin sees it before committing the story. */
function PhotoPicker({
  onUploaded,
}: {
  onUploaded: (path: string | null, url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const response = await fetch("/api/admin/story-photo", { method: "POST", body: form });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.detail ?? "Upload failed.");
        return;
      }
      const url = photoUrl(payload.photo_url);
      setPreview(url);
      onUploaded(payload.photo_path, url);
    } catch {
      setError("Network error during upload.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-start gap-4">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="h-16 w-16 rounded-pill object-cover" />
      ) : (
        <span className="flex h-16 w-16 items-center justify-center rounded-pill text-[10px] text-smoke ring-1 ring-dashed ring-smoke">
          No photo
        </span>
      )}
      <div className="flex-1">
        <span className="section-label block">Photograph (optional)</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
          className="mt-2 w-full text-[13px] text-pewter file:mr-3 file:rounded-button file:border-0 file:bg-char file:px-4 file:py-2 file:text-[12px] file:text-paper"
        />
        <p className="mt-1.5 text-[11px] leading-relaxed text-smoke">
          Only upload a photograph of this person, with their permission. Leave it
          empty and their initials are shown instead.
        </p>
        {busy ? <p className="mt-1 text-[12px] text-smoke">Uploading…</p> : null}
        {error ? <p className="mt-1 text-[12px] text-ember">{error}</p> : null}
      </div>
    </div>
  );
}

export function StoryForm() {
  const [state, action] = useActionState(createStoryAction, IDLE);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);

  return (
    <form action={action} className="mb-14 rounded-card border border-mist p-6">
      <input type="hidden" name="photo_path" value={photoPath ?? ""} />

      <SectionLabel>Add</SectionLabel>
      <h2 className="heading mb-6">New success story</h2>

      <div className="space-y-6">
        <PhotoPicker onUploaded={(path) => setPhotoPath(path)} />

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Name">
            <TextInput name="name" required maxLength={255} placeholder="Ama Boateng" />
          </Field>
          <Field label="Outcome" hint="What actually happened.">
            <TextInput
              name="outcome"
              required
              maxLength={255}
              placeholder="Fully funded PhD · United Kingdom"
            />
          </Field>
          <Field label="Institution">
            <TextInput name="institution" maxLength={255} placeholder="University of Edinburgh" />
          </Field>
          <Field label="Country">
            <TextInput name="country" maxLength={100} placeholder="United Kingdom" />
          </Field>
          <Field label="Field">
            <Select name="field" defaultValue="">
              <option value="">Not specified</option>
              {FIELD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Link" hint="Their LinkedIn or a write-up, if they want one.">
            <TextInput name="link_url" type="url" />
          </Field>
        </div>

        <Field label="Quote" hint="Under about forty words. Longer ones do not get read.">
          <TextArea
            name="quote"
            required
            rows={4}
            minLength={10}
            maxLength={2000}
            placeholder="I nearly missed the deadline — the reminder is the only reason I applied at all."
          />
        </Field>

        <div className="rounded-card bg-mist p-5">
          <p className="section-label mb-3">Consent</p>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="consent_confirmed"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-1"
            />
            <span>
              <span className="block text-[15px] text-ink">
                This person has given permission to be named and quoted here.
              </span>
              <span className="mt-1 block text-[12px] leading-relaxed text-pewter">
                Required before the story can be published. An invented or unconsented
                testimonial presented as genuine is deceptive advertising, and using
                someone&rsquo;s name or photograph without permission is a likeness
                issue. The API enforces this too.
              </span>
            </span>
          </label>
          <div className="mt-4">
            <Field label="How consent was given" hint="Email, message, signed form — for your own record.">
              <TextInput name="consent_note" placeholder="Email, 12 Sep 2026" />
            </Field>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <Toggle
            name="published"
            label="Publish immediately"
            hint={consent ? undefined : "Blocked until consent is confirmed."}
          />
          <Field label="Order" className="w-[110px]">
            <TextInput name="position" type="number" defaultValue={0} />
          </Field>
        </div>

        <FormMessage state={state} />
        <SubmitButton pendingLabel="Saving…">Add story</SubmitButton>
      </div>
    </form>
  );
}

export function StoryList({ stories }: { stories: AdminStory[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok: boolean; message: string | null }>) {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) setError(result.message);
      else router.refresh();
    });
  }

  if (stories.length === 0) {
    return (
      <p className="rounded-card border border-mist px-6 py-10 text-center text-[15px] text-pewter">
        No stories yet. The carousel stays hidden on the landing page until at least
        one is published.
      </p>
    );
  }

  return (
    <>
      {error ? <p className="mb-4 text-[13px] text-ember">{error}</p> : null}
      <ul>
        {stories.map((story) => (
          <li key={story.id} className="hairline py-6 first:border-t-0 first:pt-0">
            <div className="flex flex-wrap items-start gap-5">
              {story.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl(story.photo_url) ?? ""}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-pill object-cover"
                />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-pill bg-mist text-[13px] text-pewter">
                  {story.initials}
                </span>
              )}

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-[18px] text-ink">{story.name}</span>
                  <Tag tone={story.published ? "outline" : "mist"}>
                    {story.published ? "Published" : "Draft"}
                  </Tag>
                  {!story.consent_confirmed ? (
                    <Tag tone="ember">No consent recorded</Tag>
                  ) : null}
                </div>
                <p className="text-[12px] text-smoke">
                  {[story.outcome, story.institution, story.country]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="prose-column mt-2 text-[13px] leading-relaxed text-pewter">
                  &ldquo;{story.quote}&rdquo;
                </p>
                {story.consent_note ? (
                  <p className="mt-1 text-[11px] text-smoke">
                    Consent: {story.consent_note}
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <GhostButton
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    run(() =>
                      updateStoryAction(story.id, { consent_confirmed: !story.consent_confirmed }),
                    )
                  }
                >
                  {story.consent_confirmed ? "Withdraw consent" : "Record consent"}
                </GhostButton>
                <GhostButton
                  type="button"
                  disabled={pending || (!story.consent_confirmed && !story.published)}
                  onClick={() =>
                    run(() => updateStoryAction(story.id, { published: !story.published }))
                  }
                  className={cx(!story.consent_confirmed && !story.published && "text-smoke")}
                >
                  {story.published ? "Unpublish" : "Publish"}
                </GhostButton>
                {confirming === story.id ? (
                  <>
                    <GhostButton
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => deleteStoryAction(story.id))}
                      className="text-ember"
                    >
                      Confirm delete
                    </GhostButton>
                    <GhostButton
                      type="button"
                      onClick={() => setConfirming(null)}
                      className="text-smoke"
                    >
                      Cancel
                    </GhostButton>
                  </>
                ) : (
                  <GhostButton
                    type="button"
                    disabled={pending}
                    onClick={() => setConfirming(story.id)}
                    className="text-smoke"
                  >
                    Delete
                  </GhostButton>
                )}
              </div>
            </div>
          </li>
        ))}
        <Hairline />
      </ul>
    </>
  );
}
