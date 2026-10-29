import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { Background, BACKGROUNDS, BG_INFO, BgName } from "./reel/backgrounds";
import { Captions, CAPTION_PRESETS, CapPreset } from "./reel/captions";
import { ThemeProvider, useTheme } from "./reel/core";
import { EventView, evDur } from "./reel/events";
import { FONTS, useFont } from "./reel/fonts";
import type { Ev, ReelProps, Word } from "./reel/types";

/* ═══ ВІТРИНИ: щоб людина бачила, що вибирати. Рендер: npm run demos (→ studio/out/ДЕМО-*.mp4) ═══ */

/** слова з рівними таймінгами (для демо без озвучки) */
export const fakeWords = (text: string, start = 0, per = 0.36): Word[] => text.split(/\s+/).filter(Boolean).map((t, i) => ({ text: t, start: +(start + i * per).toFixed(2), end: +(start + i * per + per * 0.85).toFixed(2) }));

const Label: React.FC<{ n: string; title: string; note?: string; low?: boolean }> = ({ n, title, note, low }) => {
  const T = useTheme();
  return <div style={{ position: "absolute", left: T.safe.left, right: T.safe.right, top: low ? T.H - T.safe.bottom - 190 : T.safe.top + 10, fontFamily: T.family, zIndex: 60, background: "rgba(10,10,12,.62)", borderRadius: 22, padding: "16px 20px" }}>
    <div style={{ display: "inline-block", background: T.accent, color: "#111", fontWeight: 900, fontSize: 30, padding: "6px 16px", borderRadius: 12 }}>{n}</div>
    <div style={{ fontWeight: 900, fontSize: 56, color: "#fff", marginTop: 12, letterSpacing: "-0.03em", textShadow: "0 4px 16px rgba(0,0,0,.6)" }}>{title}</div>
    {note && <div style={{ fontWeight: 600, fontSize: 28, color: "#fff", opacity: 0.85, marginTop: 6, textShadow: "0 3px 10px rgba(0,0,0,.7)" }}>{note}</div>}
  </div>;
};

/* ── субтитри: 8 стилів по 4 с ── */
const SUB_NOTE: Record<CapPreset, string> = { classic: "обведення + поточне слово кольором", pop: "кожне слово вистрибує", karaoke: "сказане заливається кольором", box: "плашка їде за голосом",
  typewriter: "друкується по літерах", minimal: "спокійно, для експертів", hormozi: "1–2 великі слова", neon: "світіння" };
const SUB_TEXT = "Ось як виглядатимуть ваші субтитри у цьому стилі монтажу";
export const SUB_SEC = 4;
export const SubtitlesDemo: React.FC = () => <ThemeProvider><AbsoluteFill style={{ background: "#000" }}>
  {CAPTION_PRESETS.map((p, i) => <Sequence key={p} from={i * SUB_SEC * 30} durationInFrames={SUB_SEC * 30}>
    <Background name={(["spotlight", "gradient", "bokeh", "blobs", "neon", "grid", "stripes", "spotlight"] as BgName[])[i]} />
    <Label n={`СТИЛЬ ${i + 1}/8`} title={`"${p}"`} note={SUB_NOTE[p]} />
    <Captions words={fakeWords(SUB_TEXT, 0.3, 0.38)} style={{ preset: p }} keywords={["субтитри", "монтажу"]} />
  </Sequence>)}
</AbsoluteFill></ThemeProvider>;

/* ── фони: 10 по 3 с ── */
export const BG_SEC = 3;
export const BackgroundsDemo: React.FC = () => <ThemeProvider><AbsoluteFill>
  {BACKGROUNDS.map((b, i) => <Sequence key={b} from={i * BG_SEC * 30} durationInFrames={BG_SEC * 30}>
    <Background name={b} /><Label n={`ФОН ${i + 1}/10`} title={`"${b}"`} note={BG_INFO[b]} />
  </Sequence>)}
</AbsoluteFill></ThemeProvider>;

