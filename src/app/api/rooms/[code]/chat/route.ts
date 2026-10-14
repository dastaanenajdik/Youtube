import { NextRequest, NextResponse } from "next/server";
import { addMessage } from "@/lib/room-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  if (!/^[A-Z0-9]{6,8}$/i.test(code)) return NextResponse.json({ error: "Invalid room code." }, { status: 400 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const memberId = typeof body.memberId === "string" ? body.memberId.slice(0, 80) : "";
    const room = addMessage(code, memberId, body.name, body.text);
    if (!room) return NextResponse.json({ error: "Room not found." }, { status: 404 });
    return NextResponse.json({ room }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not send message." }, { status: 400 });
  }
}
