"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { deleteMediaAction, updateMediaAction } from "@/lib/actions";
import { GhostButton, SectionLabel, Tag, cx } from "@/components/ui";
import type { MediaAsset, SlotOption } from "@/types/api";

const CORE_ORIGIN = process.env.NEXT_PUBLIC_CORE_ORIGIN ?? "http://localhost:8000";

function assetUrl(url: string): string {
  return url.startsWith("/media/") ? `${CORE_ORIGIN}${url}` : url;
}

function bytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(0)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function Preview({ asset }: { asset: MediaAsset }) {
  if (asset.kind === "video") {
    return (
      <video
        src={assetUrl(asset.url)}
        muted
        loop
        playsInline
        autoPlay
        className="h-full w-full object-cover"
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={assetUrl(asset.url)}
      alt={asset.alt_text}
      loading="lazy"
      className="h-full w-full object-cover"
    />
  );
}

export function MediaUploader({ slots }: { slots: SlotOption[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [title, setTitle] = useState("");
  const [credit, setCredit] = useState("");
  const [chosen, setChosen] = useState<string[]>(["hero", "gallery"]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function toggleSlot(value: string) {
    setChosen((current) =>
      current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value],
    );
  }

  async function upload() {
    if (!file) {
      setMessage({ ok: false, text: "Choose a file first." });
      return;
    }
    if (!altText.trim()) {
      setMessage({ ok: false, text: "Alt text is required — the gallery shows these as content." });
      return;
    }

    setBusy(true);
    setMessage(null);

    const form = new FormData();
    form.append("file", file);
    form.append("alt_text", altText.trim());
    if (title.trim()) form.append("title", title.trim());
    if (credit.trim()) form.append("credit", credit.trim());
    chosen.forEach((slot) => form.append("slots", slot));

    try {
      const response = await fetch("/api/admin/media", { method: "POST", body: form });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ ok: false, text: payload.detail ?? "Upload failed." });
      } else {
        setMessage({
          ok: true,
          text: `Uploaded. It now appears in ${chosen.length || "no"} slot(s).`,
        });
        setFile(null);
        setAltText("");
        setTitle("");
        setCredit("");
        if (inputRef.current) inputRef.current.value = "";
        router.refresh();
      }
    } catch {
      setMessage({ ok: false, text: "Network error during upload." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mb-14 rounded-card border border-mist p-6">
      <SectionLabel>Upload</SectionLabel>
      <h2 className="heading mb-2">Add background media</h2>
      <p className="prose-column mb-6 text-[13px] leading-relaxed text-pewter">
        Images, animated GIFs and silent video loops. Each slot rotates through
        everything assigned to it, so adding one more file lengthens the slideshow
        rather than replacing anything.
      </p>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="section-label block">File</label>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif,video/mp4,video/webm"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="mt-2 w-full text-[13px] text-pewter file:mr-3 file:rounded-button file:border-0 file:bg-char file:px-4 file:py-2 file:text-[12px] file:text-paper"
          />
          <p className="mt-2 text-[11px] leading-relaxed text-smoke">
            Up to 25MB. A silent MP4 is far smaller and sharper than a GIF for the
            same effect — prefer it where you can.
          </p>
        </div>

        <label className="block">
          <span className="section-label block">
            Alt text <span className="text-ember">required</span>
          </span>
          <input
            value={altText}
            onChange={(event) => setAltText(event.target.value)}
            placeholder="Students walking a campus path in autumn"
            className="mt-2 w-full rounded-small border border-mist px-3 py-[10px] text-[15px] focus:border-ink focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="section-label block">Title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Campus walk"
            className="mt-2 w-full rounded-small border border-mist px-3 py-[10px] text-[15px] focus:border-ink focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="section-label block">Credit</span>
          <input
            value={credit}
            onChange={(event) => setCredit(event.target.value)}
            placeholder="Photographer or source"
            className="mt-2 w-full rounded-small border border-mist px-3 py-[10px] text-[15px] focus:border-ink focus:outline-none"
          />
        </label>
      </div>

      <div className="mt-6">
        <p className="section-label">Where it appears</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {slots.map((slot) => (
            <button
              key={slot.value}
              type="button"
              onClick={() => toggleSlot(slot.value)}
              className={cx(
                "rounded-pill px-[14px] py-[8px] text-[12px] font-medium leading-none transition-colors",
                chosen.includes(slot.value)
                  ? "bg-char text-paper"
                  : "text-pewter ring-1 ring-inset ring-mist hover:ring-smoke",
              )}
            >
              {slot.label}
              <span className="ml-1.5 opacity-55">{slot.asset_count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-5">
        <button
          type="button"
          onClick={upload}
          disabled={busy}
          className="rounded-button bg-char px-4 py-[13px] text-[13px] font-medium text-paper transition-colors hover:bg-ink disabled:bg-smoke"
        >
          {busy ? "Uploading…" : "Upload"}
        </button>
        {message ? (
          <span className={cx("text-[13px]", message.ok ? "text-pewter" : "text-ember")}>
            {message.text}
          </span>
        ) : null}
      </div>
    </section>
  );
}

export function MediaGrid({
  assets,
  slots,
}: {
  assets: MediaAsset[];
  slots: SlotOption[];
}) {
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

  if (assets.length === 0) {
    return (
      <p className="rounded-card border border-mist px-6 py-10 text-center text-[15px] text-pewter">
        No media yet. Upload something above, or run{" "}
        <code className="text-[13px]">python -m scripts.bootstrap seed-media</code> to
        import the campus photographs bundled with the repo.
      </p>
    );
  }

  return (
    <>
      {error ? <p className="mb-4 text-[13px] text-ember">{error}</p> : null}
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {assets.map((asset) => (
          <li
            key={asset.id}
            className={cx(
              "overflow-hidden rounded-card border transition-opacity",
              asset.enabled ? "border-mist" : "border-mist opacity-55",
            )}
          >
            <div className="aspect-[16/10] bg-mist">
              <Preview asset={asset} />
            </div>

            <div className="p-4">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-[15px] text-ink">
                  {asset.title ?? asset.filename}
                </span>
                <Tag tone="outline">{asset.kind}</Tag>
                {!asset.enabled ? <Tag tone="ember">Hidden</Tag> : null}
              </div>
              <p className="text-[11px] text-smoke">
                {bytes(asset.size_bytes)}
                {asset.width ? ` · ${asset.width}×${asset.height}` : ""}
              </p>
              <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-pewter">
                {asset.alt_text}
              </p>
              {asset.credit ? (
                <p className="mt-1 text-[11px] text-smoke">{asset.credit}</p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-1.5">
                {slots.map((slot) => {
                  const active = asset.slots.includes(slot.value);
                  return (
                    <button
                      key={slot.value}
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        run(() =>
                          updateMediaAction(asset.id, {
                            slots: active
                              ? asset.slots.filter((entry) => entry !== slot.value)
                              : [...asset.slots, slot.value],
                          }),
                        )
                      }
                      className={cx(
                        "rounded-pill px-2.5 py-1 text-[10px] font-medium leading-none transition-colors",
                        active
                          ? "bg-char text-paper"
                          : "text-smoke ring-1 ring-inset ring-mist hover:ring-smoke",
                      )}
                    >
                      {slot.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center gap-4 border-t border-mist pt-3">
                <GhostButton
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    run(() => updateMediaAction(asset.id, { enabled: !asset.enabled }))
                  }
                >
                  {asset.enabled ? "Hide" : "Show"}
                </GhostButton>
                {confirming === asset.id ? (
                  <>
                    <GhostButton
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => deleteMediaAction(asset.id))}
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
                    onClick={() => setConfirming(asset.id)}
                    className="text-smoke"
                  >
                    Delete
                  </GhostButton>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
