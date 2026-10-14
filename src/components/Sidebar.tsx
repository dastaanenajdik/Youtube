"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock3, Compass, Home, Library, ListVideo, Plus, Radio, Settings, ThumbsUp, X, PlaySquare, Tv2 } from "lucide-react";
import { useApp } from "./Providers";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shorts", label: "Shorts", icon: PlaySquare },
  { href: "/subscriptions", label: "Subscriptions", icon: Tv2 },
];

function activePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/library") return pathname.startsWith("/library") || pathname.startsWith("/playlist");
  if (href === "/history") return pathname === "/history";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar({ open = false, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname() || "/";
  const { playlists, createPlaylist, roomSession } = useApp();
  const makePlaylist = () => {
    const name = window.prompt("Playlist name");
    if (name) createPlaylist(name);
  };

  const linkClass = (href: string) => `nav-link ${activePath(pathname, href) ? "active" : ""}`;
  const close = () => onClose?.();

  return (
    <>
      {open && <button className="mobile-scrim" aria-label="Close menu" onClick={close} />}
      <aside className={`sidebar glass-panel ${open ? "mobile-open" : ""}`}>
        <div className="sidebar-head">
          <button className="icon-button mobile-close" aria-label="Close menu" onClick={close}><X size={19} /></button>
          <Link href="/" className="brand-lockup" onClick={close} aria-label="YouTube Glass home">
            <span className="brand-mark"><span /></span>
            <span className="brand-name">YouTube<span>Glass</span></span>
          </Link>
        </div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          <div className="nav-group">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link href={href} className={linkClass(href)} key={href} onClick={close}>
                <Icon size={19} strokeWidth={activePath(pathname, href) ? 2.4 : 1.8} />
                <span>{label}</span>
              </Link>
            ))}
          </div>
          <div className="nav-divider" />
          <div className="nav-group">
            <div className="nav-section-title">You <span>›</span></div>
            <Link href="/library" className={linkClass("/library")} onClick={close}><Library size={19} /><span>Your library</span></Link>
            <Link href="/history" className={linkClass("/history")} onClick={close}><Clock3 size={19} /><span>History</span></Link>
            <Link href="/library?tab=watch-later" className={linkClass("/library?tab=watch-later")} onClick={close}><ListVideo size={19} /><span>Watch later</span></Link>
            <Link href="/library?tab=liked" className={linkClass("/library?tab=liked")} onClick={close}><ThumbsUp size={19} /><span>Liked videos</span></Link>
            <Link href="/rooms" className={linkClass("/rooms")} onClick={close}>
              <Radio size={19} />
              <span>Watch together</span>
              {roomSession && <span className="live-pill"><i /> LIVE</span>}
            </Link>
          </div>
          <div className="nav-divider" />
          <div className="playlist-heading">
            <div className="nav-section-title">Playlists</div>
            <button className="icon-button tiny" aria-label="Create playlist" title="Create playlist" onClick={makePlaylist}><Plus size={17} /></button>
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
          <div className="side-user"><span className="user-avatar">A</span><div><strong>Your space</strong><small>Personal library</small></div></div>
          <div className="side-foot-links"><Link href="/settings" onClick={close}><Settings size={15} /> Settings</Link><Link href="/explore" onClick={close}><Compass size={15} /> Explore</Link></div>
          <p className="disclaimer">Fan-built demo · not affiliated with YouTube</p>
        </div>
      </aside>
    </>
  );
}
