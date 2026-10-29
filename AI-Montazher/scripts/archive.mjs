// Після здачі ролика: переносить вихідники з ЗАНЕСИ-СЮДИ/1… у папку проєкту (inbox/), щоб папка була чиста для наступного.
// node scripts/archive.mjs <проєкт>   (спершу копія → звірка розміру → лише тоді прибирання; нічого не губиться)
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { INBOX, project } from "./_lib.mjs";

const P = project(process.argv[2]);
const src = readdirSync(INBOX).map((d) => join(INBOX, d)).find((d) => /^1 /.test(d.split(/[\\/]/).pop()));
if (!src || !existsSync(src)) { console.error("✗ Не знайдено папку ЗАНЕСИ-СЮДИ/1 …"); process.exit(1); }
const dst = join(P, "inbox");
mkdirSync(dst, { recursive: true });
let n = 0;
for (const f of readdirSync(src)) {
  if (f === "ЩО-СЮДИ.txt" || f === "що-сюди-класти.txt" || statSync(join(src, f)).isDirectory()) continue;
  const a = join(src, f), b = join(dst, f);
  copyFileSync(a, b);
  if (statSync(b).size !== statSync(a).size) { console.error("✗ Копія не збіглась, лишаю оригінал:", f); continue; }
  rmSync(a); n++;
}
console.log(`✓ перенесено ${n} файл(ів) у ${dst} · папка «${src.split(/[\\/]/).pop()}» чиста`);
