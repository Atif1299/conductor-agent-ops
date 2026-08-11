"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiPost } from "@/lib/client";

export function SeedDemoButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setErr(null);
    try {
      await apiPost("/api/demo/seed", { runWorkerSim: true });
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Seed failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inline-actions">
      <button type="button" className="btn primary" onClick={run} disabled={busy}>
        {busy ? "Loading…" : "Load sample board"}
      </button>
      {err ? <span className="error-text">{err}</span> : null}
    </div>
  );
}
