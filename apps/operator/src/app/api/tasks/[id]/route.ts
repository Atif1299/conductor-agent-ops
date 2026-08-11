import { getTask } from "@/lib/store";
import { error, json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const task = await getTask(id);
  if (!task) return error("Not found", 404);
  return json({ task });
}
