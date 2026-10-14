import { NextRequest, NextResponse } from "next/server";
import { findRoom } from "@/lib/room-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  if (!/^[A-Z0-9]{6,8}$/i.test(code)) return NextResponse.json({ error: "Invalid room code." }, { status: 400 });
  const room = findRoom(code, request.nextUrl.searchParams.get("memberId") ?? undefined);
  if (!room) return NextResponse.json({ error: "This room has ended or the code is incorrect." }, { status: 404 });
  return NextResponse.json({ room }, { headers: { "Cache-Control": "no-store" } });
}
