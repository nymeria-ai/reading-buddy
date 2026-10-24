# Reading Buddy — UI v2 design concepts (Oct 24 2026)

Goal: rebuild the whole UI from zero so it looks like a real app (Duolingo-grade), not a hobby page. Phone-first (390×844), iPad second. RTL Hebrew with nikud. Mascot = the panda in the green soccer kit (existing art in `img/panda/`). Default address = masculine (בֵּן), all strings have an f-variant via the existing `data-m/data-f` + `G()` mechanism.

Mockups in this folder: `mock-a.html`, `mock-b.html`, `mock-c.html` (static HTML, real fonts, real panda art), rendered with `node shoot.mjs` → `<x>-home.png`, `<x>-read.png`, `<x>-milestone.png`, `<x>-finish.png`, `<x>-combined.png` (home | read), `<x>-all4.png`, `overview.png`.

---

## 0. Inventory of today's screens / elements (from index.html)

**Home (`#s-start`)**
- Hero: panda `wave` + speech bubble ("שָׁלוֹם! בּוֹא נִקְרָא יַחַד! ⚽"), title "קוֹרְאִים עִם פַּנְדָּה 🐼"
- Name input + gender בֵּן/בַּת
- Text library (`#texts`, cards with cover) + "➕ טֶקְסְט חָדָשׁ" (title + textarea + save)
- Part picker (`#parts`, thumbnails, "✓ קָרָאתִי N פְּעָמִים")
- Mode: 👆 לוֹחֲצִים / 🎤 מִיקְרוֹפוֹן / 🧠 מִיקְרוֹפוֹן חָכָם
- Toggles: syllable-by-syllable, colored syllables, show sentence, sounds
- Sticky CTA "יַאללָה לְהַתְחִיל! ⚽"

**Reading (`#s-read`)**
- HUD: 🏠 home, ⭐ stars, progress track with ⚽ ball, 🥅 goal
- Mic row: listening dot + "מַקְשִׁיבָה…", heard text
- Stage: word card (one big word, syllables past/now/fut), optional sentence (`#ctx`), panda lane (`read` pose + bubble), scene image (iPad)
- Controls: → back, 🔈 help, "הַבָּא ←"

**Overlays:** scene intro (`#intro`, scene image + "בּוֹא נִקְרָא! 👆"), milestone every 10 words (`#big`, panda cheer/trophy/thumbs + line), confetti.

**Finish (`#s-end`)**: "סִיַּמְתָּ! 🏆", panda trophy, words read, stars, faster-than-last-time, parent line (time, previous time, help count, times read), 🔁 עוֹד פַּעַם / 🏠.

---

## 1. Shared decisions (all three directions)

These come from Duolingo's playbook and from the v1 lessons (panda must never cover content, one word is the hero):

1. **One-focus screens.** Home = pick what to read + big CTA. Reading = the word. Nothing else competes.
2. **Chunky 3D buttons**: flat fill + 4–5px darker "bottom edge" (`box-shadow: 0 5px 0 <dark>` or border-bottom), radius 16–22px, 60–66px tall, 900-weight label. Press = translateY(4px) + shadow 0. One primary color per screen, secondary buttons are white/outlined.
3. **Type**: one bold rounded sans for everything (no Alef/Varela mix). Reading word = **900 weight, 90–100px on phone, line-height 1.65, letter-spacing 0.02–0.04em**. Section labels = small caps-style 14–15px grey 900.
4. **Home top bar** (Duolingo-style): avatar pill with name (tap → settings: name, בֵּן/בַּת, toggles, add text), stat pill 🔥 streak · ⭐ stars, ⚙︎. Settings/toggles/add-text move OFF the home screen into a settings sheet. Home becomes: hero → "הַסֵּפֶר שֶׁלִּי" (current text card with progress bar; "change text" link) → part picker (4 square thumbs: done ×N / today / locked) → mode segmented control → CTA.
5. **Reading screen bands** (no scroll, 100dvh): HUD (✕, progress track with ⚽ + 🥅, ⭐) → mic status pill → **word card** (white, big radius, bottom-edge shadow; word + tiny "מִלָּה 8 מִתּוֹךְ 21") → sentence line (current word underlined) → heard pill ("🎤 שָׁמַעְתִּי: שׁוֹ…") → panda lane (bubble + panda, 150px, bottom-right) → fixed control bar (→ · 🔈 · הַבָּא ←, 64px, primary = Next).
6. **Syllable states**: past = green text, **now = soft tinted pill + 8px bar under it**, future = grey. No boxes around every syllable (v1 looked like tiles). Gap between syllables ≈ 0.03em + pill padding so the word still reads as one word.
7. **Milestone**: dim backdrop, white card, panda pops **above** the card (-130px), big headline ("גּוֹל! ⚽"), one encouragement line with the name, "+10 ⭐" chip, confetti dots. Auto-closes (existing 3.3s) or tap.
8. **Finish**: headline, panda trophy, **2×2 stat cards** (words / stars / time / 🚀 faster), small parent line, 🏠 + 🔁 full-width primary.
9. **Streak/XP feel**: 🔥 day streak (localStorage date), ⭐ = XP. Shown on home pill, HUD and finish. No leaderboards/shop.
10. **iPad (≥900px)**: same components, reading stage becomes 3 columns (scene | word card + sentence | panda column), home max-width 720px centered, part thumbs 4-up larger.
11. **Icons**: emoji are acceptable for v2 (they render natively and kids like them) but keep them to ⚽ 🥅 ⭐ 🔥 🎤 🔈 🏠 🔁 🔒. A later pass can swap to a single SVG set.

