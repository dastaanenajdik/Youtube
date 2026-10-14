"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Heart, MessageCircle, Share2, Volume2 } from "lucide-react";
import { starterShorts } from "@/lib/demo-videos";
import type { Video } from "@/lib/types";
import { useApp } from "@/components/Providers";
import { ChannelAvatar } from "@/components/VideoCard";

export default function ShortsPage() {
  const router = useRouter();
  const { cacheVideos, likedIds, toggleLiked, toggleWatchLater, pushNotice, openVideo } = useApp();
  const [items, setItems] = useState<Video[]>(starterShorts);
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/search?q=popular%20youtube%20shorts&limit=12", { signal: controller.signal })
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

  const current = items[index] ?? starterShorts[0];
  const liked = likedIds.includes(current.id);
  const next = useCallback(() => setIndex((value) => (value + 1) % Math.max(items.length, 1)), [items.length]);
  const previous = useCallback(() => setIndex((value) => (value - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1)), [items.length]);
  const share = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/watch?v=${current.id}`);
      pushNotice("Video link copied");
    } catch {
      pushNotice("Could not copy the link.");
    }
  };
  const recommendations = items.length;

  useEffect(() => {
    setLoaded(false);
    setMuted(true);
  }, [current.id]);

  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: muted ? "mute" : "unMute", args: [] }), "https://www.youtube.com");
  }, [muted, current.id]);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") next();
      if (event.key === "ArrowUp") previous();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [next, previous]);

  return <div className="shorts-page">
    <div className="shorts-title-row"><div><span className="eyebrow">A vertical feed</span><h1><span className="shorts-mark">▶</span> Shorts</h1><p>Swipe or use the arrows to find your next quick watch.</p></div><span className="count-pill">{recommendations} clips</span></div>
    <div className="shorts-viewer">
      <button className="shorts-step previous" aria-label="Previous short" onClick={previous}><ChevronUp size={22} /></button>
      <div className="shorts-card glass-panel">
        <div className="shorts-embed-wrap">
          <iframe
            key={current.id}
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${encodeURIComponent(current.id)}?playsinline=1&controls=1&rel=0&autoplay=0&mute=1&enablejsapi=1`}
            title={current.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            onLoad={() => setLoaded(true)}
          />
          {!loaded && <div className="shorts-embed-loading"><span className="player-spinner" /></div>}
        </div>
        <div className="shorts-overlay-info"><div className="shorts-caption"><div className="shorts-channel"><ChannelAvatar name={current.channel} size={32} /><strong>{current.channel}</strong></div><h2>{current.title}</h2><p>{current.views || "Popular on YouTube"} · {current.published || "Quick watch"}</p><button className="shorts-watch-link" onClick={() => { openVideo(current, true); router.push(`/watch?v=${current.id}`); }}>Watch full video <span>→</span></button></div>
          <div className="shorts-actions"><button className={liked ? "liked" : ""} aria-label={liked ? "Unlike" : "Like"} onClick={() => toggleLiked(current)}><Heart size={20} fill={liked ? "currentColor" : "none"} /><span>{liked ? "Liked" : "Like"}</span></button><button aria-label="Save to Watch later" onClick={() => { toggleWatchLater(current); pushNotice("Saved to Watch later"); }}><MessageCircle size={20} /><span>Save</span></button><button aria-label="Share short" onClick={share}><Share2 size={20} /><span>Share</span></button><button aria-label={muted ? "Unmute" : "Mute"} onClick={() => setMuted((value) => !value)}><Volume2 size={20} /><span>{muted ? "Sound" : "Mute"}</span></button></div>
        </div>
      </div>
      <button className="shorts-step next" aria-label="Next short" onClick={next}><ChevronDown size={22} /></button>
    </div>
    <div className="shorts-footer-note">The vertical feed is a demo using embeddable YouTube videos. Actual Shorts eligibility and playback are determined by YouTube.</div>
  </div>;
}
