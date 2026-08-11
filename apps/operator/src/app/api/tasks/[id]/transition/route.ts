import { TaskStatusSchema } from "@conductor/contracts";
import { transitionTask } from "@/lib/store";
import { error, json } from "@/lib/http";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Body = z.object({
  status: TaskStatusSchema,
  actor: z.enum(["hermes", "claude_code", "human", "system"]).optional(),
  message: z.string().optional(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const body = Body.parse(await req.json());
    const task = await transitionTask(
      id,
      body.status,
      body.actor ?? "system",
      body.message
    );
    return json({ task });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Transition failed", 400);
  }
}
