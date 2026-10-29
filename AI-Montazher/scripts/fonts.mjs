// Завантажує шрифти студії в studio/public/fonts, щоб рендер не ходив у Google Fonts: node scripts/fonts.mjs
// Потрібно лише раз (або після додавання шрифту в studio/src/reel/fonts.ts). Файли вже лежать у комплекті.
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { STUDIO } from "./_lib.mjs";

const require = createRequire(join(STUDIO, "package.json"));
const src = readFileSync(join(STUDIO, "src", "reel", "fonts.ts"), "utf8");
const families = [...src.matchAll(/@remotion\/google-fonts\/(\w+)/g)].map((m) => m[1]);
const dir = join(STUDIO, "public", "fonts");
mkdirSync(dir, { recursive: true });

export const fontFile = (url) => url.split("/s/")[1].replace(/\//g, "-");
let got = 0, had = 0;
for (const f of families) {
  const info = require(`@remotion/google-fonts/${f}`).getInfo();
  for (const w of Object.values(info.fonts.normal)) for (const s of ["cyrillic", "latin"]) {
    if (!w[s]) continue;
    const out = join(dir, fontFile(w[s]));
    if (existsSync(out)) { had++; continue; }
    const r = await fetch(w[s]);
    if (!r.ok) { console.error(`✗ ${f}: HTTP ${r.status}`); process.exit(1); }
    writeFileSync(out, Buffer.from(await r.arrayBuffer()));
    got++;
  }
}
console.log(`✓ шрифти: ${families.length} родин, завантажено ${got}, вже було ${had} → studio/public/fonts`);
