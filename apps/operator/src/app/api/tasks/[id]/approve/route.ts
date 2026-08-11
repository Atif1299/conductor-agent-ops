import { approveTask, rejectApproval } from "@/lib/store";
import { error, json } from "@/lib/http";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Body = z.object({
  action: z.enum(["approve", "reject"]),
  by: z.string().optional(),
  reason: z.string().optional(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const body = Body.parse(await req.json());
    if (body.action === "approve") {
      return json({ task: await approveTask(id, body.by ?? "operator") });
    }
    return json({
      task: await rejectApproval(
        id,
        body.reason ?? "Rejected",
        body.by ?? "operator"
      ),
    });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Approval failed", 400);
  }
}
