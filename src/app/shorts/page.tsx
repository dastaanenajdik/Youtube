"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, MessageCircle, Play, Share2, ThumbsDown, ThumbsUp, Volume2, VolumeX, X } from "lucide-react";
import { starterShorts } from "@/lib/demo-videos";
import { countValue } from "@/lib/feed";
import type { Video } from "@/lib/types";
import { useApp } from "@/components/Providers";
import { ChannelAvatar } from "@/components/VideoCard";
import EmbedPlayerView from "@/components/EmbedPlayerView";
import Comments from "@/components/Comments";

function ShortsExperience() {
  const router = useRouter();
  const params = useSearchParams();
  const { cacheVideos, videos, subscribedChannels, toggleSubscription, reactions, react, pushNotice, openVideo } = useApp();
  const [items, setItems] = useState<Video[]>(starterShorts);
  const [index, setIndex] = useState(() => {
    const byId = params.get("v") ? starterShorts.findIndex((video) => video.id === params.get("v")) : -1;
    const byIndex = Number(params.get("i"));
    if (byIndex >= 0 && byIndex < starterShorts.length) return byIndex;
    return byId >= 0 ? byId : 0;
  });
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [muted, setMuted] = useState(true);
  const shellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/search?q=popular%20youtube%20shorts&limit=14", { signal: controller.signal })
      .then(async (response) => {
        const result = (await response.json()) as { videos?: Video[] };
        if (response.ok && result.videos?.length) {
          const mapped = result.videos.map((video) => ({ ...video, isShort: true }));
          setItems(mapped);
          cacheVideos(mapped);
        }
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [cacheVideos]);

  const merged = useMemo(() => {
    const pool = items.map((item) => videos[item.id] ?? item);
    return pool.length ? pool : starterShorts;
  }, [items, videos]);

  const current = merged[Math.min(index, merged.length - 1)] ?? starterShorts[0];
  const reaction = reactions[current?.id];
  const subscribed = subscribedChannels.includes(current?.channel ?? "");

  const go = useCallback((delta: number) => {
    setIndex((value) => {
      const next = (value + delta + merged.length) % merged.length;
      router.replace(`/shorts?v=${encodeURIComponent(merged[next]?.id ?? "")}&i=${next}`);
      return next;
    });
  }, [merged, router]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (event.key === "ArrowDown" || event.key === "j") { event.preventDefault(); go(1); }
      if (event.key === "ArrowUp" || event.key === "k") { event.preventDefault(); go(-1); }
      if (event.key === "m") setMuted((value) => !value);
      if (event.key === "l" && current) react(current, "like");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, current, react]);

  const share = async () => {
    const link = `${window.location.origin}/shorts?v=${current.id}&i=${index}`;
    try {
      await navigator.clipboard.writeText(link);
      pushNotice("Short link copied");
    } catch {
      pushNotice(link);
    }
  };

  const likeCount = countValue(current?.likes || current?.views) || 0;

  return <div className="shorts-page" ref={shellRef}>
    <div className="shorts-title-row">
      <div>
        <span className="eyebrow">A vertical feed</span>
        <h1><span className="shorts-mark"><Play size={14} fill="currentColor" /></span> Shorts</h1>
        <p>Arrow keys or the glass buttons to move · <kbd>m</kbd> mute · <kbd>l</kbd> like</p>
      </div>
      <span className="glass-chip">{merged.length} clips · {index + 1}/{merged.length}</span>
    </div>

    <div className="shorts-viewer">
      <div className="shorts-steps glass-panel">
        <button className="glass-icon-button round" aria-label="Previous short" onClick={() => go(-1)}><ChevronUp size={20} /></button>
        <span className="shorts-step-count">{index + 1}</span>
        <button className="glass-icon-button round" aria-label="Next short" onClick={() => go(1)}><ChevronDown size={20} /></button>
        <button
          className={`glass-icon-button round ${muted ? "" : "active"}`}
          aria-label={muted ? "Unmute" : "Mute"}
          title={muted ? "Unmute this clip" : "Mute this clip"}
          onClick={() => setMuted((value) => !value)}
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      <div className="shorts-card glass-panel">
        <EmbedPlayerView
          videoId={current?.id ?? ""}
          vertical
          muted={muted}
          autoplay
          variant="compact"
          className="shorts-embed"
          onEnded={() => go(1)}
        />
        <div className="shorts-overlay-info">
          <div className="shorts-caption">
            <div className="shorts-channel">
              <ChannelAvatar name={current?.channel ?? "YouTube"} size={32} />
              <div>
                <strong>{current?.channel ?? "YouTube creator"}</strong>
                <small>{current?.views || "Popular on YouTube"}</small>
              </div>
              <button className={`subscribe-button ${subscribed ? "subscribed" : ""}`} onClick={() => current && toggleSubscription(current.channel)}>
                {subscribed ? "Subscribed" : "Subscribe"}
              </button>
            </div>
            <h2>{current?.title ?? "Pick a short to start the feed"}</h2>
            <p>{current?.published || "Fresh from YouTube"} · {current?.duration ?? "0:30"}</p>
            <button className="shorts-watch-link" onClick={() => { openVideo(current, true); router.push(`/watch?v=${current.id}`); }}>Watch full video <span>→</span></button>
          </div>

          <div className="shorts-actions">
            <button className={reaction === "like" ? "liked" : ""} aria-label={reaction === "like" ? "Unlike" : "Like"} onClick={() => current && react(current, "like")}>
              <span className="shorts-action-icon"><ThumbsUp size={19} fill={reaction === "like" ? "currentColor" : "none"} /></span>
              <span>{likeCount > 0 ? `${(likeCount / 1000).toFixed(1).replace(/\.0$/, "")}K` : "Like"}</span>
            </button>
            <button className={reaction === "dislike" ? "liked" : ""} aria-label="Dislike" onClick={() => current && react(current, "dislike")}>
              <span className="shorts-action-icon"><ThumbsDown size={19} fill={reaction === "dislike" ? "currentColor" : "none"} /></span>
              <span>Dislike</span>
            </button>
            <button aria-label="Comments" onClick={() => setCommentsOpen(true)}>
              <span className="shorts-action-icon"><MessageCircle size={19} /></span>
              <span>Comments</span>
            </button>
            <button aria-label="Share short" onClick={share}>
              <span className="shorts-action-icon"><Share2 size={19} /></span>
              <span>Share</span>
            </button>
          </div>
        </div>
        {!current?.isShort && <span className="shorts-note">This clip is not a real short — it is standing in for the vertical feed.</span>}
      </div>

      <aside className="shorts-upnext glass-panel">
        <h2>Up next</h2>
        <div className="shorts-upnext-list">
          {merged.slice(0, 8).map((video, position) => (
            <button key={`${video.id}-${position}`} className={position === index ? "active" : ""} onClick={() => { setIndex(position); router.replace(`/shorts?v=${video.id}&i=${position}`); }}>
              <img src={video.thumbnail} alt="" loading="lazy" referrerPolicy="no-referrer" />
              <span>{video.title}</span>
            </button>
          ))}
        </div>
      </aside>
    </div>

    <p className="shorts-footer-note">Shorts here are real YouTube embeds. Some creators disable embedding, so a clip may show a black frame — press the next arrow and keep moving.</p>

    {commentsOpen && (
      <div className="sheet-scrim" onMouseDown={() => setCommentsOpen(false)}>
        <div className="comment-sheet glass-pop" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-label="Comments">
          <header>
            <strong>{current?.channel ?? "This short"}</strong>
            <button className="glass-icon-button tiny" aria-label="Close comments" onClick={() => setCommentsOpen(false)}><X size={17} /></button>
          </header>
          <Comments videoId={current?.id ?? ""} channel={current?.channel} variant="sheet" limit={4} />
        </div>
      </div>
    )}
  </div>;
}

export default function ShortsPage() {
  return <Suspense fallback={<div className="page-loading">Loading the Shorts feed…</div>}><ShortsExperience /></Suspense>;
}
