/**
 * Persistence: local file OR GCS when GCS_BUCKET is set (Cloud Run).
 * In-memory cache + GCS write retry avoids object mutation 429s.
 */
import fs from "node:fs";
import path from "node:path";
import type { StoreSnapshot } from "@conductor/contracts";

function findProjectRoot(start = process.cwd()): string {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
          name?: string;
        };
        if (pkg.name === "conductor-dual-stack") return dir;
      } catch {
        /* continue */
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(process.cwd(), "..", "..");
}

export const ROOT = findProjectRoot();
const DATA_DIR = path.join(ROOT, "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");
const TMP_STORE = path.join("/tmp", "conductor-store.json");

let memoryCache: StoreSnapshot | null = null;
let writeChain: Promise<void> = Promise.resolve();

export function localStorePath(): string {
  if (process.env.GCS_BUCKET) {
    return process.env.STORE_LOCAL_PATH || TMP_STORE;
  }
  return STORE_PATH;
}

let gcsClient: import("@google-cloud/storage").Storage | null = null;

async function getBucket() {
  const name = process.env.GCS_BUCKET;
  if (!name) return null;
  if (!gcsClient) {
    const { Storage } = await import("@google-cloud/storage");
    gcsClient = new Storage();
  }
  return gcsClient.bucket(name);
}

function ensureLocalDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function getMemoryCache(): StoreSnapshot | null {
  return memoryCache;
}

export function setMemoryCache(store: StoreSnapshot): void {
  memoryCache = store;
}

export function clearMemoryCache(): void {
  memoryCache = null;
}

export async function loadRawStore(): Promise<string | null> {
  const bucket = await getBucket();
  if (bucket) {
    const object = process.env.GCS_OBJECT || "store.json";
    const file = bucket.file(object);
    const [exists] = await file.exists();
    if (!exists) return null;
    const [buf] = await file.download();
    return buf.toString("utf8");
  }
  const p = localStorePath();
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, "utf8");
}

async function saveGcsWithRetry(json: string): Promise<void> {
  const bucket = await getBucket();
  if (!bucket) return;
  const object = process.env.GCS_OBJECT || "store.json";
  const file = bucket.file(object);
  let lastErr: unknown;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      await file.save(json, {
        contentType: "application/json",
        resumable: false,
      });
      return;
    } catch (e) {
      lastErr = e;
      const code = (e as { code?: number })?.code;
      if (code === 429 || code === 503) {
        await sleep(200 * Math.pow(2, attempt));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

export async function saveRawStore(json: string): Promise<void> {
  const p = localStorePath();
  ensureLocalDir(p);
  fs.writeFileSync(p, json, "utf8");
  await saveGcsWithRetry(json);
}

/** Serialize writes so concurrent API handlers don't hammer GCS. */
export async function persistSnapshot(store: StoreSnapshot): Promise<void> {
  memoryCache = store;
  const json = JSON.stringify(store, null, 2);
  writeChain = writeChain.then(async () => {
    await saveRawStore(json);
  });
  await writeChain;
}

export { STORE_PATH, DATA_DIR };
