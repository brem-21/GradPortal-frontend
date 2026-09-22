import { NextResponse } from "next/server";
import { SERVICE_URLS, getApiToken } from "@/lib/ai-api";
import { NotAuthenticatedError } from "@/lib/api";

/** Recorded audio in, transcript out. The ElevenLabs key never leaves the service. */
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

  const form = await request.formData();
  if (!(form.get("file") instanceof File)) {
    return NextResponse.json({ detail: "No audio was received." }, { status: 422 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${SERVICE_URLS.voice}/voice/transcribe`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
  } catch {
    return NextResponse.json(
      {
        detail: `The voice service is not responding at ${SERVICE_URLS.voice}. Start it and retry.`,
      },
      { status: 503 },
    );
  }

  const text = await upstream.text();
  return new NextResponse(text || "{}", {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}
