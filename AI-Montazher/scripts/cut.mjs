// Монтаж в один клік: прибирає паузи, «е-е», «м-м» і невдалі дублі, склеює відео, чистить звук.
// node scripts/cut.mjs <проєкт> [--gap 0.3]
// Вхід: media/src.mp4 + transcript.json (stt.mjs) + drops.json (необовʼязково: [[початок, кінець], …] у секундах ОРИГІНАЛУ — вікна дублів, які викинути).
// Вихід: media/cut.mp4, cut_transcript.json (нові таймінги слів), segments.json (шматки для джамп-катів).
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ff, project, readJSON, writeJSON } from "./_lib.mjs";

const P = project(process.argv[2]);
const gi = process.argv.indexOf("--gap");
const MAX_GAP = gi > 0 ? +process.argv[gi + 1] : 0.3, PRE = 0.08, POST = 0.14;
const t = readJSON(join(P, "transcript.json"));
if (!t) { console.error("✗ Спершу node scripts/stt.mjs " + process.argv[2]); process.exit(1); }
const DROP = readJSON(join(P, "drops.json"), []);
// звуки-паразити: «е», «ее», «ем», «м-м», «хм», «аа»… (окреме «а» — це слово, його не чіпаємо)
const norm = (s) => s.toLowerCase().replace(/[^\p{L}]/gu, "");
const FILLER = /^(е+|е+м+|м+|х+м+|аа+|аа+м+|э+|э+м+|u+h+|u+m+|h+m+|a+h+|e+r+m*)$/;
const all = t.words;
const fillers = all.filter((w) => FILLER.test(norm(w.text)));
const words = all.filter((w) => !fillers.includes(w) && !DROP.some(([a, b]) => w.start >= a && w.start <= b));

const segs = [];
for (const w of words) {
  const last = segs[segs.length - 1];
  if (last && w.start - last.lastEnd <= MAX_GAP) { last.lastEnd = w.end; last.words.push(w); }
  else segs.push({ firstStart: w.start, lastEnd: w.end, words: [w] });
}
// запаси не залазять на сусіднє слово оригіналу (інакше лишаються хвости вирізаних дублів)
const idx = (w) => all.indexOf(w);
const cuts = segs.map((s) => {
  const i0 = idx(s.words[0]), i1 = idx(s.words[s.words.length - 1]);
  const prevEnd = i0 > 0 ? all[i0 - 1].end + 0.03 : 0;
  const nextStart = i1 < all.length - 1 ? all[i1 + 1].start - 0.03 : Infinity;
  return { a: Math.max(0, s.firstStart - PRE, Math.min(prevEnd, s.firstStart)), b: Math.min(s.lastEnd + POST, Math.max(nextStart, s.lastEnd)), words: s.words };
});
// межі точно на кадрах (30 fps), без перекриттів — інакше звук і субтитри «пливуть»
for (const c of cuts) { c.a = Math.round(c.a * 30) / 30; c.b = Math.round(c.b * 30) / 30; }
for (let i = 1; i < cuts.length; i++) if (cuts[i].a < cuts[i - 1].b) cuts[i].a = cuts[i - 1].b;

let acc = 0;
const out = [];
const segsOut = cuts.map((c, i) => {
  const dur = c.b - c.a;
  for (const w of c.words) out.push({ text: w.text, start: +(acc + w.start - c.a).toFixed(3), end: +(acc + w.end - c.a).toFixed(3) });
  const r = { at: +acc.toFixed(3), dur: +dur.toFixed(3), src_a: +c.a.toFixed(3), src_b: +c.b.toFixed(3) };
  acc += dur;
  return r;
});

const v = cuts.map((c, i) => `[0:v]trim=${c.a.toFixed(3)}:${c.b.toFixed(3)},setpts=PTS-STARTPTS[v${i}]`).join(";");
const a = cuts.map((c, i) => `[0:a]atrim=${c.a.toFixed(3)}:${c.b.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:d=0.012,afade=t=out:st=${(c.b - c.a - 0.02).toFixed(3)}:d=0.02[a${i}]`).join(";");
const cat = cuts.map((_, i) => `[v${i}][a${i}]`).join("") + `concat=n=${cuts.length}:v=1:a=1[v][ac];[ac]highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,loudnorm=I=-16:TP=-1.5:LRA=9[a]`;
const fpath = join(P, "cut_filter.txt");
writeFileSync(fpath, `${v};${a};${cat}`);
ff(["-i", join(P, "media", "src.mp4"), "-/filter_complex", fpath, "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-crf", "14", "-preset", "medium", "-pix_fmt", "yuv420p", "-r", "30", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", join(P, "media", "cut.mp4")]);
writeJSON(join(P, "segments.json"), segsOut);
writeJSON(join(P, "cut_transcript.json"), { words: out, duration: +acc.toFixed(3) });
const was = all.at(-1)?.end ?? 0;
console.log(`✓ media/cut.mp4: ${cuts.length} шматків · вирізано «е/м-м»: ${fillers.length} · слів з дублів: ${all.length - fillers.length - words.length} · ${was.toFixed(1)} с → ${acc.toFixed(1)} с`);
if (fillers.length) console.log("  паразити:", [...new Set(fillers.map((w) => w.text))].join(", "));
