import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { handleInvoiceWebhook, type LogFn } from "../src/invoice-webhook.ts";

describe("handleInvoiceWebhook", () => {
  it("returns 200 for a successful paid invoice", async () => {
    const logs: Array<{ level: string; msg: string; meta?: Record<string, unknown> }> = [];
    const log: LogFn = (level, msg, meta) => {
      logs.push({ level, msg, meta });
    };

    const result = await handleInvoiceWebhook(
      { invoiceId: "inv_ok", status: "paid" },
      { maxRetries: 3, log }
    );

    assert.equal(result.ok, true);
    assert.equal(result.statusCode, 200);
  });

  it("retries flaky deliveries and logs attempt count", async () => {
    const logs: Array<{ level: string; meta?: Record<string, unknown> }> = [];
    const log: LogFn = (level, _msg, meta) => {
      logs.push({ level, meta });
    };

    const result = await handleInvoiceWebhook(
      { invoiceId: "inv_needs_retry", status: "paid" },
      { maxRetries: 3, log }
    );

    assert.equal(result.ok, true, "should succeed after retries");
    assert.equal(result.statusCode, 200);
    assert.ok(result.attempts >= 3, "should attempt until success");
    const withAttempts = logs.filter((l) => typeof l.meta?.attempt === "number");
    assert.ok(withAttempts.length >= 1, "must log attempt numbers");
  });
});
