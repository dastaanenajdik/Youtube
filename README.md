# YouTube Glass

A glassmorphism-first rebuild of the classic YouTube layout — home feed, category rail, Shorts,
watch page, channel, library, history, playlists, search, settings and watch-together rooms — on
Next.js, React, TypeScript and the official YouTube IFrame Player API.

Every surface in this app is frosted glass: buttons, chips, sidebars, drawers, popovers, toasts,
player controls, comment sheets and the mobile tab bar all come from one shared recipe in
`src/app/globals.css` (translucent fill + hairline light border + inner top highlight +
`backdrop-filter: blur() saturate()` over a fixed aurora backdrop). Switching theme or accent
re-tints the entire shell at once.

Video playback always stays inside YouTube's own embedded player, borrowed from
[Sidify V2](https://github.com/dastaanenajdik/Sidify-V2)'s navigation language; the page layout,
route list and feature inventory are adapted from
[omavcher/YouTube-Clone](https://github.com/omavcher/YouTube-Clone) (MIT — see `NOTICE.md`).

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts: `npm run build`, `npm start`, `npm run lint`, `npm run typecheck`, `npm test`.

## Feature map (and where it came from)

| Source clone page | Where it lives now |
| --- | --- |
| `index.html` — hamburger + sidebar cards, chip row, 4-up video cards with duration badge, verified tick, `views · age`, Shorts shelf with "Show more" | `/` with `Sidebar`, `CategoryRail`, `VideoCard`, `ShortsShelf` (collapsible + dismissible) |
| `shorts.html` — full-height vertical rows, `@username`, subscribe, like/dislike/comment/share rail, "up next" button | `/shorts` with a real embedded player, tap-to-pause, glass action rail, up-next list and step counter |
| `history.html` — "Today"/"Yesterday" grouping, per-card remove, trash + pause controls | `/history` with day grouping, per-day clear, search filter, resume card and history pause |
| `your_channel.html` — banner + avatar + `@handle · subscribers · videos`, tab chips, running preview with progress/volume/captions/gear/expand, "For You" row, Shorts row | `/channel` with banner, tab rail + channel search, featured-upload preview driven by the same shared player state, Videos / Shorts / Playlists / Community / Membership / Manage-videos tabs |

Stack note: the original clone is static HTML with Bootstrap 5.3.3 + Font Awesome 6.5.1 and no
application JavaScript. Its markup and layout intent were ported, but the Next.js + TypeScript +
`lucide-react` stack was kept — a Bootstrap + Font Awesome stylesheet would have thrown away the
working player, API routes, rooms and persistence. Icons are `lucide-react`, styling is hand-written
CSS custom properties (no CSS framework, no icon font, no third-party images).

## What's on top of the source clone

- **Design system**: dark and light frosted themes, four accent palettes, reduced-motion switch,
  collapsible icon-only sidebar rail, mobile bottom tab bar, live mini-player that survives navigation.
- **⌘K / `/` command palette** — jump to pages, run actions, find any cached video.
- **Player controls** built in glass: play/pause, ±10s, scrubbing with chapter ticks, volume,
  playback rate (0.5×–2×), captions toggle, fullscreen, theater mode, "up next" chapter chip.
- **Keyboard**: `k` play/pause (global), `↑`/`↓` and `j`/`k` on the watch page, `m` mute, `l` like.
- **Queue** — add any video to a queue, autoplay-next into it, manage it from the watch sidebar or
  the Library "Queue" tab.
- **Local comments** on watch and Shorts (device-only, sortable Top/Newest, like + delete), plus
  per-video watch notes and a reactions bar.
- **Notifications** popover with unread badge, derived from your subscriptions; subscription
  toggles from cards, watch page and channel.
- **Watch-later, likes, playlists** (create/delete/add/remove) and search history, all persisted in
  `localStorage` under `ytglass.*.v1`.
- **Channel extras**: community posts with working polls, membership tiers (demo only), and a
  "Manage videos" tab that stores public/unlisted/private visibility per video.
- **Explore** (category grid, fresh/live/trending cuts), **search** with sort modes and category
  chips plus a fallback link to real YouTube results, and a **Watch-together** room with join codes,
  presence, chat and synchronized play/pause/seek.
- **Live metadata** through `youtubei.js` at `/api/search` (5-minute cache) and thumbnails from
  `i.ytimg.com`; everything degrades to a local demo catalogue when the network is unavailable.

## Important playback and deployment notes

This app does **not** remove, skip, or block YouTube ads. YouTube controls the ads and playback
experience inside its official embed, and some videos disallow embedding or require sign-in. Search
uses public YouTube InnerTube metadata through `youtubei.js`; upstream changes or network access can
temporarily make live results unavailable.

Watch-together room state is held in process memory for this starter. It works for the local/preview
server process, but production deployments with multiple server instances should replace
`src/lib/room-store.ts` with a shared store (for example Redis or Postgres) and add production-grade
authorization/rate limits. Library, search history, comments, queue, playlists and settings are
stored locally in the browser and can be wiped from `/settings`.
