import { WorkerResultSchema } from "@conductor/contracts";
import { completeWorker } from "@/lib/store";
import { error, json } from "@/lib/http";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Body = z.object({
  result: WorkerResultSchema,
  forceNeedsHuman: z.boolean().optional(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const body = Body.parse(await req.json());
    const task = await completeWorker(id, body.result, {
      forceNeedsHuman: body.forceNeedsHuman,
    });
    return json({ task });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Complete failed", 400);
  }
}
