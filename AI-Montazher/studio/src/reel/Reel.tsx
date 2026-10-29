import React from "react";
import { AbsoluteFill, Audio, CalculateMetadataFunction, Img, OffthreadVideo, Sequence, useCurrentFrame } from "remotion";
import { Background } from "./backgrounds";
import { Captions } from "./captions";
import { clamp01, eio, fr, inOut, onColor, spr, src, ThemeProvider, useTheme } from "./core";
import { EventView, evDur, FULL_TYPES } from "./events";
import type { Ev, ReelProps } from "./types";

/* ═══ REEL — один шаблон на всі ролики. Ним керує монтажний лист edit.json (схема — types.ts, docs/EDIT-JSON.md).
   Рендер: node scripts/render.mjs <папка проєкту>  (сам підставляє edit.json як props). ═══ */

export const COVER_F = 8;
export const reelFrames = (p: ReelProps) => (p.cover ? COVER_F : 0) + fr(p.duration) + (p.end ? fr(p.end.dur ?? 2.5) : 0);
export const reelMetadata: CalculateMetadataFunction<ReelProps> = ({ props }) => ({
  durationInFrames: Math.max(30, reelFrames(props)),
  width: props.format === "16x9" ? 1280 : 720,
  height: props.format === "16x9" ? 720 : 1280,
  fps: 30,
});

export const Reel: React.FC<ReelProps> = (props) => <ThemeProvider brand={props.brand}><ReelInner {...props} /></ThemeProvider>;

/* звуки (усі — Mixkit Free License, studio/public/sfx; перелік — ATTRIBUTION.md) */
const U = (p: string) => `sfx/u/${p}.wav`;
const SFX: Record<string, string> = { sticker: U("pop/30-explainer-video-pops-whoosh-light-pop"), icon: U("pop/30-explainer-video-pops-whoosh-light-pop"), logo: U("pop/28-hard-pop-click"),
  burst: U("ding/41-positive-notification"), lowerThird: "sfx/swoosh-quick.mp3", callout: "sfx/marker-pen-line.mp3", notification: U("pop/31-bubble-pop-up-alert-notification"),
  subscribe: U("clicks/20-select-click"), title: U("whoosh/08-fast-transitions-swoosh"), counter: "sfx/sweep-digital.mp3", list: "sfx/swoosh-quick.mp3", steps: "sfx/swoosh-quick.mp3",
  chart: "sfx/swoosh-quick.mp3", compare: U("whoosh/02-fast-small-sweep-transition"), image: "sfx/transition-soft.mp3" };
const TR_SFX: Record<string, string> = { zoom: U("whoosh/03-air-zoom-vacuum"), flash: "sfx/camera-autofocus.mp3", whip: "sfx/whoosh-fast.mp3", shake: "sfx/bass-hit-short.mp3", blur: "sfx/transition-soft.mp3" };

const ReelInner: React.FC<ReelProps> = (P) => {
  const f = useCurrentFrame();
  const T = useTheme();
  const coverF = P.cover ? COVER_F : 0, baseF = fr(P.duration), total = reelFrames(P);
  const musicVol = P.music?.volume ?? 0.08;
  return <AbsoluteFill style={{ background: "#000" }}>
    <Sequence from={coverF} durationInFrames={total - coverF}><Main {...P} /></Sequence>
    {P.cover && f < coverF && <Cover {...P.cover} video={P.base.kind === "video" ? P.base.src : undefined} />}
    {P.music?.src && <Audio src={src(P.music.src)} volume={(x) => musicVol * Math.min(1, x / 15, (total - x) / 30)} loop />}
    {P.sfx !== false && <Sequence from={coverF} layout="none"><AutoSfx {...P} /></Sequence>}
  </AbsoluteFill>;
};

const AutoSfx: React.FC<ReelProps> = (P) => <>
  {(P.events ?? []).map((e, i) => SFX[e.type] && <Sequence key={"e" + i} from={Math.max(0, fr(e.at) + (e.type === "subscribe" ? Math.round(fr(evDur(e)) * 0.45) : 0))} durationInFrames={45} layout="none"><Audio src={src(SFX[e.type])} volume={0.1} /></Sequence>)}
  {(P.transitions ?? []).map((t, i) => <Sequence key={"t" + i} from={Math.max(0, fr(t.at) - 3)} durationInFrames={40} layout="none"><Audio src={src(TR_SFX[t.type] ?? TR_SFX.zoom)} volume={0.08} /></Sequence>)}
  {P.end && <Sequence from={fr(P.duration)} durationInFrames={45} layout="none"><Audio src={src(U("whoosh/07-short-transition-sweep"))} volume={0.1} /></Sequence>}
</>;

