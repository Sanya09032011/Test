import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, useCurrentFrame } from "remotion";
import { clamp01, eio, eout, float, fr, inOut, isVideo, onColor, spr, src, Theme, useTheme } from "./core";
import type { Ev } from "./types";

/* ═══ ПОДІЇ НА ЕКРАНІ ═══
   Дрібні (поверх відео, не закривають людину): sticker · icon · logo · burst · lowerThird · callout · notification · subscribe
   Великі (відео під ними тьмяніє й розмивається, голос звучить далі): title · counter · list · steps · chart · compare · image
   10 бонусних анімацій = lowerThird, title, counter, callout, list, steps, chart, compare, notification, subscribe.
   Опис полів кожної — docs/ANIMATIONS.md. Демо — композиція «Animations» (ДЕМО-анімації.mp4). */

export const FULL_TYPES = ["title", "counter", "list", "steps", "chart", "compare", "image"];
export const BONUS_ANIMS = ["lowerThird", "title", "counter", "callout", "list", "steps", "chart", "compare", "notification", "subscribe"];
export const evDur = (e: Ev) => e.dur ?? (FULL_TYPES.includes(e.type) ? 2.6 : e.type === "subscribe" ? 2.4 : e.type === "notification" ? 2.6 : 1.8);

type Pos = "left" | "right" | "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
const posXY = (T: Theme, pos: Pos | [number, number] = "right", talk = false): [number, number] => {
  if (Array.isArray(pos)) return pos;
  const { W, H, wide } = T;
  // у записі людини (talk) обличчя зазвичай у центрі зверху → дрібні елементи нижче, на рівні грудей і по краях
  if (talk && !wide) { const m: Record<Pos, [number, number]> = { left: [150, 720], right: [570, 720], center: [360, 740], "top-left": [150, 290], "top-right": [570, 290], "bottom-left": [150, 820], "bottom-right": [570, 820] }; return m[pos] ?? m.right; }
  const cx = W / 2, cy = wide ? H * 0.46 : 520;
  const dx = wide ? W * 0.3 : 190, dy = wide ? H * 0.22 : 210;
  const m: Record<Pos, [number, number]> = { left: [cx - dx, cy], right: [cx + dx, cy], center: [cx, cy], "top-left": [cx - dx, cy - dy], "top-right": [cx + dx, cy - dy], "bottom-left": [cx - dx, cy + dy], "bottom-right": [cx + dx, cy + dy] };
  return m[pos] ?? m.right;
};
/** центр контентної зони між верхньою сейф-зоною і субтитрами */
const zone = (T: Theme) => (T.wide ? { cy: T.H * 0.45, maxH: T.H * 0.62 } : { cy: 520, maxH: 620 });
const fit = (text: string, base: number, maxW: number, k = 0.62) => Math.min(base, maxW / Math.max(1, text.length * k));

const Card: React.FC<{ T: Theme; p: number; vis: number; w: number; h?: number; children: React.ReactNode; dark?: boolean; y?: number }> = ({ T, p, vis, w, h, children, dark, y }) => {
  const Z = zone(T);
  return <div style={{ position: "absolute", left: T.W / 2 - w / 2, top: (y ?? Z.cy) - (h ?? 0) / 2, width: w, height: h, borderRadius: 36, background: dark ? T.ink : T.paper, color: dark ? "#fff" : T.ink,
    boxShadow: "0 40px 80px -30px rgba(0,0,0,.6)", padding: 34, boxSizing: "border-box", transform: `translateY(${(1 - p) * 70}px) scale(${0.86 + 0.14 * p})`, opacity: Math.min(1, p * 1.6) * vis, fontFamily: T.family }}>{children}</div>;
};

