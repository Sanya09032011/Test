// Підготовка запису: node scripts/prepare.mjs <проєкт> <файл відео>
// Будь-яке відео з телефона/камери (MOV, HEVC, 4K, 60 fps, поворот) → media/src.mp4 (H.264, 30 fps, до 1080p) + media/src.wav (звук для розпізнавання).
import { join, resolve } from "node:path";
import { existsSync, copyFileSync } from "node:fs";
import { ff, probe, project } from "./_lib.mjs";

const P = project(process.argv[2]);
const input = process.argv[3] && resolve(process.argv[3]);
if (!input || !existsSync(input)) { console.error("✗ Вкажи файл відео: node scripts/prepare.mjs <проєкт> <шлях до відео>"); process.exit(1); }
const i = probe(input);
if (!i.video) { console.error("✗ У файлі немає відео"); process.exit(1); }
if (!i.audio) console.warn("⚠ У відео немає звуку — субтитри й нарізка пауз не спрацюють.");
const vertical = i.h >= i.w;
const scale = vertical ? "scale=1080:-2:flags=lanczos" : "scale=-2:1080:flags=lanczos";
console.log(`… ${i.w}×${i.h}, ${i.fps.toFixed(2)} fps, ${i.dur.toFixed(1)} с → ${vertical ? "вертикальне 9:16" : "горизонтальне 16:9"}`);
ff(["-i", input, "-vf", `${scale},fps=30,format=yuv420p`, "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", join(P, "media", "src.mp4")]);
if (i.audio) ff(["-i", input, "-vn", "-ac", "1", "-ar", "48000", join(P, "media", "src.wav")]);
console.log(`✓ media/src.mp4${i.audio ? " + media/src.wav" : ""} · формат ${vertical ? "9x16" : "16x9"}`);
