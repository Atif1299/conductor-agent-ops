import Link from "next/link";
import { listTasks } from "@/lib/store";
import { ApprovalActions } from "@/components/ApprovalActions";
import { StatusPill } from "@/components/StatusPill";
import { formatTime } from "@/lib/client";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const pending = (await listTasks()).filter((t) => t.status === "needs_human");

  return (
    <>
      <header className="page-head">
        <div>
          <span className="eyebrow">Safety gates</span>
          <h1>Approvals</h1>
          <p>
            High-risk work stops here. Approving records audit; never auto-merges
            to main.
          </p>
        </div>
      </header>

      {pending.length === 0 ? (
        <section className="panel">
          <p className="panel-muted">
            No tasks need review. Load sample board for a high-risk bugfix gate.
          </p>
        </section>
      ) : (
        <div className="list">
          {pending.map((t) => (
            <article key={t.id} className="panel">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <Link href={`/tasks/${t.id}`}>
                    <strong>{t.title}</strong>
                  </Link>
                  <p className="panel-muted" style={{ margin: "0.35rem 0 0" }}>
                    {t.brief.objective}
                  </p>
                  <p
                    className="mono"
                    style={{ marginTop: "0.5rem", color: "var(--muted)" }}
                  >
                    {formatTime(t.updatedAt)}
                  </p>
                </div>
                <StatusPill status={t.status} />
              </div>
              <div style={{ marginTop: "0.9rem" }}>
                <ApprovalActions taskId={t.id} />
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
