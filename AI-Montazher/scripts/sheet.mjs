// Аркуш кадрів відео (щоб швидко перевірити ролик або референс очима): node scripts/sheet.mjs <відео> [вихід.jpg] [кадрів=18]
import { resolve } from "node:path";
import { ff, probe } from "./_lib.mjs";

const v = process.argv[2] && resolve(process.argv[2]);
if (!v) { console.error("✗ Вкажи відео"); process.exit(1); }
const out = process.argv[3] ? resolve(process.argv[3]) : v.replace(/\.[^.]+$/, "") + "-sheet.jpg", n = +(process.argv[4] || 18);
const i = probe(v), vert = i.h >= i.w;
ff(["-i", v, "-vf", `fps=${(n / i.dur).toFixed(4)},scale=${vert ? "180:320" : "320:180"},tile=6x${Math.ceil(n / 6)}`, "-frames:v", "1", out]);
console.log("✓", out);
