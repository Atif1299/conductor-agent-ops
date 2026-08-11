/**
 * Scenario sim:
 * 1) Copies after-fix fixtures into sample-target/src
 * 2) Re-seeds operator store with completed audit chains
 * 3) Optionally runs sample-target tests
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sample = path.join(root, "sample-target");
const fixtures = path.join(sample, "fixtures", "after-fix");

function copy(name: string) {
  const from = path.join(fixtures, name);
  const to = path.join(sample, "src", name);
  fs.copyFileSync(from, to);
  console.log(`Applied fixture → src/${name}`);
}

copy("invoice-webhook.ts");
copy("rates-client.ts");

// Re-run seed (node direct — avoids Windows path breaks on "&" in folders)
const seed = spawnSync(
  process.execPath,
  [path.join(root, "node_modules/tsx/dist/cli.mjs"), "scripts/seed-demo.ts"],
  { cwd: root, stdio: "inherit" }
);
if (seed.status !== 0) process.exit(seed.status ?? 1);

const test = spawnSync(
  process.execPath,
  [
    "--import",
    "tsx",
    "--test",
    path.join(root, "sample-target/tests/invoice-webhook.test.ts"),
    path.join(root, "sample-target/tests/rates-client.test.ts"),
  ],
  { cwd: root, stdio: "inherit", env: { ...process.env, NODE_OPTIONS: "" } }
);

const proof = path.join(root, "docs", "proof", "scenario-sim-result.md");
fs.writeFileSync(
  proof,
  `# Scenario sim result\n\n- Fixtures applied: invoice-webhook.ts, rates-client.ts\n- Seed store: ok\n- sample-target tests exit: ${test.status}\n- Timestamp: ${new Date().toISOString()}\n`
);
console.log(`Wrote ${proof}`);
process.exit(test.status ?? 0);
