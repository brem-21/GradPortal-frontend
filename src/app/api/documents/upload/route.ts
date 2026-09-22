import { NextResponse } from "next/server";
import { SERVICE_URLS, getApiToken } from "@/lib/ai-api";
import { NotAuthenticatedError } from "@/lib/api";

/**
 * Multipart upload passthrough.
 *
 * The browser cannot call doc-service directly — the API bearer lives in the
 * session cookie and must stay server-side. Streaming the FormData straight
 * through avoids buffering a 15MB PDF twice.
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

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ detail: "No file was received." }, { status: 422 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${SERVICE_URLS.doc}/documents`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
  } catch {
    return NextResponse.json(
      {
        detail: `The document service is not responding at ${SERVICE_URLS.doc}. Start it and retry.`,
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
