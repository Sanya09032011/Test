// Розпізнавання мовлення з таймінгами слів (ElevenLabs Scribe): node scripts/stt.mjs <проєкт> [файл звуку] [мова]
// За замовчуванням: media/src.wav → transcript.json. Мова: ukr (українська), eng, pol, deu… або auto.
import { readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { needKey, project, writeJSON } from "./_lib.mjs";

const P = project(process.argv[2]);
const file = process.argv[3] ? resolve(process.argv[3]) : join(P, "media", "src.wav");
const lang = process.argv[4] || "ukr";
const out = process.argv[3] ? join(P, "check_transcript.json") : join(P, "transcript.json");
const fd = new FormData();
fd.append("file", new Blob([readFileSync(file)]), basename(file));
fd.append("model_id", "scribe_v1");
if (lang !== "auto") fd.append("language_code", lang);
fd.append("timestamps_granularity", "word");
fd.append("tag_audio_events", "false");
const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": needKey() }, body: fd });
if (!res.ok) { console.error("✗ HTTP", res.status, await res.text()); process.exit(1); }
const d = await res.json();
const words = (d.words || []).filter((w) => w.type === "word").map((w) => ({ text: w.text, start: +w.start.toFixed(3), end: +w.end.toFixed(3) }));
writeJSON(out, { text: d.text, language: d.language_code, words });
console.log(`✓ ${basename(out)}: ${words.length} слів, ${words.at(-1)?.end ?? 0} с\n${d.text}`);
