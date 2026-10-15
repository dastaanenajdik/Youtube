"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BadgeCheck, Bell, Check, ExternalLink, Eye, Image as ImageIcon, ListVideo, Lock,
  Moon, PlaySquare, Radio, Search, Send, Share2, SlidersHorizontal, ThumbsUp, Users, Video as VideoIcon,
} from "lucide-react";
import { communityPosts, demoVideos, myChannel, myUploads, starterShorts } from "@/lib/demo-videos";
import { countValue } from "@/lib/feed";
import type { ChannelProfile, CommunityPost, Video, Visibility } from "@/lib/types";
import { useApp } from "@/components/Providers";
import VideoCard, { ChannelAvatar } from "@/components/VideoCard";
import EmbedPlayerView from "@/components/EmbedPlayerView";

const TABS = ["Home", "Videos", "Shorts", "Live", "Playlists", "Community", "Manage videos"] as const;
type Tab = (typeof TABS)[number];

const MEMBERSHIP = [
  { id: "supporter", label: "Supporter", price: "₹49 / mo", perks: "Custom badge + emoji set" },
  { id: "insider", label: "Insider", price: "₹149 / mo", perks: "Early cuts, monthly Q&A" },
  { id: "studio", label: "Studio pass", price: "₹499 / mo", perks: "Project files + name in credits" },
];

function deriveProfile(name: string): ChannelProfile {
  if (name === myChannel.name) return myChannel;
  const uploads = [...demoVideos, ...myUploads].filter((video) => video.channel === name);
  const totalViews = uploads.reduce((sum, video) => sum + countValue(video.views), 0);
  return {
    name,
    handle: `@${name.toLowerCase().replace(/[^a-z0-9]+/g, "")}`,
    tagline: uploads[0]?.description ?? "A creator you subscribed to while exploring this demo.",
    subscribers: totalViews > 0 ? `${(totalViews / 1_000_000).toFixed(1).replace(/\.0$/, "")}M` : "—",
    videoCount: uploads.length || 12,
    joined: "Joined some years ago",
    location: "On YouTube",
    links: [{ label: "youtube.com", href: "https://www.youtube.com" }],
  };
}

