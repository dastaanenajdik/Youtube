"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Headphones, Link2, Radio, Users, Video } from "lucide-react";
import { useApp } from "@/components/Providers";

export default function RoomsPage() {
  const router = useRouter();
  const { createRoom, joinRoom, roomSession, roomSnapshot, roomBusy } = useApp();
  const [name, setName] = useState("You");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  const start = async () => {
    setError("");
    try {
      const roomCode = await createRoom(name.trim() || "You");
      router.push(`/rooms/${roomCode}`);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Room creation failed.");
    }
  };

  const submitJoin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setJoining(true);
    setError("");
    try {
      await joinRoom(code, name.trim() || "Guest");
      const safeCode = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
      router.push(`/rooms/${safeCode}`);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Could not join this room.");
    } finally {
      setJoining(false);
    }
  };

  return <div className="rooms-home-page">
    <div className="rooms-hero glass-panel">
      <div className="rooms-hero-copy"><span className="hero-kicker"><Radio size={14} /> WATCH TOGETHER</span><h1>Same video.<br /><span>Same moment.</span></h1><p>Start a private room or join a friend. Playback stays in sync while you chat.</p><div className="room-feature-list"><span><Users size={16} /> Up to 30 listeners</span><span><Headphones size={16} /> Shared play & seek</span><span><Link2 size={16} /> Invite with a code</span></div></div>
      <div className="rooms-visual" aria-hidden="true"><div className="room-orbit orbit-one" /><div className="room-orbit orbit-two" /><div className="room-friends"><span>A</span><span>J</span><span>M</span><span>+</span></div><div className="room-visual-card"><Video size={28} /><div><strong>Watch party</strong><small>syncing in real time</small></div><i /></div></div>
    </div>
    <div className="room-join-grid">
      <section className="room-action-card glass-panel"><div className="room-action-icon pink"><Video size={21} /></div><span className="eyebrow">Host a room</span><h2>Start watching together</h2><p>Invite a friend with a short room code. Your current video can be shared with the room.</p><label className="field-label">Your display name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={24} placeholder="Your name" /></label><button className="button-primary full-width" onClick={start} disabled={roomBusy}>{roomBusy ? "Creating room…" : "Create a room"}<ArrowRight size={16} /></button></section>
      <section className="room-action-card glass-panel"><div className="room-action-icon blue"><Link2 size={21} /></div><span className="eyebrow">Have an invite?</span><h2>Join a friend&apos;s room</h2><p>Enter the six-character code from your invite link. You&apos;ll sync to the host&apos;s video.</p><form onSubmit={submitJoin}><label className="field-label">Room code<input value={code} onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))} placeholder="ABC123" maxLength={8} autoCapitalize="characters" /></label><button className="button-soft full-width" disabled={joining || !code.trim()}>{joining ? "Joining…" : "Join room"}<ArrowRight size={16} /></button></form></section>
    </div>
    {roomSession && roomSnapshot && <button className="current-room-card glass-panel" onClick={() => router.push(`/rooms/${roomSession.code}`)}><span className="room-live-dot" /><span><strong>You&apos;re already in {roomSnapshot.name}</strong><small>{roomSnapshot.members.length} people here · Code {roomSnapshot.code}</small></span><ArrowRight size={18} /></button>}
    {error && <div className="inline-warning room-error">{error}</div>}
    <p className="room-fineprint">Room syncing uses an ephemeral demo server. YouTube controls ads and video availability inside the embedded player.</p>
  </div>;
}
