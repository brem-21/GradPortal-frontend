"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "./ui";

type State = "idle" | "recording" | "transcribing" | "error";

/**
 * Press-to-record microphone.
 *
 * MediaRecorder output goes to voice-service for transcription, and the
 * resulting text is handed back to the caller as if it had been typed — so the
 * chat pipeline has exactly one input path regardless of how the words arrived.
 */
export function VoiceRecorder({
  onTranscript,
  disabled,
}: {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}) {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function start() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("error");
      setError("This browser does not support microphone capture.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Let the browser pick: Chrome gives webm/opus, Safari mp4.
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : undefined;
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        void transcribe(new Blob(chunksRef.current, { type: recorder.mimeType }));
      };

      recorder.start();
      recorderRef.current = recorder;
      setState("recording");
      setSeconds(0);
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (exception) {
      setState("error");
      setError(
        exception instanceof DOMException && exception.name === "NotAllowedError"
          ? "Microphone permission was denied. Allow it in your browser settings."
          : "Could not start recording.",
      );
    }
  }

  function stop() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    recorderRef.current?.stop();
    recorderRef.current = null;
    setState("transcribing");
  }

  async function transcribe(blob: Blob) {
    if (blob.size < 1200) {
      setState("idle");
      setError("That recording was too short to transcribe.");
      return;
    }

    const form = new FormData();
    const extension = blob.type.includes("mp4") ? "mp4" : "webm";
    form.append("file", blob, `speech.${extension}`);

    try {
      const response = await fetch("/api/voice/transcribe", { method: "POST", body: form });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setState("error");
        setError(payload.detail ?? "Transcription failed.");
        return;
      }
      setState("idle");
      onTranscript(payload.text ?? "");
    } catch {
      setState("error");
      setError("Could not reach the voice service.");
    }
  }

  const recording = state === "recording";
  const busy = state === "transcribing";

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={recording ? stop : start}
        disabled={disabled || busy}
        aria-label={recording ? "Stop recording" : "Ask by voice"}
        className={cx(
          "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-pill transition-all duration-200",
          recording
            ? "bg-ember text-paper"
            : "border border-mist text-ink hover:border-ink",
          (disabled || busy) && "cursor-not-allowed opacity-50",
        )}
      >
        {busy ? (
          <span className="text-[10px]">…</span>
        ) : recording ? (
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <rect width="14" height="14" rx="2" fill="currentColor" />
          </svg>
        ) : (
          <svg width="16" height="20" viewBox="0 0 16 20" fill="none" aria-hidden="true">
            <rect
              x="5"
              y="1"
              width="6"
              height="10"
              rx="3"
              stroke="currentColor"
              strokeWidth="1.3"
            />
            <path
              d="M2 9a6 6 0 0 0 12 0M8 15v4M5 19h6"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>

      {recording ? (
        <span className="flex items-center gap-2 text-[12px] text-ember">
          <span className="h-1.5 w-1.5 animate-pulse rounded-pill bg-ember" />
          {String(Math.floor(seconds / 60)).padStart(2, "0")}:
          {String(seconds % 60).padStart(2, "0")} — tap to stop
        </span>
      ) : busy ? (
        <span className="text-[12px] text-smoke">Transcribing…</span>
      ) : error ? (
        <span className="text-[12px] text-ember">{error}</span>
      ) : null}
    </div>
  );
}