const Main: React.FC<ReelProps> = (P) => {
  const f = useCurrentFrame();
  const T = useTheme();
  const baseF = fr(P.duration), events = P.events ?? [];
  // великі вставки: відео під ними тьмяніє й розмивається
  const dim = Math.max(0, ...events.filter((e) => FULL_TYPES.includes(e.type) && !(e.type === "image" && (e.full ?? true))).map((e) => inOut(f, fr(e.at), fr(e.at) + fr(evDur(e)), 7, 7)));
  // переходи
  let tScale = 1, tx = 0, ty = 0, tBlur = 0, flash = 0;
  for (const t of P.transitions ?? []) {
    const d = f - fr(t.at);
    if (d < -6 || d > 14) continue;
    const bump = d < 0 ? eio((d + 6) / 6) : 1 - eio(d / 14);
    if (t.type === "zoom") { tScale *= 1 + 0.16 * bump; tBlur = Math.max(tBlur, bump * 6); }
    if (t.type === "flash") flash = Math.max(flash, d >= 0 ? 1 - d / 8 : 0);
    if (t.type === "whip") { tx += (d < 0 ? -1 : 1) * bump * T.W * 0.18; tBlur = Math.max(tBlur, bump * 14); }
    if (t.type === "shake" && d >= 0 && d < 10) { tx += Math.sin(d * 7) * 14 * (1 - d / 10); ty += Math.cos(d * 9) * 10 * (1 - d / 10); }
    if (t.type === "blur") tBlur = Math.max(tBlur, bump * 18);
  }
  const ended = f >= baseF;
  return <AbsoluteFill style={{ overflow: "hidden" }}>
    <Background name={P.background ?? (P.base.kind === "voice" ? "grid" : "blobs")} />
    {!ended && <AbsoluteFill style={{ transform: `translate(${tx}px,${ty}px) scale(${tScale})`, filter: tBlur > 0.3 || dim > 0.01 ? `blur(${(tBlur + dim * 14).toFixed(1)}px) brightness(${1 - 0.5 * dim})` : undefined }}>
      {P.base.kind === "video" ? <BaseVideo {...P} /> : P.base.src ? <Audio src={src(P.base.src)} /> : null}
    </AbsoluteFill>}
    {/* звук запису не зникає під час розмиття: аудіо окремо не потрібне — воно в OffthreadVideo */}
    {!ended && events.map((e, i) => <EventView key={i} e={e} all={events} talk={P.base.kind === "video" && (P.base.fit ?? "cover") === "cover"} />)}
    {!ended && P.captions && <Captions words={P.words} style={P.captions} keywords={P.keywords} />}
    {flash > 0 && <AbsoluteFill style={{ background: "#fff", opacity: flash * 0.85 }} />}
    {T.tag && !ended && <Tag />}
    {P.end && ended && <EndCard at={baseF} {...P.end} />}
  </AbsoluteFill>;
};

