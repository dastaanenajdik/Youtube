"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, Check, Copy, ListPlus, MessageCircle, MoreHorizontal, Radio, Share2, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { demoVideos } from "@/lib/demo-videos";
import { readStorage, writeStorage } from "@/lib/storage";
import { timeAgo } from "@/lib/format";
import type { Video } from "@/lib/types";
import { useApp, PlayerMount } from "./Providers";
import { ChannelAvatar } from "./VideoCard";
import VideoCard from "./VideoCard";
import PlayerControls from "./PlayerControls";

interface LocalNote { id: string; text: string; createdAt: number }

function WatchExperience() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("v") ?? "";
  const {
    videos, currentVideo, isPlaying, playerReady, playerIssue, history, likedIds, watchLaterIds,
    subscribedChannels, roomSession, setVideoFromUrl, toggleLiked, toggleWatchLater, toggleSubscription,
    togglePlayback, createRoom, pushNotice,
  } = useApp();
  const [notes, setNotes] = useState<LocalNote[]>([]);
  const [noteText, setNoteText] = useState("");
  const [copied, setCopied] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const video = (currentVideo?.id === id ? currentVideo : videos[id]) ?? demoVideos.find((item) => item.id === id) ?? null;
  const activeVideo: Video | null = video ?? (id ? {
    id,
    title: "YouTube video",
    channel: "YouTube creator",
    thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    duration: "",
    durationSeconds: 0,
    views: "",
    published: "",
    description: "Playback is provided by YouTube. This video may not be available to embed.",
  } : null);
  const liked = activeVideo ? likedIds.includes(activeVideo.id) : false;
  const later = activeVideo ? watchLaterIds.includes(activeVideo.id) : false;
  const subscribed = activeVideo ? subscribedChannels.includes(activeVideo.channel) : false;

  useEffect(() => {
    if (!id || !/^[\w-]{11}$/.test(id)) return;
    const cached = videos[id] ?? demoVideos.find((item) => item.id === id) ?? {
      id,
      title: "YouTube video",
      channel: "YouTube creator",
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      duration: "",
      durationSeconds: 0,
      views: "",
      published: "",
      description: "Playback is provided by YouTube. This video may not be available to embed.",
    };
    setVideoFromUrl(cached, false);
  }, [id, videos, setVideoFromUrl]);

  useEffect(() => {
    if (!id) return;
    setNotes(readStorage<LocalNote[]>(`ytglass.notes.${id}`, []));
  }, [id]);

  const related = useMemo(() => {
    const pool = [...Object.values(videos), ...demoVideos];
    const unique = new Map(pool.filter((item) => item.id !== id).map((item) => [item.id, item]));
    return Array.from(unique.values()).slice(0, 12);
  }, [id, videos]);

  const addNote = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = noteText.trim().slice(0, 400);
    if (!text || !id) return;
    const next = [{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text, createdAt: Date.now() }, ...notes];
    setNotes(next);
    writeStorage(`ytglass.notes.${id}`, next);
    setNoteText("");
  };

  const copyLink = async () => {
    const link = `${window.location.origin}/watch?v=${id}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      pushNotice(link);
    }
  };

  const startParty = async () => {
    if (roomSession) {
      router.push(`/rooms/${roomSession.code}`);
      return;
    }
    try {
      const code = await createRoom();
      router.push(`/rooms/${code}`);
    } catch {
      // A notice is shown by the provider.
    }
  };

  const isHistoryItem = activeVideo && history.some((item) => item.video.id === activeVideo.id);

  if (!id) return <div className="empty-state watch-empty"><div className="empty-state-icon">▶</div><strong>Choose a video to start watching</strong><span>Search for a video or pick one from Home.</span><button className="button-primary" onClick={() => router.push("/")}>Browse home</button></div>;

  return <div className="watch-layout">
    <div className="watch-main-column">
      <div className="watch-player-frame">
        <PlayerMount className="watch-player" />
        {(!playerReady || !isPlaying) && !playerIssue && <button className={`player-overlay ${playerReady ? "is-paused" : "is-loading"}`} onClick={() => {
          if (activeVideo) {
            if (!playerReady) pushNotice("The YouTube player is still loading. Try again in a moment.");
            else togglePlayback();
          }
        }} aria-label={playerReady ? "Play video" : "Loading YouTube player"}>
          {playerReady ? <span className="player-overlay-play">▶</span> : <span className="player-spinner" />}
        </button>}
        {playerIssue && <div className="player-error"><strong>Video unavailable here</strong><span>{playerIssue}</span><a href={`https://www.youtube.com/watch?v=${encodeURIComponent(id)}`} target="_blank" rel="noreferrer">Open on YouTube ↗</a></div>}
      </div>
      <PlayerControls />
      <h1 className="watch-title">{activeVideo?.title ?? "Loading video…"}</h1>
      <div className="watch-meta-actions">
        <div className="watch-channel-block">
          <ChannelAvatar name={activeVideo?.channel ?? "YouTube"} size={44} />
          <div className="watch-channel-info"><strong>{activeVideo?.channel ?? "YouTube creator"}</strong><span>Creator on YouTube</span></div>
          <button className={`subscribe-button ${subscribed ? "subscribed" : ""}`} onClick={() => activeVideo && toggleSubscription(activeVideo.channel)}>{subscribed ? <><Check size={15} /> Subscribed</> : "Subscribe"}</button>
        </div>
        <div className="watch-actions">
          <div className="like-combo"><button className={liked ? "selected" : ""} onClick={() => activeVideo && toggleLiked(activeVideo)}><ThumbsUp size={17} fill={liked ? "currentColor" : "none"} /><span>{liked ? "Liked" : "Like"}</span></button><i /><button aria-label="Dislike" onClick={() => pushNotice("Thanks for your feedback.")}><ThumbsDown size={17} /></button></div>
          <button className={`soft-action ${later ? "selected" : ""}`} onClick={() => activeVideo && toggleWatchLater(activeVideo)}><ListPlus size={17} /><span>{later ? "Saved" : "Save"}</span></button>
          <button className="soft-action" onClick={copyLink}>{copied ? <Check size={17} /> : <Share2 size={17} />}<span>{copied ? "Copied" : "Share"}</span></button>
          <button className="soft-action room-action" onClick={startParty}><Radio size={17} /><span>{roomSession ? "Join room" : "Watch together"}</span></button>
          <button className="icon-button more-watch" aria-label="More actions" onClick={() => setShowMore((value) => !value)}><MoreHorizontal size={20} /></button>
          {showMore && <div className="watch-more-menu glass-panel"><button onClick={() => { router.push("/rooms"); setShowMore(false); }}><Radio size={16} /> Create a watch party</button><button onClick={() => { pushNotice("Notifications for this channel are local to this demo."); setShowMore(false); }}><Bell size={16} /> Turn on notifications</button><button onClick={() => { void copyLink(); setShowMore(false); }}><Copy size={16} /> Copy link</button></div>}
        </div>
      </div>
      <div className="watch-description glass-panel">
        <div className="watch-description-meta"><strong>{activeVideo?.views || "YouTube video"}</strong><span>{activeVideo?.published}</span></div>
        <p>{activeVideo?.description || "Watch this video using YouTube's official embedded player. Playback availability and any advertising are controlled by YouTube."}</p>
        <details><summary>Show more</summary><p>Playback is served by YouTube. Some videos may require sign-in or may not allow embedding. This independent demo does not remove or skip YouTube ads.</p><a href={`https://www.youtube.com/watch?v=${encodeURIComponent(id)}`} target="_blank" rel="noreferrer">View on YouTube ↗</a></details>
      </div>
      <section className="notes-section">
        <div className="notes-heading"><h2><MessageCircle size={20} /> Notes <span>{notes.length}</span></h2><span>Saved on this device only</span></div>
        <form className="note-form" onSubmit={addNote}><span className="user-avatar">A</span><input value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="Add a private note about this video…" maxLength={400} /><button className="button-soft" disabled={!noteText.trim()}>Add note</button></form>
        {notes.length > 0 ? <div className="note-list">{notes.map((note) => <article className="note-item" key={note.id}><span className="user-avatar">A</span><div><strong>You <small>{timeAgo(note.createdAt)}</small></strong><p>{note.text}</p></div><button className="icon-button tiny" aria-label="Delete note" onClick={() => { const next = notes.filter((item) => item.id !== note.id); setNotes(next); writeStorage(`ytglass.notes.${id}`, next); }}><X size={15} /></button></article>)}</div> : <p className="notes-empty">{isHistoryItem ? "Your private notes for this video will stay here." : "Start a private discussion note; it is not posted publicly to YouTube."}</p>}
      </section>
    </div>
    <aside className="related-column">
      <div className="related-heading"><h2>Up next</h2><span>Recommendations</span></div>
      <div className="related-list">{related.map((item) => <VideoCard key={item.id} video={item} variant="row" hideMenu />)}</div>
    </aside>
  </div>;
}

export default function WatchPageClient() {
  return <Suspense fallback={<div className="page-loading">Loading video…</div>}><WatchExperience /></Suspense>;
}
