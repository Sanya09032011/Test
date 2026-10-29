import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { useTheme } from "./core";

/* ═══ БОНУС: 10 АНІМОВАНИХ ФОНІВ (кольори беруться з бренду, src/config.ts) ═══
   grid · dots · gradient · blobs · stripes · spotlight · waves · bokeh · rays · neon
   Подивитися всі — композиція «Backgrounds» (ДЕМО-фони.mp4). У edit.json: "background": "blobs". */
export const BACKGROUNDS = ["grid", "dots", "gradient", "blobs", "stripes", "spotlight", "waves", "bokeh", "rays", "neon"] as const;
export type BgName = typeof BACKGROUNDS[number];
export const BG_INFO: Record<BgName, string> = {
  grid: "світлий папір у клітинку, що повільно пливе — експертні, освітні ролики",
  dots: "крапкова сітка з паралаксом — технології, огляди",
  gradient: "мʼякий градієнт, що переливається кольорами бренду — лайфстайл, beauty",
  blobs: "великі розмиті кольорові плями — сучасний «скляний» вигляд",
  stripes: "діагональні смуги, що їдуть — динаміка, розпродажі, анонси",
  spotlight: "темна сцена з прожектором — драма, секрети, «ніхто не каже»",
  waves: "тонкі хвилі-лінії — спокій, музика, медитативні теми",
  bokeh: "розмиті вогники — свято, вечір, атмосфера",
  rays: "промені, що обертаються — WOW-момент, перемога, розіграш",
  neon: "неонова сітка-перспектива 80-х — ігри, AI, ретро",
};

const rgba = (hex: string, a: number) => {
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
  if (!m) return `rgba(0,0,0,${a})`;
  return `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})`;
};

