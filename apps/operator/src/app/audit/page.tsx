import Link from "next/link";
import { listAudit } from "@/lib/store";
import { formatTime } from "@/lib/client";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const audit = await listAudit(250);

  return (
    <>
      <header className="page-head">
        <div>
          <span className="eyebrow">Observability</span>
          <h1>Audit log</h1>
          <p>
            Append-only trail of delegations, worker events, gate blocks, and
            human approvals.
          </p>
        </div>
      </header>

      <section className="panel">
        {audit.length === 0 ? (
          <p className="panel-muted">
            Empty. Load sample board to produce a full hand-off chain.
          </p>
        ) : (
          audit.map((e) => (
            <div key={e.id} className="audit-item">
              <div className="mono">
                {formatTime(e.createdAt)}
                <br />
                {e.actor}
              </div>
              <div>
                <strong className="mono">{e.type}</strong>
                {e.taskId ? (
                  <>
                    {" · "}
                    <Link href={`/tasks/${e.taskId}`} className="mono">
                      {e.taskId}
                    </Link>
                  </>
                ) : null}
                <p className="panel-muted" style={{ margin: "0.25rem 0 0" }}>
                  {e.message}
                </p>
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
}
