import React from "react";
import { useCurrentFrame } from "remotion";
import { clamp01, FPS, onColor, spr, useTheme } from "./core";
import { useFont } from "./fonts";
import type { Word } from "./types";

/* ═══ СУБТИТРИ: 8 стилів (подивитися всі — композиція «Subtitles» / ДЕМО-субтитри.mp4) ═══
   classic    — білий жирний з обведенням, поточне слово акцентним кольором (як у CapCut)
   pop        — кожне слово вистрибує на своєму звуці
   karaoke    — фраза видна вся, сказані слова заливаються кольором
   box        — поточне слово в кольоровій плашці, що їде за голосом
   typewriter — літери друкуються, як на машинці
   minimal    — дрібно, спокійно, без обведення (для експертних роликів)
   hormozi    — 1–2 ВЕЛИКІ слова, яскраво, з поворотом (агресивні рілси)
   neon       — світіння акцентним кольором */
export const CAPTION_PRESETS = ["classic", "pop", "karaoke", "box", "typewriter", "minimal", "hormozi", "neon"] as const;
export type CapPreset = typeof CAPTION_PRESETS[number];
export type CapStyle = {
  preset: CapPreset;
  /** товщина літер (400 — звичайний, 500 — трохи щільніший), за замовчуванням — найжирніша */
  weight?: number;
  /** шрифт (src/reel/fonts.ts), за замовчуванням — шрифт бренду */
  font?: string;
  /** колір звичайних слів */
  color?: string;
  /** колір ключових/поточних слів (за замовчуванням — акцент бренду) */
  accent?: string;
  /** розмір у px на кадрі 720 px завширшки (9:16) */
  size?: number;
  /** "bottom" | "middle" | "top" або число — Y центру рядка в px */
  position?: "top" | "middle" | "bottom" | number;
  /** ВЕЛИКИМИ ЛІТЕРАМИ */
  upper?: boolean;
  /** скільки слів максимум у рядку */
  maxWords?: number;
  /** обведення навколо літер */
  stroke?: boolean;
};

