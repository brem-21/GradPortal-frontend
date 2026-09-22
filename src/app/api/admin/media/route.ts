import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";

const CORE_API = (process.env.API_BASE_URL ?? "http://localhost:8000/api/v1").replace(
  /\/$/,
  "",
);

/** Multipart passthrough for admin media uploads; the token stays server-side. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.apiToken) {
    return NextResponse.json({ detail: "Not signed in" }, { status: 401 });
  }

  const form = await request.formData();
  if (!(form.get("file") instanceof File)) {
    return NextResponse.json({ detail: "No file was received." }, { status: 422 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${CORE_API}/admin/media`, {
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

  if (upstream.ok) {
    // The landing page caches site media for a minute; drop it now so the
    // admin sees their upload immediately rather than wondering if it worked.
    revalidateTag("site-media");
  }

  const text = await upstream.text();
  return new NextResponse(text || "{}", {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}
