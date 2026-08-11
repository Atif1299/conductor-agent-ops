import { NextResponse } from "next/server";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Protect intake (and optionally demo seed) when CONDUCTOR_API_KEY is set. */
export function assertIntakeAuth(req: Request): string | null {
  const expected = process.env.CONDUCTOR_API_KEY;
  if (!expected) return null;
  const got =
    req.headers.get("x-conductor-key") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (got !== expected) return "Unauthorized: missing or invalid X-Conductor-Key";
  return null;
}
