import Link from "next/link";
import { getTask, listAudit } from "@/lib/store";
import { StatusPill } from "@/components/StatusPill";
import { ApprovalActions } from "@/components/ApprovalActions";
import { formatTime } from "@/lib/client";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const task = await getTask(id);
  if (!task) notFound();
  const audit = (await listAudit(100)).filter((a) => a.taskId === id);

  return (
    <>
      <header className="page-head">
        <div>
          <span className="eyebrow">Task · {task.id}</span>
          <h1>{task.title}</h1>
          <p>
            Source {task.source}
            {task.scenarioId ? ` · ${task.scenarioId}` : ""} · updated{" "}
            {formatTime(task.updatedAt)}
          </p>
        </div>
        <StatusPill status={task.status} />
      </header>

      <div className="detail-grid">
        <section className="panel">
          <h2>Delegation brief</h2>
          <div className="kv">
            <div className="kv-item">
              <label>Objective</label>
              <p>{task.brief.objective}</p>
            </div>
            <div className="kv-item">
              <label>Why it matters</label>
              <p>{task.brief.whyItMatters}</p>
            </div>
            <div className="kv-item">
              <label>Done criteria</label>
              <ul>
                {task.brief.doneCriteria.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
            <div className="kv-item">
              <label>Boundaries</label>
              <ul>
                {task.brief.boundaries.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
            <div className="kv-item">
              <label>Return format</label>
              <p>{task.brief.returnFormat}</p>
            </div>
          </div>
        </section>

        <section className="panel">
          <h2>Gates &amp; result</h2>
          <div className="kv">
            <div className="kv-item">
              <label>Risk</label>
              <p>
                {task.highRisk ? "High-risk coding change" : "Standard"} · approval{" "}
                {task.requiresApproval ? "required" : "not required"}
              </p>
            </div>
            <div className="kv-item">
              <label>Approval</label>
              <p>
                {task.approvedAt
                  ? `Approved by ${task.approvedBy} at ${formatTime(task.approvedAt)}`
                  : "Not approved yet"}
              </p>
            </div>
            {task.status === "needs_human" ? (
              <div className="kv-item">
                <label>Human action</label>
                <ApprovalActions taskId={task.id} />
              </div>
            ) : null}
            {task.workerResult ? (
              <>
                <div className="kv-item">
                  <label>Worker summary</label>
                  <p>{task.workerResult.summary}</p>
                </div>
                <div className="kv-item">
                  <label>Files changed</label>
                  <ul>
                    {task.workerResult.filesChanged.map((f) => (
                      <li key={f} className="mono">
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="kv-item">
                  <label>Risks</label>
                  <ul>
                    {(task.workerResult.risks?.length
                      ? task.workerResult.risks
                      : ["None noted"]
                    ).map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <p className="panel-muted">No worker result yet.</p>
            )}
          </div>
        </section>
      </div>

      {task.workerResult?.prDescription ? (
        <section className="panel">
          <h2>PR description (worker)</h2>
          <pre className="pre">{task.workerResult.prDescription}</pre>
        </section>
      ) : null}

      {task.workerResult?.transcript ? (
        <section className="panel">
          <h2>Worker transcript</h2>
          <pre className="pre">{task.workerResult.transcript}</pre>
        </section>
      ) : null}

      <section className="panel">
        <h2>Task audit</h2>
        {audit.length === 0 ? (
          <p className="panel-muted">No events for this task.</p>
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
                <p className="panel-muted" style={{ margin: "0.25rem 0 0" }}>
                  {e.message}
                </p>
              </div>
            </div>
          ))
        )}
      </section>

      <p>
        <Link className="btn ghost" href="/board">
          ← Board
        </Link>
      </p>
    </>
  );
}
