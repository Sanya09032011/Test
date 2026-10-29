// Стікерпак з картинок: прибирає однотонний фон (білий, зелений, будь-який), обрізає порожні краї → PNG з прозорістю.
// node scripts/stickers.mjs <картинка або папка> [--grid 3x3] [--name hero]
//   --grid 3x3 — якщо на одній картинці сітка з 9 стікерів (так їх зручно генерувати), розрізає на окремі.
// Результат: studio/public/stickers/<name>-N.png (у ролику: { "type": "sticker", "src": "stickers/<name>-N.png" }).
// Порада: генеруйте стікери на ОДНОТОННОМУ яскраво-зеленому (#00FF00) або білому фоні — так фон прибирається чисто.
import { existsSync, mkdirSync, statSync, readdirSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { STUDIO } from "./_lib.mjs";

const input = process.argv[2] && resolve(process.argv[2]);
if (!input || !existsSync(input)) { console.error("✗ Вкажи картинку або папку: node scripts/stickers.mjs \"ЗАНЕСИ-СЮДИ/2 бренд і стікери\""); process.exit(1); }
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const grid = (arg("--grid", "1x1")).split("x").map(Number);
const OUT = join(STUDIO, "public", "stickers");
mkdirSync(OUT, { recursive: true });
const files = statSync(input).isDirectory() ? readdirSync(input).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).map((f) => join(input, f)) : [input];

const rgbAt = (file, x, y, w = 6, h = 6) => {
  const b = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-vf", `crop=${w}:${h}:${x}:${y},scale=1:1:flags=area,format=rgb24`, "-frames:v", "1", "-f", "rawvideo", "-"]);
  return [b[0], b[1], b[2]];
};
const size = (file) => execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,pix_fmt", "-of", "csv=p=0", file], { encoding: "utf8" }).trim().split(",");
const hex = (c) => c.map((v) => v.toString(16).padStart(2, "0")).join("");
let n = 0;
for (const file of files) {
  const [W, H] = size(file).map(Number), [cols, rows] = grid, cw = Math.floor(W / cols), ch = Math.floor(H / rows);
  const base = (arg("--name", basename(file, extname(file)))).toLowerCase().replace(/[^\p{L}\d]+/gu, "-");
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const crop = `crop=${cw}:${ch}:${c * cw}:${r * ch}`;
    const tmp = join(OUT, `_tmp.png`);
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", file, "-vf", crop, tmp]);
    // колір фону — з кутів клітинки
    const cs = [[2, 2], [cw - 8, 2], [2, ch - 8], [cw - 8, ch - 8]].map(([x, y]) => rgbAt(tmp, x, y));
    const bg = cs[0].map((_, k) => Math.round(cs.reduce((s, v) => s + v[k], 0) / 4));
    const spread = Math.max(...cs.map((v) => Math.abs(v[0] - bg[0]) + Math.abs(v[1] - bg[1]) + Math.abs(v[2] - bg[2])));
    const green = bg[1] > 150 && bg[0] < 120 && bg[2] < 120;
    const key = spread > 60 ? "" : `colorkey=0x${hex(bg)}:${green ? 0.3 : 0.12}:0.08,${green ? "despill=type=green," : ""}`;
    if (spread > 60) console.warn(`⚠ ${basename(file)} [${r + 1},${c + 1}]: фон не однотонний — лишаю як є (краще згенерувати на однотонному фоні)`);
    // межі непрозорого вмісту
    const det = spawnSync("ffmpeg", ["-v", "info", "-i", tmp, "-vf", `format=rgba,${key}alphaextract,cropdetect=limit=24:round=2:reset=0`, "-frames:v", "1", "-f", "null", "-"], { encoding: "utf8" });
    const m = [...(det.stderr || "").matchAll(/crop=(\d+):(\d+):(\d+):(\d+)/g)].pop();
    const pad = 12, cropC = m ? `crop=${Math.min(cw, +m[1] + pad * 2)}:${Math.min(ch, +m[2] + pad * 2)}:${Math.max(0, +m[3] - pad)}:${Math.max(0, +m[4] - pad)},` : "";
    const name = `${base}${rows * cols > 1 || files.length > 1 ? "-" + (++n) : ""}.png`;
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", tmp, "-vf", `format=rgba,${key}${cropC}scale='min(800,iw)':-1:flags=lanczos`, "-pix_fmt", "rgba", join(OUT, name)]);
    console.log(`✓ stickers/${name}${key ? ` (фон #${hex(bg)} прибрано)` : ""}`);
  }
}
try { execFileSync(process.execPath, ["-e", `require("fs").rmSync(${JSON.stringify(join(OUT, "_tmp.png"))},{force:true})`]); } catch {}
