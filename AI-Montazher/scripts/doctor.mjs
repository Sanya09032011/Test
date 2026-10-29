// Перевірка, чи все готово до роботи: node scripts/doctor.mjs
// Node.js, ffmpeg, бібліотеки студії, ключ і голос ElevenLabs (ключ НЕ показується).
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { env, KIT, STUDIO } from "./_lib.mjs";

const ok = (b, msg, fix) => { console.log(`${b ? "✓" : "✗"} ${msg}${!b && fix ? `  → ${fix}` : ""}`); return b; };
const ver = (cmd, a) => { try { return execFileSync(cmd, a, { encoding: "utf8" }).split("\n")[0].trim(); } catch { return ""; } };
ok(true, `Node.js ${process.version}`);
const ffv = ver("ffmpeg", ["-version"]);
ok(!!ffv, ffv ? ffv.slice(0, 40) : "ffmpeg", "встановити ffmpeg (CLAUDE.md, «Перший запуск», крок 2)");
ok(existsSync(join(STUDIO, "node_modules", "remotion")), "бібліотеки студії (studio/node_modules)", "у папці studio виконати npm install");
const E = env();
const hasEnv = existsSync(join(KIT, ".env"));
ok(hasEnv, "файл .env", "скопіювати .env.example → .env");
if (ok(!!E.ELEVENLABS_API_KEY, "ключ ElevenLabs у .env", "вписати ключ (docs/VOICE.md)")) {
  const r = await fetch("https://api.elevenlabs.io/v1/user", { headers: { "xi-api-key": E.ELEVENLABS_API_KEY } });
  if (ok(r.ok, r.ok ? "ключ працює" : `ключ не прийнято (HTTP ${r.status})`, "перевірити, що скопійовано повністю, без пробілів")) {
    const u = await r.json(), s = u.subscription || {};
    console.log(`  план: ${s.tier ?? "?"} · використано ${s.character_count ?? "?"} з ${s.character_limit ?? "?"} символів`);
  }
  if (ok(!!E.ELEVENLABS_VOICE_ID, "голос для озвучки (ELEVENLABS_VOICE_ID)", "потрібен лише для роликів з озвучкою (docs/VOICE.md)")) {
    const v = await fetch(`https://api.elevenlabs.io/v1/voices/${E.ELEVENLABS_VOICE_ID}`, { headers: { "xi-api-key": E.ELEVENLABS_API_KEY } });
    ok(v.ok, v.ok ? `голос «${(await v.json()).name}»` : "голос не знайдено", "скопіювати Voice ID ще раз");
  }
}
