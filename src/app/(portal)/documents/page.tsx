import { ai, serviceHealth } from "@/lib/ai-api";
import { ApiError } from "@/lib/api";
import { DocumentRow } from "./document-row";
import { Uploader } from "./uploader";
import { Banner, EmptyState, Hairline, PillLink, SectionLabel, StatTile } from "@/components/ui";
import { kindLabel } from "@/lib/document-kinds";
import type { DocumentList, DocumentStats } from "@/types/ai";

export const metadata = { title: "Documents — GradPortal" };
export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const health = await serviceHealth();
  const docHealth = health.doc;

  let documents: DocumentList = { items: [], total: 0 };
  let stats: DocumentStats | null = null;
  let loadError: string | null = null;

  try {
    [documents, stats] = await Promise.all([ai.documents(), ai.documentStats()]);
  } catch (error) {
    loadError = error instanceof ApiError ? error.message : "Could not load your documents.";
  }

  const embeddingsMissing = docHealth?.checks?.embeddings?.startsWith("missing");

  return (
    <div className="py-12">
      <SectionLabel>Your application file</SectionLabel>
      <h1 className="heading-lg mb-4">Documents</h1>
      <p className="prose-column mb-10 text-[15px] text-pewter">
        Upload your CV, statement of purpose, motivation letter, recommendations and
        transcripts. They are indexed so the assistant can answer from them, and they
        are what the admissions reviewer reads.
      </p>

      {docHealth === null ? (
        <div className="mb-8">
          <Banner tone="error">
            The document service is not running. Start it with{" "}
            <code className="text-[12px]">
              uvicorn doc_service.main:app --port 8001
            </code>{" "}
            from the services directory.
          </Banner>
        </div>
      ) : embeddingsMissing ? (
        <div className="mb-8">
          <Banner tone="warning">
            <strong>OPENAI_API_KEY is not set.</strong> Uploads will parse but cannot be
            indexed, so the assistant will not be able to search them. OpenRouter has no
            embeddings endpoint, which is why this key is separate. Add it to{" "}
            <code className="text-[12px]">services/.env</code> and restart doc-service.
          </Banner>
        </div>
      ) : null}

      {loadError ? (
        <div className="mb-8">
          <Banner tone="error">{loadError}</Banner>
        </div>
      ) : null}

      {stats && stats.total_documents > 0 ? (
        <div className="mb-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile label="Documents" value={stats.total_documents} />
          <StatTile
            label="Words indexed"
            value={stats.total_words.toLocaleString()}
            hint="Searchable by the assistant"
          />
          <StatTile
            label="Types covered"
            value={Object.keys(stats.by_kind).length}
            hint={Object.keys(stats.by_kind).map(kindLabel).join(", ")}
          />
          <StatTile
            label="Ready to review"
            value={documents.items.filter((d) => d.status === "indexed").length}
          />
        </div>
      ) : null}

      <Uploader />

      <section>
        <SectionLabel>Uploaded</SectionLabel>
        <h2 className="heading mb-6">Your documents</h2>

        {documents.items.length === 0 ? (
          <EmptyState
            title="Nothing uploaded yet"
            body="Start with your CV and your statement of purpose — those two carry most of the weight in a committee's reading, and they are what the reviewer has most to say about."
            action={<PillLink href="/evaluate">See what gets assessed</PillLink>}
          />
        ) : (
          <ul>
            {documents.items.map((document) => (
              <DocumentRow key={document.id} document={document} />
            ))}
            <Hairline />
          </ul>
        )}
      </section>
    </div>
  );
}
