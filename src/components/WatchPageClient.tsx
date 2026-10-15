"use client";

import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bell, Check, Copy, Eye, ListPlus, ListVideo, MoreHorizontal, PanelTop, Play, Radio, Repeat2,
  Search, Share2, SkipForward, ThumbsDown, ThumbsUp, X,
} from "lucide-react";
import { demoVideos } from "@/lib/demo-videos";
import { readStorage, writeStorage } from "@/lib/storage";
import { formatDuration, timeAgo } from "@/lib/format";
import { dedupeVideos } from "@/lib/feed";
import type { Video } from "@/lib/types";
import { useApp, PlayerMount } from "./Providers";
import { ChannelAvatar } from "./VideoCard";
import VideoCard from "./VideoCard";
import PlayerControls from "./PlayerControls";
import Comments from "./Comments";

interface LocalNote { id: string; text: string; createdAt: number }

function findChapters(video: Video | null, length: number) {
  if (video?.chapters?.length) return video.chapters;
  if (!length || length < 240) return [];
  const labels = ["Cold open", "The setup", "Main part", "Deep dive", "Wrap up"];
  const step = length / (labels.length + 1);
  return labels.map((title, index) => ({ title, at: Math.round(step * (index + 1)) }));
}

function WatchExperience() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("v") ?? "";
  const startAt = Number(params.get("t")) || 0;
  const {
    videos, currentVideo, isPlaying, playerReady, playerIssue, duration, playbackTime, history, likedIds, watchLaterIds,
    subscribedChannels, roomSession, reactions, react, setVideoFromUrl, toggleWatchLater, toggleSubscription,
    togglePlayback, seekTo, createRoom, pushNotice, queue, addToQueue, removeFromQueue, playFromQueue, clearQueue, settings, updateSettings,
  } = useApp();
  const [notes, setNotes] = useState<LocalNote[]>([]);
  const [noteText, setNoteText] = useState("");
  const [copied, setCopied] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [theater, setTheater] = useState(false);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const startedRef = useRef(false);
  const fallbackVideo: Video = {
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
  const video = (currentVideo?.id === id ? currentVideo : videos[id]) ?? demoVideos.find((item) => item.id === id) ?? null;
  const activeVideo: Video | null = video ?? (id ? fallbackVideo : null);
  const liked = Boolean(activeVideo && (likedIds.includes(activeVideo.id) || reactions[activeVideo.id] === "like"));
  const disliked = Boolean(activeVideo && reactions[activeVideo.id] === "dislike");
  const later = activeVideo ? watchLaterIds.includes(activeVideo.id) : false;
  const subscribed = activeVideo ? subscribedChannels.includes(activeVideo.channel) : false;
  const queued = activeVideo ? queue.some((entry) => entry.video.id === activeVideo.id) : false;

  useEffect(() => {
    if (!id || !/^[\w-]{11}$/.test(id)) return;
    const cached = videos[id] ?? demoVideos.find((item) => item.id === id) ?? fallbackVideo;
    setVideoFromUrl(cached, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, videos, setVideoFromUrl]);

  useEffect(() => {
    if (!id) return;
    setNotes(readStorage<LocalNote[]>(`ytglass.notes.${id}`, []));
  }, [id]);

  useEffect(() => {
    if (startedRef.current || !playerReady || !startAt) return;
    startedRef.current = true;
    seekTo(startAt);
  }, [playerReady, startAt, seekTo]);

  const related = useMemo(() => {
    const pool = [...Object.values(videos), ...demoVideos];
    const unique = dedupeVideos(pool.filter((item) => item.id !== id), id);
    return unique.slice(0, 12);
  }, [id, videos]);

  const chapters = useMemo(() => findChapters(activeVideo, duration), [activeVideo, duration]);
  const activeChapter = useMemo(() => {
    if (!chapters.length) return null;
    let found = chapters[0];
    for (const chapter of chapters) if (chapter.at <= playbackTime) found = chapter;
    return found;
  }, [chapters, playbackTime]);

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

  const playNext = () => {
    const next = queue[0]?.video ?? related[0];
    if (!next) return;
    if (queue[0]) playFromQueue(next.id);
    else {
      router.push(`/watch?v=${next.id}`);
      pushNotice("Autoplay queued the next video");
    }
  };

  const isHistoryItem = activeVideo && history.some((item) => item.video.id === activeVideo.id);

  if (!id) return <div className="empty-state watch-empty"><div className="empty-state-icon">▶</div><strong>Choose a video to start watching</strong><span>Search for a video or pick one from Home.</span><button className="glass-button primary" onClick={() => router.push("/")}>Browse home</button></div>;

  return <div className={`watch-layout ${theater ? "is-theater" : ""}`}>
    <div className="watch-main-column">
      <div className="watch-player-frame glass-player">
        <PlayerMount className="watch-player" />
        {(!playerReady || !isPlaying) && !playerIssue && <button className={`player-overlay ${playerReady ? "is-paused" : "is-loading"}`} onClick={() => {
          if (activeVideo) {
            if (!playerReady) pushNotice("The YouTube player is still loading. Try again in a moment.");
            else togglePlayback();
          }
        }} aria-label={playerReady ? "Play video" : "Loading YouTube player"}>
          {playerReady ? <span className="player-overlay-play"><Play size={22} fill="currentColor" /></span> : <span className="player-spinner" />}
        </button>}
        {playerIssue && <div className="player-error"><strong>Video unavailable here</strong><span>{playerIssue}</span><a href={`https://www.youtube.com/watch?v=${encodeURIComponent(id)}`} target="_blank" rel="noreferrer">Open on YouTube ↗</a></div>}
      </div>
      <PlayerControls chapters={chapters} captionsNote />
      <div className="watch-head-row">
        <h1 className="watch-title">{activeVideo?.title ?? "Loading video…"}</h1>
        <div className="watch-head-actions">
          <button className={`glass-button tiny ${theater ? "active" : ""}`} onClick={() => setTheater((value) => !value)} title="Theater mode"><PanelTop size={15} /> {theater ? "Default view" : "Theater"}</button>
          <button className={`glass-button tiny ${settings.autoplay ? "active" : ""}`} onClick={() => updateSettings({ autoplay: !settings.autoplay })} title="Autoplay the next video"><Repeat2 size={15} /> Autoplay {settings.autoplay ? "on" : "off"}</button>
        </div>
      </div>
      <div className="watch-meta-actions">
        <div className="watch-channel-block glass-panel">
          <ChannelAvatar name={activeVideo?.channel ?? "YouTube"} size={44} />
          <div className="watch-channel-info"><strong>{activeVideo?.channel ?? "YouTube creator"}</strong><span>{activeVideo?.channelId ? "Verified creator" : "Creator on YouTube"}</span></div>
          <button className={`subscribe-button ${subscribed ? "subscribed" : ""}`} onClick={() => activeVideo && toggleSubscription(activeVideo.channel)}>{subscribed ? <><Check size={15} /> Subscribed</> : "Subscribe"}</button>
        </div>
        <div className="watch-actions">
          <div className="like-combo glass-panel">
            <button className={liked ? "selected" : ""} onClick={() => activeVideo && react(activeVideo, "like")} aria-pressed={liked}><ThumbsUp size={17} fill={liked ? "currentColor" : "none"} /><span>{liked ? "Liked" : "Like"}</span></button>
            <i />
            <button className={disliked ? "selected" : ""} aria-label="Dislike" onClick={() => activeVideo && react(activeVideo, "dislike")}><ThumbsDown size={17} fill={disliked ? "currentColor" : "none"} /></button>
          </div>
          <button className={`glass-button ${later ? "active" : ""}`} onClick={() => activeVideo && toggleWatchLater(activeVideo)}><ListPlus size={16} /><span>{later ? "Saved" : "Save"}</span></button>
          <button className={`glass-button ${queued ? "active" : ""}`} onClick={() => activeVideo && addToQueue(activeVideo)}><ListVideo size={16} /><span>{queued ? "In queue" : "Queue"}</span></button>
          <button className="glass-button" onClick={copyLink}>{copied ? <Check size={16} /> : <Share2 size={16} />}<span>{copied ? "Copied" : "Share"}</span></button>
          <button className="glass-button" onClick={startParty}><Radio size={16} /><span>{roomSession ? "Join room" : "Watch together"}</span></button>
          <button className="glass-icon-button round more-watch" aria-label="More actions" onClick={() => setShowMore((value) => !value)}><MoreHorizontal size={20} /></button>
          {showMore && <div className="watch-more-menu glass-pop">
            <button onClick={() => { router.push("/rooms"); setShowMore(false); }}><Radio size={16} /> Create a watch party</button>
            <button onClick={() => { pushNotice("Notifications for this channel are local to this demo."); setShowMore(false); }}><Bell size={16} /> Turn on notifications</button>
            <button onClick={() => { void copyLink(); setShowMore(false); }}><Copy size={16} /> Copy link</button>
            <button onClick={() => { router.push(`/search?q=${encodeURIComponent(activeVideo?.channel ?? "")}`); setShowMore(false); }}><Search size={16} /> More from this channel</button>
          </div>}
        </div>
      </div>
      <div className="watch-description glass-panel">
        <div className="watch-description-meta">
          <span>{activeVideo?.views || "—"} views</span>
          <span>{activeVideo?.published || "on YouTube"}</span>
          {activeVideo?.likes && <span><ThumbsUp size={12} /> {activeVideo.likes}</span>}
          {isHistoryItem && <span><Eye size={12} /> in your history</span>}
        </div>
        <p className={descriptionOpen ? "open" : ""}>{activeVideo?.description || "No description was cached for this video."}</p>
        <button className="section-action" onClick={() => setDescriptionOpen((value) => !value)}>{descriptionOpen ? "Show less" : "…more"}</button>
        <details>
          <summary>Video details</summary>
          <p>Video id <code>{id}</code> · played through YouTube&apos;s official embed · {chapters.length} chapter{chapters.length === 1 ? "" : "s"}</p>
        </details>
      </div>

      {chapters.length > 0 && (
        <section className="chapter-strip glass-panel">
          <span className="glass-menu-label">Chapters</span>
          <div className="chapter-list">
            {chapters.map((chapter) => (
              <button key={`${chapter.at}-${chapter.title}`} type="button" className={`chapter-chip glass-chip ${activeChapter?.at === chapter.at ? "active" : ""}`} onClick={() => seekTo(chapter.at)}>
                <span>{formatDuration(chapter.at)}</span> {chapter.title}
              </button>
            ))}
          </div>
        </section>
      )}

      <Comments videoId={id} channel={activeVideo?.channel} />
    </div>

    <aside className="related-column">
      {queue.length > 0 && (
        <section className="queue-card glass-panel">
          <div className="related-heading"><h2>Queue</h2><button className="section-action" onClick={() => { clearQueue(); pushNotice("Queue cleared"); }}>Clear</button></div>
          <div className="queue-list">
            {queue.map((entry) => (
              <div className="queue-row" key={entry.video.id}>
                <img src={entry.video.thumbnail} alt="" loading="lazy" referrerPolicy="no-referrer" />
                <button className="queue-copy" onClick={() => playFromQueue(entry.video.id)}><strong>{entry.video.title}</strong><small>{entry.video.channel}</small></button>
                <button className="glass-icon-button tiny" aria-label="Remove from queue" onClick={() => removeFromQueue(entry.video.id)}><X size={15} /></button>
              </div>
            ))}
          </div>
        </section>
      )}
      <div className="related-heading">
        <h2>{queue.length ? "Up next after queue" : "Up next"}</h2>
        <button className="section-action" onClick={playNext}><SkipForward size={14} /> Play next</button>
      </div>
      <div className="related-list">{related.map((item) => <VideoCard key={item.id} video={item} variant="row" hideMenu />)}</div>

      <section className="notes-section glass-panel">
        <div className="notes-heading"><h2><ListPlus size={16} /> Private notes <span>{notes.length ? `${notes.length} saved` : "on this device"}</span></h2></div>
        <form className="note-form glass-input" onSubmit={addNote}>
          <span className="user-avatar">A</span>
          <input value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="Note a timestamp, a joke, a reminder…" maxLength={400} />
          <button className="glass-button tiny" disabled={!noteText.trim()}>Add note</button>
        </form>
        {notes.length > 0 ? <div className="note-list">{notes.map((note) => (
          <article className="note-item" key={note.id}>
            <span className="user-avatar">A</span>
            <div><strong>You <small>{timeAgo(note.createdAt)}</small></strong><p>{note.text}</p></div>
            <button className="glass-icon-button tiny" aria-label="Delete note" onClick={() => { const next = notes.filter((item) => item.id !== note.id); setNotes(next); writeStorage(`ytglass.notes.${id}`, next); }}><X size={15} /></button>
          </article>
        ))}</div> : <p className="notes-empty">Notes are stored separately from comments, just for you.</p>}
      </section>
    </aside>
  </div>;
}

export default function WatchPageClient() {
  return <Suspense fallback={<div className="page-loading">Loading video…</div>}><WatchExperience /></Suspense>;
}
