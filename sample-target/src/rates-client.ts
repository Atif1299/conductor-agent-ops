/**
 * Fixed rates client for scenario 02 post-implement state.
 */

export type RateQuote = {
  base: string;
  quote: string;
  rate: number;
  asOf: string;
};

export type RatesClientOptions = {
  baseUrl: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

export function createRatesClient(opts: RatesClientOptions) {
  const timeoutMs = opts.timeoutMs ?? 3000;
  const fetchImpl = opts.fetchImpl ?? fetch;
  const baseUrl = opts.baseUrl.replace(/\/$/, "");

  return {
    timeoutMs,
    async getRate(base: string, quote: string): Promise<RateQuote> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetchImpl(
          `${baseUrl}?base=${encodeURIComponent(base)}&quote=${encodeURIComponent(quote)}`,
          { signal: controller.signal }
        );
        if (!res.ok) {
          throw new Error(`Rates API HTTP ${res.status}`);
        }
        const data = (await res.json()) as RateQuote;
        return data;
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
