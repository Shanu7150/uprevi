import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Liveness + DB connectivity check for monitoring/uptime probes. */
export async function GET() {
  const startedAt = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      db: "up",
      latencyMs: Date.now() - startedAt,
      time: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[health] db check failed:", err);
    return NextResponse.json(
      { status: "degraded", db: "down", time: new Date().toISOString() },
      { status: 503 },
    );
  }
}
