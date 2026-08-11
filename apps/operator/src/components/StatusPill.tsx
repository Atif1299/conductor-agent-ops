import type { TaskStatus } from "@conductor/contracts";
import { STATUS_LABEL } from "@/lib/client";

export function StatusPill({ status }: { status: TaskStatus | string }) {
  return (
    <span className={`pill pill-${status}`}>{STATUS_LABEL[status] ?? status}</span>
  );
}
