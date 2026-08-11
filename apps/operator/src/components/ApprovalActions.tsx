"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiPost } from "@/lib/client";

export function ApprovalActions({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function act(action: "approve" | "reject") {
    setBusy(true);
    setErr(null);
    try {
      await apiPost(`/api/tasks/${taskId}/approve`, {
        action,
        by: "operator",
        reason: action === "reject" ? "Rejected in operator UI" : undefined,
      });
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inline-actions">
      <button
        type="button"
        className="btn primary"
        disabled={busy}
        onClick={() => act("approve")}
      >
        Approve (no auto-merge)
      </button>
      <button
        type="button"
        className="btn ghost"
        disabled={busy}
        onClick={() => act("reject")}
      >
        Reject
      </button>
      {err ? <span className="error-text">{err}</span> : null}
    </div>
  );
}
