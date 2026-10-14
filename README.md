# YouTube Glass

A glassmorphism-first video discovery/watch-party prototype built with Next.js, React, TypeScript and the official YouTube IFrame Player API. The shell borrows the frosted-glass navigation language from [Sidify V2](https://github.com/dastaanenajdik/Sidify-V2); video playback remains inside YouTube's own embedded player.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Features

- Responsive home feed, category filters, personalized shelf based on recent searches, and a recent-watch shelf.
- YouTube-style search backed by `youtubei.js` metadata search, with loading/error states and local demo picks for the home feed.
- Watch page with the official YouTube IFrame API, related videos, comments UI, save/like/watch-later actions, and a persistent mini-player when navigating away.
- Shorts-style vertical feed, subscriptions, library, history, playlists, and browser-local persistence.
- Watch-together rooms with join codes, member presence, chat, and play/pause/seek/video synchronization using a same-origin polling API.

## Important playback and deployment notes

This app does **not** remove, skip, or block YouTube ads. YouTube controls the ads and playback experience inside its official embed, and some videos may disallow embedding or require sign-in. Search uses public YouTube InnerTube metadata through `youtubei.js`; upstream changes or network access can temporarily make live results unavailable.

Watch-together room state is held in process memory for this starter. It works for the local/preview server process, but production deployments with multiple server instances should replace `src/lib/room-store.ts` with a shared store (for example Redis or Postgres) and add production-grade authorization/rate limits. User library, search history, and playlists are stored locally in the browser.