export const norm = (s: string) => s.toLowerCase().replace(/[ʼ‘’'´`]/g, "").replace(/[^\p{L}\d]/gu, "");
const clean = (s: string) => s.replace(/[.,;:…«»"“”()]+/g, "").replace(/^-+|-+$/g, "");
const outline = (r: number, c: string) => { const o: string[] = []; for (let a = 0; a < 16; a++) { const t = (a / 16) * Math.PI * 2; o.push(`${(Math.cos(t) * r).toFixed(1)}px ${(Math.sin(t) * r).toFixed(1)}px 0 ${c}`); } return o.join(","); };

type Group = { words: (Word & { key: boolean })[]; a: number; b: number };
export const groupWords = (words: Word[], keywords: string[], maxWords: number): Group[] => {
  const keys = keywords.map(norm).filter((k) => k.length >= 2);
  const gs: Group[] = [];
  let cur: Group | null = null;
  words.forEach((w, i) => {
    const key = keys.some((k) => norm(w.text).startsWith(k));
    const prev = words[i - 1];
    if (!cur || cur.words.length >= maxWords || (prev && /[.,!?;:…]$/.test(prev.text)) || (prev && w.start - prev.end > 0.6)) { cur = { words: [], a: w.start, b: w.end }; gs.push(cur); }
    cur.words.push({ ...w, key }); cur.b = w.end;
  });
  gs.forEach((g, i) => { g.b = i < gs.length - 1 ? Math.min(gs[i + 1].a, g.b + 0.8) : g.b + 0.6; });
  return gs;
};

export const Captions: React.FC<{ words: Word[]; style: CapStyle; keywords?: string[] }> = ({ words, style, keywords = [] }) => {
  const f = useCurrentFrame();
  const T = useTheme();
  const preset = style.preset ?? "classic";
  const { family, heavy: fontHeavy } = useFont(style.font ?? T.font);
  const heavy = style.weight ?? fontHeavy;
  const maxWords = style.maxWords ?? (preset === "hormozi" ? 2 : preset === "minimal" ? 5 : 3);
  const groups = React.useMemo(() => groupWords(words, keywords, maxWords), [words, keywords, maxWords]);
  const t = f / FPS;
  const g = groups.find((x) => t >= x.a - 0.04 && t < x.b);
  if (!g) return null;
  const gf = Math.round((g.a - 0.04) * FPS);
  const color = style.color ?? "#FFFFFF", accent = style.accent ?? T.accent;
  const upper = style.upper ?? (preset === "hormozi" || preset === "classic" || preset === "box");
  const base = (style.size ?? (T.wide ? 52 : 64)) * (preset === "hormozi" ? 1.3 : preset === "minimal" ? 0.75 : 1);
  const maxW = T.W - T.safe.left - T.safe.right - 20;
  const chars = g.words.reduce((a, w) => a + clean(w.text).length, 0) + g.words.length;
  const size = Math.min(base, maxW / Math.max(1, chars * (upper ? 0.68 : 0.58)));
  const pos = style.position ?? "bottom";
  const cy = typeof pos === "number" ? pos : pos === "top" ? (T.wide ? 150 : 250) : pos === "middle" ? T.H / 2 : (T.wide ? T.H - 150 : 880);
  const stroke = style.stroke ?? !(preset === "minimal" || preset === "neon");
  const shadowBase = stroke ? `${outline(Math.max(2.5, size * 0.07), "#000")}, 0 6px 14px rgba(0,0,0,.45)` : "0 4px 16px rgba(0,0,0,.55)";
  const gp = spr(f, gf, 12, 200);
  const flick = preset === "neon" && f - gf < 7 ? [1, 0.3, 1, 0.5, 1, 0.8, 1][f - gf] : 1;
  const rot = preset === "hormozi" ? (groups.indexOf(g) % 2 ? 2 : -2) * (1 - gp * 0.5) : 0;

  return (
    <div style={{ position: "absolute", left: T.safe.left, right: T.safe.right, top: cy, transform: `translateY(-50%) rotate(${rot}deg) scale(${preset === "hormozi" ? 0.7 + 0.3 * gp : 1})`, display: "flex", justifyContent: "center", flexWrap: "nowrap", gap: size * 0.26, opacity: flick, zIndex: 50 }}>
      {g.words.map((w, i) => {
        const ws = Math.round(w.start * FPS), we = Math.round(w.end * FPS);
        const spoken = f >= ws, active = f >= ws && (f < we + 2 || i === g.words.length - 1);
        let txt = clean(w.text); if (upper) txt = txt.toUpperCase(); else if (preset === "minimal") txt = txt.toLowerCase();
        let col = w.key ? accent : color, op = 1, sc = 1, bg: string | undefined, ty = 0, blur = 0;
        const p = spr(f, ws, 11, 220);
        switch (preset) {
          case "classic": if (active) col = accent; break;
          case "pop": if (!spoken) op = 0; sc = 0.55 + 0.45 * p; ty = (1 - p) * 14; break;
          case "karaoke": col = spoken ? accent : color; op = spoken ? 1 : 0.55; break;
          case "box": if (active) { bg = accent; col = onColor(accent); } break;
          case "minimal": { const q = clamp01((f - ws + 1) / 5); op = spoken ? q : 0; blur = (1 - q) * 8; ty = (1 - q) * 6; break; }
          case "hormozi": if (active && !w.key) col = i % 2 ? accent : color; break;
          case "neon": col = "#FFFFFF"; break;
        }
        if (preset === "typewriter") {
          const n = txt.length, k = f < ws ? 0 : f >= we ? n : Math.ceil(((f - ws) / Math.max(1, we - ws)) * n);
          const caret = active && k <= n && Math.floor(f / 8) % 2 === 0;
          return <span key={i} style={{ fontFamily: family, fontWeight: heavy, fontSize: size, color: w.key ? accent : color, textShadow: shadowBase, whiteSpace: "pre", lineHeight: 1.1 }}>
            {txt.slice(0, k)}<span style={{ opacity: 0 }}>{txt.slice(k)}</span>{caret && <span style={{ position: "absolute", marginLeft: -size * 0.1, color: accent }}>|</span>}
          </span>;
        }
        const glow = preset === "neon" ? `0 0 ${size * 0.15}px ${accent}, 0 0 ${size * 0.4}px ${accent}, 0 0 ${size * 0.8}px ${accent}` : bg ? "none" : shadowBase;
        return <span key={i} style={{ position: "relative", display: "inline-block", fontFamily: family, fontWeight: heavy, fontSize: size, lineHeight: 1.1, letterSpacing: "-0.01em", color: col, opacity: op,
          transform: `translateY(${ty}px) scale(${active && (preset === "classic" || preset === "box" || preset === "hormozi") ? 1.08 : sc})`, transformOrigin: "50% 70%",
          textShadow: glow, filter: blur > 0.3 ? `blur(${blur}px)` : undefined, padding: bg ? `0 ${size * 0.16}px` : undefined, background: bg, borderRadius: bg ? size * 0.18 : undefined,
          boxShadow: bg ? "0 8px 20px rgba(0,0,0,.35)" : undefined }}>{txt}</span>;
      })}
    </div>
  );
};
