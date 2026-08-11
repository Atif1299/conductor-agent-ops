import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createRatesClient } from "../src/rates-client.ts";

describe("createRatesClient", () => {
  it("defaults timeout to 3000ms and returns typed quote", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchImpl = async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      return new Response(
        JSON.stringify({
          base: "USD",
          quote: "EUR",
          rate: 0.92,
          asOf: "2026-08-11T00:00:00.000Z",
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    };

    const client = createRatesClient({
      baseUrl: "https://example.test/rates",
      fetchImpl: fetchImpl as typeof fetch,
    });

    const quote = await client.getRate("USD", "EUR");
    assert.equal(quote.base, "USD");
    assert.equal(quote.quote, "EUR");
    assert.equal(quote.rate, 0.92);
    assert.equal(client.timeoutMs, 3000);
  });
});
