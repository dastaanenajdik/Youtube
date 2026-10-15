"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock3, Compass, Flame, Home, Library, ListVideo, PlaySquare, Plus, Radio, Settings, SlidersHorizontal, ThumbsUp, Tv2, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "./Providers";
import { ChannelAvatar } from "./VideoCard";
import { readStorage, writeStorage } from "@/lib/storage";

const primaryNav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shorts", label: "Shorts", icon: PlaySquare },
  { href: "/subscriptions", label: "Subscriptions", icon: Tv2 },
  { href: "/channel", label: "Your channel", icon: UserRound },
];

const youNav = [
  { href: "/library", label: "Your library", icon: Library },
  { href: "/history", label: "History", icon: Clock3 },
  { href: "/library?tab=watch-later", label: "Watch later", icon: ListVideo },
  { href: "/library?tab=liked", label: "Liked videos", icon: ThumbsUp },
  { href: "/explore", label: "Trending", icon: Flame },
];

const RAIL_KEY = "ytglass.rail-mini.v1";

function activePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/library") return pathname === "/library";
  if (href.startsWith("/library?")) return pathname === "/library" && new URLSearchParams(href.split("?")[1]).get("tab") !== null;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar({ open = false, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname() || "/";
  const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("tab") : null;
  const { playlists, createPlaylist, roomSession, subscribedChannels, hydrated } = useApp();
  const [mini, setMini] = useState(false);

  useEffect(() => {
    const stored = readStorage<boolean>(RAIL_KEY, false);
    setMini(stored);
    document.documentElement.dataset.rail = stored ? "mini" : "full";
  }, [hydrated]);

  const toggleMini = () => {
    setMini((previous) => {
      const next = !previous;
      writeStorage(RAIL_KEY, next);
      document.documentElement.dataset.rail = next ? "mini" : "full";
      return next;
    });
  };

  const makePlaylist = () => {
    const name = window.prompt("Playlist name");
    if (name) createPlaylist(name);
  };

  const linkClass = (href: string) => `nav-link ${activePath(pathname, href) || (href === "/library" && search === null && pathname.startsWith("/playlist/")) ? "active" : ""}`;
  const close = () => onClose?.();

  return (
    <>
      {open && <button className="mobile-scrim" aria-label="Close menu" onClick={close} />}
      <aside className={`sidebar glass-panel ${open ? "mobile-open" : ""} ${mini ? "is-mini" : ""}`}>
        <div className="sidebar-head">
          <button className="glass-icon-button tiny mobile-close" aria-label="Close menu" onClick={close}><X size={19} /></button>
          <Link href="/" className="brand-lockup" onClick={close} aria-label="YouTube Glass home">
            <span className="brand-mark"><span /></span>
            <span className="brand-name">YouTube<span>Glass</span></span>
          </Link>
          <button className="glass-icon-button tiny rail-toggle" aria-label={mini ? "Expand sidebar" : "Collapse sidebar"} title={mini ? "Expand sidebar" : "Collapse to icons"} onClick={toggleMini}><SlidersHorizontal size={15} /></button>
        </div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          <div className="nav-group">
            {primaryNav.map(({ href, label, icon: Icon }) => (
              <Link href={href} className={linkClass(href)} key={href} onClick={close} title={label}>
                <Icon size={19} strokeWidth={activePath(pathname, href) ? 2.4 : 1.8} />
                <span>{label}</span>
              </Link>
            ))}
            <Link href="/rooms" className={linkClass("/rooms")} onClick={close} title="Watch together">
              <Radio size={19} />
              <span>Watch together</span>
              {roomSession && <span className="live-pill"><i /> LIVE</span>}
            </Link>
          </div>
          <div className="nav-divider" />
          <div className="nav-group">
            <div className="nav-section-title">You <span>›</span></div>
            {youNav.map(({ href, label, icon: Icon }) => (
              <Link href={href} className={linkClass(href)} key={href} onClick={close} title={label}><Icon size={19} /><span>{label}</span></Link>
            ))}
          </div>
          {subscribedChannels.length > 0 && (
            <>
              <div className="nav-divider" />
              <div className="nav-group">
                <div className="nav-section-title">Subscriptions</div>
                {subscribedChannels.slice(0, 6).map((channel) => (
                  <Link href={`/channel?c=${encodeURIComponent(channel)}`} className="nav-link sub-link" key={channel} onClick={close} title={channel}>
                    <ChannelAvatar name={channel} size={24} />
                    <span>{channel}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
          <div className="nav-divider" />
          <div className="playlist-heading">
            <div className="nav-section-title">Playlists</div>
            <button className="glass-icon-button tiny" aria-label="Create playlist" title="Create playlist" onClick={makePlaylist}><Plus size={17} /></button>
          </div>
          <div className="nav-group playlist-nav">
            {playlists.length ? playlists.slice(0, 8).map((playlist) => (
              <Link href={`/playlist/${playlist.id}`} key={playlist.id} className={linkClass(`/playlist/${playlist.id}`)} onClick={close}>
                <span className="playlist-mini"><ListVideo size={15} /></span><span>{playlist.name}</span>
              </Link>
            )) : <p className="sidebar-hint">Your playlists will show up here.</p>}
            <button className="nav-link nav-create" onClick={makePlaylist}><Plus size={18} /><span>Create a playlist</span></button>
          </div>
        </nav>
        <div className="sidebar-foot">
          <div className="side-user"><span className="user-avatar">A</span><div><strong>Your space</strong><small>Local · nothing syncs</small></div></div>
          <div className="side-foot-links"><Link href="/settings" onClick={close}><Settings size={15} /> Settings</Link><Link href="/explore" onClick={close}><Compass size={15} /> Explore</Link></div>
          <p className="disclaimer">Fan-built demo · not affiliated with YouTube</p>
        </div>
      </aside>
    </>
  );
}
