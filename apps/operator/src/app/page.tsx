import Link from "next/link";
import { overview, listTasks } from "@/lib/store";
import { SeedDemoButton } from "@/components/SeedDemoButton";
import { StatusPill } from "@/components/StatusPill";
import { formatTime } from "@/lib/client";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const data = await overview();
  const recent = (await listTasks()).slice(0, 5);
  const settings = data.settings;

  return (
    <>
      <header className="page-head">
        <div>
          <span className="eyebrow">Conductor · Operator</span>
          <h1>Control plane</h1>
          <p>
            Hermes plans and verifies. Claude Code path executes. Humans approve
            risk. Models via OpenRouter (no Anthropic console required).
          </p>
        </div>
        <SeedDemoButton />
      </header>

      <section className="grid-stats">
        {(
          [
            ["queued", data.counts.queued],
            ["working", data.counts.working],
            ["needs_human", data.counts.needs_human],
            ["done", data.counts.done],
            ["failed", data.counts.failed],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="stat">
            <div className="k">{k.replace("_", " ")}</div>
            <div className="v">{v ?? 0}</div>
          </div>
        ))}
      </section>

      <div className="detail-grid">
        <section className="panel">
          <h2>Provider &amp; bridge</h2>
          <div className="list">
            <p className="panel-muted mono">
              LLM: {settings.llmProvider} · {settings.llmModel}
              {settings.llmModelFallback
                ? ` · fallback ${settings.llmModelFallback}`
                : ""}
            </p>
            <p className="panel-muted mono">
              Coding role: {settings.codingRoleLabel}
            </p>
            <div className="health">
              <span className={`dot ${settings.bridgeHermes}`} />
              Hermes — {settings.bridgeHermes}
            </div>
            <div className="health">
              <span className={`dot ${settings.bridgeClaudeCode}`} />
              Claude Code path — {settings.bridgeClaudeCode}
            </div>
            <p className="panel-muted" style={{ marginTop: "0.75rem" }}>
              Channel: <span className="mono">{settings.channel}</span>
              {" · "}
              Max children: <span className="mono">{settings.maxChildAgents}</span>
              {" · "}
              Budget: <span className="mono">${settings.budgetUsdPerDay}/day</span>
              {" · "}
              Auto-merge: <span className="mono">false</span>
            </p>
            <p className="panel-muted">
              OpenRouter key on server:{" "}
              {data.provider.openRouterConfigured ? "configured" : "not set"}
              {data.provider.gcsBucket
                ? ` · GCS: ${data.provider.gcsBucket}`
                : " · store: local"}
            </p>
          </div>
        </section>

        <section className="panel">
          <h2>Recent runs</h2>
          {recent.length === 0 ? (
            <p className="panel-muted">
              No tasks. Load sample board to populate scenarios, audit, and approvals.
            </p>
          ) : (
            <div className="list">
              {recent.map((t) => (
                <div key={t.id} className="list-row">
                  <div>
                    <Link href={`/tasks/${t.id}`}>{t.title}</Link>
                    <div className="meta mono" style={{ marginTop: 4 }}>
                      {formatTime(t.updatedAt)} · {t.source}
                    </div>
                  </div>
                  <StatusPill status={t.status} />
                </div>
              ))}
            </div>
          )}
          <p style={{ marginTop: "1rem" }}>
            <Link className="btn ghost" href="/board">
              Open board →
            </Link>
          </p>
        </section>
      </div>
    </>
  );
}
