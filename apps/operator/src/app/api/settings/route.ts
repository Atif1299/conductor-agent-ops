import { getSettings, updateSettings } from "@/lib/store";
import { error, json } from "@/lib/http";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Patch = z.object({
  bridgeHermes: z.enum(["connected", "degraded", "offline"]).optional(),
  bridgeClaudeCode: z.enum(["connected", "degraded", "offline"]).optional(),
  channel: z.enum(["telegram", "cli", "none"]).optional(),
  maxChildAgents: z.number().int().positive().optional(),
  budgetUsdPerDay: z.number().nonnegative().optional(),
  demoMode: z.boolean().optional(),
  llmProvider: z.enum(["openrouter", "openai", "none"]).optional(),
  llmModel: z.string().optional(),
  codingRoleLabel: z.string().optional(),
});

export async function GET() {
  return json({
    settings: await getSettings(),
    runtime: {
      openRouterConfigured: Boolean(process.env.OPENROUTER_API_KEY),
      gcsBucket: process.env.GCS_BUCKET || null,
      publicUrl: process.env.CONDUCTOR_PUBLIC_URL || null,
    },
  });
}

export async function PATCH(req: Request) {
  try {
    const body = Patch.parse(await req.json());
    return json({ settings: await updateSettings(body) });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Invalid settings", 400);
  }
}
