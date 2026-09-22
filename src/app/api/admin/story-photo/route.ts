import { NextResponse } from "next/server";
import { auth } from "@/auth";

const CORE_API = (process.env.API_BASE_URL ?? "http://localhost:8000/api/v1").replace(
  /\/$/,
  "",
);

/** Upload a story photograph and return its stored path. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.apiToken) {
    return NextResponse.json({ detail: "Not signed in" }, { status: 401 });
  }

  const form = await request.formData();
  if (!(form.get("file") instanceof File)) {
    return NextResponse.json({ detail: "No image was received." }, { status: 422 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${CORE_API}/admin/stories/photo`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.apiToken}` },
      body: form,
    });
  } catch {
    return NextResponse.json(
      { detail: "The API is not responding. Start core-api and retry." },
      { status: 503 },
    );
  }

  const text = await upstream.text();
  return new NextResponse(text || "{}", {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}