export const Background: React.FC<{ name?: BgName }> = ({ name = "grid" }) => {
  const f = useCurrentFrame();
  const T = useTheme();
  const { W, H, accent, accent2, ink, paper } = T;
  switch (name) {
    case "grid": {
      const s = 48, o = (f * 0.4) % s;
      return <AbsoluteFill style={{ background: paper }}>
        <AbsoluteFill style={{ backgroundImage: `linear-gradient(${rgba(ink, 0.07)} 1.5px, transparent 1.5px), linear-gradient(90deg, ${rgba(ink, 0.07)} 1.5px, transparent 1.5px)`, backgroundSize: `${s}px ${s}px`, backgroundPosition: `${o}px ${o}px` }} />
        <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, transparent 50%, ${rgba(ink, 0.12)} 100%)` }} />
      </AbsoluteFill>;
    }
    case "dots": {
      const layer = (s: number, sp: number, a: number, r: number) => <AbsoluteFill style={{ backgroundImage: `radial-gradient(${rgba(ink, a)} ${r}px, transparent ${r + 0.6}px)`, backgroundSize: `${s}px ${s}px`, backgroundPosition: `0px ${(f * sp) % s}px` }} />;
      return <AbsoluteFill style={{ background: paper }}>{layer(36, 0.3, 0.12, 2)}{layer(72, 0.8, 0.1, 3.5)}</AbsoluteFill>;
    }
    case "gradient": {
      const a = f * 0.6;
      return <AbsoluteFill style={{ background: `linear-gradient(${a}deg, ${rgba(accent, 0.85)}, ${rgba(accent2, 0.75)} 50%, ${paper})` }}>
        <AbsoluteFill style={{ background: `radial-gradient(circle at ${50 + Math.sin(f / 50) * 30}% ${50 + Math.cos(f / 60) * 25}%, rgba(255,255,255,.55), transparent 60%)` }} />
      </AbsoluteFill>;
    }
    case "blobs": {
      const blob = (c: string, x: number, y: number, r: number, k: number) => <div style={{ position: "absolute", left: x + Math.sin(f / 40 + k) * W * 0.15 - r, top: y + Math.cos(f / 47 + k * 2) * H * 0.08 - r, width: r * 2, height: r * 2, borderRadius: "50%", background: c, filter: `blur(${r * 0.45}px)` }} />;
      return <AbsoluteFill style={{ background: paper, overflow: "hidden" }}>
        {blob(rgba(accent, 0.9), W * 0.25, H * 0.3, W * 0.42, 0)}{blob(rgba(accent2, 0.7), W * 0.8, H * 0.6, W * 0.38, 2)}{blob(rgba(ink, 0.18), W * 0.4, H * 0.85, W * 0.3, 4)}
      </AbsoluteFill>;
    }
    case "stripes": {
      const s = 70, o = (f * 2) % (s * 2);
      return <AbsoluteFill style={{ background: accent }}>
        <AbsoluteFill style={{ backgroundImage: `repeating-linear-gradient(45deg, ${rgba(ink, 0.12)} 0 ${s}px, transparent ${s}px ${s * 2}px)`, backgroundPosition: `${o}px 0` }} />
      </AbsoluteFill>;
    }
    case "spotlight": {
      const x = 50 + Math.sin(f / 45) * 22, y = 38 + Math.cos(f / 60) * 10;
      return <AbsoluteFill style={{ background: "#0B0B0E" }}>
        <AbsoluteFill style={{ background: `radial-gradient(circle at ${x}% ${y}%, ${rgba(accent, 0.38)}, transparent 45%)` }} />
        <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 120%, ${rgba(accent2, 0.25)}, transparent 60%)` }} />
      </AbsoluteFill>;
    }
    case "waves": {
      return <AbsoluteFill style={{ background: paper }}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 14 }, (_, i) => {
            const y0 = H * 0.15 + i * H * 0.055, amp = 18 + i * 2, ph = f / 25 + i * 0.5;
            let d = `M0,${y0}`; for (let x = 0; x <= W; x += 20) d += ` L${x},${(y0 + Math.sin(x / 90 + ph) * amp).toFixed(1)}`;
            return <path key={i} d={d} fill="none" stroke={i % 3 === 0 ? accent : rgba(ink, 0.18)} strokeWidth={i % 3 === 0 ? 4 : 2} />;
          })}
        </svg>
      </AbsoluteFill>;
    }
    case "bokeh": {
      return <AbsoluteFill style={{ background: `linear-gradient(180deg, #141019, #241826)`, overflow: "hidden" }}>
        {Array.from({ length: 22 }, (_, i) => {
          const r = 30 + ((i * 37) % 70), x = ((i * 173) % W), y = (H - ((f * (0.4 + (i % 5) * 0.15) + i * 97) % (H + 200))) ;
          return <div key={i} style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%", background: i % 3 === 0 ? rgba(accent, 0.35) : i % 3 === 1 ? rgba(accent2, 0.28) : "rgba(255,255,255,.14)", filter: `blur(${4 + (i % 4) * 3}px)` }} />;
        })}
      </AbsoluteFill>;
    }
    case "rays": {
      const n = 18, R = Math.hypot(W, H);
      return <AbsoluteFill style={{ background: accent, overflow: "hidden" }}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(${W / 2},${H * 0.45}) rotate(${f * 0.5})`}>
            {Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2, b = a + Math.PI / n; return <path key={i} d={`M0,0 L${Math.cos(a) * R},${Math.sin(a) * R} L${Math.cos(b) * R},${Math.sin(b) * R} Z`} fill={rgba("#FFFFFF", 0.22)} />; })}
          </g>
        </svg>
        <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, rgba(255,255,255,.5), transparent 40%)` }} />
      </AbsoluteFill>;
    }
    case "neon": {
      const hz = H * 0.42, o = (f * 3) % 60;
      return <AbsoluteFill style={{ background: "linear-gradient(180deg, #0D0221 0%, #261447 45%, #0D0221 100%)", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: W / 2 - W * 0.28, top: hz - W * 0.5, width: W * 0.56, height: W * 0.56, borderRadius: "50%", background: `linear-gradient(180deg, ${accent}, ${accent2})`, opacity: 0.85, filter: "blur(1px)" }} />
        <div style={{ position: "absolute", left: -W, right: -W, top: hz, height: H, transform: "perspective(300px) rotateX(70deg)", transformOrigin: "50% 0",
          backgroundImage: `linear-gradient(${rgba(accent2, 0.9)} 2px, transparent 2px), linear-gradient(90deg, ${rgba(accent2, 0.9)} 2px, transparent 2px)`, backgroundSize: "60px 60px", backgroundPosition: `0 ${o}px` }} />
        <AbsoluteFill style={{ background: `linear-gradient(180deg, transparent 38%, rgba(13,2,33,.9) 43%, transparent 52%)` }} />
      </AbsoluteFill>;
    }
  }
  return <AbsoluteFill style={{ background: paper }} />;
};
