import { startWorker } from "@/lib/store";
import { error, json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const task = await startWorker(id);
    return json({ task });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Start failed", 400);
  }
}
