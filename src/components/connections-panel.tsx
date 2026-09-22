import { Tag, cx } from "./ui";
import { formatDate } from "@/lib/format";
import type { Connections } from "@/types/api";

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  linkedin: "LinkedIn",
  microsoft: "Microsoft",
  "azure-ad": "Microsoft",
  dev: "Development sign-in",
};

const GMAIL_SEND = "https://www.googleapis.com/auth/gmail.send";

/**
 * What is linked, and whether outreach will actually work.
 *
 * "Signed in successfully" and "can send email" are separate facts: Google
 * only returns a refresh token on an explicit offline consent, so an account
 * can authenticate perfectly and still be unable to send. Surfacing that here
 * beats discovering it when a written email is refused.
 */
export function ConnectionsPanel({ connections }: { connections: Connections }) {
  if (connections.connections.length === 0) {
    return (
      <p className="rounded-card border border-mist px-4 py-4 text-[13px] text-pewter">
        No identity provider is linked to this account.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {connections.connections.map((connection) => {
        const label = PROVIDER_LABELS[connection.provider] ?? connection.provider;
        const sending = connections.sending_provider === connection.provider;
        return (
          <li
            key={`${connection.provider}-${connection.provider_account_id}`}
            className={cx(
              "rounded-card border p-4",
              sending ? "border-ink" : "border-mist",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-[15px] text-ink">{label}</span>
                  {sending ? <Tag tone="outline">Sends your email</Tag> : null}
                  {connection.provider === "dev" ? <Tag tone="ember">Development</Tag> : null}
                </div>
                <p className="text-[11px] text-smoke">
                  Linked {formatDate(connection.connected_at)}
                  {connection.has_refresh_token
                    ? " · refresh token stored"
                    : " · no refresh token"}
                </p>
              </div>

              <span
                className={cx(
                  "shrink-0 text-[12px]",
                  connection.can_send_mail ? "text-pine" : "text-pewter",
                )}
              >
                {connection.can_send_mail ? "Can send email" : "Cannot send email"}
              </span>
            </div>

            {connection.blocked_reason ? (
              <p className="mt-2.5 text-[12px] leading-relaxed text-pewter">
                {connection.blocked_reason}
              </p>
            ) : null}

            {connection.scopes.length > 0 ? (
              <details className="mt-2.5">
                <summary className="cursor-pointer text-[11px] text-smoke hover:text-ink">
                  {connection.scopes.length} scope
                  {connection.scopes.length === 1 ? "" : "s"} granted
                </summary>
                <ul className="mt-1.5 space-y-0.5">
                  {connection.scopes.map((scope) => (
                    <li
                      key={scope}
                      className={cx(
                        "break-all font-mono text-[10px]",
                        scope === GMAIL_SEND ? "text-ember" : "text-smoke",
                      )}
                    >
                      {scope}
                      {scope === GMAIL_SEND ? "  ← lets outreach leave your mailbox" : ""}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
