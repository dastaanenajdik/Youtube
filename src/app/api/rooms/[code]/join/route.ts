import { NextRequest, NextResponse } from "next/server";
import { joinRoom } from "@/lib/room-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  if (!/^[A-Z0-9]{6,8}$/i.test(code)) return NextResponse.json({ error: "Invalid room code." }, { status: 400 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const memberId = typeof body.memberId === "string" ? body.memberId.trim() : "";
    if (!memberId || memberId.length > 80) return NextResponse.json({ error: "A member id is required." }, { status: 400 });
    const room = joinRoom(code, memberId, body.name);
    if (!room) return NextResponse.json({ error: "Room not found or full." }, { status: 404 });
    return NextResponse.json({ room }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not join this room." }, { status: 400 });
  }
}
