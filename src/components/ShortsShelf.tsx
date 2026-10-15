"use client";

import { useState } from "react";
import { ChevronDown, Play, PlaySquare, X } from "lucide-react";
import type { Video } from "@/lib/types";

/**
 * The Shorts rail that the classic clone painted inside its home feed, plus a
 * "Show less" collapse and a dismiss button so the shelf is optional.
 */
export default function ShortsShelf({
  videos,
  onOpen,
  onDismiss,
  title = "Shorts",
  eyebrow = "The vertical feed",
  initial = 6,
}: {
  videos: Video[];
  onOpen: (video: Video, index: number) => void;
  onDismiss?: () => void;
  title?: string;
  eyebrow?: string;
  initial?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!videos.length) return null;
  const visible = expanded ? videos : videos.slice(0, initial);

  return (
    <section className="shorts-shelf glass-panel">
      <header className="shorts-shelf-head">
        <span className="shorts-shelf-mark"><PlaySquare size={16} /></span>
        <div className="shorts-shelf-copy">
          <span className="eyebrow">{eyebrow}</span>
          <h3>{title}</h3>
        </div>
        {videos.length > initial && (
          <button type="button" className="glass-button ghost tiny" onClick={() => setExpanded((value) => !value)}>
            {expanded ? "Show less" : "Show more"}
            <ChevronDown size={15} className={expanded ? "flip-up" : ""} />
          </button>
        )}
        {onDismiss && <button type="button" className="glass-icon-button tiny" aria-label={`Hide ${title} shelf`} onClick={onDismiss}><X size={16} /></button>}
      </header>
      <div className="shorts-rail">
        {visible.map((video, index) => (
          <button type="button" key={`${video.id}-${index}`} className="short-tile" onClick={() => onOpen(video, index)}>
            <span className="short-tile-media">
              <img src={video.thumbnail} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.style.opacity = "0"; }} />
              <span className="short-tile-shade" />
              <span className="short-tile-play"><Play size={16} fill="currentColor" /></span>
            </span>
            <strong>{video.title}</strong>
            <small>{video.views || "New"} · {video.published || "on YouTube"}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
