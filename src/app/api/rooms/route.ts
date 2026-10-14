import { NextRequest, NextResponse } from "next/server";
import { createRoom } from "@/lib/room-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const memberId = typeof body.memberId === "string" ? body.memberId.trim() : "";
    if (!memberId || memberId.length > 80) return NextResponse.json({ error: "A member id is required." }, { status: 400 });
    const result = createRoom({
      memberId,
      name: body.name,
      video: body.video,
      isPlaying: body.isPlaying === true,
      positionSeconds: body.positionSeconds,
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not create the watch party." }, { status: 400 });
  }
}
