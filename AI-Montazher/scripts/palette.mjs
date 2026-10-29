// Кольори бренду з картинки (логотип, фото, референс): node scripts/palette.mjs <картинка PNG/JPG> [кількість=6]
// Друкує головні кольори в HEX — їх агент вписує в studio/src/config.ts (accent, accent2, ink, paper).
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const file = process.argv[2] && resolve(process.argv[2]), n = +(process.argv[3] || 6);
if (!file || !existsSync(file)) { console.error("✗ Вкажи картинку PNG або JPG (SVG спершу збережи як PNG)"); process.exit(1); }
let b;
try { b = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-vf", "scale=96:96:flags=area,format=rgba", "-frames:v", "1", "-f", "rawvideo", "-"]); }
catch { console.error("✗ Не вдалося прочитати картинку (SVG спершу збережи як PNG)"); process.exit(1); }
// рахуємо пікселі по «кошиках» кольорів, прозорі пропускаємо
const bins = new Map();
for (let i = 0; i + 3 < b.length; i += 4) {
  if (b[i + 3] < 128) continue;
  const k = `${b[i] >> 4},${b[i + 1] >> 4},${b[i + 2] >> 4}`;
  const v = bins.get(k) || { n: 0, r: 0, g: 0, b: 0 };
  v.n++; v.r += b[i]; v.g += b[i + 1]; v.b += b[i + 2]; bins.set(k, v);
}
const cols = [...bins.values()].sort((x, y) => y.n - x.n).map((v) => [v.r / v.n, v.g / v.n, v.b / v.n].map(Math.round));
const out = [];
for (const c of cols) { if (out.every((o) => Math.abs(o[0] - c[0]) + Math.abs(o[1] - c[1]) + Math.abs(o[2] - c[2]) > 70)) out.push(c); if (out.length >= n) break; }
const hex = (c) => "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();
const lum = (c) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2], sat = (c) => Math.max(...c) - Math.min(...c);
console.log("Кольори (від найчастішого):", out.map(hex).join("  "));
const byS = [...out].sort((a, c) => sat(c) - sat(a)), byL = [...out].sort((a, c) => lum(a) - lum(c));
console.log(`Пропозиція для config.ts → accent: "${hex(byS[0])}", accent2: "${hex(byS[1] ?? byS[0])}", ink: "${hex(byL[0])}", paper: "${hex(byL[byL.length - 1])}"`);
