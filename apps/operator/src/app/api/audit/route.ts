import { listAudit } from "@/lib/store";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? "200");
  return json({
    audit: await listAudit(Number.isFinite(limit) ? limit : 200),
  });
}
