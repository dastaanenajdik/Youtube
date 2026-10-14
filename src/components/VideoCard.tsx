"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock3, MoreVertical, Play, Plus, ThumbsUp } from "lucide-react";
import type { Video } from "@/lib/types";
import { useApp } from "./Providers";

function initials(label: string): string {
  return label.split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase();
}

function avatarTone(label: string): number {
  return [...label].reduce((total, char) => total + char.charCodeAt(0), 0) % 5;
}

export function ChannelAvatar({ name, size = 38 }: { name: string; size?: number }) {
  return <span className={`channel-avatar tone-${avatarTone(name)}`} style={{ width: size, height: size }} aria-hidden="true">{initials(name)}</span>;
}

export default function VideoCard({ video, variant = "grid", hideMenu = false }: { video: Video; variant?: "grid" | "row"; hideMenu?: boolean }) {
  const router = useRouter();
  const { openVideo, likedIds, watchLaterIds, toggleLiked, toggleWatchLater, playlists, addToPlaylist, pushNotice } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const liked = likedIds.includes(video.id);
  const saved = watchLaterIds.includes(video.id);
  const thumb = useMemo(() => video.thumbnail || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`, [video.thumbnail, video.id]);

  const play = () => {
    openVideo(video, true);
    router.push(`/watch?v=${encodeURIComponent(video.id)}`);
  };

  const share = async () => {
    const url = `${window.location.origin}/watch?v=${encodeURIComponent(video.id)}`;
    try {
      await navigator.clipboard.writeText(url);
      pushNotice("Video link copied");
    } catch {
      pushNotice(url);
    }
    setMenuOpen(false);
  };

  const cardBody = (
    <>
      <button className="thumbnail-button" onClick={play} aria-label={`Play ${video.title}`}>
        <img src={thumb} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.style.opacity = "0"; }} />
        <span className="thumbnail-shade" />
        <span className="thumbnail-play"><Play size={19} fill="currentColor" /></span>
        {video.duration && <span className={`duration-badge ${video.isLive ? "is-live" : ""}`}>{video.duration}</span>}
        {video.isLive && <span className="live-badge"><i /> LIVE</span>}
      </button>
      <div className="video-card-copy">
        <ChannelAvatar name={video.channel} />
        <div className="video-title-stack">
          <button className="video-title" onClick={play}>{video.title}</button>
          <div className="video-channel">{video.channel}{video.channelId && <Check size={12} className="verified-icon" />}</div>
          <div className="video-meta">{video.views}{video.views && video.published ? <span> · </span> : null}{video.published}</div>
        </div>
        {!hideMenu && <div className="card-menu-wrap">
          <button className="icon-button tiny card-more" aria-label="More video actions" onClick={(event) => { event.stopPropagation(); setMenuOpen((open) => !open); }}><MoreVertical size={18} /></button>
          {menuOpen && <div className="video-menu glass-panel" onClick={(event) => event.stopPropagation()}>
            <button onClick={() => { toggleWatchLater(video); setMenuOpen(false); }}><Clock3 size={16} /> {saved ? "Remove from Watch later" : "Save to Watch later"}</button>
            <button onClick={() => { toggleLiked(video); setMenuOpen(false); }}><ThumbsUp size={16} /> {liked ? "Remove from Liked videos" : "Add to Liked videos"}</button>
            <button onClick={() => setPlaylistOpen((value) => !value)}><Plus size={16} /> Add to playlist</button>
            {playlistOpen && <div className="playlist-options">{playlists.length ? playlists.map((playlist) => <button key={playlist.id} onClick={() => { addToPlaylist(playlist.id, video); setMenuOpen(false); setPlaylistOpen(false); }}>{playlist.name}</button>) : <span>Create a playlist in Your library first.</span>}</div>}
            <button onClick={share}>Share</button>
          </div>}
        </div>}
      </div>
    </>
  );

  if (variant === "row") return <article className="video-row">
    <button className="row-thumbnail" onClick={play} aria-label={`Play ${video.title}`}><img src={thumb} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.style.opacity = "0"; }} /><span className="duration-badge">{video.duration}</span></button>
    <div className="row-copy">
      <button className="video-title" onClick={play}>{video.title}</button>
      <div className="video-meta row-meta">{video.channel} · {video.views} {video.published && `· ${video.published}`}</div>
      <p>{video.description || "Enjoy this video on YouTube."}</p>
    </div>
    {!hideMenu && <button className="icon-button tiny row-more" aria-label="More video actions" onClick={() => { toggleWatchLater(video); pushNotice(saved ? "Removed from Watch later" : "Saved to Watch later"); }}><Clock3 size={18} /></button>}
  </article>;

  return <article className="video-card">{cardBody}</article>;
}
