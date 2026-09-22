import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api";
import { serviceFetch } from "@/lib/ai-api";
import type { AppDocument } from "@/types/ai";

/** Full document including its extracted text, for the viewer drawer. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const document = await serviceFetch<AppDocument & { extracted_text: string }>(
      "doc",
      `/documents/${id}`,
    );
    return NextResponse.json(document);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ detail: "Document not found" }, { status });
  }
}
