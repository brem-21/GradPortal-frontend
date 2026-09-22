import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api";
import { ai } from "@/lib/ai-api";

/** One conversation with its full message history, for resuming a thread. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    return NextResponse.json(await ai.conversation(id));
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ detail: "Conversation not found" }, { status });
  }
}
