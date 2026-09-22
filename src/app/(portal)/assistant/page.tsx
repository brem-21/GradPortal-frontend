import Link from "next/link";
import { ai, serviceHealth } from "@/lib/ai-api";
import { Chat } from "./chat";
import { Banner, PillLink, SectionLabel, Tag } from "@/components/ui";
import { formatRelative } from "@/lib/format";
import type { ChatMessage, Conversation } from "@/types/ai";

export const metadata = { title: "Assistant — GradPortal" };
export const dynamic = "force-dynamic";

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  const health = await serviceHealth();

  const [documents, conversationList] = await Promise.all([
    ai.documents().catch(() => ({ items: [], total: 0 })),
    ai.conversations().catch(() => ({ items: [], total: 0 })),
  ]);

  const indexed = documents.items.filter((d) => d.status === "indexed");
  const conversations = conversationList.items as Conversation[];

  let messages: ChatMessage[] = [];
  let activeId: string | null = null;
  if (c) {
    const conversation = await ai.conversation(c).catch(() => null);
    if (conversation) {
      messages = conversation.messages;
      activeId = conversation.id;
    }
  }

  const ragDown = health.rag === null;
  const voiceDown = health.voice === null;
  const openrouterMissing = health.rag?.checks?.openrouter?.startsWith("missing");
  const elevenMissing = health.voice?.checks?.elevenlabs?.startsWith("missing");

  return (
    <div className="py-12">
      <SectionLabel>Grounded in your own documents</SectionLabel>
      <h1 className="heading-lg mb-4">Assistant</h1>
      <p className="prose-column mb-8 text-[15px] text-pewter">
        Ask by typing or by speaking. Every answer is drawn from the documents you
        uploaded and cites them; when your documents do not cover something, it says
        so instead of filling the gap.
      </p>

      <div className="mb-8 space-y-3">
        {ragDown ? (
          <Banner tone="error">
            The chat service is not running. Start it with{" "}
            <code className="text-[12px]">uvicorn rag_service.main:app --port 8002</code>{" "}
            from the services directory.
          </Banner>
        ) : openrouterMissing ? (
          <Banner tone="warning">
            <strong>OPENROUTER_API_KEY is not set,</strong> so the assistant cannot
            answer. Add it to <code className="text-[12px]">services/.env</code> and
            restart rag-service.
          </Banner>
        ) : null}

        {voiceDown ? (
          <Banner tone="warning">
            The voice service is not running, so the microphone and spoken replies are
            unavailable. Text still works.
          </Banner>
        ) : elevenMissing ? (
          <Banner tone="warning">
            <strong>ELEVENLABS_API_KEY is not set.</strong> Speech input and spoken
            replies are unavailable; text still works.
          </Banner>
        ) : null}

        {indexed.length === 0 ? (
          <Banner tone="warning">
            You have no indexed documents, so there is nothing to ground answers in.{" "}
            <Link href="/documents" className="text-ember hover:underline">
              Upload your CV and statement →
            </Link>
          </Banner>
        ) : null}
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-w-0">
          <Chat
            initialConversationId={activeId}
            initialMessages={messages}
            hasDocuments={indexed.length > 0}
          />
        </div>

        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <div>
            <p className="section-label">Grounded in</p>
            {indexed.length === 0 ? (
              <p className="mt-2 text-[13px] text-pewter">Nothing yet.</p>
            ) : (
              <ul className="mt-3 space-y-1.5">
                {indexed.map((document) => (
                  <li key={document.id} className="text-[12px] text-pewter">
                    {document.title ?? document.filename}
                    <span className="text-smoke"> · {document.chunk_count} sections</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <PillLink href="/documents">Manage documents</PillLink>
            </div>
          </div>

          {conversations.length > 0 ? (
            <div>
              <p className="section-label">Recent</p>
              <ul className="mt-3 space-y-2">
                {conversations.slice(0, 10).map((conversation) => (
                  <li key={conversation.id}>
                    <Link
                      href={`/assistant?c=${conversation.id}`}
                      className="group block"
                    >
                      <span
                        className={
                          conversation.id === activeId
                            ? "block text-[13px] text-ember"
                            : "block text-[13px] text-ink transition-colors group-hover:text-ember"
                        }
                      >
                        {conversation.title}
                      </span>
                      <span className="text-[11px] text-smoke">
                        {formatRelative(conversation.updated_at)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              {activeId ? (
                <Link
                  href="/assistant"
                  className="mt-4 inline-block text-[12px] text-smoke hover:text-ink"
                >
                  Start a new conversation →
                </Link>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-card bg-mist p-4">
            <p className="section-label">Privacy</p>
            <p className="text-[12px] leading-relaxed text-pewter">
              Retrieval is filtered to your account on every query. No other user&rsquo;s
              documents can be reached, and answers never draw on them.
            </p>
            {health.doc?.checks?.embeddings === "configured" ? (
              <Tag tone="outline" className="mt-3">
                Documents are embedded via OpenAI
              </Tag>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
