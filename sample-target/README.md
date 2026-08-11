# sample-target

Tiny coding playground for dual-stack demos.

| Scenario | Files |
|----------|--------|
| Bugfix invoice webhook | `src/invoice-webhook.ts` |
| Thin rates client | `src/rates-client.ts` |

`fixtures/after-fix/` holds the patched versions applied by `npm run sim`.

```bash
# from monorepo root
npm run test:sample
```