### Font check (rendered test: `fonttest.png`)
Tested at 84px with שׁוֹקוֹלָד · בִּקְרֶם · סֻכָּרִיּוֹת. Verdict:
- **Rubik 900** ✅ best: boldest, open counters, nikud large and well positioned (shin dot, holam, dagesh all clear). Rounded-ish, friendly.
- **Heebo 900** ✅ very close second, slightly more condensed (fits long words better).
- **Noto Sans Hebrew 900** ✅ precise nikud, less friendly letterforms.
- Assistant 800 ✅ fine but lighter nikud. Secular One ✅ display-only (one weight). Alef 700 (current) OK but lighter/narrower. Varela Round (current UI font) too thin for the reading word.
- ❌ Fredoka, Baloo 2: **no Hebrew glyphs**, fall back silently. Never use for Hebrew.
→ Use **Rubik** (A, C) or **Heebo** (B) for UI + reading word; one family per app.

---

## 2. Direction A — "Duo Clean" (closest to Duolingo)

**Mood:** white, airy, flat; green 3D buttons; everything on cards with 2px grey outline + 4px bottom edge. Feels exactly like a shipped learning app. Safest choice.

**Palette**
- Green primary `#58CC02` / edge `#46A302` / tint `#D7FFB8`
- Blue secondary `#1CB0F6` / edge `#1899D6`
- Gold (stars, done) `#FFC800` / edge `#E5A800`
- Ink `#3C3C3C`, ink-2 `#777777`, outline `#E5E5E5`, grey `#AFAFAF`, bg `#FFFFFF`
- Red (mic dot) `#FF4B4B`, purple (confetti) `#CE82FF`

**Font:** Rubik 500/700/900.

**Buttons:** fill + 2px outline for secondary (white, blue text); primary green with 4px darker bottom border; radius 16–18px.

**Home:** top bar (avatar pill / 🔥3 ⭐120 pill / ⚙︎) → panda wave + outlined bubble → "הַסֵּפֶר שֶׁלִּי" card (cover, title, "4 חֲלָקִים · 2 קָרָאתָ", green progress bar) → "מָה קוֹרְאִים הַיּוֹם?" 4 thumb cards (gold outline = done, green tint = today, faded = locked) → segmented mode control (blue active) → sticky green CTA.

**Reading:** HUD (✕ / green track + ⚽ / 🥅 / ⭐12) → mic pill → white word card (word 96px, now-syllable on `#D7FFB8` pill with green bar) → sentence (grey, current word underlined green) → heard pill (grey bg) → panda lane → control bar with top rule.

**Milestone:** grey dim, white card, panda cheer above, "גּוֹל! ⚽", "+10 ⭐" gold chip, confetti (gold/green/blue/purple).

**Finish:** "סִיַּמְתָּ! 🏆", panda trophy, 2×2 outlined stat cards (green/gold/blue numbers), parent line, 🏠 outlined + green 🔁.

---

## 3. Direction B — "Night Stadium"

**Mood:** the panda's world: navy night sky with stadium floodlight cones + stars, green striped pitch at the bottom of every screen, lime/gold chunky buttons that glow. Most "wow" for a soccer-loving kid; content always sits on **white boards** (scoreboard feel) so legibility stays high.

**Palette**
- Navy bg `#0B1A3A` → `#2A4A8F` (radial top), panel navy `#122247`, line `#2A3E6B`
- Pitch `#1E8E4E` / `#20A05A` stripes, lines `#FFFFFF66`
- Lime primary `#B4FF3A` / edge `#86C914`
- Gold `#FFC93C` / edge `#D9A520`
- White boards `#FFFFFF`, ink on boards `#0B1A3A`, muted `#5A6A8A`
- Chips on dark: `#FFFFFF14` fill + `#FFFFFF2A` border, text white / `#C7D4EE`

**Font:** Heebo 500/700/900 (slightly condensed, sporty).

