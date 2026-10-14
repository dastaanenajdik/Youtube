import { NextRequest, NextResponse } from "next/server";
import { controlRoom, type RoomAction } from "@/lib/room-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const actions: RoomAction[] = ["play", "pause", "seek", "video"];

export async function POST(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  if (!/^[A-Z0-9]{6,8}$/i.test(code)) return NextResponse.json({ error: "Invalid room code." }, { status: 400 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.action !== "string" || !actions.includes(body.action as RoomAction)) {
      return NextResponse.json({ error: "Unsupported room action." }, { status: 400 });
    }
    const room = controlRoom(code, {
      action: body.action as RoomAction,
      video: body.video,
      positionSeconds: body.positionSeconds,
    });
    if (!room) return NextResponse.json({ error: "Room or video not found." }, { status: 404 });
    return NextResponse.json({ room }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not update room playback." }, { status: 400 });
  }
}