function ChannelExperience() {
  const router = useRouter();
  const params = useSearchParams();
  const requested = params.get("c");
  const tab = (params.get("tab") as Tab) ?? "Home";
  const profile = useMemo(() => deriveProfile(requested ?? myChannel.name), [requested]);
  const isOwn = !requested || requested === myChannel.name;

  const { playlists, videos, subscribedChannels, toggleSubscription, pushNotice, comments, addComment, visibility, setVisibility, settings, updateSettings } = useApp();
  const [query, setQuery] = useState("");
  const [membership, setMembership] = useState<string>("");
  const [posts, setPosts] = useState<CommunityPost[]>(communityPosts);
  const [draft, setDraft] = useState("");
  const [voted, setVoted] = useState<Record<string, number>>({});

  const cachedPool = useMemo(() => [...Object.values(videos), ...demoVideos, ...myUploads, ...starterShorts], [videos]);
  const uploads = useMemo(() => {
    const pool = isOwn ? myUploads : cachedPool.filter((video) => video.channel === profile.name);
    const base = pool.length ? pool : isOwn ? myUploads : cachedPool.slice(0, 6);
    return query ? base.filter((video) => `${video.title} ${video.description ?? ""}`.toLowerCase().includes(query.toLowerCase())) : base;
  }, [cachedPool, isOwn, profile.name, query]);

  const shorts = useMemo(() => starterShorts.slice(0, 6), []);
  const live = useMemo(() => [...demoVideos, ...myUploads].filter((video) => video.isLive), []);
  const featured: Video = uploads[0] ?? myUploads[0];
  const subscribed = subscribedChannels.includes(profile.name);
  const totalViews = useMemo(() => uploads.reduce((sum, video) => sum + countValue(video.views), 0), [uploads]);
  const setTab = (next: Tab) => {
    const search = new URLSearchParams(params.toString());
    search.set("tab", next);
    if (!isOwn) search.set("c", profile.name);
    router.replace(`/channel?${search.toString()}`);
  };

  const publish = () => {
    const text = draft.trim();
    if (!text) return;
    setPosts((previous) => [{ id: `post-${Date.now()}`, author: profile.name, text: text.slice(0, 500), at: Date.now(), likes: 0 }, ...previous]);
    setDraft("");
    pushNotice("Posted to your community tab (local only)");
  };

  return <div className="channel-page">
    {!isOwn && <button className="back-link" onClick={() => router.push("/")}>← Back to the feed</button>}

    <section className="channel-hero glass-panel">
      <div className="channel-banner">
        <span className="banner-orb orb-one" /><span className="banner-orb orb-two" /><span className="banner-orb orb-three" />
        <div className="banner-noise" />
        <div className="banner-tags">
          <span className="glass-chip micro"><Radio size={12} /> glass-first redesign</span>
          <span className="glass-chip micro">{profile.joined}</span>
          <span className="glass-chip micro"><Users size={12} /> {profile.location}</span>
        </div>
      </div>
      <div className="channel-identity">
        <span className="channel-avatar huge tone-2">{profile.name.slice(0, 2).toUpperCase()}</span>
        <div className="channel-identity-copy">
          <h1>{profile.name} <BadgeCheck size={19} className="verified-icon" /></h1>
          <p className="channel-sub">{profile.handle} · {profile.subscribers} subscribers · {profile.videoCount} videos{totalViews > 0 ? ` · ${Math.round(totalViews / 1000).toLocaleString()}K views` : ""}</p>
          <p className="channel-tagline">{profile.tagline}</p>
          <div className="channel-links">
            {profile.links.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noreferrer"><ExternalLink size={13} /> {link.label}</a>)}
            <span className="channel-links-more">{profile.links.length - 1} more</span>
          </div>
        </div>
        <div className="channel-actions">
          <button className="glass-button primary" onClick={() => { if (!subscribed) toggleSubscription(profile.name); pushNotice(subscribed ? "Unsubscribed" : `Subscribed to ${profile.name}`); }}>
            {subscribed ? <><Check size={15} /> Subscribed</> : "Subscribe"}
          </button>
          {isOwn ? (
            <>
              <button className="glass-button" onClick={() => { setTab("Manage videos"); }}><SlidersHorizontal size={15} /> Manage videos</button>
              <button className="glass-button" onClick={() => updateSettings({ theme: settings.theme === "dark" ? "light" : "dark" })}>
                <Moon size={15} /> {settings.theme === "dark" ? "Light preview" : "Dark preview"}
              </button>
              <button className="glass-button" onClick={() => pushNotice("Channel customisation lives in the studio editor — this demo keeps it on your device.")}>Customise channel</button>
            </>
          ) : (
            <>
              <button className="glass-button" onClick={() => { setMembership("supporter"); }}><Users size={15} /> Join</button>
              <button className="glass-button" onClick={() => pushNotice("Notifications are local to this demo.")}><Bell size={15} /> Bell</button>
            </>
          )}
        </div>
      </div>
      <div className="channel-tabs-row">
        <div className="channel-tabs">
          {TABS.map((item) => <button key={item} className={`glass-chip ${tab === item ? "active" : ""}`} onClick={() => setTab(item)}>{item}</button>)}
        </div>
        <label className="channel-search glass-input">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${profile.name}`} aria-label="Search this channel" />
        </label>
      </div>
    </section>

    {tab === "Home" && (
      <div className="channel-home">
        <section className="channel-feature glass-panel">
          <EmbedPlayerView videoId={featured.id} title={featured.title} className="channel-feature-player" onEnded={() => undefined} />
          <div className="channel-feature-copy">
            <span className="eyebrow">Featured upload</span>
            <h2>{featured.title}</h2>
            <p className="channel-feature-meta">{featured.views} · {featured.published} · {featured.duration}</p>
            <p className="channel-feature-desc">{featured.description}</p>
            <div className="channel-feature-buttons">
              <button className="glass-button primary" onClick={() => { router.push(`/watch?v=${featured.id}`); }}><PlaySquare size={15} /> Open in the player</button>
              <button className="glass-button" onClick={() => {
                const link = `${window.location.origin}/watch?v=${featured.id}`;
                navigator.clipboard?.writeText(link).then(() => pushNotice("Link copied")).catch(() => pushNotice(link));
              }}><Share2 size={15} /> Share</button>
              <span className="glass-chip micro"><ThumbsUp size={12} /> {featured.likes ?? "—"}</span>
            </div>
          </div>
        </section>

        <section className="feed-section">
          <div className="section-heading"><div><span className="eyebrow">Channel mix</span><h2>For You</h2></div><button className="section-action" onClick={() => setTab("Videos")}>All videos →</button></div>
          <div className="video-grid">{uploads.slice(0, 4).map((video) => <VideoCard key={video.id} video={video} />)}</div>
        </section>

        <section className="feed-section">
          <div className="section-heading"><div><span className="eyebrow">Vertical</span><h2><PlaySquare size={17} /> Shorts</h2></div><button className="section-action" onClick={() => router.push("/shorts")}>Open the feed →</button></div>
          <div className="shorts-grid">{shorts.map((video) => (
            <button key={video.id} className="short-tile glass-panel" onClick={() => router.push(`/shorts?v=${video.id}`)}>
              <span className="short-tile-media">
                <img src={video.thumbnail} alt="" loading="lazy" referrerPolicy="no-referrer" />
                <span className="short-tile-shade" />
              </span>
              <strong>{video.title}</strong>
              <small>{video.views}</small>
            </button>
          ))}</div>
        </section>
      </div>
    )}

    {(tab === "Videos" || tab === "Live") && (
      <section className="channel-grid-section">
        <div className="section-heading">
          <div><span className="eyebrow">{tab === "Live" ? "Scheduled" : "Uploads"}</span><h2>{tab === "Live" ? "Live and ambient" : `Videos${query ? ` matching “${query}”` : ""}`}</h2></div>
          <span className="glass-chip">{(tab === "Live" ? live : uploads).length} items</span>
        </div>
        <div className="video-grid">{(tab === "Live" ? live : uploads).map((video) => <VideoCard key={video.id} video={video} />)}</div>
      </section>
    )}

    {tab === "Shorts" && (
      <section className="channel-grid-section">
        <div className="section-heading"><div><span className="eyebrow">Vertical</span><h2>Shorts</h2></div><span className="glass-chip">{shorts.length} clips</span></div>
        <div className="shorts-grid">{starterShorts.map((video) => (
          <button key={video.id} className="short-tile glass-panel" onClick={() => router.push(`/shorts?v=${video.id}`)}>
            <span className="short-tile-media"><img src={video.thumbnail} alt="" loading="lazy" referrerPolicy="no-referrer" /><span className="short-tile-shade" /></span>
            <strong>{video.title}</strong>
            <small>{video.views}</small>
          </button>
        ))}</div>
      </section>
    )}

    {tab === "Playlists" && (
      <section className="channel-grid-section">
        <div className="section-heading"><div><span className="eyebrow">Collections</span><h2>Playlists</h2></div><Link href="/library?tab=playlists" className="section-action">Manage →</Link></div>
        {playlists.length ? <div className="playlist-grid">{playlists.map((playlist) => {
          const first = videos[playlist.videoIds[0]] ?? demoVideos[0];
          return <Link className="playlist-card glass-panel" key={playlist.id} href={`/playlist/${playlist.id}`}>
            <img src={first.thumbnail} alt="" />
            <div className="playlist-card-shade"><ListVideo size={25} /></div>
            <div className="playlist-card-copy"><strong>{playlist.name}</strong><span>{playlist.videoIds.length} videos · Private</span></div>
          </Link>;
        })}</div> : <div className="empty-state"><div className="empty-state-icon"><ListVideo size={24} /></div><strong>No playlists on this channel yet</strong><span>Use the “+” in the sidebar or the library to make one.</span></div>}
      </section>
    )}

    {tab === "Community" && (
      <section className="channel-community">
        <div className="section-heading"><div><span className="eyebrow">Posts, polls and updates</span><h2>Community</h2></div><span className="glass-chip"><Users size={12} /> {profile.subscribers}</span></div>
        <form className="post-composer glass-panel" onSubmit={(event) => { event.preventDefault(); publish(); }}>
          <span className="user-avatar">A</span>
          <textarea value={draft} onChange={(event) => setDraft(event.target.value.slice(0, 500))} placeholder="Share an update with your subscribers…" rows={3} aria-label="New community post" />
          <div className="post-composer-foot">
            <span className="glass-chip micro"><ImageIcon size={12} /> Attach thumbnail (mock)</span>
            <button type="submit" className="glass-button primary tiny" disabled={!draft.trim()}><Send size={14} /> Post</button>
          </div>
        </form>
        <div className="post-list">
          {posts.map((post) => {
            const totalVotes = (post.poll ?? []).reduce((sum, option) => sum + option.votes, 0);
            return (
              <article className="post-card glass-panel" key={post.id}>
                <header>
                  <ChannelAvatar name={post.author} size={34} />
                  <div><strong>{post.author}</strong><small>{new Date(post.at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</small></div>
                  <span className="glass-chip micro"><Check size={12} /> Public</span>
                </header>
                <p>{post.text}</p>
                {post.poll && (
                  <div className="post-poll">
                    {post.poll.map((option, position) => {
                      const votes = option.votes + (voted[`${post.id}:${position}`] ?? 0);
                      const share = totalVotes ? Math.round((votes / Math.max(totalVotes + Object.keys(voted).length, 1)) * 100) : 0;
                      return (
                        <button key={option.label} type="button" className="poll-option" onClick={() => setVoted((previous) => ({ ...previous, [`${post.id}:${position}`]: (previous[`${post.id}:${position}`] ?? 0) + 1 }))}>
                          <span className="poll-fill" style={{ width: `${Math.min(100, share)}%` }} />
                          <span className="poll-label">{option.label}</span>
                          <span className="poll-value">{share}%</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                <footer>
                  <span className="glass-chip micro"><ThumbsUp size={12} /> {post.likes.toLocaleString()}</span>
                  <span className="glass-chip micro"><Eye size={12} /> {totalVotes || post.likes * 3}</span>
                </footer>
              </article>
            );
          })}
        </div>
      </section>
    )}

    {tab === "Manage videos" && (
      <section className="channel-manage">
        <div className="section-heading">
          <div><span className="eyebrow">Studio</span><h2>Manage videos</h2><p className="section-sub">Visibility is remembered in this browser, exactly like a real studio would remember it server-side.</p></div>
          <span className="glass-chip"><VideoIcon size={12} /> {uploads.length} uploads</span>
        </div>
        <div className="manage-list">
          {uploads.map((video) => (
            <article className="manage-row glass-panel" key={video.id}>
              <img src={video.thumbnail} alt="" loading="lazy" referrerPolicy="no-referrer" />
              <div className="manage-copy">
                <strong>{video.title}</strong>
                <small>{video.views} · {video.published} · {(comments[video.id]?.length ?? 0)} local comment{comments[video.id]?.length === 1 ? "" : "s"}</small>
                <div className="manage-tools">
                  {(["public", "unlisted", "private"] as Visibility[]).map((option) => (
                    <button key={option} type="button" className={`glass-chip micro ${(visibility[video.id] ?? "public") === option ? "active" : ""}`} onClick={() => setVisibility(video.id, option)}>
                      {option === "public" ? <Check size={12} /> : option === "unlisted" ? <LinkIcon /> : <Lock size={12} />} {option}
                    </button>
                  ))}
                  <button type="button" className="glass-chip micro" onClick={() => addComment(video.id, "Thanks for watching — pinned by the studio bot.")}><Send size={12} /> Pin a reply</button>
                </div>
              </div>
              <div className="manage-metrics">
                <span>{video.duration}</span>
                <em>{(visibility[video.id] ?? "public")}</em>
              </div>
            </article>
          ))}
        </div>
      </section>
    )}

    {membership && (
      <div className="sheet-scrim" onMouseDown={() => setMembership("")}>
        <div className="membership-sheet glass-pop" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-label="Channel membership">
          <h2>Join {profile.name}</h2>
          <p>Pick a tier. Nothing is charged in this demo — the choice is only stored locally.</p>
          <div className="membership-grid">
            {MEMBERSHIP.map((tier) => (
              <button key={tier.id} type="button" className={`membership-card glass-panel ${membership === tier.id ? "selected" : ""}`} onClick={() => { setMembership(tier.id); pushNotice(`You joined as ${tier.label} (demo only)`); }}>
                <strong>{tier.label}</strong>
                <span>{tier.price}</span>
                <small>{tier.perks}</small>
              </button>
            ))}
          </div>
          <button className="glass-button" onClick={() => setMembership("")}>Close</button>
        </div>
      </div>
    )}
  </div>;
}

function LinkIcon() {
  return <ExternalLink size={12} />;
}

export default function ChannelPage() {
  return <Suspense fallback={<div className="page-loading">Loading the channel…</div>}><ChannelExperience /></Suspense>;
}
