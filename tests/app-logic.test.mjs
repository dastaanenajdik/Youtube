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
