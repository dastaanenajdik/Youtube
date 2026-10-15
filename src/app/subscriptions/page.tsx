"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Radio, Tv2 } from "lucide-react";
import { useApp } from "@/components/Providers";
import { demoVideos } from "@/lib/demo-videos";
import VideoGrid from "@/components/VideoGrid";
import { ChannelAvatar } from "@/components/VideoCard";
import SectionHeading from "@/components/SectionHeading";

export default function SubscriptionsPage() {
  const router = useRouter();
  const { subscribedChannels, toggleSubscription, videos, history, pushNotice } = useApp();
  const pool = [...Object.values(videos), ...demoVideos];
  const subscribedVideos = pool.filter((video) => subscribedChannels.includes(video.channel));
  const watchedIds = new Set(history.map((record) => record.video.id));
  const unseen = subscribedVideos.filter((video) => !watchedIds.has(video.id));

  return <div className="subscriptions-page">
    <div className="page-title-row">
      <div><span className="eyebrow">Your channels</span><h1>Subscriptions</h1><p>Latest uploads from creators you follow, plus the notifications they generate on this device.</p></div>
      <span className="glass-chip">{subscribedChannels.length} channels · {unseen.length} unseen</span>
    </div>

    {subscribedChannels.length > 0 && <div className="subscription-channels">
      {subscribedChannels.map((channel) => (
        <div className="subscription-channel glass-panel" key={channel}>
          <ChannelAvatar name={channel} size={44} />
          <div className="subscription-copy">
            <strong>{channel}</strong>
            <small>{pool.filter((video) => video.channel === channel).length} videos cached here</small>
          </div>
          <button className="glass-chip micro" onClick={() => pushNotice("Notifications for this channel stay inside this demo.")} aria-label="Notification settings"><Bell size={13} /></button>
          <Link className="glass-chip micro" href={`/channel?c=${encodeURIComponent(channel)}`}>Channel</Link>
          <button onClick={() => toggleSubscription(channel)}>Subscribed</button>
        </div>
      ))}
    </div>}

    {subscribedVideos.length ? <>
      <section className="feed-section">
        <SectionHeading eyebrow="From your channels" title={unseen.length ? "New to you" : "Everything from your channels"} />
        <VideoGrid videos={unseen.length ? unseen : subscribedVideos} />
      </section>
      <section className="feed-section">
        <SectionHeading eyebrow="Replay" title="Already on your radar" />
        <VideoGrid videos={subscribedVideos.filter((video) => watchedIds.has(video.id))} emptyMessage="You have not watched anything from these channels yet." />
      </section>
    </> : <div className="empty-state subscriptions-empty">
      <div className="empty-state-icon"><Tv2 size={24} /></div>
      <strong>Your subscriptions are just getting started</strong>
      <span>Open a video and tap Subscribe — the channel, its uploads and a bell item all show up here.</span>
      <div className="empty-state-actions">
        <Link className="glass-button primary" href="/">Explore home</Link>
        <button className="glass-button" onClick={() => router.push("/rooms")}><Radio size={15} /> Watch together instead</button>
      </div>
    </div>}
  </div>;
}
