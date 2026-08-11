import { listTasks } from "@/lib/store";
import { createTask, startWorker, completeWorker, failWorker } from "@/lib/store";
import { assertIntakeAuth, error, json } from "@/lib/http";
import { DelegationBriefSchema } from "@conductor/contracts";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Body = z.object({
  message: z.string().min(1),
  source: z.enum(["telegram", "cli", "cron", "sim", "manual"]).default("cli"),
  title: z.string().optional(),
  brief: DelegationBriefSchema.optional(),
  highRisk: z.boolean().optional(),
  simWorker: z.boolean().optional(),
  simFailFirst: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const authErr = assertIntakeAuth(req);
    if (authErr) return error(authErr, 401);

    const body = Body.parse(await req.json());
    const title =
      body.title ??
      (body.message.length > 72 ? `${body.message.slice(0, 69)}…` : body.message);

    const brief =
      body.brief ??
      ({
        objective: body.message,
        whyItMatters: "Operator intake via channel — Hermes owns memory and routing.",
        doneCriteria: [
          "Worker returns summary + file list",
          "Tests documented pass or fail honestly",
        ],
        boundaries: [
          "Do not auto-merge to main",
          "Stay inside sample-target unless instructed",
        ],
        returnFormat: "Summary + risks + PR description",
      } as const);

    const task = await createTask({
      title,
      brief,
      source: body.source,
      highRisk: body.highRisk ?? false,
      requiresApproval: body.highRisk ?? false,
    });

    if (body.simWorker) {
      await startWorker(task.id);
      if (body.simFailFirst) {
        await failWorker(task.id, "Simulated test failure on first worker pass");
        const retried = await createTask({
          title: `${title} (retry)`,
          brief,
          source: body.source,
          highRisk: body.highRisk ?? false,
          requiresApproval: body.highRisk ?? false,
        });
        await startWorker(retried.id);
        await completeWorker(retried.id, {
          summary: "Retried after failed tests; patch applied.",
          risks: ["Original failure was in retry loop"],
          filesChanged: ["sample-target/src/invoice-webhook.ts"],
          testsPassed: true,
          prDescription: "Fix after failed test run",
        });
        return json({ task: retried, note: "Failed once then recovered (demo)" });
      }
      await completeWorker(task.id, {
        summary: "Sim worker completed intake job.",
        risks: [],
        filesChanged: [],
        testsPassed: true,
        prDescription: "Simulated PR",
      });
      const tasks = await listTasks();
      return json({ task: tasks.find((t) => t.id === task.id) });
    }

    return json({ task }, 201);
  } catch (e) {
    return error(e instanceof Error ? e.message : "Intake failed", 400);
  }
}
