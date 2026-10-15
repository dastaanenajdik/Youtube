"use client";

import { ReactNode, Suspense, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Home, Maximize2, Pause, Play, PlaySquare, Tv2, UserRound, Volume2, VolumeX, X } from "lucide-react";
import { AppProvider, PlayerMount, useApp } from "./Providers";
import Sidebar from "./Sidebar";
import Header from "./Header";
import CommandPalette from "./CommandPalette";

function MiniPlayer() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentVideo, isPlaying, togglePlayback, muted, toggleMute, roomSession, pushNotice, clearCurrentPlayer } = useApp();
  if (!currentVideo || pathname === "/watch" || pathname.startsWith("/rooms/")) return null;

  const goToWatch = () => router.push(`/watch?v=${encodeURIComponent(currentVideo.id)}`);
  return (
    <aside className="mini-player glass-panel" aria-label="Mini player">
      <div className="mini-player-topline">
        <button className="mini-player-title" onClick={goToWatch} title="Open video">{currentVideo.title}</button>
        <button className="glass-button tiny" onClick={() => { togglePlayback(); pushNotice(isPlaying ? "Player paused" : "Player resumed"); }} aria-label={isPlaying ? "Pause" : "Play"}>
          {isPlaying ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
        </button>
        <button className={`glass-icon-button tiny ${muted ? "" : "active"}`} aria-label={muted ? "Unmute" : "Mute"} onClick={toggleMute}>{muted ? <VolumeX size={15} /> : <Volume2 size={15} />}</button>
        <button className="glass-icon-button tiny" aria-label="Close mini player" onClick={() => { clearCurrentPlayer(); pushNotice("Player closed"); }}><X size={15} /></button>
        <button className="glass-icon-button tiny" aria-label="Expand player" onClick={goToWatch}><Maximize2 size={15} /></button>
      </div>
      <div className="mini-player-video"><PlayerMount /></div>
      <div className="mini-player-controls">
        <button className="round-play glass-icon-button" aria-label={isPlaying ? "Pause video" : "Play video"} onClick={togglePlayback}>{isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}</button>
        <div className="mini-now">
          <strong>{roomSession ? "Watch party in progress" : currentVideo.channel}</strong>
          <span>{currentVideo.views}{currentVideo.published ? ` · ${currentVideo.published}` : ""}</span>
        </div>
        <button className="room-mini" aria-label="Open watch party" onClick={() => router.push(roomSession ? `/rooms/${roomSession.code}` : "/rooms")}>
          <PlaySquare size={13} />
        </button>
      </div>
    </aside>
  );
}

function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const links = [
    { label: "Home", href: "/", icon: Home },
    { label: "Shorts", href: "/shorts", icon: PlaySquare },
    { label: "Subs", href: "/subscriptions", icon: Tv2 },
    { label: "Channel", href: "/channel", icon: UserRound },
    { label: "You", href: "/library", icon: UserRound },
  ];
  return <nav className="mobile-nav glass-panel" aria-label="Mobile navigation">
    {links.map(({ label, href, icon: Icon }) => <button key={label} className={pathname === href ? "active" : ""} onClick={() => router.push(href)}><Icon size={19} /><small>{label}</small></button>)}
  </nav>;
}

function Toast() {
  const { notice } = useApp();
  if (!notice) return null;
  return <div className="toast-message glass-panel" role="status">{notice}</div>;
}

/** Soft aurora behind the whole shell so the frosted panels have something to blur. */
function AuroraBackdrop() {
  return (
    <div className="glass-aurora" aria-hidden="true">
      <span className="aurora aurora-one" />
      <span className="aurora aurora-two" />
      <span className="aurora aurora-three" />
      <span className="aurora grain" />
    </div>
  );
}

function ShellContent({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { currentVideo, roomSession, roomSnapshot, isPlaying, togglePlayback } = useApp();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (typing || pathname === "/shorts") return;
      if (event.key === "k" && currentVideo) {
        event.preventDefault();
        togglePlayback();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentVideo, togglePlayback, pathname]);

  return (
    <div className="app-layout">
      <AuroraBackdrop />
      <Sidebar open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="app-main">
        <Suspense fallback={<div className="topbar glass-bar" aria-hidden="true" />}><Header onMenu={() => setMobileMenuOpen(true)} /></Suspense>
        {roomSession && roomSnapshot && <button className="room-banner glass-panel" onClick={() => router.push(`/rooms/${roomSession.code}`)}><span className="room-live-dot" /> Watching together · {roomSnapshot.members.length} here <ChevronDown size={14} /></button>}
        <main className="page-content">{children}</main>
      </div>
      <MiniPlayer />
      <MobileNav />
      <Toast />
      <CommandPalette />
      {currentVideo && isPlaying && <span className="sr-only" aria-live="polite">Playing {currentVideo.title}</span>}
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  return <AppProvider><ShellContent>{children}</ShellContent></AppProvider>;
}
