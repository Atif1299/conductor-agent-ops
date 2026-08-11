import {
  ALLOWED_TRANSITIONS,
  type AuditEvent,
  type DelegationBrief,
  type Settings,
  type StoreSnapshot,
  type Task,
  type TaskStatus,
  type WorkerResult,
  canTransition,
  newId,
} from "@conductor/contracts";
import { loadRawStore, persistSnapshot, setMemoryCache, getMemoryCache, clearMemoryCache, DATA_DIR, STORE_PATH } from "./persistence";

function now(): string {
  return new Date().toISOString();
}

function defaultSettings(): Settings {
  return {
    bridgeHermes: "degraded",
    bridgeClaudeCode: "degraded",
    channel: "cli",
    maxChildAgents: 2,
    budgetUsdPerDay: Number(process.env.BUDGET_USD_PER_DAY || 25),
    autoMergeMain: false,
    demoMode: process.env.DEMO_MODE !== "false",
    llmProvider: (process.env.LLM_PROVIDER as Settings["llmProvider"]) || "openrouter",
    llmModel:
      process.env.OPENROUTER_MODEL ||
      process.env.LLM_MODEL ||
      "openrouter/free",
    llmModelFallback:
      process.env.OPENROUTER_FALLBACK_MODEL ||
      process.env.LLM_MODEL_FALLBACK ||
      "openrouter/free",
    codingRoleLabel: process.env.CODING_ROLE_LABEL || "Claude Code path",
  };
}

function emptyStore(): StoreSnapshot {
  return {
    version: 1,
    settings: defaultSettings(),
    tasks: [],
    audit: [],
  };
}

function mergeSettings(raw: Settings): Settings {
  const envDefaults = defaultSettings();
  return {
    ...envDefaults,
    ...raw,
    // Env wins for provider/model (Cloud Run free model cutover)
    llmProvider: envDefaults.llmProvider,
    llmModel: envDefaults.llmModel,
    llmModelFallback: envDefaults.llmModelFallback,
    autoMergeMain: false,
  };
}

export async function readStore(): Promise<StoreSnapshot> {
  const cached = getMemoryCache();
  if (cached) return cached;
  const raw = await loadRawStore();
  if (!raw) {
    const empty = emptyStore();
    await writeStore(empty);
    return empty;
  }
  const parsed = JSON.parse(raw) as StoreSnapshot;
  parsed.settings = mergeSettings(parsed.settings);
  setMemoryCache(parsed);
  return parsed;
}

export async function writeStore(store: StoreSnapshot): Promise<void> {
  store.settings = { ...store.settings, autoMergeMain: false };
  await persistSnapshot(store);
}

function pushAudit(
  store: StoreSnapshot,
  partial: Omit<AuditEvent, "id" | "createdAt">
): AuditEvent {
  const event: AuditEvent = {
    id: newId("aud"),
    createdAt: now(),
    ...partial,
  };
  store.audit.unshift(event);
  return event;
}

