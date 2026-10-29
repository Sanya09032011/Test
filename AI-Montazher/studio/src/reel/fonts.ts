import { getInfo as montserrat } from "@remotion/google-fonts/Montserrat";
import { getInfo as inter } from "@remotion/google-fonts/Inter";
import { getInfo as rubik } from "@remotion/google-fonts/Rubik";
import { getInfo as unbounded } from "@remotion/google-fonts/Unbounded";
import { getInfo as manrope } from "@remotion/google-fonts/Manrope";
import { getInfo as oswald } from "@remotion/google-fonts/Oswald";
import { getInfo as comfortaa } from "@remotion/google-fonts/Comfortaa";
import { getInfo as caveat } from "@remotion/google-fonts/Caveat";
import { getInfo as pacifico } from "@remotion/google-fonts/Pacifico";
import { getInfo as robotoCondensed } from "@remotion/google-fonts/RobotoCondensed";
import { getInfo as nunito } from "@remotion/google-fonts/Nunito";
import { getInfo as spectral } from "@remotion/google-fonts/Spectral";

import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

/* ШРИФТИ (усі з кирилицею, безкоштовні Google Fonts). Назву шрифту пишеш у edit.json → captions.font
   або в src/config.ts → BRAND.font. Подивитися всі — композиція «Fonts» (ДЕМО-шрифти.mp4). */
type Info = () => { fontFamily: string; fonts: Record<string, Record<string, Record<string, string>>>; unicodeRanges: Record<string, string> };
const F = (load: Info, family: string, weights: string[], heavy: number, note: string, italic = false) => ({ load, family, weights, heavy, note, italic });
export const FONTS = {
  Montserrat: F(montserrat, "Montserrat", ["400", "500", "600", "800", "900"], 900, "універсальний жирний, як у більшості рілсів"),
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
  Spectral: F(spectral, "Spectral", ["500"], 500, "з засічками, курсив — елегантні заголовки", true),
};
export type FontKey = keyof typeof FONTS;

/* Файли шрифтів лежать у public/fonts (node scripts/fonts.mjs) — рендер не ходить у Google Fonts. */
const fontFile = (url: string) => url.split("/s/")[1].replace(/\//g, "-");
const loadLocal = (info: ReturnType<Info>, weights: string[], style: "normal" | "italic") => {
  const faces: FontFace[] = [];
  for (const w of weights) for (const s of ["cyrillic", "latin"]) {
    const url = info.fonts[style]?.[w]?.[s];
    if (url) faces.push(new FontFace(info.fontFamily, `url(${staticFile("fonts/" + fontFile(url))}) format("woff2")`, { weight: w, style, unicodeRange: info.unicodeRanges[s] }));
  }
  const h = delayRender(`шрифт ${info.fontFamily}`);
  Promise.all(faces.map((ff) => ff.load().then(() => document.fonts.add(ff)))).then(() => continueRender(h), (e) => cancelRender(e));
};

const loaded = new Set<string>();
/** Підвантажує шрифт (один раз) і повертає CSS font-family, найжирнішу вагу й накреслення (курсив чи ні). */
export const useFont = (k?: string) => {
  const key = (k && k in FONTS ? k : "Montserrat") as FontKey;
  const f = FONTS[key];
  if (!loaded.has(key)) { loaded.add(key); loadLocal(f.load(), f.weights, f.italic ? "italic" : "normal"); }
  return { family: `"${f.family}", system-ui, sans-serif`, heavy: f.heavy, style: f.italic ? "italic" : "normal" };
};
