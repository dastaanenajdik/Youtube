import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function loadTypeScript(relativePath, overrides = {}) {
  const source = fs.readFileSync(path.join(root, relativePath), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  const fakeModule = { exports: {} };
  const localRequire = (specifier) => Object.hasOwn(overrides, specifier) ? overrides[specifier] : require(specifier);
  new Function("require", "module", "exports", outputText)(localRequire, fakeModule, fakeModule.exports);
  return fakeModule.exports;
}

const format = loadTypeScript("src/lib/format.ts");
const roomStore = loadTypeScript("src/lib/room-store.ts", { "./format": format });

const video = {
  id: "4NRXx6U8ABQ",
  title: "Blinding Lights",
  channel: "The Weeknd",
  thumbnail: "https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg",
  duration: "4:22",
  durationSeconds: 262,
  views: "892M views",
  published: "6 years ago",
};

test("duration helpers handle long and short YouTube runtimes", () => {
  assert.equal(format.formatDuration(262), "4:22");
  assert.equal(format.formatDuration(3_661), "1:01:01");
  assert.equal(format.parseDuration("1:02:03"), 3_723);
  assert.equal(format.parseDuration("not a time"), 0);
});

test("video sanitizing rejects invalid ids and normalizes valid metadata", () => {
  assert.equal(format.cleanVideo({ ...video, id: "bad" }), null);
  const cleaned = format.cleanVideo(video);
  assert.equal(cleaned.id, video.id);
  assert.equal(cleaned.durationSeconds, 262);
  assert.equal(cleaned.thumbnail, video.thumbnail);
});

test("watch-party state supports join, synchronized controls, chat and leave", () => {
  const created = roomStore.createRoom({ memberId: `host-${Date.now()}`, name: "Host", video, isPlaying: true, positionSeconds: 8 });
  const code = created.room.code;
  assert.match(code, /^[A-Z0-9]{6,8}$/);
  assert.equal(created.room.members.length, 1);
  assert.equal(created.room.video.id, video.id);

  const guest = roomStore.joinRoom(code, `guest-${Date.now()}`, "Guest");
  assert.equal(guest.members.length, 2);

  const paused = roomStore.controlRoom(code, { action: "pause", positionSeconds: 42 });
  assert.equal(paused.isPlaying, false);
  assert.equal(paused.positionSeconds, 42);
  assert.equal(paused.stateVersion, created.room.stateVersion + 1);

  const resumed = roomStore.controlRoom(code, { action: "play" });
  assert.equal(resumed.isPlaying, true);
  const message = roomStore.addMessage(code, guest.members[1].id, "Guest", "Hello room!");
  assert.equal(message.messages.at(-1).text, "Hello room!");

  const left = roomStore.leaveRoom(code, guest.members[1].id);
  assert.equal(left.members.length, 1);
});

const feed = loadTypeScript("src/lib/feed.ts");

const pool = [
  { ...video, id: "aaaaaaaaaaa", title: "Lo-fi radio", channel: "Chill Lab", category: "Music", tags: ["study"], views: "1.2M views", published: "3 hours ago", durationSeconds: 3600, isLive: true },
  { ...video, id: "bbbbbbbbbbb", title: "Glass CSS in 8 minutes", channel: "Design Basics", category: "Design", tags: ["css"], views: "84K views", published: "2 days ago", durationSeconds: 480 },
  { ...video, id: "ccccccccccc", title: "Vertical clip about trains", channel: "Rail Daily", category: "Travel", tags: ["trains"], views: "12K views", published: "5 weeks ago", durationSeconds: 45, isShort: true },
  { ...video, id: "ddddddddddd", title: "Deep work documentary", channel: "Studio Notes", category: "Podcasts", tags: ["focus"], views: "9K views", published: "1 year ago", durationSeconds: 5400 },
];

test("category rail filtering understands Live, Shorts and free-text categories", () => {
  assert.equal(feed.filterByCategory(pool, "All").length, pool.length);
  assert.deepEqual(feed.filterByCategory(pool, "Live").map((item) => item.id), ["aaaaaaaaaaa"]);
  assert.deepEqual(feed.filterByCategory(pool, "Shorts").map((item) => item.id), ["ccccccccccc"]);
  assert.deepEqual(feed.filterByCategory(pool, "design").map((item) => item.id), ["bbbbbbbbbbb"]);
  assert.deepEqual(feed.filterByCategory(pool, "trains").map((item) => item.id), ["ccccccccccc"]);
});

test("the local recommender promotes followed channels and demotes already-watched videos", () => {
  const ranked = feed.rankByAffinity(pool, { channels: ["Studio Notes"], likedIds: [], searches: ["css"], watchedIds: ["Chill Lab"].length ? ["aaaaaaaaaaa"] : [] });
  assert.equal(ranked[0].id, "ddddddddddd");
  assert.ok(ranked.findIndex((item) => item.id === "bbbbbbbbbbb") < ranked.findIndex((item) => item.id === "ccccccccccc"));
  assert.equal(feed.scoreByAffinity(pool[0], { watchedIds: ["aaaaaaaaaaa"] }), -1);
  assert.ok(feed.scoreByAffinity(pool[1], { searches: ["css glass"] }) > feed.scoreByAffinity(pool[3], { searches: ["css glass"] }));
});

test("sorting and view counting work on human-readable metadata", () => {
  assert.deepEqual(feed.sortVideos(pool, "views").map((item) => item.id), ["aaaaaaaaaaa", "bbbbbbbbbbb", "ccccccccccc", "ddddddddddd"]);
  assert.deepEqual(feed.sortVideos(pool, "duration").map((item) => item.id), ["ddddddddddd", "aaaaaaaaaaa", "bbbbbbbbbbb", "ccccccccccc"]);
  assert.deepEqual(feed.sortVideos(pool, "newest").map((item) => item.id), ["aaaaaaaaaaa", "bbbbbbbbbbb", "ccccccccccc", "ddddddddddd"]);
  const original = pool.map((item) => item.id);
  feed.sortVideos(pool, "views");
  assert.deepEqual(pool.map((item) => item.id), original, "sorting must not mutate the input");
  assert.equal(feed.countValue("1.2M views"), 1_200_000);
  assert.equal(feed.countValue("84K"), 84_000);
  assert.equal(feed.countValue("no numbers"), 0);
  assert.equal(feed.countValue(4200), 4200);
});

test("freshness helpers understand relative publish labels", () => {
  assert.equal(feed.ageInDays("3 hours ago"), 0.125);
  assert.equal(feed.ageInDays("2 days ago"), 2);
  assert.equal(feed.ageInDays("1 year ago"), 365);
  assert.equal(feed.ageInDays("Streamed live 2 hours ago"), 2 / 24);
  assert.equal(feed.isFresh("6 days ago"), true);
  assert.equal(feed.isFresh("8 days ago"), false);
  assert.equal(feed.isFresh("8 days ago", 30), true);
});

test("watch history is grouped into Today, Yesterday and dated days", () => {
  const now = new Date("2026-02-14T18:30:00Z").getTime();
  const day = 86_400_000;
  const records = [
    { video: pool[0], watchedAt: now - 40 * 60 * 1000, positionSeconds: 12, completed: false },
    { video: pool[1], watchedAt: now - day - 5 * 60 * 60 * 1000, positionSeconds: 40, completed: true },
    { video: pool[2], watchedAt: now - 9 * day, positionSeconds: 9, completed: false },
  ].map((record) => ({ ...record, video: record.video }));
  const days = feed.groupByDay(records, now);
  assert.equal(days.length, 3);
  assert.deepEqual(days.map((item) => item.records.length), [1, 1, 1]);
  assert.match(days[0].label, /Today|Feb/);
  assert.ok(days[1].label === "Yesterday" || /1[23]/.test(days[1].label));
  assert.ok(days[2].key < days[0].key);
});

test("queues and shelves stay de-duplicated and wrap around", () => {
  const duplicated = [{ ...pool[0] }, { ...pool[0] }, { ...pool[1] }];
  assert.deepEqual(feed.dedupeVideos(duplicated).map((item) => item.id), ["aaaaaaaaaaa", "bbbbbbbbbbb"]);
  assert.deepEqual(feed.dedupeVideos(duplicated, "aaaaaaaaaaa").map((item) => item.id), ["bbbbbbbbbbb"]);
  assert.deepEqual(feed.takeEvery(pool, 6).map((item) => item.id).slice(0, 4), ["aaaaaaaaaaa", "bbbbbbbbbbb", "ccccccccccc", "ddddddddddd"]);
  assert.equal(feed.takeEvery(pool, 6)[4].id, "aaaaaaaaaaa");
  assert.deepEqual(feed.takeEvery([], 4), []);
});

test("video ids can be pasted as urls and notifications describe the right kind", () => {
  assert.equal(feed.shortIdFromUrl("  aaaaaaaaaaa "), "aaaaaaaaaaa");
  assert.equal(feed.shortIdFromUrl("https://www.youtube.com/watch?v=bbbbbbbbbbb&t=30"), "bbbbbbbbbbb");
  assert.equal(feed.shortIdFromUrl("https://youtu.be/ccccccccccc"), "ccccccccccc");
  assert.equal(feed.shortIdFromUrl("https://www.youtube.com/shorts/ddddddddddd"), "ddddddddddd");
  assert.equal(feed.shortIdFromUrl("https://example.com/nope"), null);

  const notifications = feed.buildNotifications(["Chill Lab", "Nobody"], pool);
  assert.ok(notifications.length >= 2);
  assert.equal(notifications[0].channel, "Chill Lab");
  assert.equal(notifications[0].kind, "live");
  assert.ok(notifications.every((item) => item.at <= Date.now()));
  assert.equal(new Set(notifications.map((item) => item.id)).size, notifications.length);
});
