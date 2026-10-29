// Озвучка тексту ролика (ElevenLabs) з таймінгами слів: node scripts/tts.mjs <проєкт>
// Вхід: script.json у папці проєкту: { "lines": ["[excited] Перше речення.", "[calm] Друге…"], "speed": 1.0 }
//   (необовʼязково "voice_id" — інший голос, "model", "stability" 0..1, "style" 0..1)
// Вихід: media/voice.mp3 + voice.json (слова з таймінгами). Наголоси з library/voice/lexicon.json підставляються самі.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { env, ff, KIT, needKey, probe, project, readJSON, writeJSON } from "./_lib.mjs";

const P = project(process.argv[2]);
const S = readJSON(join(P, "script.json"));
if (!S?.lines?.length) { console.error("✗ Немає script.json з полем lines (див. docs/IDEA-VIDEO.md)"); process.exit(1); }
const E = env(), KEY = needKey();
const VOICE = S.voice_id || E.ELEVENLABS_VOICE_ID;
if (!VOICE) { console.error("✗ Впиши ELEVENLABS_VOICE_ID у .env (docs/VOICE.md)"); process.exit(1); }
const MODEL = S.model || E.ELEVENLABS_MODEL || "eleven_v4";

const ACC = "́", L = "а-щьюяєіїґА-ЩЬЮЯЄІЇҐʼ'";
const lex = readJSON(join(KIT, "library", "voice", "lexicon.json"), { words: {} });
const accents = (text) => { let out = text; for (const [w, e] of Object.entries(lex.words || {})) { if (!e.accent) continue;
  out = out.replace(new RegExp(`(^|[^${L}${ACC}])(${w})(?=[^${L}${ACC}]|$)`, "giu"), (_, pre, m) => pre + (m[0] === m[0].toUpperCase() ? e.accent[0].toUpperCase() + e.accent.slice(1) : e.accent)); } return out; };

const text = accents(S.lines.join(" "));
const body = { text, model_id: MODEL, language_code: S.language || "uk", voice_settings: { stability: S.stability ?? 0.35, similarity_boost: 0.75, style: S.style ?? 0.45, use_speaker_boost: true, ...(S.speed ? { speed: S.speed } : {}) } };
const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}/with-timestamps`, { method: "POST", headers: { "xi-api-key": KEY, "content-type": "application/json" }, body: JSON.stringify(body) });
if (!res.ok) { console.error("✗ HTTP", res.status, await res.text()); process.exit(1); }
const data = await res.json();
const raw = join(P, "media", "voice_raw.mp3");
writeFileSync(raw, Buffer.from(data.audio_base64, "base64"));

// символи → слова (теги [..] і знак наголосу — не частина слова)
const { characters: ch, character_start_times_seconds: st, character_end_times_seconds: en } = data.alignment;
const words = []; let cur = null, tag = false;
for (let i = 0; i < ch.length; i++) {
  const c = ch[i];
  if (c === "[") { tag = true; if (cur) { words.push(cur); cur = null; } continue; }
  if (c === "]") { tag = false; continue; }
  if (tag || c === ACC) continue;
  if (/\s/.test(c)) { if (cur) { words.push(cur); cur = null; } continue; }
  if (!cur) cur = { text: c, start: st[i], end: en[i] }; else { cur.text += c; cur.end = en[i]; }
}
if (cur) words.push(cur);

// зрізати тишу на початку, вирівняти гучність
const head = Math.max(0, (words[0]?.start ?? 0) - 0.08);
const tempo = S.tempo && S.tempo !== 1 ? `,atempo=${S.tempo}` : "";
ff(["-ss", head.toFixed(3), "-i", raw, "-af", `loudnorm=I=-16:TP=-1.5${tempo}`, "-ar", "44100", "-b:a", "192k", join(P, "media", "voice.mp3")]);
const k = S.tempo || 1;
const W = words.map((w) => ({ text: w.text, start: +((w.start - head) / k).toFixed(3), end: +((w.end - head) / k).toFixed(3) }));
const dur = probe(join(P, "media", "voice.mp3")).dur;
writeJSON(join(P, "voice.json"), { words: W, duration: +dur.toFixed(3) });
console.log(`✓ media/voice.mp3: ${dur.toFixed(1)} с, ${W.length} слів · голос ${VOICE.slice(0, 6)}… · ${MODEL}`);
