import React from "react";
import { Composition } from "remotion";
import { Reel, reelMetadata } from "./reel/Reel";
import type { ReelProps } from "./reel/types";
import { AnimationsDemo, ANIM_SEC, BackgroundsDemo, BG_SEC, DEMO_PROPS, FontsDemo, SubtitlesDemo, SUB_SEC } from "./demos";
import { CAPTION_PRESETS } from "./reel/captions";
import { BACKGROUNDS } from "./reel/backgrounds";

/* Композиції. Головна — Reel: кожен ролик = монтажний лист edit.json (props), код писати не треба.
   Рендер ролика: node scripts/render.mjs <папка проєкту> (з кореня AI-Montazher).
   Вітрини стилів: npm run demos. */
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Reel" component={Reel as React.FC<any>} defaultProps={DEMO_PROPS as any} calculateMetadata={reelMetadata as any} durationInFrames={300} fps={30} width={720} height={1280} />
    <Composition id="Subtitles" component={SubtitlesDemo} durationInFrames={CAPTION_PRESETS.length * SUB_SEC * 30} fps={30} width={720} height={1280} />
    <Composition id="Animations" component={AnimationsDemo} durationInFrames={Math.round(10 * ANIM_SEC * 30)} fps={30} width={720} height={1280} />
    <Composition id="Backgrounds" component={BackgroundsDemo} durationInFrames={BACKGROUNDS.length * BG_SEC * 30} fps={30} width={720} height={1280} />
    <Composition id="Fonts" component={FontsDemo} durationInFrames={60} fps={30} width={720} height={1280} />
  </>
);
