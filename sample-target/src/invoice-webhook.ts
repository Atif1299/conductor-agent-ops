/**
 * Fixed invoice webhook for scenario 01 post-fix state.
 * Applied by `npm run sim` fixtures; keeps intentional retry + logging.
 */

export type InvoiceEvent = {
  invoiceId: string;
  status: "paid" | "failed" | "pending";
  attemptHint?: number;
};

export type LogFn = (level: "info" | "error" | "warn", msg: string, meta?: Record<string, unknown>) => void;

export type ProcessResult = {
  ok: boolean;
  statusCode: number;
  attempts: number;
};

const defaultLog: LogFn = (level, msg, meta) => {
  // eslint-disable-next-line no-console
  console[level === "error" ? "error" : "log"](`[${level}] ${msg}`, meta ?? {});
};

export async function deliverToLedger(
  event: InvoiceEvent,
  attempt: number
): Promise<{ ok: boolean }> {
  if (event.invoiceId.endsWith("retry") && attempt < 3) {
    return { ok: false };
  }
  if (event.status === "failed") {
    return { ok: false };
  }
  return { ok: true };
}

export async function handleInvoiceWebhook(
  event: InvoiceEvent,
  opts?: { maxRetries?: number; log?: LogFn }
): Promise<ProcessResult> {
  const log = opts?.log ?? defaultLog;
  const maxRetries = opts?.maxRetries ?? 3;
  let lastAttempt = 0;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    lastAttempt = attempt;
    const result = await deliverToLedger(event, attempt);
    if (result.ok) {
      log("info", "webhook processed", {
        invoiceId: event.invoiceId,
        attempt,
      });
      return { ok: true, statusCode: 200, attempts: attempt };
    }
    log("error", "webhook delivery failed", {
      invoiceId: event.invoiceId,
      attempt,
    });
  }

  return { ok: false, statusCode: 500, attempts: lastAttempt };
}
