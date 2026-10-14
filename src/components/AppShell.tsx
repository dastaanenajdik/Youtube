"use client";

import { ReactNode, Suspense, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Home, Maximize2, Pause, Play, PlaySquare, Radio, Tv2, UserRound, Volume2 } from "lucide-react";
import { AppProvider, PlayerMount, useApp } from "./Providers";
import Sidebar from "./Sidebar";
import Header from "./Header";

function MiniPlayer() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentVideo, isPlaying, togglePlayback, volume, setVolumeLevel, roomSession, pushNotice } = useApp();
  if (!currentVideo || pathname === "/watch" || pathname.startsWith("/rooms/")) return null;

  const goToWatch = () => router.push(`/watch?v=${encodeURIComponent(currentVideo.id)}`);
  return (
    <aside className="mini-player glass-panel" aria-label="Mini player">
      <div className="mini-player-topline">
        <button className="mini-player-title" onClick={goToWatch} title="Open video">{currentVideo.title}</button>
        <button className="icon-button tiny" aria-label="Expand player" onClick={goToWatch}><Maximize2 size={15} /></button>
      </div>
      <div className="mini-player-video"><PlayerMount /></div>
      <div className="mini-player-controls">
        <button className="round-play" aria-label={isPlaying ? "Pause" : "Play"} onClick={togglePlayback}>{isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}</button>
        <div className="mini-now"><strong>{currentVideo.channel}</strong><span>{isPlaying ? "Now playing" : "Paused"}</span></div>
        <button className="icon-button tiny" aria-label="Adjust volume" onClick={() => setVolumeLevel(volume > 0 ? Math.max(volume - 10, 0) : 72)}><Volume2 size={17} /></button>
        <button className="room-mini" aria-label="Watch together" title="Watch together" onClick={() => roomSession ? router.push(`/rooms/${roomSession.code}`) : pushNotice("Create a watch party from the video page.")}><Radio size={16} /></button>
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
    { label: "Subscriptions", href: "/subscriptions", icon: Tv2 },
    { label: "You", href: "/library", icon: UserRound },
  ];
  return <nav className="mobile-nav glass-panel" aria-label="Mobile navigation">
    {links.map(({ label, href, icon: Icon }) => <button key={href} className={pathname === href ? "active" : ""} onClick={() => router.push(href)}><Icon size={19} /><small>{label}</small></button>)}
  </nav>;
}

function Toast() {
  const { notice } = useApp();
  if (!notice) return null;
  return <div className="toast-message glass-panel" role="status">{notice}</div>;
}

function ShellContent({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { currentVideo, roomSession, roomSnapshot, isPlaying } = useApp();
  return (
    <div className="app-layout">
      <Sidebar open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="app-main">
        <Suspense fallback={<div className="topbar glass-bar" aria-hidden="true" />}><Header onMenu={() => setMobileMenuOpen(true)} /></Suspense>
        {roomSession && roomSnapshot && <button className="room-banner" onClick={() => router.push(`/rooms/${roomSession.code}`)}><span className="room-live-dot" /> Watching together · {roomSnapshot.members.length} here <ChevronDown size={14} /></button>}
        <main className="page-content">{children}</main>
      </div>
      <MiniPlayer />
      <MobileNav />
      <Toast />
      {currentVideo && isPlaying && <span className="sr-only" aria-live="polite">Playing {currentVideo.title}</span>}
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  return <AppProvider><ShellContent>{children}</ShellContent></AppProvider>;
}
