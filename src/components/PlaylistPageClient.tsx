"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ListVideo, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useApp } from "./Providers";
import VideoCard from "./VideoCard";

export default function PlaylistPageClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { playlists, videos, removePlaylist } = useApp();
  const playlist = playlists.find((item) => item.id === params.id);
  const items = useMemo(() => playlist?.videoIds.map((id) => videos[id]).filter(Boolean) ?? [], [playlist, videos]);

  if (!playlist) return <div className="empty-state"><div className="empty-state-icon"><ListVideo size={25} /></div><strong>Playlist not found</strong><span>It may have been deleted from this browser.</span><button className="button-soft" onClick={() => router.push("/library?tab=playlists")}><ArrowLeft size={16} /> Back to library</button></div>;

  return <div className="playlist-page">
    <button className="back-link" onClick={() => router.push("/library?tab=playlists")}><ArrowLeft size={16} /> Your library</button>
    <div className="playlist-hero glass-panel"><div className="playlist-hero-art"><ListVideo size={34} /></div><div className="playlist-hero-copy"><span className="eyebrow">Private playlist</span><h1>{playlist.name}</h1><p>{items.length} videos · Created {new Date(playlist.createdAt).toLocaleDateString()}</p></div><button className="icon-button" title="Delete playlist" aria-label="Delete playlist" onClick={() => { if (window.confirm(`Delete “${playlist.name}”?`)) { removePlaylist(playlist.id); router.push("/library?tab=playlists"); } }}><Trash2 size={18} /></button></div>
    {items.length ? <div className="video-grid">{items.map((video) => <VideoCard key={video.id} video={video} />)}</div> : <div className="empty-state"><div className="empty-state-icon"><Plus size={24} /></div><strong>This playlist is ready for its first video</strong><span>Use the menu on any video card and choose “Add to playlist”.</span><button className="button-primary" onClick={() => router.push("/")}><MoreHorizontal size={16} /> Find videos</button></div>}
  </div>;
}
