import { overview } from "@/lib/store";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return json(await overview());
}
