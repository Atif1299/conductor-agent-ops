import { resetStore } from "@/lib/store";
import { seedDemoTasks } from "@/lib/seed";
import { assertIntakeAuth, json, error } from "@/lib/http";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Body = z.object({
  runWorkerSim: z.boolean().optional(),
});

export async function POST(req: Request) {
  const authErr = assertIntakeAuth(req);
  // Allow seed without key in demo/local only when no API key configured
  if (authErr && process.env.CONDUCTOR_API_KEY) {
    // seed does not require key when CONDUCTOR_REQUIRE_KEY_FOR_SEED is not true
    if (process.env.CONDUCTOR_REQUIRE_KEY_FOR_SEED === "true") {
      return error(authErr, 401);
    }
  }
  const body = Body.safeParse(await req.json().catch(() => ({})));
  await resetStore();
  const seeded = await seedDemoTasks({
    runWorkerSim: body.success ? body.data.runWorkerSim ?? true : true,
  });
  return json({ ok: true, ...seeded });
}
