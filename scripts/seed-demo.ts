/**
 * Seed demo via direct store write (no Next server required).
 * Prefer: start `npm run dev` then POST /api/demo/seed
 * This script mirrors that for CLI portfolios / CI-ish runs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "data");
const storePath = path.join(dataDir, "store.json");

function now() {
  return new Date().toISOString();
}
function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const bugFix = {
  objective:
    "Add retry + structured logging to the invoice webhook handler and open a PR.",
  whyItMatters:
    "Failed invoice webhooks silently drop revenue events; retries and logs restore reliability and ops visibility.",
  doneCriteria: [
    "Unit tests for retry path pass",
    "Webhook returns 200 after successful processing",
    "Failed deliveries are logged with invoiceId and attempt count",
    "Does not auto-merge to main",
  ],
  boundaries: [
    "Do not touch billing database migrations",
    "Do not change payment amount calculation",
    "Do not auto-merge to main",
  ],
  returnFormat:
    "PR description + files changed + risks; confirm tests pass or show failing output",
};

const thin = {
  objective:
    "Implement a thin HTTP client for the sample FX rates endpoint with timeout and typed response.",
  whyItMatters:
    "Integration code should be isolated, testable, and fail loudly on network timeouts before it touches business logic.",
  doneCriteria: [
    "File src/rates-client.ts exists",
    "Client tests pass",
    "Timeout defaults to 3000ms and is overridable",
  ],
  boundaries: [
    "Do not add a new framework",
    "Do not hardcode production API keys",
    "Keep the client under 80 lines",
  ],
  returnFormat: "Summary + risks + file list + test output",
};

function makeTask(
  title: string,
  brief: typeof bugFix,
  opts: { scenarioId: string; source: string; highRisk: boolean }
) {
  const ts = now();
  return {
    id: id("task"),
    title,
    status: "queued" as const,
    source: opts.source,
    scenarioId: opts.scenarioId,
    brief,
    highRisk: opts.highRisk,
    requiresApproval: opts.highRisk,
    approvedAt: null,
    approvedBy: null,
    workerResult: null,
    createdAt: ts,
    updatedAt: ts,
  };
}

function aud(
  taskId: string | null,
  type: string,
  message: string,
  actor: string,
  meta?: Record<string, unknown>
) {
  return {
    id: id("aud"),
    taskId,
    type,
    message,
    actor,
    meta,
    createdAt: now(),
  };
}

const t1 = makeTask("Bugfix: invoice webhook retries & logging", bugFix, {
  scenarioId: "scenario_bugfix",
  source: "telegram",
  highRisk: true,
});
const t2 = makeTask("Research + implement: Rates API thin client", thin, {
  scenarioId: "scenario_thin_client",
  source: "cli",
  highRisk: false,
});

// Advance workers as sim does by default
t1.status = "needs_human";
t1.updatedAt = now();
t1.workerResult = {
  summary:
    "Added exponential retry (max 3) and structured attempt logging to handleInvoiceWebhook.",
  risks: [
    "Retries amplify load on outaged ledger — circuit breaker next",
    "No auto-merge; PR pending human review",
  ],
  filesChanged: ["sample-target/src/invoice-webhook.ts"],
  prDescription:
    "## Summary\n- Retry loop with maxRetries\n- Structured logs with invoiceId + attempt\n",
  testsPassed: true,
  transcript:
    "Tests first failed (no retry). Patched handleInvoiceWebhook. Re-ran tests — PASS.",
};

t2.status = "done";
t2.updatedAt = now();
t2.workerResult = {
  summary:
    "Implemented createRatesClient with default 3000ms timeout and typed RateQuote.",
  risks: ["Live endpoint not wired in unit tests"],
  filesChanged: ["sample-target/src/rates-client.ts"],
  prDescription: "## Summary\nThin rates client with timeout.\n",
  testsPassed: true,
  transcript: "Hermes research note → Claude Code implementation → tests PASS.",
};

const store = {
  version: 1 as const,
  settings: {
    bridgeHermes: "degraded",
    bridgeClaudeCode: "degraded",
    channel: "cli",
    maxChildAgents: 2,
    budgetUsdPerDay: 25,
    autoMergeMain: false,
    demoMode: true,
    llmModel: "openrouter/free",
    llmModelFallback: "openrouter/free",
    codingRoleLabel: "Claude Code path",
  },
  tasks: [t1, t2],
  audit: [
    aud(t2.id, "worker_completed", "Worker completed; Hermes verified done criteria", "hermes"),
    aud(t2.id, "worker_started", "Claude Code worker started", "claude_code"),
    aud(t2.id, "brief_issued", "Delegation brief issued by Hermes", "hermes"),
    aud(t2.id, "task_created", `Task created: ${t2.title}`, "system"),
    aud(t1.id, "approval_requested", "Human approval required (merge gate / high risk)", "hermes"),
    aud(t1.id, "worker_completed", "Worker returned result; safety gate → needs_human", "claude_code"),
    aud(t1.id, "worker_started", "Claude Code worker started", "claude_code"),
    aud(t1.id, "brief_issued", "Delegation brief issued by Hermes", "hermes"),
    aud(t1.id, "task_created", `Task created: ${t1.title}`, "system", { source: "telegram" }),
  ],
};

fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(storePath, JSON.stringify(store, null, 2));
const proofDir = path.join(root, "docs", "proof");
fs.mkdirSync(proofDir, { recursive: true });
fs.writeFileSync(
  path.join(proofDir, "audit-bugfix.json"),
  JSON.stringify(
    store.audit.filter((a) => a.taskId === t1.id),
    null,
    2
  )
);
fs.writeFileSync(
  path.join(proofDir, "audit-thin-client.json"),
  JSON.stringify(
    store.audit.filter((a) => a.taskId === t2.id),
    null,
    2
  )
);
console.log(`Seeded store → ${storePath}`);
console.log(`Proof audit files → ${proofDir}`);
console.log(`Tasks: ${t1.id} (needs_human), ${t2.id} (done)`);
