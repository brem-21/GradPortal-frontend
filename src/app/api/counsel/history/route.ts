import { NextResponse } from "next/server";
import { NotAuthenticatedError } from "@/lib/api";
import { ai } from "@/lib/ai-api";

/** Conversation list for the Counsel history drawer. */
export async function GET() {
  try {
    const page = await ai.conversations();
    return NextResponse.json(page);
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return NextResponse.json({ detail: "Not signed in" }, { status: 401 });
    }
    return NextResponse.json({ items: [], total: 0 });
  }
}