/** одна подія: сама рахує свій локальний кадр і проявлення */
export const EventView: React.FC<{ e: Ev; all?: Ev[]; talk?: boolean }> = ({ e, all = [], talk = false }) => {
  const f = useCurrentFrame();
  const T = useTheme();
  const a = fr(e.at);
  let b = a + fr(evDur(e));
  if (["sticker", "icon", "logo", "callout"].includes(e.type)) for (const o of all) { const oa = fr(o.at); if (FULL_TYPES.includes(o.type) && oa > a && oa < b) b = oa; }
  if (f < a - 1 || f > b + 8) return null;
  const lf = f - a, D = b - a, vis = inOut(f, a, b, 1, 7), p = spr(f, a, 13, 170);
  const W = T.W, maxW = W - T.safe.left - T.safe.right - 40;
  const H = T.heavy;

  switch (e.type) {
    /* ── дрібні ── */
    case "sticker": case "icon": case "logo": {
      const [x, y] = posXY(T, e.pos, talk), size = e.size ?? (talk ? (e.type === "sticker" ? 240 : 170) : e.type === "sticker" ? 280 : 200);
      const file = e.type === "icon" ? `assets/fl-${e.name}.png` : e.src;
      const q = spr(f, a, 10, 200);
      const tile = e.type === "logo";
      return <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, opacity: Math.min(1, q * 1.6) * vis, zIndex: 20,
        transform: `${float(f, e.at, 5)} scale(${(0.3 + 0.7 * q) * (1 - 0.3 * (1 - vis))}) rotate(${(e.rot ?? (x < W / 2 ? -6 : 6)) * q + (1 - q) * -30}deg)` }}>
        {tile ? <div style={{ width: size, height: size, borderRadius: size * 0.24, background: "#fff", boxShadow: "0 24px 40px -16px rgba(0,0,0,.55)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: size * 0.04 }}>
          <Img src={src(file)} style={{ width: size * 0.56, height: size * 0.56, objectFit: "contain" }} />
          {e.label && <div style={{ fontFamily: T.family, fontWeight: 800, fontSize: size * 0.11, color: "#111" }}>{e.label}</div>}
        </div> : <Img src={src(file)} style={{ width: size, height: size, objectFit: "contain", filter: "drop-shadow(0 20px 24px rgba(0,0,0,.35))" }} />}
      </div>;
    }
    case "burst": {
      const n = e.count ?? 9, [x0, y0] = posXY(T, e.pos ?? "center", talk), file = e.src ?? `assets/fl-${e.name ?? "party_popper"}.png`;
      return <AbsoluteFill style={{ zIndex: 20, pointerEvents: "none" }}>{Array.from({ length: n }, (_, i) => {
        const ang = (i / n) * Math.PI * 2 + 0.3, t = clamp01(lf / 26), dist = eout(t) * (T.wide ? 380 : 300), g = t * t * 260;
        const s = 90 + (i % 3) * 30;
        return <Img key={i} src={src(file)} style={{ position: "absolute", left: x0 + Math.cos(ang) * dist - s / 2, top: y0 + Math.sin(ang) * dist * 0.8 + g - s / 2, width: s, height: s, opacity: (1 - clamp01((lf - D * 0.6) / 10)) * clamp01(lf / 3), transform: `rotate(${lf * (i % 2 ? 6 : -6)}deg)` }} />;
      })}</AbsoluteFill>;
    }
    case "lowerThird": {
      const y = T.wide ? T.H - 270 : 720, x = T.safe.left + 10, k = eout(lf / 10), bar = eout((lf - 4) / 12);
      return <div style={{ position: "absolute", left: x, top: y, opacity: vis, zIndex: 20, fontFamily: T.family, transform: `translateX(${(1 - k) * -60}px)` }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 14, height: 118, background: T.accent, borderRadius: 7, transform: `scaleY(${k})`, transformOrigin: "50% 0" }} />
        <div style={{ marginLeft: 26, overflow: "hidden", width: (T.wide ? 620 : 520) * bar, whiteSpace: "nowrap" }}>
          <div style={{ display: "inline-block", background: T.ink, color: "#fff", padding: "10px 22px", borderRadius: 16, fontWeight: H, fontSize: 46, letterSpacing: "-0.02em" }}>{e.name}</div><br />
          {e.role && <div style={{ display: "inline-block", marginTop: 8, background: T.accent, color: onColor(T.accent), padding: "6px 18px", borderRadius: 12, fontWeight: 700, fontSize: 30 }}>{e.role}</div>}
        </div>
      </div>;
    }
    case "callout": {
      // стрілка-виноска: x, y — куди показати (0..1 від ширини/висоти кадру); text — підпис
      const tx = (e.x ?? 0.5) * W, ty = (e.y ?? 0.4) * T.H, side = e.side ?? (tx > W / 2 ? "left" : "right");
      const lx = side === "left" ? Math.max(T.safe.left + 150, tx - 260) : Math.min(W - T.safe.right - 150, tx + 260), ly = ty + (e.below ? 220 : -200);
      const draw = eio(lf / 14), lp = spr(f, a + 10, 12, 190);
      const mx = (lx + tx) / 2 + (side === "left" ? -40 : 40), my = (ly + ty) / 2;
      const ang = Math.atan2(ty - my, tx - mx);
      return <AbsoluteFill style={{ zIndex: 20, opacity: vis }}>
        <svg width={W} height={T.H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <path d={`M${lx},${ly + (e.below ? -40 : 40)} Q${mx},${my} ${tx - Math.cos(ang) * 30},${ty - Math.sin(ang) * 30}`} fill="none" stroke={T.accent2} strokeWidth={9} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
          {draw > 0.95 && <path d={`M${tx - Math.cos(ang) * 30 + Math.cos(ang + 2.5) * 34},${ty - Math.sin(ang) * 30 + Math.sin(ang + 2.5) * 34} L${tx - Math.cos(ang) * 30},${ty - Math.sin(ang) * 30} L${tx - Math.cos(ang) * 30 + Math.cos(ang - 2.5) * 34},${ty - Math.sin(ang) * 30 + Math.sin(ang - 2.5) * 34}`} fill="none" stroke={T.accent2} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />}
          <circle cx={tx} cy={ty} r={26 + Math.sin(lf / 4) * 4} fill="none" stroke={T.accent2} strokeWidth={6} opacity={clamp01((lf - 12) / 4)} />
        </svg>
        <div style={{ position: "absolute", left: lx, top: ly, transform: `translate(-50%,-50%) scale(${lp})`, background: T.accent2, color: onColor(T.accent2), padding: "14px 26px", borderRadius: 22, fontFamily: T.family, fontWeight: H, fontSize: fit(e.text ?? "", 44, 420, 0.6), whiteSpace: "nowrap", boxShadow: "0 16px 30px -10px rgba(0,0,0,.45)" }}>{e.text}</div>
      </AbsoluteFill>;
    }
    case "notification": {
      const y0 = T.safe.top + 24, k = spr(f, a, 14, 160), out = eio((lf - D + 8) / 8);
      const w = Math.min(maxW + 20, 620);
      return <div style={{ position: "absolute", left: W / 2 - w / 2, top: y0, width: w, zIndex: 25, transform: `translateY(${(1 - k) * -220 - out * 220}px)`, opacity: 1 - out }}>
        <div style={{ background: "rgba(245,245,247,.97)", borderRadius: 34, padding: "22px 26px", display: "flex", gap: 20, alignItems: "center", boxShadow: "0 30px 60px -20px rgba(0,0,0,.6)", fontFamily: T.family, color: "#111" }}>
          <div style={{ width: 84, height: 84, borderRadius: 20, overflow: "hidden", flexShrink: 0, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Img src={src(e.icon ?? "assets/fl-bell.png")} style={{ width: e.icon?.startsWith("social/") ? 84 : 60, height: e.icon?.startsWith("social/") ? 84 : 60, objectFit: "cover" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, fontWeight: 600, opacity: 0.55 }}><span>{e.app ?? "Повідомлення"}</span><span>зараз</span></div>
            <div style={{ fontSize: 31, fontWeight: 800, marginTop: 2, lineHeight: 1.15, maxHeight: 72, overflow: "hidden" }}>{e.title}</div>
            {e.text && <div style={{ fontSize: 28, fontWeight: 600, opacity: 0.75, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.text}</div>}
          </div>
        </div>
      </div>;
    }
    case "subscribe": {
      const y = T.wide ? T.H * 0.5 : 640, click = Math.round(D * 0.45), done = lf >= click;
      const k = spr(f, a, 12, 180), press = lf >= click && lf < click + 5 ? 0.92 : 1;
      const cx = W / 2 + 120, cy = y + 20, sx = W - 60, sy = T.H * 0.85;
      const m = eio((lf - 6) / (click - 6));
      const label = done ? (e.done ?? "Ви підписані") : (e.text ?? "Підписатися");
      return <div style={{ position: "absolute", inset: 0, zIndex: 25, opacity: vis }}>
        <div style={{ position: "absolute", left: W / 2, top: y, transform: `translate(-50%,-50%) scale(${(0.5 + 0.5 * k) * press})`, background: done ? T.ink : T.accent2, color: "#fff", padding: "26px 54px", borderRadius: 60,
          fontFamily: T.family, fontWeight: H, fontSize: 50, display: "flex", alignItems: "center", gap: 18, whiteSpace: "nowrap", boxShadow: "0 24px 50px -16px rgba(0,0,0,.55)" }}>
          {done && <svg width={44} height={44} viewBox="0 0 26 26"><path d="M4,14 L10,20 L22,6" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" /></svg>}{label}
          <Img src={src("assets/fl-bell.png")} style={{ width: 58, height: 58, transform: `rotate(${done ? Math.sin((lf - click) / 1.6) * 22 * Math.max(0, 1 - (lf - click) / 20) : 0}deg)` }} />
        </div>
        <svg width={64} height={74} style={{ position: "absolute", left: sx + (cx - sx) * m, top: sy + (cy - sy) * m, transform: `scale(${press})`, filter: "drop-shadow(0 6px 8px rgba(0,0,0,.4))", opacity: clamp01((lf - 4) / 4) }}>
          <path d="M4,4 L4,48 L16,37 L24,58 L33,54 L25,34 L40,34 Z" fill="#fff" stroke="#111" strokeWidth={4} strokeLinejoin="round" />
        </svg>
      </div>;
    }

    /* ── великі ── */
    case "title": {
      const text = String(e.text ?? ""), size = fit(text, T.wide ? 130 : 120, maxW, 0.66);
      const k = spr(f, a, 10, 190);
      return <AbsoluteFill style={{ zIndex: 15, opacity: vis, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 18, top: zone(T).cy - T.H / 2, fontFamily: T.family }}>
        <div style={{ position: "relative", transform: `scale(${1.6 - 0.6 * k})`, filter: k < 0.99 ? `blur(${(1 - k) * 10}px)` : undefined, opacity: Math.min(1, k * 1.5) }}>
          <div style={{ position: "absolute", left: -18, right: -18, top: "52%", height: "42%", background: T.accent, borderRadius: 10, transform: `scaleX(${eout((lf - 6) / 10)}) rotate(-1.5deg)`, transformOrigin: "0 50%" }} />
          <div style={{ position: "relative", fontWeight: H, fontSize: size, lineHeight: 1, letterSpacing: "-0.04em", color: e.color ?? "#fff", textShadow: "0 10px 30px rgba(0,0,0,.5)", whiteSpace: "nowrap", textTransform: e.upper === false ? undefined : "uppercase" }}>{text}</div>
        </div>
        {e.sub && <div style={{ fontWeight: 700, fontSize: 40, color: "#fff", opacity: clamp01((lf - 10) / 6), textShadow: "0 6px 20px rgba(0,0,0,.6)" }}>{e.sub}</div>}
      </AbsoluteFill>;
    }
    case "counter": {
      const from = e.from ?? 0, to = e.to ?? 100, dec = e.decimals ?? 0, run = Math.min(D * 0.6, 36);
      const v = from + (to - from) * eout(lf / run);
      const txt = `${e.prefix ?? ""}${v.toLocaleString("uk-UA", { minimumFractionDigits: dec, maximumFractionDigits: dec })}${e.suffix ?? ""}`;
      const done = lf >= run;
      return <Card T={T} p={p} vis={vis} w={Math.min(maxW + 30, 620)} h={360}>
        <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <div style={{ fontWeight: H, fontSize: fit(txt, 150, 540, 0.62), lineHeight: 1, letterSpacing: "-0.05em", color: T.ink, fontVariantNumeric: "tabular-nums", transform: `scale(${done ? 1 + 0.08 * Math.max(0, 1 - (lf - run) / 8) : 1})` }}>{txt}</div>
          <div style={{ width: 120, height: 10, borderRadius: 5, background: T.accent }} />
          {e.label && <div style={{ fontWeight: 700, fontSize: 38, opacity: 0.75, textAlign: "center" }}>{e.label}</div>}
        </div>
      </Card>;
    }
    case "list": case "steps": {
      const items: string[] = e.items ?? [], n = items.length;
      const times: number[] = e.times ? e.times.map((t: number) => fr(t) - a) : items.map((_, i) => 6 + i * Math.max(8, Math.floor((D * 0.55) / Math.max(1, n))));
      const rowH = n > 4 ? 82 : 96, h = (e.title ? 100 : 30) + n * rowH + 40, steps = e.type === "steps";
      return <Card T={T} p={p} vis={vis} w={Math.min(maxW + 30, T.wide ? 760 : 620)} h={h}>
        {e.title && <div style={{ fontWeight: H, fontSize: fit(e.title, 50, 540, 0.6), letterSpacing: "-0.03em", marginBottom: 18 }}>{e.title}</div>}
        {steps && lf >= times[0] && <div style={{ position: "absolute", left: 34 + 30, top: (e.title ? 100 : 30) + 34 + 30, width: 6, height: (n - 1) * rowH, background: "rgba(0,0,0,.1)", borderRadius: 3 }}>
          <div style={{ width: 6, height: `${clamp01((lf - times[0]) / Math.max(1, times[n - 1] - times[0])) * 100}%`, background: T.accent, borderRadius: 3 }} /></div>}
        {items.map((it, i) => { const q = spr(f, a + times[i], 12, 190); const on = lf >= times[i];
          return <div key={i} style={{ position: "relative", height: rowH, display: "flex", alignItems: "center", gap: 22, opacity: Math.min(1, q * 1.6), transform: `translateX(${(1 - q) * 50}px)` }}>
            <div style={{ width: 60, height: 60, borderRadius: 30, background: on ? T.accent : "#ddd", color: onColor(T.accent), flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: H, fontSize: 32, transform: `scale(${0.6 + 0.4 * q})` }}>
              {steps ? i + 1 : <svg width={32} height={32} viewBox="0 0 26 26"><path d="M4,14 L10,20 L22,6" fill="none" stroke={onColor(T.accent)} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </div>
            <div style={{ fontWeight: 800, fontSize: fit(it, 42, T.wide ? 580 : 440, 0.56), letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>{it}</div>
          </div>; })}
      </Card>;
    }
    case "chart": {
      const bars: { label: string; value: number }[] = e.bars ?? [], n = bars.length, max = Math.max(1, ...bars.map((b) => b.value));
      const w = Math.min(maxW + 30, T.wide ? 820 : 620), h = 520, bw = Math.min(110, (w - 68 - (n - 1) * 22) / Math.max(1, n));
      return <Card T={T} p={p} vis={vis} w={w} h={h}>
        {e.title && <div style={{ fontWeight: H, fontSize: fit(e.title, 46, w - 70, 0.6), letterSpacing: "-0.03em" }}>{e.title}</div>}
        <div style={{ position: "absolute", left: 34, right: 34, bottom: 70, height: 320, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 22 }}>
          {bars.map((b, i) => { const g = eout((lf - 6 - i * 4) / 18), hh = (b.value / max) * 300 * g, top = b.value === max;
            return <div key={i} style={{ width: bw, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: 320 }}>
              <div style={{ fontWeight: H, fontSize: 30, marginBottom: 8, opacity: g, fontVariantNumeric: "tabular-nums" }}>{Math.round(b.value * g)}{e.suffix ?? ""}</div>
              <div style={{ width: "100%", height: hh, borderRadius: 14, background: top ? T.accent : "rgba(0,0,0,.18)" }} />
            </div>; })}
        </div>
        <div style={{ position: "absolute", left: 34, right: 34, bottom: 22, display: "flex", justifyContent: "center", gap: 22 }}>
          {bars.map((b, i) => <div key={i} style={{ width: bw, textAlign: "center", fontWeight: 700, fontSize: 24, opacity: 0.7, whiteSpace: "nowrap", overflow: "hidden" }}>{b.label}</div>)}
        </div>
      </Card>;
    }
    case "compare": {
      const L = e.left ?? { title: "Було" }, R = e.right ?? { title: "Стало" }, Z = zone(T);
      const cw = T.wide ? 400 : 290, ch = T.wide ? 380 : 470, gap = T.wide ? 60 : 26;
      const kl = spr(f, a, 13, 170), kr = spr(f, a + 8, 13, 170), vs = spr(f, a + 14, 10, 220);
      const col = (S: any, good: boolean, k: number, dir: number) => <div style={{ width: cw, height: ch, borderRadius: 32, background: good ? T.paper : "#2A2A2E", color: good ? T.ink : "#fff", padding: 26, boxSizing: "border-box",
        boxShadow: "0 30px 60px -24px rgba(0,0,0,.6)", transform: `translateX(${(1 - k) * dir * 200}px) rotate(${(1 - k) * dir * 6}deg)`, opacity: Math.min(1, k * 1.6), fontFamily: T.family, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ width: 92, height: 92, borderRadius: 46, background: good ? "#1E9E5A" : T.accent2, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={48} height={48} viewBox="0 0 26 26">{good ? <path d="M4,14 L10,20 L22,6" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" /> : <path d="M6,6 L20,20 M20,6 L6,20" stroke="#fff" strokeWidth={4} strokeLinecap="round" />}</svg>
        </div>
        <div style={{ fontWeight: H, fontSize: fit(S.title ?? "", 48, cw - 40, 0.6), letterSpacing: "-0.03em", textAlign: "center" }}>{S.title}</div>
        {(S.items ?? []).map((it: string, i: number) => <div key={i} style={{ fontWeight: 700, fontSize: fit(it, 30, cw - 40, 0.55), opacity: clamp01((f - a - 12 - i * 5) / 6) * 0.85, textAlign: "center" }}>{it}</div>)}
      </div>;
      return <AbsoluteFill style={{ zIndex: 15, opacity: vis }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: Z.cy - ch / 2, display: "flex", justifyContent: "center", gap }}>{col(L, false, kl, -1)}{col(R, true, kr, 1)}</div>
        <div style={{ position: "absolute", left: T.W / 2 - 46, top: Z.cy - 46, width: 92, height: 92, borderRadius: 46, background: T.accent, color: onColor(T.accent), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.family, fontWeight: H, fontSize: 36, transform: `scale(${vs})`, boxShadow: "0 10px 24px rgba(0,0,0,.4)" }}>VS</div>
      </AbsoluteFill>;
    }
    case "image": {
      const full = e.full ?? true, Z = zone(T), k = spr(f, a, 13, 160), kb = 1.04 + 0.08 * (lf / Math.max(1, D));
      const w = full ? T.W : Math.min(maxW + 30, 620), h = full ? T.H : Math.min(Z.maxH, w * 1.25);
      const style: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", transform: `scale(${kb})` };
      return <div style={{ position: "absolute", left: T.W / 2 - w / 2, top: full ? 0 : Z.cy - h / 2, width: w, height: h, borderRadius: full ? 0 : 32, overflow: "hidden", zIndex: 14, opacity: vis * Math.min(1, k * 1.5),
        transform: full ? `scale(${1.08 - 0.08 * k})` : `scale(${0.85 + 0.15 * k})`, boxShadow: full ? undefined : "0 40px 80px -30px rgba(0,0,0,.6)" }}>
        {isVideo(e.src) ? <Sequence from={a} layout="none"><OffthreadVideo src={src(e.src)} muted={!e.sound} startFrom={fr(e.from ?? 0)} style={style} /></Sequence> : <Img src={src(e.src)} style={style} />}
      </div>;
    }
  }
  return null;
};
