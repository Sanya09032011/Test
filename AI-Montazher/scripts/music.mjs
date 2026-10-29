// Фонова музика під ролик (Eleven Music): node scripts/music.mjs <проєкт> "опис настрою англійською" [секунд=60]
// → media/music.mp3. Без ключа або на безкоштовному плані — беріть готові треки з studio/public/music (docs/MUSIC.md).
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { needKey, project } from "./_lib.mjs";

const P = project(process.argv[2]);
const prompt = process.argv[3] || "Upbeat modern lo-fi hip hop instrumental, light and positive, for social media video";
const sec = +(process.argv[4] || 60);
const res = await fetch("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128", { method: "POST", headers: { "xi-api-key": needKey(), "content-type": "application/json" },
  body: JSON.stringify({ prompt, music_length_ms: Math.round(sec * 1000), force_instrumental: true }) });
if (!res.ok) { console.error("✗ HTTP", res.status, (await res.text()).slice(0, 300), "\n  → візьми готовий трек з studio/public/music"); process.exit(1); }
writeFileSync(join(P, "media", "music.mp3"), Buffer.from(await res.arrayBuffer()));
console.log(`✓ media/music.mp3 (${sec} с) — у edit.json: "music": { "src": "media/music.mp3", "volume": 0.07 }`);
