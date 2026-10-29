# Референси: де шукати і як дати агенту

Референс — приклад, який подобається: кольори, шрифт, субтитри, ритм, анімації. Не копіюємо чужий бренд — беремо підхід.

## Для дизайн-системи (кольори, шрифти, стиль)
- **Pinterest** — шукай: «brand color palette», «instagram reels design», «youtube thumbnail style», «minimal brand identity»; зберігай у дошку.
- **Behance** (behance.net) — «brand identity», «social media design», «motion branding».
- **Dribbble** (dribbble.com) — «color palette», «social media kit».
- **Savee** (savee.it) — естетичні добірки.
- **Coolors** (coolors.co) — генератор палітр: обери 2–4 кольори → HEX-коди дай агенту.
- **Fonts In Use** (fontsinuse.com) — як шрифти виглядають у реальних брендах.
- Власний Instagram «Збережене»: колекція «Референси» — скріни туди.

## Для анімації й монтажу
- **Instagram Reels / TikTok** — збережи 3–5 рілсів у своїй ніші, де подобається монтаж (субтитри, темп, вставки).
- **Behance → Motion**, **Dribbble → Animation** — «kinetic typography», «motion graphics reel», «infographic animation».
- **YouTube** — «motion design reel 2026», «kinetic typography».
- **TikTok Creative Center** — трендові формати й звуки.

## Як дати агенту
1. Скачай відео / зроби скріни → поклади в `ЗАНЕСИ-СЮДИ/3 референси/`.
2. Скажи: «подивись референси й налаштуй мій стиль».
3. Агент:
   - робить аркуш кадрів кожного відео: `node scripts/sheet.mjs "<відео>"` і дивиться їх;
   - бере кольори: `node scripts/palette.mjs "<скрін>"`;
   - підбирає найближче з наших: стиль субтитрів (`docs/SUBTITLES.md`), шрифт, фон, тип анімацій, темп (як часто нова подія), переходи;
   - пише тобі коротко: «взяв звідти — це, це і це» і вписує в `studio/src/config.ts` та в стиль наступних роликів.
Музику з чужих роликів не беремо (авторські права) — див. `docs/MUSIC.md`.
