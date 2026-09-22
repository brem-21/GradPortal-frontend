import { NextResponse } from "next/server";
import { SERVICE_URLS, getApiToken } from "@/lib/ai-api";
import { NotAuthenticatedError } from "@/lib/api";

/**
 * Text in, spoken audio out, streamed so playback starts before generation
 * finishes. The upstream body is piped through rather than buffered.
 */
export async function POST(request: Request) {
  let token: string;
  try {
    token = await getApiToken();
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return NextResponse.json({ detail: "Not signed in" }, { status: 401 });
    }
    throw error;
  }

  const payload = await request.json();
  if (!payload?.text || typeof payload.text !== "string") {
    return NextResponse.json({ detail: "Nothing to speak." }, { status: 422 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${SERVICE_URLS.voice}/voice/speak`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: payload.text, voice_id: payload.voice_id ?? null }),
    });
  } catch {
    return NextResponse.json(
      {
        detail: `The voice service is not responding at ${SERVICE_URLS.voice}. Start it and retry.`,
      },
      { status: 503 },
    );
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text();
    return new NextResponse(detail || '{"detail":"Speech synthesis failed."}', {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
