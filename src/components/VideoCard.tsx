"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock3, ListPlus, MoreVertical, Play, Plus, ThumbsUp } from "lucide-react";
import type { Video } from "@/lib/types";
import { useApp } from "./Providers";

export function initials(label: string): string {
  return label.split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase();
}

export function avatarTone(label: string): number {
  return [...label].reduce((total, char) => total + char.charCodeAt(0), 0) % 5;
}

export function ChannelAvatar({ name, size = 38 }: { name: string; size?: number }) {
  return <span className={`channel-avatar tone-${avatarTone(name)}`} style={{ width: size, height: size }} aria-hidden="true">{initials(name)}</span>;
}

function Thumb({ video }: { video: Video }) {
  const thumb = useMemo(() => video.thumbnail || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`, [video.thumbnail, video.id]);
  return (
    <>
      <img src={thumb} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.style.opacity = "0"; }} />
      <span className="thumbnail-shade" />
      <span className="thumbnail-play"><Play size={19} fill="currentColor" /></span>
      {video.duration && <span className={`duration-badge ${video.isLive ? "is-live" : ""}`}>{video.duration}</span>}
      {video.isLive && <span className="live-badge"><i /> LIVE</span>}
    </>
  );
}

export default function VideoCard({
  video,
  variant = "grid",
  hideMenu = false,
  progress,
  footer,
}: {
  video: Video;
  variant?: "grid" | "row";
  hideMenu?: boolean;
  progress?: number;
  footer?: React.ReactNode;
}) {
  const router = useRouter();
  const { openVideo, likedIds, watchLaterIds, toggleLiked, toggleWatchLater, playlists, addToPlaylist, queue, addToQueue, pushNotice } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const liked = likedIds.includes(video.id);
  const saved = watchLaterIds.includes(video.id);
  const queued = queue.some((entry) => entry.video.id === video.id);

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

  const menu = !hideMenu ? (
    <div className="card-menu-wrap">
      <button className="glass-icon-button tiny card-more" aria-label="More video actions" onClick={(event) => { event.stopPropagation(); setMenuOpen((open) => !open); }}><MoreVertical size={18} /></button>
      {menuOpen && (
        <div className="video-menu glass-pop" onClick={(event) => event.stopPropagation()}>
          <button onClick={() => { toggleWatchLater(video); setMenuOpen(false); }}><Clock3 size={16} /> {saved ? "Remove from Watch later" : "Save to Watch later"}</button>
          <button onClick={() => { toggleLiked(video); setMenuOpen(false); }}><ThumbsUp size={16} /> {liked ? "Remove from Liked videos" : "Add to Liked videos"}</button>
          <button onClick={() => { addToQueue(video); setMenuOpen(false); }}><ListPlus size={16} /> {queued ? "Added to queue" : "Add to queue"}</button>
          <button onClick={() => setPlaylistOpen((value) => !value)}><Plus size={16} /> Add to playlist</button>
          {playlistOpen && (
            <div className="playlist-options">
              {playlists.length
                ? playlists.map((playlist) => <button key={playlist.id} onClick={() => { addToPlaylist(playlist.id, video); setMenuOpen(false); setPlaylistOpen(false); }}>{playlist.name}</button>)
                : <span>Create a playlist in Your library first.</span>}
            </div>
          )}
          <button onClick={share}>Share</button>
        </div>
      )}
    </div>
  ) : null;

  if (variant === "row") {
    return (
      <article className="video-row">
        <button className="row-thumbnail" onClick={play} aria-label={`Play ${video.title}`}>
          <img src={video.thumbnail} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.style.opacity = "0"; }} />
          {video.duration && <span className="duration-badge">{video.duration}</span>}
          {typeof progress === "number" && progress > 0 && <span className="continue-progress"><span style={{ width: `${Math.min(100, progress)}%` }} /></span>}
        </button>
        <div className="row-copy">
          <button className="video-title" onClick={play}>{video.title}</button>
          <div className="video-meta row-meta">
            {video.channel} · {video.views}{video.published ? ` · ${video.published}` : ""}
            {video.channelId && <Check size={12} className="verified-icon" />}
          </div>
          <p>{video.description || "Enjoy this video on YouTube."}</p>
          {footer}
        </div>
        {menu}
      </article>
    );
  }

  return (
    <article className="video-card">
      <button className="thumbnail-button" onClick={play} aria-label={`Play ${video.title}`}>
        <Thumb video={video} />
        {typeof progress === "number" && progress > 0 && <span className="continue-progress"><span style={{ width: `${Math.min(100, progress)}%` }} /></span>}
      </button>
      <div className="video-card-copy">
        <ChannelAvatar name={video.channel} />
        <div className="video-title-stack">
          <button className="video-title" onClick={play}>{video.title}</button>
          <div className="video-channel">{video.channel}{video.channelId && <Check size={12} className="verified-icon" />}</div>
          <div className="video-meta">{video.views}{video.views && video.published ? <span> · </span> : null}{video.published}</div>
        </div>
        {menu}
      </div>
      {footer}
    </article>
  );
}
