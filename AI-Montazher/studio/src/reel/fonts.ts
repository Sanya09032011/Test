import { loadFont as montserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as inter } from "@remotion/google-fonts/Inter";
import { loadFont as rubik } from "@remotion/google-fonts/Rubik";
import { loadFont as unbounded } from "@remotion/google-fonts/Unbounded";
import { loadFont as manrope } from "@remotion/google-fonts/Manrope";
import { loadFont as oswald } from "@remotion/google-fonts/Oswald";
import { loadFont as comfortaa } from "@remotion/google-fonts/Comfortaa";
import { loadFont as caveat } from "@remotion/google-fonts/Caveat";
import { loadFont as pacifico } from "@remotion/google-fonts/Pacifico";
import { loadFont as robotoCondensed } from "@remotion/google-fonts/RobotoCondensed";
import { loadFont as nunito } from "@remotion/google-fonts/Nunito";

/* ШРИФТИ (усі з кирилицею, безкоштовні Google Fonts). Назву шрифту пишеш у edit.json → captions.font
   або в src/config.ts → BRAND.font. Подивитися всі — композиція «Fonts» (ДЕМО-шрифти.mp4). */
type Loader = (style?: any, opts?: any) => any;
const F = (load: Loader, family: string, weights: string[], heavy: number, note: string) => ({ load, family, weights, heavy, note });
export const FONTS = {
  Montserrat: F(montserrat, "Montserrat", ["600", "800", "900"], 900, "універсальний жирний, як у більшості рілсів"),
  Inter: F(inter, "Inter", ["600", "800", "900"], 900, "спокійний сучасний, для експертів"),
  Rubik: F(rubik, "Rubik", ["600", "800", "900"], 900, "округлий дружній"),
  Unbounded: F(unbounded, "Unbounded", ["600", "800", "900"], 900, "широкий яскравий, для заголовків"),
  Manrope: F(manrope, "Manrope", ["600", "800"], 800, "легкий технологічний"),
  Oswald: F(oswald, "Oswald", ["500", "700"], 700, "вузький високий, багато слів в один рядок"),
  RobotoCondensed: F(robotoCondensed, "Roboto Condensed", ["600", "800", "900"], 900, "вузький щільний, новинний"),
  Nunito: F(nunito, "Nunito", ["700", "900"], 900, "мʼякий, для лайфстайлу й дітей"),
  Comfortaa: F(comfortaa, "Comfortaa", ["600", "700"], 700, "ніжний округлий"),
  Caveat: F(caveat, "Caveat", ["600", "700"], 700, "рукописний, як маркером"),
  Pacifico: F(pacifico, "Pacifico", ["400"], 400, "каліграфія, для акцентів"),
};
export type FontKey = keyof typeof FONTS;

const loaded = new Set<string>();
/** Підвантажує шрифт (один раз) і повертає CSS font-family та найжирнішу вагу. */
export const useFont = (k?: string) => {
  const key = (k && k in FONTS ? k : "Montserrat") as FontKey;
  const f = FONTS[key];
  if (!loaded.has(key)) { loaded.add(key); f.load("normal", { weights: f.weights, subsets: ["cyrillic", "latin"] }); }
  return { family: `"${f.family}", system-ui, sans-serif`, heavy: f.heavy };
};