const BaseVideo: React.FC<ReelProps> = (P) => {
  const f = useCurrentFrame();
  const T = useTheme();
  if (P.base.kind !== "video") return null;
  const B = P.base, t = f / 30;
  const segs = B.segments ?? [];
  const si = segs.findIndex((s) => t >= s.at && t < s.at + s.dur);
  const zoomOn = B.zoom ?? true;
  // джамп-кати: на кожній склейці план міняється 1.0 ↔ 1.1 + повільний наїзд
  const s = si >= 0 ? segs[si] : null;
  const sc = zoomOn ? (si % 2 === 1 ? 1.1 : 1.0) * (1 + 0.025 * (s ? clamp01((t - s.at) / Math.max(0.5, s.dur)) : t / Math.max(1, P.duration))) : 1;
  if ((B.fit ?? "cover") === "card") {
    const w = T.W - T.safe.left - T.safe.right + 30, h = T.wide ? T.H - T.safe.top - T.safe.bottom - 60 : w * 9 / 16;
    return <div style={{ position: "absolute", left: T.W / 2 - w / 2, top: (T.wide ? T.H / 2 : 520) - h / 2, width: w, height: h, borderRadius: 28, overflow: "hidden", boxShadow: "0 40px 80px -30px rgba(0,0,0,.7)", background: "#000", transform: `scale(${sc})` }}>
      <OffthreadVideo src={src(B.src)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
    </div>;
  }
  return <AbsoluteFill style={{ transform: `scale(${sc})`, transformOrigin: "50% 40%" }}>
    <OffthreadVideo src={src(B.src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  </AbsoluteFill>;
};

const Tag: React.FC = () => {
  const T = useTheme();
  return <div style={{ position: "absolute", left: T.safe.left, top: T.safe.top - (T.wide ? 30 : 46), display: "flex", alignItems: "center", gap: 10, fontFamily: T.family, fontWeight: 800, fontSize: 22, letterSpacing: "0.02em",
    color: "#fff", background: "rgba(0,0,0,.35)", padding: "7px 14px", borderRadius: 12, zIndex: 40 }}>
    <div style={{ width: 12, height: 12, borderRadius: 6, background: T.accent }} />{T.channel}
  </div>;
};

/** обкладинка (перші 8 кадрів і cover.png): кадр із запису або промені + 1–3 слова; усе в центральній зоні 4:5 (сітка Instagram) */
const Cover: React.FC<{ title: string; sub?: string; sticker?: string; frame?: number; video?: string }> = ({ title, sub, sticker, frame = 1, video }) => {
  const T = useTheme();
  const st = sticker || T.mascot;
  const words = title.split(/\s+/).filter(Boolean);
  const maxW = T.W - T.safe.left - T.safe.right - 30;
  const size = Math.min(T.wide ? 140 : 150, maxW / Math.max(...words.map((w) => w.length * 0.8 + 0.4), 1));
  const onBg = video ? "#FFFFFF" : onColor(T.accent);
  return <AbsoluteFill>
    {video ? <AbsoluteFill>
      <OffthreadVideo src={src(video)} muted startFrom={fr(frame)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,.15) 0%, rgba(0,0,0,.55) 45%, rgba(0,0,0,.2) 100%)" }} />
    </AbsoluteFill> : <Background name="rays" />}
    {/* на кадрі з запису напис унизу (обличчя зазвичай угорі), але в межах зони 4:5 */}
    <div style={{ position: "absolute", left: T.safe.left, right: T.safe.right, ...(video && !T.wide ? { bottom: T.H - 1120 } : { top: T.wide ? 110 : 330 }), fontFamily: T.family, fontWeight: T.heavy, fontSize: size, lineHeight: 1, letterSpacing: "-0.04em", textTransform: "uppercase" }}>
      {words.map((w, i) => i === words.length - 1
        ? <div key={i}><span style={{ display: "inline-block", background: video ? T.accent : T.ink, color: video ? onColor(T.accent) : "#fff", padding: `${size * 0.04}px ${size * 0.12}px ${size * 0.1}px`, borderRadius: size * 0.14, marginTop: size * 0.06 }}>{w}</span></div>
        : <div key={i} style={{ color: onBg, textShadow: video ? "0 6px 24px rgba(0,0,0,.6)" : "none" }}>{w}</div>)}
      {sub && <div style={{ display: "inline-block", marginTop: 22, fontSize: 40, letterSpacing: 0, background: video ? "#fff" : T.ink, color: video ? "#111" : "#fff", padding: "8px 18px", borderRadius: 14, textTransform: "none" }}>{sub}</div>}
    </div>
    {st && <Img src={src(st)} style={{ position: "absolute", right: T.safe.right - 20, bottom: T.wide ? 40 : 150, height: T.wide ? T.H * 0.62 : 480, objectFit: "contain", filter: "drop-shadow(0 30px 40px rgba(0,0,0,.4))" }} />}
  </AbsoluteFill>;
};

const EndCard: React.FC<{ at: number; title?: string; sub?: string }> = ({ at, title = "Підпишись", sub }) => {
  const f = useCurrentFrame();
  const T = useTheme();
  const p = spr(f, at, 12, 170);
  return <AbsoluteFill>
    <Background name="blobs" />
    <div style={{ position: "absolute", left: T.safe.left, right: T.safe.right, top: T.wide ? 140 : 300, fontFamily: T.family, transform: `translateY(${(1 - p) * 60}px)`, opacity: Math.min(1, p * 1.5) }}>
      <div style={{ fontWeight: T.heavy, fontSize: Math.min(T.wide ? 110 : 112, (T.W - T.safe.left - T.safe.right) / Math.max(1, title.length * 0.66)), letterSpacing: "-0.045em", lineHeight: 1, color: T.ink, whiteSpace: "nowrap" }}>{title}</div>
      {sub && <div style={{ fontWeight: 700, fontSize: 38, marginTop: 18, color: T.ink, opacity: 0.8 }}>{sub}</div>}
      <div style={{ marginTop: 26, display: "inline-flex", alignItems: "center", gap: 12, background: T.ink, color: "#fff", padding: "12px 22px", borderRadius: 18, fontWeight: 800, fontSize: 36 }}>
        <div style={{ width: 16, height: 16, borderRadius: 8, background: T.accent }} />{T.handle}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 30 }}>
        {T.socials.map((s, i) => { const q = spr(f, at + 6 + i * 3, 11, 200); return <Img key={s} src={src(s)} style={{ width: 84, height: 84, borderRadius: 20, objectFit: "cover", transform: `scale(${q})`, boxShadow: "0 10px 20px -8px rgba(0,0,0,.5)" }} />; })}
      </div>
    </div>
    {T.mascot && <Img src={src(T.mascot)} style={{ position: "absolute", right: T.safe.right - 30, bottom: T.wide ? 20 : T.safe.bottom - 60, height: T.wide ? T.H * 0.62 : 520, objectFit: "contain", transform: `scale(${0.6 + 0.4 * spr(f, at + 4, 11, 180)})`, transformOrigin: "50% 100%" }} />}
  </AbsoluteFill>;
};
