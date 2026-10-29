// Спільне для всіх скриптів AI-Монтажера: шляхи, ключ ElevenLabs, ffmpeg, JSON.
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync, spawnSync } from "node:child_process";

export const KIT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const STUDIO = join(KIT, "studio");
export const INBOX = join(KIT, "ЗАНЕСИ-СЮДИ");

/** ключі: спершу змінні середовища, потім файл .env у корені комплекту */
export function env() {
  const out = {};
  const p = join(KIT, ".env");
  if (existsSync(p)) for (const l of readFileSync(p, "utf8").replace(/^﻿/, "").split(/\r?\n/)) {
    const s = l.trim(); if (!s || s.startsWith("#") || !s.includes("=")) continue;
    out[s.slice(0, s.indexOf("=")).trim()] = s.slice(s.indexOf("=") + 1).trim();
  }
  for (const k of ["ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID", "ELEVENLABS_MODEL"]) if (process.env[k]) out[k] = process.env[k];
  return out;
}
export function needKey() {
  const k = env().ELEVENLABS_API_KEY;
  if (!k) { console.error("✗ Немає ключа ElevenLabs. Відкрий файл .env у корені AI-Montazher і впиши ключ після ELEVENLABS_API_KEY= (див. docs/VOICE.md)."); process.exit(1); }
  return k;
}

/** папка проєкту: повний шлях або назва в projects/ */
export function project(arg) {
  if (!arg) { console.error("✗ Вкажи папку проєкту, напр.: node scripts/render.mjs projects/001-my-reel"); process.exit(1); }
  const p = existsSync(arg) ? resolve(arg) : join(KIT, "projects", arg);
  if (!existsSync(p)) { console.error("✗ Немає папки " + p); process.exit(1); }
  mkdirSync(join(p, "media"), { recursive: true });
  return p;
}
export const pid = (p) => basename(p).replace(/[^\p{L}\d_-]+/gu, "-");

export const readJSON = (p, d) => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8").replace(/^﻿/, "")) : d);
export const writeJSON = (p, v) => writeFileSync(p, JSON.stringify(v, null, 2));

export function ff(args, opts = {}) { return execFileSync("ffmpeg", ["-hide_banner", "-nostdin", "-y", ...args], { stdio: opts.quiet === false ? "inherit" : ["ignore", "pipe", "pipe"], maxBuffer: 1 << 26 }); }
export function probe(file) {
  const j = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", file], { encoding: "utf8" }));
  const v = j.streams.find((s) => s.codec_type === "video"), a = j.streams.find((s) => s.codec_type === "audio");
  let w = v?.width, h = v?.height;
  const rot = Math.abs(+(v?.tags?.rotate ?? v?.side_data_list?.find((d) => d.rotation !== undefined)?.rotation ?? 0));
  if (rot === 90 || rot === 270) [w, h] = [h, w];
  return { dur: +j.format.duration, w, h, fps: v ? eval(v.r_frame_rate) : 0, audio: !!a, video: !!v };
}
/** гучність під соцмережі: −14 LUFS, пік не вище −1 dB (відео не перекодовується) */
export function loudnorm(input, output) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostdin", "-i", input, "-af", "loudnorm=I=-14:TP=-1:print_format=summary", "-f", "null", "-"], { encoding: "utf8" });
  const I = +((r.stderr || "").match(/Input Integrated:\s+(-?[\d.]+)/)?.[1] ?? -14);
  const gain = Math.max(-20, Math.min(20, -14 - I));
  ff(["-i", input, "-c:v", "copy", "-af", `volume=${gain.toFixed(2)}dB,alimiter=limit=0.84:level=disabled`, "-c:a", "aac", "-b:a", "256k", output]);
  return { before: I, gain };
}
export const listFiles = (dir, re) => (existsSync(dir) ? readdirSync(dir).filter((f) => re.test(f)).map((f) => join(dir, f)) : []);
