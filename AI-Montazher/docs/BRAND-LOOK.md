# Бренд-лук: кольори, шрифт, персонаж і власний стікерпак

## 1. Дизайн-система за 5 хвилин
Агент питає (або бере з логотипа / фото / референсу) і вписує в `studio/src/config.ts`:
- **Назва каналу** (`channel`) і **нік** (`handle`) — на бирці й фінальній картці.
- **Кольори:** `accent` (головний — ключові слова, плашки), `accent2` (стрілки, «ні»), `ink` (темний), `paper` (світлий).
  Є логотип чи фото, яке подобається? `node scripts/palette.mjs "<картинка>"` — дасть кольори й готову пропозицію.
- **Шрифт** (`font`) — подивитися: `ДЕМО/ДЕМО-шрифти.png`.
- **Соцмережі** (`socials`) — плитки з `studio/public/social`.
- **Маскот** (`mascot`) — твій стікер-персонаж (крок 4) для обкладинки й фінальної картки.
Після змін — `npm run demos` у `studio`: вітрини перемалюються твоїми кольорами.

Правило: один акцентний колір + один допоміжний. Усі ролики — в одній системі, тоді канал впізнають.

## 2. Картка персонажа (безкоштовно)
Де генерувати: **ChatGPT** (картинки), **Google AI Studio** (aistudio.google.com, модель Nano Banana), **Google Flow**, **Qwen** (chat.qwen.ai).
Завантаж своє фото анфас (гарне світло, без окулярів від сонця) і встав промпт:
```
Create a character reference sheet of the person in the photo. Keep the face, hairstyle and proportions recognizable.
Layout on a clean white background: full body front view, side view, back view, plus 4 close-up facial expressions
(happy, surprised, thinking, laughing). Consistent outfit: [опиши свій одяг]. Studio lighting, high detail, no text.
```
Збережи найкращий результат у `ЗАНЕСИ-СЮДИ/2 бренд і стікери/`. Ця картка — еталон: далі завжди прикладай її як референс.

## 3. Персонаж у будь-якому стилі
Приклади стилів: `3D Pixar-style cartoon` · `anime illustration` · `flat vector illustration, bold outlines` · `clay / plasticine figure` ·
`comic book style, halftone` · `cute chibi` · `realistic 3D render, Apple-style`. Промпт (до нього прикладай картку з кроку 2):
```
Redraw this character in [STYLE]. Keep the same face features, hairstyle, outfit and colors so it is clearly the same person.
Full body, neutral pose, plain white background, no text.
```

## 4. Власний стікерпак (9 емоцій однією картинкою)
Генеруй на **однотонному яскраво-зеленому фоні** — тоді фон прибирається чисто:
```
Sticker sheet of this character in [STYLE], 3x3 grid, 9 different stickers: waving hello, thumbs up, shocked face, thinking,
laughing, pointing to the side, holding a phone, celebrating with arms up, facepalm. Each sticker separated with space,
thick white outline around each character, solid pure green background #00FF00, no text, no shadows on background.
```
Поклади картинку в `ЗАНЕСИ-СЮДИ/2 бренд і стікери/` і скажи агенту «зроби стікери». Агент запускає
`node scripts/stickers.mjs "<картинка>" --grid 3x3 --name <імʼя>` → `studio/public/stickers/<імʼя>-1…9.png` з прозорим фоном.
Окремі стікери (по одному на картинці) — без `--grid`. Перевір, що фон прибрався (агент покаже).
У ролику: `{ "type": "sticker", "at": 3.2, "src": "stickers/hero-3.png", "pos": "right" }`.

## 5. Логотипи сервісів
Згадав сервіс — справжній логотип: `studio/public/logos` (40 найпопулярніших) або `tools/logos` (~950, копіюй потрібний у `studio/public/logos`).
Немає — агент знаходить офіційний на сайті сервісу.
