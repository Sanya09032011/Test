// Рендер ролика за монтажним листом: node scripts/render.mjs <проєкт> [--draft]
//   --draft → швидка чернетка 540p + аркуш кадрів sheet.jpg для перевірки (кілька хвилин)
//   без --draft → фінал 1080p, гучність −14 LUFS, обкладинка cover.png
// Файли з media/ проєкту автоматично копіюються в studio/public/jobs/<проєкт>/.
import { copyFileSync, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { spawnSync } from "node:child_process";
import { ff, loudnorm, pid, probe, project, readJSON, STUDIO, writeJSON } from "./_lib.mjs";

const P = project(process.argv[2]);
const draft = process.argv.includes("--draft");
const edit = readJSON(join(P, "edit.json"));
if (!edit) { console.error("✗ Немає edit.json — спершу node scripts/edit.mjs " + process.argv[2]); process.exit(1); }
const id = pid(P), jobs = join(STUDIO, "public", "jobs", id);
mkdirSync(jobs, { recursive: true });

// media/xxx → jobs/<id>/xxx (копіюємо лише те, на що посилається монтажний лист)
const used = new Set();
const fix = (v) => (typeof v === "string" && v.startsWith("media/") ? (used.add(v.slice(6)), `jobs/${id}/${v.slice(6)}`) : Array.isArray(v) ? v.map(fix) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fix(x)])) : v);
const props = fix(edit);
for (const f of used) {
  const s = join(P, "media", f), d = join(jobs, f);
  if (!existsSync(s)) { console.error("✗ Немає файлу media/" + f); process.exit(1); }
  if (!existsSync(d) || statSync(d).size !== statSync(s).size || statSync(d).mtimeMs < statSync(s).mtimeMs) { mkdirSync(join(d, ".."), { recursive: true }); copyFileSync(s, d); }
}
// файли з studio/public (музика, стікери, логотипи, іконки), на які посилається лист, мають існувати
const missing = [];
const walk = (v) => {
  if (typeof v === "string") { if (/\.(mp3|wav|m4a|png|jpe?g|webp|svg|mp4|mov|webm)$/i.test(v) && !v.startsWith("jobs/") && !/^https?:/.test(v) && !existsSync(join(STUDIO, "public", v))) missing.push(v); }
  else if (Array.isArray(v)) v.forEach(walk);
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) if (k !== "words") walk(x);
};
walk(props);
for (const e of props.events ?? []) if (e.type === "icon" && e.name && !existsSync(join(STUDIO, "public", "assets", `fl-${e.name}.png`))) missing.push(`assets/fl-${e.name}.png (іконка «${e.name}»)`);
if (missing.length) {
  console.error("✗ У edit.json є посилання на файли, яких немає в studio/public:\n  " + missing.join("\n  ") + "\n  → виправ назву або поклади файл (логотипи: tools/logos → studio/public/logos; іконки: ls studio/public/assets)");
  process.exit(1);
}
mkdirSync(join(STUDIO, "out"), { recursive: true });
const propsFile = join(STUDIO, "out", `props-${id}.json`);
writeJSON(propsFile, props);

const cli = join(STUDIO, "node_modules", "@remotion", "cli", "remotion-cli.js");
if (!existsSync(cli)) { console.error("✗ Не встановлено бібліотеки: у папці studio виконай npm install"); process.exit(1); }
const run = (args) => { const r = spawnSync(process.execPath, [cli, ...args], { cwd: STUDIO, stdio: "inherit" }); if (r.status !== 0) { console.error("✗ рендер упав"); process.exit(1); } };
const raw = join(STUDIO, "out", `${id}-raw.mp4`);
const t0 = Date.now();
run(["render", "Reel", raw, `--props=${propsFile}`, ...(draft ? ["--scale=0.75", "--crf=26"] : ["--scale=1.5", "--crf=18", "--jpeg-quality=95"]), "--log=error"]);

if (draft) {
  const outF = join(P, "draft.mp4");
  copyFileSync(raw, outF);
  const d = probe(outF).dur, n = 18;
  ff(["-i", outF, "-vf", `fps=${(n / d).toFixed(4)},scale=${edit.format === "16x9" ? "320:180" : "180:320"},tile=6x3`, "-frames:v", "1", join(P, "sheet.jpg")]);
  console.log(`✓ чернетка: ${outF}\n✓ аркуш кадрів для перевірки: ${join(P, "sheet.jpg")} · ${((Date.now() - t0) / 1000).toFixed(0)} с`);
} else {
  const outF = join(P, `${basename(P)}.mp4`);
  const { before, gain } = loudnorm(raw, outF);
  if (edit.cover) run(["still", "Reel", join(P, "cover.png"), `--props=${propsFile}`, "--frame=0", "--scale=1.5", "--log=error"]);
  console.log(`✓ ГОТОВО: ${outF} (1080p, гучність ${before.toFixed(1)} → −14 LUFS)${edit.cover ? `\n✓ обкладинка: ${join(P, "cover.png")}` : ""} · ${((Date.now() - t0) / 1000).toFixed(0)} с`);
}
