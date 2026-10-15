"use client";

import { useMemo, useState } from "react";
import { ArrowBigUp, MessageSquareMore, Send, ThumbsUp, Trash2 } from "lucide-react";
import { useApp } from "./Providers";
import { ChannelAvatar } from "./VideoCard";
import { timeAgo } from "@/lib/format";
import type { CommentEntry } from "@/lib/types";

const SEED_AUTHORS = ["Ravi Kumar", "pixel_priya", "north_east_nerd", "glass_gazer", "midnight_moderator"];

function seedComments(videoId: string, channel: string): CommentEntry[] {
  const hash = [...videoId].reduce((total, char) => total + char.charCodeAt(0), 0);
  return [
    {
      id: `seed-${videoId}-1`,
      videoId,
      author: SEED_AUTHORS[hash % SEED_AUTHORS.length],
      text: `The frosted overlay on this player is doing something weird to my brain in the best way. ${channel} would be proud.`,
      at: Date.now() - (hash % 40 + 3) * 3_600_000,
      likes: (hash * 13) % 420,
    },
    {
      id: `seed-${videoId}-2`,
      videoId,
      author: SEED_AUTHORS[(hash + 2) % SEED_AUTHORS.length],
      text: "Timestamp for anyone who wants the good part: everything after the intro. Watching on a 4K monitor, still crisp.",
      at: Date.now() - (hash % 90 + 12) * 3_600_000,
      likes: (hash * 7) % 240,
    },
  ];
}

export default function Comments({
  videoId,
  channel = "the creator",
  variant = "panel",
  limit = 6,
}: {
  videoId: string;
  channel?: string;
  variant?: "panel" | "sheet";
  limit?: number;
}) {
  const { comments, addComment, toggleCommentLike, removeComment } = useApp();
  const [sort, setSort] = useState<"top" | "newest">("top");
  const [draft, setDraft] = useState("");
  const [showAll, setShowAll] = useState(false);
  const own = useMemo(() => comments[videoId] ?? [], [comments, videoId]);
  const list = useMemo(() => {
    const merged = [...own, ...seedComments(videoId, channel)];
    return sort === "newest" ? merged.sort((a, b) => b.at - a.at) : merged.sort((a, b) => b.likes - a.likes || b.at - a.at);
  }, [own, videoId, channel, sort]);
  const visible = showAll ? list : list.slice(0, limit);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    addComment(videoId, text);
    setDraft("");
    setSort("newest");
    setShowAll(true);
  };

  return (
    <section className={`comments ${variant === "sheet" ? "is-sheet" : ""}`}>
      <header className="comments-head">
        <h2><MessageSquareMore size={16} /> {list.length} Comments</h2>
        <div className="comments-sort glass-toggle">
          <button type="button" className={sort === "top" ? "active" : ""} onClick={() => setSort("top")}>Top</button>
          <button type="button" className={sort === "newest" ? "active" : ""} onClick={() => setSort("newest")}>Newest</button>
        </div>
      </header>
      <form
        className="comment-composer glass-input"
        onSubmit={(event) => { event.preventDefault(); submit(); }}
      >
        <span className="user-avatar">A</span>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value.slice(0, 600))}
          placeholder="Add a comment on this device only…"
          aria-label="Add a comment"
          maxLength={600}
        />
        <button type="submit" className="glass-button primary tiny" disabled={!draft.trim()}><Send size={14} /> Comment</button>
      </form>
      <div className="comment-list">
        {visible.map((comment) => {
          const isOwn = own.some((item) => item.id === comment.id);
          return (
            <article className="comment-item" key={comment.id}>
              <ChannelAvatar name={comment.author} size={32} />
              <div className="comment-body">
                <strong>{isOwn ? "You" : `@${comment.author.toLowerCase().replace(/\s+/g, "")}`} <small>{timeAgo(comment.at)}</small></strong>
                <p>{comment.text}</p>
                <div className="comment-tools">
                  <button type="button" className={`glass-chip micro ${comment.liked ? "active" : ""}`} onClick={() => toggleCommentLike(videoId, comment.id)}>
                    <ThumbsUp size={13} /> {comment.likes}
                  </button>
                  {isOwn && <button type="button" className="glass-chip micro danger" onClick={() => removeComment(videoId, comment.id)}><Trash2 size={13} /> Delete</button>}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {list.length > limit && (
        <button type="button" className="glass-button ghost tiny" onClick={() => setShowAll((value) => !value)}>
          {showAll ? "Show fewer replies" : `Show ${list.length - limit} more`}
        </button>
      )}
      <p className="comments-note"><ArrowBigUp size={13} /> Likes and replies live in this browser; nothing is posted to YouTube.</p>
    </section>
  );
}
