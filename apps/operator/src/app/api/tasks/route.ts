import { DelegationBriefSchema } from "@conductor/contracts";
import { createTask, listTasks } from "@/lib/store";
import { error, json } from "@/lib/http";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CreateBody = z.object({
  title: z.string().min(1),
  brief: DelegationBriefSchema,
  source: z.enum(["telegram", "cli", "cron", "sim", "manual"]).optional(),
  scenarioId: z.string().optional(),
  highRisk: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
});

export async function GET() {
  return json({ tasks: await listTasks() });
}

export async function POST(req: Request) {
  try {
    const body = CreateBody.parse(await req.json());
    const task = await createTask(body);
    return json({ task }, 201);
  } catch (e) {
    return error(e instanceof Error ? e.message : "Invalid body", 400);
  }
}
