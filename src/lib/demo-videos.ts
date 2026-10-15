import type { ChannelProfile, CommunityPost, Video } from "./types";

const thumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

const base = (
  id: string,
  title: string,
  channel: string,
  durationSeconds: number,
  views: string,
  published: string,
  description: string,
  category: string,
  tags: string[],
  likes?: string,
): Video => ({
  id,
  title,
  channel,
  thumbnail: thumb(id),
  duration: formatClock(durationSeconds),
  durationSeconds,
  views,
  published,
  description,
  category,
  tags,
  likes,
});

function formatClock(total: number): string {
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** A local starter feed keeps the UI alive while the live search API warms up. */
export const demoVideos: Video[] = [
  {
    ...base("jfKfPfyJRdk", "lofi hip hop radio 📚 beats to relax / study to", "Lofi Girl", 0, "24K watching", "Live",
      "A live lofi stream for studying, reading and winding down.", "Music", ["lofi", "study", "chill", "Live"]),
    duration: "LIVE",
    isLive: true,
    chapters: [
      { title: "Side A — slow beats", at: 0 },
      { title: "Rainy interlude", at: 1800 },
      { title: "Side B — night drive", at: 3600 },
    ],
  },
  base("5yx6BWlEVcY", "Chillhop Radio — jazzy / lofi beats to relax & study to", "Chillhop Music", 0, "8K watching", "Live",
    "A 24/7 radio of jazzy boom-bap and lofi instrumentals.", "Music", ["lofi", "jazz", "Live"], "180K"),
  base("4NRXx6U8ABQ", "The Weeknd - Blinding Lights (Official Video)", "The Weeknd", 262, "892M views", "6 years ago",
    "The official music video for Blinding Lights by The Weeknd.", "Music", ["music video", "synthwave"], "14M"),
  base("OPf0YbXqDm0", "Mark Ronson - Uptown Funk (Official Video) ft. Bruno Mars", "Mark Ronson", 270, "4.9B views", "10 years ago",
    "Uptown Funk, the biggest party track of its decade.", "Music", ["funk", "party", "music video"], "22M"),
  base("RgKAFK5djSk", "Wiz Khalifa - See You Again ft. Charlie Puth [Official Video]", "Wiz Khalifa", 230, "6.2B views", "10 years ago",
    "A farewell to Paul Walker, and to everybody's favorite action-hero soundtrack.", "Music", ["hip hop", "soundtrack"], "28M"),
  base("JGwWNGJdvx8", "Ed Sheeran - Shape of You (Official Music Video)", "Ed Sheeran", 264, "6.4B views", "9 years ago",
    "The official music video for Shape of You.", "Music", ["pop", "acoustic"], "26M"),
  base("kJQP7kiw5Fk", "Luis Fonsi - Despacito ft. Daddy Yankee", "Luis Fonsi", 282, "8.5B views", "9 years ago",
    "The song that broke the counter.", "Music", ["latin", "pop"], "40M"),
  base("hT_nvWreIhg", "OneRepublic - Counting Stars (Official Music Video)", "OneRepublic", 254, "4.1B views", "12 years ago",
    "Counting Stars from the album Native.", "Music", ["pop rock"], "16M"),
  base("CevxZvSJLk8", "Katy Perry - Roar (Official)", "Katy Perry", 269, "3.9B views", "12 years ago",
    "Roar, the lead single from Prism.", "Music", ["pop"], "12M"),
  base("e-ORhEE9VVg", "Taylor Swift - Blank Space", "Taylor Swift", 231, "3.4B views", "10 years ago",
    "Blank Space, from 1989.", "Music", ["pop", "music video"], "11M"),
  base("2vjPBrBU-TM", "Sia - Chandelier (Official Video)", "Sia", 232, "2.8B views", "11 years ago",
    "Chandelier, choreographed with Maddie Ziegler.", "Music", ["pop", "dance"], "9M"),
  base("60ItHLz5WEA", "Alan Walker - Faded", "Alan Walker", 213, "3.7B views", "10 years ago",
    "The official video for Faded by Alan Walker.", "Music", ["edm"], "15M"),
  base("5NV6Rdv1a3I", "Daft Punk - Get Lucky (Official Audio) ft. Pharrell Williams, Nile Rodgers", "Daft Punk", 369, "1.1B views", "13 years ago",
    "Get Lucky from Random Access Memories.", "Music", ["disco", "funk"], "6M"),
  base("YQHsXMglC9A", "Adele - Hello", "Adele", 367, "3.2B views", "10 years ago",
    "The official video for Hello by Adele.", "Music", ["ballad"], "13M"),
  base("dQw4w9WgXcQ", "Rick Astley - Never Gonna Give You Up (Official Music Video)", "Rick Astley", 213, "1.6B views", "17 years ago",
    "The official video for Never Gonna Give You Up.", "Music", ["80s", "classic"], "18M"),
  {
    ...base("aqz-KE-bpKQ", "Big Buck Bunny — Blender open movie (4K)", "Blender", 635, "41M views", "16 years ago",
      "A classic open movie created with Blender. Free to watch, remix and embed.", "Animation", ["open movie", "3d", "blender"], "620K"),
    chapters: [
      { title: "Morning in the meadow", at: 0 },
      { title: "The three rodents", at: 90 },
      { title: "Payback time", at: 320 },
      { title: "Credits", at: 600 },
    ],
  },
  base("tgbNymZ7vqY", "The Muppets: Bohemian Rhapsody", "The Muppets", 334, "100M views", "16 years ago",
    "The Muppets perform Queen's Bohemian Rhapsody.", "Comedy", ["muppets", "cover"], "900K"),
  base("M7lc1UVf-VE", "YouTube IFrame Player API demo", "YouTube Developers", 144, "3.1M views", "8 years ago",
    "A short demo video used to test embedded playback.", "Technology", ["api", "docs"], "12K"),
  base("ScMzIvxBSi4", "Electric Sheep — generative loop study", "Blender", 118, "410K views", "6 years ago",
    "A looping colour study used as a lightweight demo clip.", "Technology", ["generative", "loop"], "8K"),
  base("b7CzgjJ1d6w", "Ambient screensaver: slow glass gradients", "Glass Tube Studio", 300, "24K views", "3 weeks ago",
    "Looping frosted gradients for demos, backdrops and screenshots.", "Live", ["loop", "aesthetic"], "1.2K"),
];

export const starterShorts: Video[] = [
  "tgbNymZ7vqY", "M7lc1UVf-VE", "aqz-KE-bpKQ", "dQw4w9WgXcQ", "60ItHLz5WEA",
  "4NRXx6U8ABQ", "OPf0YbXqDm0", "CevxZvSJLk8", "JGwWNGJdvx8", "e-ORhEE9VVg",
  "2vjPBrBU-TM", "hT_nvWreIhg",
].map((id, index) => {
  const source = demoVideos.find((video) => video.id === id) ?? demoVideos[index % demoVideos.length];
  const seconds = 18 + ((index * 7) % 40);
  return {
    ...source,
    isShort: true,
    duration: formatClock(seconds),
    durationSeconds: seconds,
    category: "Shorts",
    views: `${(index + 3) * 371}K views`,
    published: ["2 hours ago", "yesterday", "3 days ago", "1 week ago"][index % 4],
  };
});

export const categories = [
  "All", "Music", "Live", "Shorts", "Technology", "Animation", "Comedy", "Gaming", "Podcasts", "Travel", "Recently uploaded",
];

/** The "Your channel" page, ported from the classic HTML clone's `your_channel.html`. */
export const myChannel: ChannelProfile = {
  name: "Glass Tube Studio",
  handle: "@glasstube",
  tagline: "Comedy edits, code experiments and the odd 4K screensaver. Frosted glass only. 😶‍🌫️",
  subscribers: "2.45K",
  videoCount: 379,
  joined: "Joined 12 Mar 2019",
  location: "Ranchi, India",
  links: [
    { label: "glasstube.dev", href: "https://example.com/glasstube" },
    { label: "instagram.com/glasstube", href: "https://example.com/glasstube-ig" },
  ],
};

export const myUploads: Video[] = [
  base("b7CzgjJ1d6w", "Ambient screensaver: slow glass gradients (4K loop)", myChannel.name, 300, "24K views", "3 weeks ago",
    "Looping frosted gradients for demos, backdrops and screenshots.", "Live", ["loop", "aesthetic"], "1.2K"),
  base("M7lc1UVf-VE", "I built a YouTube player in a weekend (devlog)", myChannel.name, 144, "18K views", "2 months ago",
    "How the embedded player, seek bar and mini-player actually work.", "Technology", ["devlog", "nextjs"], "980"),
  base("aqz-KE-bpKQ", "Re-cutting Big Buck Bunny for a vertical feed", myChannel.name, 635, "9.4K views", "5 months ago",
    "A behind-the-scenes look at re-framing a 16:9 film for shorts.", "Animation", ["editing"], "610"),
  base("tgbNymZ7vqY", "When the band shows up but the song is still Queen", myChannel.name, 334, "142K views", "8 months ago",
    "Puppet rock, one take.", "Comedy", ["muppets", "music"], "7.7K"),
  base("dQw4w9WgXcQ", "I let autoplay pick my workout playlist", myChannel.name, 213, "56K views", "1 year ago",
    "It chose the same song 14 times. I have never felt more seen.", "Comedy", ["autoplay", "prank"], "3.1K"),
  base("60ItHLz5WEA", "Faded, but every drop is a UI transition", myChannel.name, 213, "31K views", "1 year ago",
    "An edit where each drop swaps the interface theme.", "Comedy", ["edit", "motion"], "2.4K"),
];

export const communityPosts: CommunityPost[] = [
  {
    id: "post-poll",
    author: myChannel.name,
    text: "Which shelf should get a full page next?",
    at: Date.now() - 6 * 3_600_000,
    likes: 412,
    poll: [
      { label: "Trending gaming", votes: 812 },
      { label: "Podcast clips", votes: 466 },
      { label: "Live radio", votes: 388 },
    ],
  },
  {
    id: "post-glass",
    author: myChannel.name,
    text: "Every button in this clone is frosted glass now. Blur 26px, 1px light border, one highlight on top. Say it with me: backdrop-filter is a lifestyle. 🧊",
    at: Date.now() - 2 * 86_400_000,
    likes: 1_204,
  },
  {
    id: "post-upload",
    author: myChannel.name,
    text: "New upload: a 4K ambient loop you can leave running behind a video call. Link on the Videos tab.",
    at: Date.now() - 5 * 86_400_000,
    likes: 743,
  },
];

export function shortsPool(): Video[] {
  return starterShorts;
}

export function allDemoVideos(): Video[] {
  return [...demoVideos, ...starterShorts, ...myUploads];
}

export function localSearch(query: string): Video[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return demoVideos;
  const pool = allDemoVideos();
  const scored = pool
    .map((video) => {
      const text = `${video.title} ${video.channel} ${video.category ?? ""} ${(video.tags ?? []).join(" ")} ${video.description ?? ""}`.toLowerCase();
      return { video, score: words.reduce((sum, word) => sum + (text.includes(word) ? 1 : 0), 0) };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.map(({ video }) => video);
}
