// Новий проєкт ролика: node scripts/new.mjs <назва латиницею або кирилицею>
// → projects/NNN-назва/ (media/ — усі файли ролика). Друкує шлях.
import { mkdirSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { KIT } from "./_lib.mjs";

const name = (process.argv.slice(2).join(" ") || "reel").trim().toLowerCase().replace(/[^\p{L}\d]+/gu, "-").replace(/^-|-$/g, "").slice(0, 40);
const root = join(KIT, "projects");
mkdirSync(root, { recursive: true });
const n = Math.max(0, ...readdirSync(root).map((d) => +(d.match(/^(\d{3})-/)?.[1] ?? 0))) + 1;
const dir = join(root, `${String(n).padStart(3, "0")}-${name}`);
if (!existsSync(dir)) mkdirSync(join(dir, "media"), { recursive: true });
console.log(dir);
