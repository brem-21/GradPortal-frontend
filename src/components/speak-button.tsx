"use client";

import { useRef, useState } from "react";
import { GhostButton } from "./ui";

/**
 * Read an answer aloud.
 *
 * Failures are surfaced verbatim rather than swallowed: the most likely one is
 * an ElevenLabs plan restriction, and "speech unavailable" would leave the user
 * guessing at something a sentence of the real error explains.
 */
export function SpeakButton({ text }: { text: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const [error, setError] = useState<string | null>(null);

  async function speak() {
    if (state === "playing") {
      audioRef.current?.pause();
      audioRef.current = null;
      setState("idle");
      return;
    }

    setState("loading");
    setError(null);
    try {
      const response = await fetch("/api/voice/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const detail =
          typeof payload.detail === "string"
            ? payload.detail
            : (payload.detail?.message ?? "Speech synthesis failed.");
        setState("idle");
        setError(detail);
        return;
      }

      const blob = await response.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audioRef.current = audio;
      audio.onended = () => setState("idle");
      audio.onerror = () => {
        setState("idle");
        setError("Could not play the audio.");
      };
      await audio.play();
      setState("playing");
    } catch {
      setState("idle");
      setError("Could not reach the voice service.");
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-3">
      <GhostButton type="button" onClick={speak} disabled={state === "loading"}>
        {state === "loading" ? "Preparing…" : state === "playing" ? "Stop" : "Listen →"}
      </GhostButton>
      {error ? <span className="text-[12px] text-ember">{error}</span> : null}
    </span>
  );
}
