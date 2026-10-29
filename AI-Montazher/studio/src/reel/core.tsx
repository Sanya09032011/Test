import React, { createContext, useContext } from "react";
import { spring, staticFile, useVideoConfig } from "remotion";
import { BRAND, Brand } from "../config";
import { useFont } from "./fonts";

/* ── спільне для всього двигуна: тема (бренд + розмітка кадру), анімаційні хелпери ── */

export const FPS = 30;
/** Сейф-зони соцмереж: у 9:16 (720×1280) зверху нік/статус, знизу опис і кнопки, справа лайки. */
export const SAFE_V = { top: 110, bottom: 270, left: 56, right: 76 };
export const SAFE_W = { top: 64, bottom: 80, left: 96, right: 96 };

type Face = { family: string; heavy: number; style: string };
export type Theme = Brand & { W: number; H: number; wide: boolean; safe: typeof SAFE_V; family: string; heavy: number; head: Face; hand: Face };
const Ctx = createContext<Theme | null>(null);
export const ThemeProvider: React.FC<{ brand?: Partial<Brand>; children: React.ReactNode }> = ({ brand, children }) => {
  const { width, height } = useVideoConfig();
  const b = { ...BRAND, ...(brand || {}) };
  const { family, heavy: fontHeavy } = useFont(b.font);
  const heavy = b.weight ?? fontHeavy;
  const head = useFont(b.headFont || b.font), hand = useFont(b.handFont || b.font);
  const wide = width > height;
  return <Ctx.Provider value={{ ...b, W: width, H: height, wide, safe: wide ? SAFE_W : SAFE_V, family, heavy, head, hand }}>{children}</Ctx.Provider>;
};
/** CSS для заголовка й рукописного підпису (шрифти headFont / handFont з config.ts). */
export const headCss = (T: Theme) => ({ fontFamily: T.head.family, fontWeight: T.headFont && T.headFont !== T.font ? T.head.heavy : T.heavy, fontStyle: T.head.style, letterSpacing: T.headFont && T.headFont !== T.font ? "0" : "-0.04em" });
export const handCss = (T: Theme) => ({ fontFamily: T.hand.family, fontWeight: T.hand.heavy, fontStyle: T.hand.style });
export const useTheme = (): Theme => {
  const t = useContext(Ctx);
  if (!t) throw new Error("ThemeProvider missing");
  return t;
};

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const eio = (t: number) => { const x = clamp01(t); return x < 0.5 ? 4 * x ** 3 : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const eout = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
/** пружина: 0→1 з невеликим перельотом, стартує на кадрі `at` */
export const spr = (f: number, at: number, damping = 13, stiffness = 170) => spring({ frame: f - at, fps: FPS, config: { damping, stiffness, mass: 0.8 } });
/** «дихання» обʼєкта, що стоїть: легке погойдування */
export const float = (f: number, seed = 0, amp = 4) => `translateY(${Math.sin(f / 22 + seed * 1.7) * amp}px) rotate(${Math.sin(f / 37 + seed) * 0.8}deg)`;
/** секунди → кадри */
export const fr = (s: number) => Math.round(s * FPS);
/** проявлення/зникання елемента на інтервалі [a, b) у кадрах: 0..1 */
export const inOut = (f: number, a: number, b: number, inF = 8, outF = 7) => Math.min(clamp01((f - a) / inF), clamp01((b - f) / outF));

/** колір тексту, що читається на тлі `bg` (чорний або білий) */
export const onColor = (bg: string) => {
  const m = bg.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
  if (!m) return "#111";
  const [r, g, b] = m.slice(1).map((h) => parseInt(h, 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#111111" : "#FFFFFF";
};
/** шлях до файлу: http(s) як є, інше — з public/ */
export const src = (p: string) => (/^https?:/.test(p) ? p : staticFile(p.replace(/^\/+/, "")));
export const isVideo = (p: string) => /\.(mp4|mov|webm|m4v)$/i.test(p);
