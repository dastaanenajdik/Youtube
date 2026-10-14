"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Clock3, Heart, ListVideo, Plus, Radio } from "lucide-react";
import { demoVideos } from "@/lib/demo-videos";
import { useApp } from "./Providers";
import VideoGrid from "./VideoGrid";

const tabs = [
  { id: "history", label: "History", icon: Clock3 },
  { id: "watch-later", label: "Watch later", icon: ListVideo },
  { id: "liked", label: "Liked videos", icon: Heart },
  { id: "playlists", label: "Playlists", icon: Plus },
];

function LibraryContent() {
  const params = useSearchParams();
  const selected = params.get("tab") ?? "history";
  const { history, watchLaterIds, likedIds, playlists, videos, createPlaylist } = useApp();
  const list = useMemo(() => {
    if (selected === "watch-later") return watchLaterIds.map((id) => videos[id]).filter(Boolean);
    if (selected === "liked") return likedIds.map((id) => videos[id]).filter(Boolean);
    return history.map((record) => record.video);
  }, [selected, watchLaterIds, likedIds, videos, history]);

  const newPlaylist = () => {
    const name = window.prompt("Name your new playlist");
    if (name) createPlaylist(name);
  };

  return <div className="library-page">
    <div className="library-hero glass-panel">
      <div className="library-hero-icon"><Radio size={21} /></div>
      <div><span className="eyebrow">Your space</span><h1>Your library</h1><p>Pick up where you left off and keep your favorite videos close.</p></div>
      <button className="button-primary" onClick={newPlaylist}><Plus size={16} /> New playlist</button>
    </div>
    <div className="library-tabs">{tabs.map(({ id, label, icon: Icon }) => <Link href={`/library?tab=${id}`} key={id} className={selected === id ? "library-tab active" : "library-tab"}><Icon size={16} />{label}</Link>)}</div>
    {selected === "playlists" ? <section className="library-content">
      <div className="section-heading"><div><span className="eyebrow">Made by you</span><h2>Playlists</h2></div></div>
      {playlists.length ? <div className="playlist-grid">{playlists.map((playlist) => {
        const first = videos[playlist.videoIds[0]] ?? demoVideos[0];
        return <Link className="playlist-card glass-panel" key={playlist.id} href={`/playlist/${playlist.id}`}><img src={first.thumbnail} alt="" /><div className="playlist-card-shade"><ListVideo size={25} /></div><div className="playlist-card-copy"><strong>{playlist.name}</strong><span>{playlist.videoIds.length} videos · Private</span></div></Link>;
      })}</div> : <div className="empty-state"><div className="empty-state-icon"><ListVideo size={24} /></div><strong>Make a playlist for any mood</strong><span>Save videos into a collection you can find again.</span><button className="button-primary" onClick={newPlaylist}><Plus size={16} /> Create playlist</button></div>}
    </section> : <section className="library-content">
      <div className="section-heading"><div><span className="eyebrow">{tabs.find((item) => item.id === selected)?.label ?? "History"}</span><h2>{selected === "history" ? "Recently watched" : selected === "liked" ? "Videos you liked" : "Saved for later"}</h2></div><span className="count-pill">{list.length} videos</span></div>
      <VideoGrid videos={list} emptyMessage={selected === "history" ? "Videos you watch will appear here." : selected === "liked" ? "Tap Like on a video to save it here." : "Save a video to Watch later to find it here."} />
    </section>}
  </div>;
}

export default function LibraryPageClient() {
  return <Suspense fallback={<div className="page-loading">Loading your library…</div>}><LibraryContent /></Suspense>;
}
