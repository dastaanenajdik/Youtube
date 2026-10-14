"use client";

import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Copy, LogOut, MessageCircle, Radio, Send, Users } from "lucide-react";
import { useApp, PlayerMount } from "./Providers";
import PlayerControls from "./PlayerControls";
import { timeAgo } from "@/lib/format";
import type { RoomMessage } from "@/lib/types";

function RoomExperience() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = String(params.code ?? "").toUpperCase();
  const { hydrated, roomSession, roomSnapshot, roomBusy, joinRoom, leaveRoom, sendRoomMessage, currentVideo, playerReady, isPlaying, togglePlayback, pushNotice } = useApp();
  const name = roomSession?.name ?? "Guest";
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hydrated || !code) return;
    if (roomSession?.code === code && roomSnapshot?.code === code) return;
    setError("");
    joinRoom(code, roomSession?.code === code ? roomSession.name : name).catch((problem: unknown) => setError(problem instanceof Error ? problem.message : "Could not join this room."));
  }, [hydrated, code, roomSession, roomSnapshot, joinRoom, name]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [roomSnapshot?.messages.length]);

  const submitMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.trim()) return;
    await sendRoomMessage(message);
    setMessage("");
  };

  const copyInvite = async () => {
    const invite = `${window.location.origin}/rooms/${code}`;
    try {
      await navigator.clipboard.writeText(invite);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      pushNotice(invite);
    }
  };

  const exitRoom = async () => {
    await leaveRoom();
    router.push("/rooms");
  };

  if (error && !roomSnapshot) return <div className="empty-state room-not-found"><div className="empty-state-icon"><Radio size={24} /></div><strong>Couldn&apos;t join this room</strong><span>{error}</span><button className="button-primary" onClick={() => router.push("/rooms")}><ArrowLeft size={16} /> Back to Watch together</button></div>;

  return <div className="room-page">
    <div className="room-page-header"><button className="back-link" onClick={() => router.push("/rooms")}><ArrowLeft size={16} /> Watch together</button><div className="room-header-actions"><span className="room-code-pill"><i /> {code}</span><button className="button-soft" onClick={copyInvite}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Copied" : "Invite"}</button><button className="icon-button" title="Leave room" aria-label="Leave room" onClick={exitRoom}><LogOut size={17} /></button></div></div>
    <div className="room-title-row"><div><span className="hero-kicker"><i className="room-live-dot" /> LIVE ROOM</span><h1>{roomSnapshot?.name ?? "Joining watch party…"}</h1><p>Everyone&apos;s playback is synced to this room.</p></div><div className="room-member-stack">{roomSnapshot?.members.slice(0, 5).map((member, index) => <span className={`member-avatar member-${index % 5}`} key={member.id} title={member.name}>{member.name.slice(0, 1).toUpperCase()}</span>)}<span className="member-count"><Users size={14} /> {roomSnapshot?.members.length ?? 0}</span></div></div>
    {error && <div className="inline-warning">{error}</div>}
    <div className="room-layout">
      <section className="room-watch-column">
        <div className="room-player-frame"><PlayerMount className="room-player" />{!roomSnapshot?.video && <div className="room-no-video"><Radio size={26} /><strong>Pick a video to watch together</strong><span>Search and play any video; it will sync to this room.</span><button className="button-soft" onClick={() => router.push("/")}>Browse videos</button></div>}{roomSnapshot?.video && !playerReady && <div className="room-loading"><span className="player-spinner" /><span>Loading shared video…</span></div>}</div>
        {roomSnapshot?.video && <>
          <PlayerControls />
          <div className="room-now-playing"><div><span className="eyebrow">NOW PLAYING</span><h2>{currentVideo?.title ?? roomSnapshot.video.title}</h2><p>{currentVideo?.channel ?? roomSnapshot.video.channel}</p></div><button className="button-soft" onClick={togglePlayback}>{isPlaying ? "Pause" : "Play"}</button></div>
        </>}
        <div className="room-sync-note"><Radio size={15} /><span>Play, pause and seek to keep everyone together. Sync can take about a second.</span></div>
      </section>
      <aside className="room-chat-panel glass-panel">
        <div className="room-chat-heading"><div><h2><MessageCircle size={18} /> Room chat</h2><span>{roomSnapshot?.members.length ?? 0} listeners online</span></div><button className="icon-button tiny" aria-label="Room members" title="Room members"><Users size={16} /></button></div>
        <div className="room-members-list">{roomSnapshot?.members.map((member, index) => <div className="room-member-row" key={member.id}><span className={`member-avatar member-${index % 5}`}>{member.name.slice(0, 1).toUpperCase()}</span><span><strong>{member.name}{member.id === roomSnapshot.hostId && <small> HOST</small>}</strong><em>Here now</em></span><i className="online-dot" /></div>)}</div>
        <div className="chat-divider" />
        <div className="room-chat-messages">{roomSnapshot?.messages.length ? roomSnapshot.messages.map((item: RoomMessage) => <div className="chat-message" key={item.id}><span className="chat-avatar">{item.name.slice(0, 1).toUpperCase()}</span><div><strong>{item.name}<small>{timeAgo(item.at)}</small></strong><p>{item.text}</p></div></div>) : <div className="chat-empty"><MessageCircle size={20} /><span>Say hello to everyone in the room.</span></div>}<div ref={chatEndRef} /></div>
        <form className="room-chat-form" onSubmit={submitMessage}><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Say something…" maxLength={240} /><button type="submit" aria-label="Send message" disabled={!message.trim()}><Send size={16} /></button></form>
        <p className="room-chat-fineprint">Chat is visible to members of this room.</p>
      </aside>
    </div>
    {roomBusy && <div className="room-joining-pill glass-panel"><span className="player-spinner" /> Syncing room…</div>}
  </div>;
}

export default function RoomPageClient() {
  return <Suspense fallback={<div className="page-loading">Joining room…</div>}><RoomExperience /></Suspense>;
}
