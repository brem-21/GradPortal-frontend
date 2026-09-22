import { NextResponse } from "next/server";
import { NotAuthenticatedError, api } from "@/lib/api";

/** Backs the bell panel, which fetches on open rather than on every page load. */
export async function GET(request: Request) {
  const limit = Number(new URL(request.url).searchParams.get("limit") ?? 8);
  try {
    const page = await api.notifications({ page_size: Math.min(Math.max(limit, 1), 25) });
    return NextResponse.json(page);
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return NextResponse.json({ detail: "Not signed in" }, { status: 401 });
    }
    return NextResponse.json({ items: [], total: 0 }, { status: 200 });
  }
}
