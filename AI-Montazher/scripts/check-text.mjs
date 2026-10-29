// Перевірка тексту озвучки перед генерацією: node scripts/check-text.mjs <проєкт>
// ElevenLabs читає навмання латиницю, цифри, тире й апострофи — їх треба писати словами (docs/VOICE.md).
import { join } from "node:path";
import { project, readJSON } from "./_lib.mjs";

const P = project(process.argv[2]);
const S = readJSON(join(P, "script.json"), { lines: [] });
let bad = 0, words = 0;
S.lines.forEach((l, i) => {
  const t = l.replace(/\[[^\]]*\]/g, "");
  words += t.split(/\s+/).filter(Boolean).length;
  const hits = { "латиниця": t.match(/[A-Za-z]+/g), "цифри": t.match(/\d+/g), "тире/дефіс": t.match(/[—–-]/g), "апостроф": t.match(/[ʼ’'`]/g) };
  const found = Object.entries(hits).filter(([, v]) => v);
  if (found.length) { bad++; console.log(`рядок ${i + 1}:`, found.map(([k, v]) => `${k}: ${v.join(" ")}`).join(" · ")); }
});
console.log(bad ? "✗ ВИПРАВ (пиши словами: «Чат Джі Пі Ті», «двадцять пять», «пять» без апострофа)" : "✓ ЧИСТО", `· ${words} слів ≈ ${(words / 2.6).toFixed(0)} с озвучки`);
process.exit(bad ? 1 : 0);
