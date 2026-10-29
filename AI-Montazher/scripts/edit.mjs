// Чернетка монтажного листа edit.json: node scripts/edit.mjs <проєкт> [--style pop] [--format 9x16|16x9] [--music music/house-vibez.mp3] [--force]
// Сам визначає режим: є media/cut.mp4 → монтаж запису; є voice.json → ролик з озвучкою.
// Далі агент додає в edit.json події (events), ключові слова, переходи, обкладинку — за docs/EDIT-JSON.md.
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { probe, project, readJSON, STUDIO, writeJSON } from "./_lib.mjs";

const P = project(process.argv[2]);
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const out = join(P, "edit.json");
if (existsSync(out) && !process.argv.includes("--force")) { console.log("• edit.json уже є — не перезаписую (додай --force, щоб створити заново)"); process.exit(0); }

const cutMp4 = join(P, "media", "cut.mp4"), voice = join(P, "voice.json");
const music = arg("--music", existsSync(join(P, "media", "music.mp3")) ? "media/music.mp3" : "music/" + (existsSync(join(STUDIO, "public", "music", "house-vibez.mp3")) ? "house-vibez.mp3" : readdirSync(join(STUDIO, "public", "music")).find((f) => f.endsWith(".mp3")) ?? ""));
const style = arg("--style", "pop");
let edit;
if (existsSync(cutMp4)) {
  const ct = readJSON(join(P, "cut_transcript.json")), i = probe(cutMp4);
  const format = arg("--format", i.h >= i.w ? "9x16" : "16x9");
  edit = {
    format, base: { kind: "video", src: "media/cut.mp4", fit: format === "9x16" && i.w > i.h ? "card" : "cover", zoom: true, segments: readJSON(join(P, "segments.json"), []).map((s) => ({ at: s.at, dur: s.dur })) },
    duration: ct.duration, background: "blobs", words: ct.words,
    captions: { preset: style, position: "bottom" }, keywords: [], events: [], transitions: [],
    music: { src: music, volume: 0.06 }, sfx: true, cover: null, end: { title: "Підпишись" },
  };
} else if (existsSync(voice)) {
  const v = readJSON(voice);
  edit = {
    format: arg("--format", "9x16"), base: { kind: "voice", src: "media/voice.mp3" }, duration: +(v.duration + 0.4).toFixed(2), background: "grid", words: v.words,
    captions: { preset: style, position: "bottom" }, keywords: [], events: [], transitions: [],
    music: { src: music, volume: 0.08 }, sfx: true, cover: null, end: { title: "Підпишись" },
  };
} else { console.error("✗ Немає ні media/cut.mp4 (монтаж запису), ні voice.json (озвучка). Спершу cut.mjs або tts.mjs."); process.exit(1); }
writeJSON(out, edit);
console.log(`✓ edit.json: ${edit.base.kind === "video" ? "монтаж запису" : "ролик з озвучкою"}, ${edit.format}, ${edit.duration.toFixed(1)} с, ${edit.words.length} слів, субтитри «${style}»`);
console.log("  Далі: додай events/keywords/transitions/cover (docs/EDIT-JSON.md) → node scripts/render.mjs " + process.argv[2] + " --draft");
