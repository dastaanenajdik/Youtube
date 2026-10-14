import { NextRequest, NextResponse } from "next/server";
import { leaveRoom } from "@/lib/room-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const memberId = typeof body.memberId === "string" ? body.memberId.slice(0, 80) : "";
    const room = leaveRoom(code, memberId);
    return NextResponse.json({ room }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not leave the room." }, { status: 400 });
  }
}
