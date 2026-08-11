import type { DelegationBrief, StoreSnapshot, Task } from "@conductor/contracts";
import { newId } from "@conductor/contracts";
import { readStore, writeStore, type CreateTaskInput } from "./store";

const bugFixBrief: DelegationBrief = {
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

const thinClientBrief: DelegationBrief = {
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

function now() {
  return new Date().toISOString();
}

function makeTask(input: CreateTaskInput): Task {
  const ts = now();
  return {
    id: newId("task"),
    title: input.title,
    status: "queued",
    source: input.source ?? "manual",
    scenarioId: input.scenarioId,
    brief: input.brief,
    highRisk: input.highRisk ?? false,
    requiresApproval: input.requiresApproval ?? input.highRisk ?? false,
    approvedAt: null,
    approvedBy: null,
    workerResult: null,
    createdAt: ts,
    updatedAt: ts,
  };
}

function push(
  store: StoreSnapshot,
  taskId: string | null,
  type: string,
  message: string,
  actor: "hermes" | "claude_code" | "human" | "system",
  meta?: Record<string, unknown>
) {
  store.audit.unshift({
    id: newId("aud"),
    taskId,
    type: type as never,
    message,
    actor,
    meta,
    createdAt: now(),
  });
}

/** One read + one write: avoids GCS mutation rate limits during seed. */
export async function seedDemoTasks(options?: { runWorkerSim?: boolean }) {
  const runWorker = options?.runWorkerSim ?? false;
  const store = await readStore();
  store.tasks = [];
  store.audit = [];

  const t1 = makeTask({
    title: "Bugfix: invoice webhook retries & logging",
    brief: bugFixBrief,
    source: "telegram",
    scenarioId: "scenario_bugfix",
    highRisk: true,
    requiresApproval: true,
  });
  const t2 = makeTask({
    title: "Research + implement: Rates API thin client",
    brief: thinClientBrief,
    source: "cli",
    scenarioId: "scenario_thin_client",
    highRisk: false,
    requiresApproval: false,
  });

  push(store, t1.id, "task_created", `Task created: ${t1.title}`, "system", {
    source: t1.source,
  });
  push(store, t1.id, "brief_issued", "Delegation brief issued by Hermes", "hermes");
  push(store, t2.id, "task_created", `Task created: ${t2.title}`, "system");
  push(store, t2.id, "brief_issued", "Delegation brief issued by Hermes", "hermes");

  if (runWorker) {
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
      prDescription: "## Summary\n- Retry loop\n- Structured attempt logs\n",
      testsPassed: true,
      transcript: "Tests failed then passed after patch (OpenRouter-backed path when live).",
    };
    push(store, t1.id, "worker_started", "Claude Code path worker started", "claude_code");
    push(
      store,
      t1.id,
      "worker_completed",
      "Worker returned result; safety gate → needs_human",
      "claude_code"
    );
    push(
      store,
      t1.id,
      "approval_requested",
      "Human approval required (merge gate / high risk)",
      "hermes"
    );

    t2.status = "done";
    t2.updatedAt = now();
    t2.workerResult = {
      summary:
        "Implemented createRatesClient with default 3000ms timeout and typed RateQuote.",
      risks: ["Live endpoint not wired in unit tests"],
      filesChanged: ["sample-target/src/rates-client.ts"],
      prDescription: "## Summary\nThin rates client.\n",
      testsPassed: true,
      transcript: "Hermes research → coding path → tests PASS.",
    };
    push(store, t2.id, "worker_started", "Claude Code path worker started", "claude_code");
    push(
      store,
      t2.id,
      "worker_completed",
      "Worker completed; Hermes verified done criteria",
      "hermes"
    );
  }

  store.tasks = [t1, t2];
  await writeStore(store);
  return { tasks: [t1, t2] };
}