export async function listTasks(): Promise<Task[]> {
  const store = await readStore();
  return store.tasks.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getTask(id: string): Promise<Task | undefined> {
  return (await readStore()).tasks.find((t) => t.id === id);
}

export async function listAudit(limit = 200): Promise<AuditEvent[]> {
  return (await readStore()).audit.slice(0, limit);
}

export async function getSettings(): Promise<Settings> {
  return (await readStore()).settings;
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  const store = await readStore();
  store.settings = mergeSettings({ ...store.settings, ...patch, autoMergeMain: false });
  await writeStore(store);
  return store.settings;
}

export type CreateTaskInput = {
  title: string;
  brief: DelegationBrief;
  source?: Task["source"];
  scenarioId?: string;
  highRisk?: boolean;
  requiresApproval?: boolean;
};

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const store = await readStore();
  const ts = now();
  const task: Task = {
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
  store.tasks.unshift(task);
  pushAudit(store, {
    taskId: task.id,
    type: "task_created",
    message: `Task created: ${task.title}`,
    actor: "system",
    meta: { source: task.source },
  });
  pushAudit(store, {
    taskId: task.id,
    type: "brief_issued",
    message: "Delegation brief issued by Hermes",
    actor: "hermes",
    meta: { objective: task.brief.objective },
  });
  await writeStore(store);
  return task;
}

export async function transitionTask(
  id: string,
  to: TaskStatus,
  actor: AuditEvent["actor"] = "system",
  message?: string
): Promise<Task> {
  const store = await readStore();
  const task = store.tasks.find((t) => t.id === id);
  if (!task) throw new Error(`Task not found: ${id}`);
  if (!canTransition(task.status, to)) {
    throw new Error(`Invalid transition ${task.status} → ${to}`);
  }
  if (
    to === "done" &&
    task.requiresApproval &&
    !task.approvedAt &&
    store.settings.autoMergeMain === false
  ) {
    pushAudit(store, {
      taskId: task.id,
      type: "gate_blocked",
      message: "Done blocked: human approval required (no auto-merge to main)",
      actor: "system",
    });
    await writeStore(store);
    throw new Error("Human approval required before done");
  }
  const from = task.status;
  task.status = to;
  task.updatedAt = now();
  pushAudit(store, {
    taskId: task.id,
    type: "status_changed",
    message: message ?? `Status ${from} → ${to}`,
    actor,
    meta: { from, to },
  });
  await writeStore(store);
  return task;
}

export async function startWorker(id: string): Promise<Task> {
  const store = await readStore();
  const task = store.tasks.find((t) => t.id === id);
  if (!task) throw new Error(`Task not found: ${id}`);
  if (!canTransition(task.status, "working")) {
    throw new Error(`Cannot start worker from ${task.status}`);
  }
  task.status = "working";
  task.updatedAt = now();
  pushAudit(store, {
    taskId: task.id,
    type: "worker_started",
    message: "Claude Code path worker started against sample-target (OpenRouter-backed when live)",
    actor: "claude_code",
  });
  await writeStore(store);
  return task;
}

export async function completeWorker(
  id: string,
  result: WorkerResult,
  opts?: { forceNeedsHuman?: boolean }
): Promise<Task> {
  const store = await readStore();
  const task = store.tasks.find((t) => t.id === id);
  if (!task) throw new Error(`Task not found: ${id}`);
  if (task.status !== "working") {
    throw new Error(`Worker complete only from working (got ${task.status})`);
  }
  task.workerResult = result;
  task.updatedAt = now();
  const needsGate =
    opts?.forceNeedsHuman ||
    task.requiresApproval ||
    task.highRisk ||
    result.testsPassed === false;
  if (needsGate) {
    task.status = "needs_human";
    pushAudit(store, {
      taskId: task.id,
      type: "worker_completed",
      message: "Worker returned result; safety gate → needs_human",
      actor: "claude_code",
      meta: { files: result.filesChanged },
    });
    pushAudit(store, {
      taskId: task.id,
      type: "approval_requested",
      message: "Human approval required (merge gate / high risk)",
      actor: "hermes",
    });
  } else {
    task.status = "done";
    pushAudit(store, {
      taskId: task.id,
      type: "worker_completed",
      message: "Worker completed; Hermes verified done criteria",
      actor: "hermes",
      meta: { files: result.filesChanged },
    });
  }
  await writeStore(store);
  return task;
}

export async function failWorker(id: string, reason: string): Promise<Task> {
  const store = await readStore();
  const task = store.tasks.find((t) => t.id === id);
  if (!task) throw new Error(`Task not found: ${id}`);
  task.status = "failed";
  task.updatedAt = now();
  pushAudit(store, {
    taskId: task.id,
    type: "worker_failed",
    message: reason,
    actor: "claude_code",
  });
  await writeStore(store);
  return task;
}

export async function approveTask(id: string, by = "operator"): Promise<Task> {
  const store = await readStore();
  const task = store.tasks.find((t) => t.id === id);
  if (!task) throw new Error(`Task not found: ${id}`);
  if (task.status !== "needs_human") {
    throw new Error("Only needs_human tasks can be approved");
  }
  task.approvedAt = now();
  task.approvedBy = by;
  task.status = "done";
  task.updatedAt = now();
  pushAudit(store, {
    taskId: task.id,
    type: "approval_granted",
    message: `Approved by ${by} — still no auto-merge to main`,
    actor: "human",
  });
  await writeStore(store);
  return task;
}

export async function rejectApproval(
  id: string,
  reason: string,
  by = "operator"
): Promise<Task> {
  const store = await readStore();
  const task = store.tasks.find((t) => t.id === id);
  if (!task) throw new Error(`Task not found: ${id}`);
  if (task.status !== "needs_human") {
    throw new Error("Only needs_human tasks can be rejected");
  }
  task.status = "failed";
  task.updatedAt = now();
  pushAudit(store, {
    taskId: task.id,
    type: "approval_rejected",
    message: `Rejected by ${by}: ${reason}`,
    actor: "human",
  });
  await writeStore(store);
  return task;
}

export async function resetStore(): Promise<StoreSnapshot> {
  clearMemoryCache();
  const empty = emptyStore();
  await writeStore(empty);
  return empty;
}

export async function overview() {
  const store = await readStore();
  const byStatus = Object.fromEntries(
    (["queued", "working", "needs_human", "done", "failed"] as TaskStatus[]).map(
      (s) => [s, store.tasks.filter((t) => t.status === s).length]
    )
  );
  const lastDone = store.tasks.find((t) => t.status === "done");
  const lastFailed = store.tasks.find((t) => t.status === "failed");
  return {
    settings: store.settings,
    counts: byStatus,
    total: store.tasks.length,
    auditCount: store.audit.length,
    lastDoneAt: lastDone?.updatedAt ?? null,
    lastFailedAt: lastFailed?.updatedAt ?? null,
    allowedTransitions: ALLOWED_TRANSITIONS,
    provider: {
      llmProvider: store.settings.llmProvider,
      llmModel: store.settings.llmModel,
      llmModelFallback: store.settings.llmModelFallback,
      codingRoleLabel: store.settings.codingRoleLabel,
      openRouterConfigured: Boolean(process.env.OPENROUTER_API_KEY),
      gcsBucket: process.env.GCS_BUCKET || null,
    },
  };
}

export { STORE_PATH, DATA_DIR };
