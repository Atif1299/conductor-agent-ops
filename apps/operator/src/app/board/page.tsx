import Link from "next/link";
import { listTasks } from "@/lib/store";
import { StatusPill } from "@/components/StatusPill";
import { STATUS_ORDER, formatTime } from "@/lib/client";
import type { TaskStatus } from "@conductor/contracts";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const tasks = await listTasks();
  const columns = STATUS_ORDER.map((status) => ({
    status,
    items: tasks.filter((t) => t.status === status),
  }));

  return (
    <>
      <header className="page-head">
        <div>
          <span className="eyebrow">Task board</span>
          <h1>Kanban</h1>
          <p>
            queued → working → needs human → done | failed. High-risk work stops
            for human approval; Hermes never merges main.
          </p>
        </div>
      </header>

      <div className="board">
        {columns.map((col) => (
          <section key={col.status} className="col">
            <div className="col-head">
              <h3>{col.status.replace("_", " ")}</h3>
              <span className="mono">{col.items.length}</span>
            </div>
            {col.items.map((t) => (
              <Link key={t.id} href={`/tasks/${t.id}`} className="card">
                <h4>{t.title}</h4>
                <div className="meta">
                  <StatusPill status={t.status as TaskStatus} />
                  <span style={{ marginLeft: 8 }}>{formatTime(t.updatedAt)}</span>
                </div>
                <div className="meta" style={{ marginTop: 6 }}>
                  {t.source}
                  {t.highRisk ? " · high risk" : ""}
                </div>
              </Link>
            ))}
          </section>
        ))}
      </div>
    </>
  );
}
