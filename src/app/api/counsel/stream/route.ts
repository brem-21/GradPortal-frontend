import { auth } from "@/auth";
import { SERVICE_URLS } from "@/lib/ai-api";

export const dynamic = "force-dynamic";
// Node, not edge: the upstream stream is proxied byte-for-byte and edge adds
// buffering we would then have to fight.
export const runtime = "nodejs";

/**
 * Proxies the rag-service SSE stream to the browser.
 *
 * A server action cannot stream, so the live answer needs a route handler. The
 * body is piped through untouched so the first token reaches the reader as
 * soon as the model produces it.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.apiToken) {
    return new Response(JSON.stringify({ detail: "Not signed in" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const payload = await request.json();

  let upstream: Response;
  try {
    upstream = await fetch(`${SERVICE_URLS.rag}/chat/stream`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      // @ts-expect-error — Node fetch needs this to stream a request body.
      duplex: "half",
    });
  } catch {
    return new Response(
      `data: ${JSON.stringify({
        type: "error",
        detail: `Counsel is not responding at ${SERVICE_URLS.rag}.`,
      })}\n\n`,
      { status: 200, headers: { "Content-Type": "text/event-stream" } },
    );
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "Upstream error");
    return new Response(
      `data: ${JSON.stringify({ type: "error", detail: detail.slice(0, 300) })}\n\n`,
      { status: 200, headers: { "Content-Type": "text/event-stream" } },
    );
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