**Buttons:** solid lime/gold with 5px dark edge (`box-shadow 0 5px 0`), dark secondary `#1B2F5E`. On the pitch area, use gold (not lime/green) for the primary so it never sinks into the grass.

**Home:** glass chips top bar → panda wave + white bubble (drop shadow) → white "הַסֵּפֶר שֶׁלִּי" board → "הַמִּשְׂחָק שֶׁל הַיּוֹם" 4 white thumb cards (🏆 ×N, lime ring = today) → dark segmented control (lime active) → lime CTA "יַאללָה לַמִּגְרָשׁ! ⚽".

**Reading:** HUD with glowing lime track → mic chip → white **scoreboard** word card (word 96px, now-syllable on `#F2FFD1` + lime-dark bar) → sentence in light text with shadow over the sky → heard chip → panda standing on the pitch → frosted control bar (dark secondary, lime Next).

**Milestone:** white card over the stadium, panda above, "גּוֹל! ⚽", gold/lime/white confetti.

**Finish:** "נִצַּחְתָּ! 🏆", trophy panda, white stat boards, white 🏠 + gold 🔁 "עוֹד מִשְׂחָק".

**Risk:** more decoration → must keep the pitch band low (bottom ~300px) and never behind the word card. Dark UI needs care with small nikud (keep nikud text ≥15px on dark).

---

## 4. Direction C — "Soft Storybook"

**Mood:** cream paper, pastel blobs (peach / sky / mint), big rounded cards with a soft 4px shadow, warm orange primary, mint for progress, lavender for the mode selector. Calm, cozy, "bedtime story" feel. Best contrast for the word (dark ink on cream/white) and the calmest for a kid who gets overwhelmed.

**Palette**
- Cream bg `#FFF8EE`, paper `#FFFFFF`, line `#EFE4D6`
- Blobs: peach `#FFE3D0`, sky `#E2F3FF`, mint `#E7FFF4`
- Primary orange `#FF9A5C` / edge `#D4713A` (white text)
- Mint `#7FD8B8` / edge `#5BBB98` / tint `#E3F8EF`, Sky `#A9D8FF`, Lavender `#D9CCFF`, Sun `#FFD65C` / `#E3B733`
- Ink `#3B3350`, ink-2 `#7E7596`, red `#FF7A7A`

**Font:** Rubik 500/700/900 (Varela Round as fallback only).

**Buttons:** fully rounded 22–24px, pastel fill + 5px darker edge; secondary = white with `#D8CBBB` edge + thin border.

**Home:** white chips top bar → panda + storybook bubble (asymmetric radius) → "הַסֵּפֶר שֶׁלִּי" card with mint bar → "אֵיזֶה עַמּוּד הַיּוֹם?" 4 thumbs (peach ring = today) → lavender segmented control → orange CTA "בּוֹא נִקְרָא! 📖".

**Reading:** HUD (white track, mint→sky fill) → mic chip → white **page** card (word 96px, now-syllable on `#FFF1E8` + peach bar, past = mint) → sentence → heard chip → panda lane → white rounded control bar (orange Next).

**Milestone:** warm dim `#F3E6DA`, white card, panda above, "כָּל הַכָּבוֹד! 🌟", pastel confetti.

**Finish:** "סִיַּמְתָּ! 🏆", trophy panda, 2×2 white stat cards, 🏠 white + orange 🔁.

---

## 5. QA done on the mockups
- Fonts render natively (no fallback) for Rubik/Heebo; nikud on the 96px word verified at 3× zoom in all three: shin dot, both holam, qamatz under ל, nothing clipped by the highlight pill.
- RTL: parts run 1→4 right-to-left, bubble tails point at the panda (panda on the left of the bubble), Next arrow points left.
- No element cut off at 844px; control bars have 28px bottom padding (safe area).
- Blind critic scores (image model, after fixes): A 8/10, B 7.5/10, C 9/10. Weak points left: emoji vs 3D-art style mix (all), pitch band is still simple (B).

## 6. Recommendation
Pick **A or C** for structure (they share the cleanest hierarchy); **B** if the soccer identity matters more than calm. My pick for Gefen: **C's palette and calm on A's structure** is also a valid hybrid — but any of the three is buildable from the mock HTML as-is (the CSS variables are the design tokens).

## 7. Build notes for whoever implements
- Start from `mock-<x>.html` CSS variables; keep all existing element ids and logic in index.html; replace only markup/CSS.
- Move name / gender / toggles / add-text into a settings sheet opened from the avatar pill or ⚙︎.
- Keep `computeFS()` but use the new font (Rubik/Heebo 900) in the measurer.
- `#big` → milestone card pattern; `#s-end` → stat grid.
- Add streak: `rb_streak` {last:'YYYY-MM-DD', n}.
- Test with `tools/shoot.mjs` at 390×844, 375×667, 1180×820 (no scroll on reading screen).
