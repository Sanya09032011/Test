import type { Brand } from "../config";
import type { BgName } from "./backgrounds";
import type { CapStyle } from "./captions";

/* ═══ СХЕМА edit.json — монтажний лист ролика. Усі часи — у СЕКУНДАХ від початку ролика (без обкладинки). ═══ */

/** слово з таймінгом (з розпізнавання мовлення або озвучки) */
export type Word = { text: string; start: number; end: number };

/** подія на екрані: що зʼявляється, коли і скільки триває. Повний список типів — docs/ANIMATIONS.md */
export type Ev = { type: string; at: number; dur?: number; [k: string]: any };

export type Transition = { at: number; type: "zoom" | "flash" | "whip" | "shake" | "blur" };

export type ReelProps = {
  /** "9x16" — Reels/TikTok/Shorts; "16x9" — YouTube */
  format: "9x16" | "16x9";
  /** основа ролика:
      video — змонтований запис людини (говоряща голова, скрінкаст): звук береться з відео;
      voice — озвучка (ролик з ідеї): під нею анімований фон */
  base:
    | { kind: "video"; src: string; fit?: "cover" | "card"; segments?: { at: number; dur: number }[]; zoom?: boolean }
    | { kind: "voice"; src?: string };
  /** тривалість основи в секундах (без обкладинки й фінальної картки) */
  duration: number;
  /** фон: під роликом з ідеї, під карткою в режимі fit:"card" і під повноекранними вставками */
  background?: BgName;
  /** слова для субтитрів */
  words: Word[];
  /** стиль субтитрів або false — без субтитрів */
  captions: CapStyle | false;
  /** слова, які в субтитрах підсвічуються акцентним кольором (без регістру, за початком слова) */
  keywords?: string[];
  /** події: стікери, іконки, логотипи, анімації-інфографіка, вставки */
  events?: Ev[];
  /** динамічні переходи (ривок-зум, спалах, свайп, тряска, розмиття) */
  transitions?: Transition[];
  /** фонова музика (файл з public або media/) */
  music?: { src: string; volume?: number } | null;
  /** автоматичні звуки на події (вжух, поп, клік) */
  sfx?: boolean;
  /** обкладинка на перших 8 кадрах і cover.png: 1–3 слова; frame — секунда запису для тла (лише монтаж запису) */
  cover?: { title: string; sub?: string; sticker?: string; frame?: number } | null;
  /** фінальна картка «підпишись» після основи */
  end?: { title?: string; sub?: string; dur?: number } | null;
  /** перевизначити бренд для цього ролика */
  brand?: Partial<Brand>;
};
