import { z } from "zod";

/** Task lifecycle — Hermes plans, Claude Code executes, humans approve risk. */
export const TaskStatusSchema = z.enum([
  "queued",
  "working",
  "needs_human",
  "done",
  "failed",
]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const TASK_STATUSES: TaskStatus[] = [
  "queued",
  "working",
  "needs_human",
  "done",
  "failed",
];

/** Valid transitions for the control-plane status machine. */
export const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  queued: ["working", "failed"],
  working: ["needs_human", "done", "failed"],
  needs_human: ["working", "done", "failed"],
  done: [],
  failed: ["queued"],
};

export const DelegationBriefSchema = z.object({
  objective: z.string().min(1),
  whyItMatters: z.string().min(1),
  doneCriteria: z.array(z.string().min(1)).min(1),
  boundaries: z.array(z.string().min(1)).min(1),
  returnFormat: z.string().min(1),
});
export type DelegationBrief = z.infer<typeof DelegationBriefSchema>;

export const WorkerResultSchema = z.object({
  summary: z.string(),
  risks: z.array(z.string()).default([]),
  filesChanged: z.array(z.string()).default([]),
  prDescription: z.string().optional(),
  testsPassed: z.boolean().optional(),
  transcript: z.string().optional(),
});
export type WorkerResult = z.infer<typeof WorkerResultSchema>;

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: TaskStatusSchema,
  source: z.enum(["telegram", "cli", "cron", "sim", "manual"]).default("manual"),
  scenarioId: z.string().optional(),
  brief: DelegationBriefSchema,
  highRisk: z.boolean().default(false),
  requiresApproval: z.boolean().default(false),
  approvedAt: z.string().nullable().optional(),
  approvedBy: z.string().nullable().optional(),
  workerResult: WorkerResultSchema.nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Task = z.infer<typeof TaskSchema>;

export const AuditEventTypeSchema = z.enum([
  "task_created",
  "status_changed",
  "brief_issued",
  "worker_started",
  "worker_completed",
  "worker_failed",
  "approval_requested",
  "approval_granted",
  "approval_rejected",
  "gate_blocked",
  "system_note",
]);
export type AuditEventType = z.infer<typeof AuditEventTypeSchema>;

export const AuditEventSchema = z.object({
  id: z.string(),
  taskId: z.string().nullable(),
  type: AuditEventTypeSchema,
  message: z.string(),
  actor: z.enum(["hermes", "claude_code", "human", "system"]),
  meta: z.record(z.unknown()).optional(),
  createdAt: z.string(),
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;

export const SettingsSchema = z.object({
  bridgeHermes: z.enum(["connected", "degraded", "offline"]).default("degraded"),
  bridgeClaudeCode: z.enum(["connected", "degraded", "offline"]).default("degraded"),
  channel: z.enum(["telegram", "cli", "none"]).default("cli"),
  maxChildAgents: z.number().int().positive().default(2),
  budgetUsdPerDay: z.number().nonnegative().default(25),
  autoMergeMain: z.literal(false).default(false),
  demoMode: z.boolean().default(true),
  /** Runtime LLM provider — hermes/coding path use this (OpenRouter recommended). */
  llmProvider: z.enum(["openrouter", "openai", "none"]).default("openrouter"),
  /** OpenRouter model slug for orchestrator / coding agent roles. */
  llmModel: z.string().default("openrouter/free"),
  /** Fallback free router if primary free route fails. */
  llmModelFallback: z.string().default("openrouter/free"),
  /** UI label for coding role (architecture name; provider is llmProvider). */
  codingRoleLabel: z.string().default("Claude Code path"),
});
export type Settings = z.infer<typeof SettingsSchema>;

export const StoreSnapshotSchema = z.object({
  version: z.literal(1),
  settings: SettingsSchema,
  tasks: z.array(TaskSchema),
  audit: z.array(AuditEventSchema),
});
export type StoreSnapshot = z.infer<typeof StoreSnapshotSchema>;

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