/* ── анімації: 10 бонусних по 3.4 с ── */
export const ANIM_SEC = 3.4;
const ANIM_EVENTS: [string, Ev][] = [
  ["lowerThird — плашка з іменем", { type: "lowerThird", at: 0.2, dur: 3, name: "Олена Коваль", role: "SMM-експертка" }],
  ["title — велике слово", { type: "title", at: 0.2, dur: 3, text: "3 ПОМИЛКИ", sub: "які зʼїдають охоплення" }],
  ["counter — лічильник", { type: "counter", at: 0.2, dur: 3, from: 0, to: 12500, suffix: " ₴", label: "заробила за тиждень" }],
  ["callout — стрілка-виноска", { type: "callout", at: 0.2, dur: 3, x: 0.62, y: 0.48, text: "ось тут кнопка" }],
  ["list — список", { type: "list", at: 0.2, dur: 3, title: "Що взяти з собою", items: ["Телефон", "Мікрофон", "Гарне світло"] }],
  ["steps — кроки", { type: "steps", at: 0.2, dur: 3, title: "Як почати", items: ["Записати відео", "Кинути в папку", "Сказати «змонтуй»"] }],
  ["chart — інфографіка", { type: "chart", at: 0.2, dur: 3, title: "Охоплення за місяць", bars: [{ label: "Січ", value: 12 }, { label: "Лют", value: 18 }, { label: "Бер", value: 31 }, { label: "Кві", value: 54 }], suffix: "K" }],
  ["compare — було / стало", { type: "compare", at: 0.2, dur: 3, left: { title: "Було", items: ["3 год монтажу", "платні субтитри"] }, right: { title: "Стало", items: ["5 хвилин", "все саме"] } }],
  ["notification — сповіщення", { type: "notification", at: 0.2, dur: 3, app: "Instagram", icon: "social/instagram-colorful-3d-tile.jpg", title: "+1 250 нових підписників", text: "Ваш рілс у рекомендаціях" }],
  ["subscribe — кнопка «Підписатися»", { type: "subscribe", at: 0.2, dur: 3 }],
];
export const AnimationsDemo: React.FC = () => <ThemeProvider><AbsoluteFill>
  {ANIM_EVENTS.map(([name, e], i) => <Sequence key={i} from={Math.round(i * ANIM_SEC * 30)} durationInFrames={Math.round(ANIM_SEC * 30)}>
    <Background name="spotlight" /><Label n={`АНІМАЦІЯ ${i + 1}/10`} title={name.split(" — ")[0]} note={name.split(" — ")[1]} low={e.type === "notification"} />
    <EventView e={e} />
  </Sequence>)}
</AbsoluteFill></ThemeProvider>;

/* ── шрифти: усі 11 на одному екрані ── */
const FontRow: React.FC<{ k: string; i: number }> = ({ k, i }) => { const { family, heavy } = useFont(k); const f = useCurrentFrame();
  return <div style={{ opacity: Math.min(1, Math.max(0, (f - i * 3) / 6)) }}><div style={{ fontFamily: "system-ui", fontWeight: 700, fontSize: 20, color: "#aaa" }}>{k}</div><div style={{ fontFamily: family, fontWeight: heavy, fontSize: 46, lineHeight: 1.1, color: i % 2 ? "#fff" : "#FFD23F", whiteSpace: "nowrap" }}>Привіт, їжак! 2026</div></div>; };
export const FontsDemo: React.FC = () => <ThemeProvider><AbsoluteFill><Background name="spotlight" />
  <div style={{ position: "absolute", left: 56, top: 120, display: "flex", flexDirection: "column", gap: 12 }}>{Object.keys(FONTS).map((k, i) => <FontRow key={k} k={k} i={i} />)}</div>
</AbsoluteFill></ThemeProvider>;

/* ── приклад монтажного листа (ролик з ідеї без озвучки) — стартові props композиції Reel ── */
const DEMO_TEXT = "Ви досі монтуєте рілси годинами? Дивіться. Записали відео, кинули в папку, сказали змонтуй. Субтитри, музика, анімації, усе саме. Було три години, стало пять хвилин. Підписуйтеся, щоб не пропустити.";
const dw = fakeWords(DEMO_TEXT, 0.3, 0.4);
const at = (word: string) => dw.find((w) => w.text.toLowerCase().startsWith(word))?.start ?? 0;
export const DEMO_PROPS: ReelProps = {
  format: "9x16",
  base: { kind: "voice" },
  duration: +(dw[dw.length - 1].end + 0.8).toFixed(2),
  background: "grid",
  words: dw,
  captions: { preset: "pop" },
  keywords: ["годинами", "змонтуй", "усе", "пять"],
  events: [
    { type: "icon", at: at("годинами"), dur: 1.2, name: "hourglass_not_done", pos: "center", size: 260 },
    { type: "steps", at: at("записали"), dur: 2.6, items: ["Записали відео", "Кинули в папку", "Сказали «змонтуй»"], times: [at("записали"), at("кинули"), at("сказали")] },
    { type: "burst", at: at("усе"), name: "sparkles" },
    { type: "compare", at: at("було"), dur: 2.2, left: { title: "3 години" }, right: { title: "5 хвилин" } },
    { type: "subscribe", at: at("підписуйтеся"), dur: 2.2 },
  ],
  transitions: [{ at: at("дивіться"), type: "zoom" }, { at: at("було") - 0.1, type: "whip" }],
  music: { src: "music/house-vibez.mp3", volume: 0.12 },
  sfx: true,
  cover: { title: "МОНТАЖ САМ", sub: "за 5 хвилин" },
  end: { title: "Підпишись", sub: "нові ролики щотижня" },
};
