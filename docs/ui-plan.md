# Reading Buddy — UI plan (Oct 2026)

## Findings (short research, kids' literacy apps + dyslexia typography)
- **One focus item.** Duolingo ABC / Lalilo / Amira put exactly one word or sentence in the middle; everything else is low-contrast chrome. Decoration never competes with the text.
- **Typography for struggling readers:** very large size, sans-serif, letter-spacing ≥0.05–0.12em, word spacing ≥0.16em, line-height ≥1.5, high contrast dark-on-light (slightly off-white is easier than pure white). No italics/underline. Bold for emphasis. Nikud needs extra vertical room (line-height ≥1.7 for Hebrew with marks).
- **Touch targets for kids:** ≥64px, few buttons (3–4 max), one primary button that is obviously the "go" one. Buttons in a fixed bottom bar, consistent heights, tactile press feedback.
- **Mascot:** best practice is a mascot that *reacts* (jump, bubble, voice) but *never covers content*. Fixed-corner overlays fail on phones (exactly the dad's screenshot). Winning pattern: give the mascot its own lane/column in the layout so overlap is impossible by construction, and make reactions happen in place (jump + bubble), not by moving across the screen.
- **Motivation without distraction:** progress bar + score always visible but small; big celebrations only at milestones (every 10 words), short (≤2s), tap-to-dismiss. Confetti is fine, constant animation is not.
- **Consistency:** kids get annoyed by random "cool" effects. Same positions, same buttons, every time.

## Decisions
1. **Layout = three fixed bands on the reading screen** (`100dvh`, no scroll): compact HUD (56px) → stage (word card + optional sentence + mascot lane) → fixed bottom control bar (≈84px + safe-area).
2. **Word is the hero.** Card hugs its content (no 40vh min-height), 22–28px padding, max 94vw. One font size per part (kept), measured against the real card width.
3. **Syllables:** tighter letter-spacing (.04em), each syllable a soft pill with a *bottom bar* marker for the current one (no heavy box), done syllables green, future ones dark. Small, even gaps.
4. **Mascot pattern:**
   - **Phone (<900px):** panda lives in a *mascot lane* under the card/sentence, right side, standing on the "pitch" (bottom of stage). Speech bubble appears to its left inside the same lane. The lane is flex-sized (min 120px); the panda scales to it (max 190px). It can never touch the word, sentence or buttons.
   - **Tablet/desktop (≥900px):** stage becomes a 3-column grid: scene thumbnail (left) | card + sentence (center) | panda column (right, bottom-aligned, up to 300px). Bubble sits above the panda.
   - Talking = jump + bubble in place. Idle = gentle bob with `read` pose. No sliding across the screen.
5. **Controls:** fixed bar, three buttons, all 72px tall: back (→, secondary), hear (🔈, secondary), **Next** (gold, 2× width, with arrow ←). Hidden help button leaves the grid intact.
6. **HUD:** home (48px) · stars pill · progress track with ⚽ · 🥅 goal. One row, 56px, no wrapping.
7. **Start screen:** scrolls; hero (panda + bubble) on top, cards for name / text / part / mode, big sticky **"יַאללָה לְהַתְחִיל! ⚽"** button at the bottom (full-width, never clipped).
8. **Theme:** pitch green background with subtle stripes + a white halfway line; cards cream-white with black panda outline; gold for the primary action and current-word highlight. Calmer than before: fewer borders, fewer shadows, one accent at a time.
9. **Overlays** (intro scene, milestone cheer, finish) keep their logic; restyled to the same card language.

## Kept as-is (logic)
Text library + paste, part selection with scene thumbs, tap/syllable stepping, Chrome mic, smart mic (startAI/stopAI/sendSeg/looseMatch), pandaSay/VOICE/POSE + audio, milestones, stuck nudge, finish stats, localStorage, `?k=` code capture, intro overlay. Element ids unchanged.

## Verification (Oct 17 2026)
Headless Chromium via `node tools/shoot.mjs` (Playwright, file://). Screenshots in `docs/shots/`.
- iPhone 390×844: reading screen `scrollHeight == 844` (no scroll). Word 74px, card centered, sentence under it, panda lane bottom-right (never touches card/sentence/buttons), controls 72px buttons.
- iPhone SE 375×667: still no scroll, panda lane shrinks to 90–140px.
- iPad 1180×820: 3 columns (scene | word 104px + sentence | panda + bubble), no scroll.
Previous version kept at `docs/index.before-ui.html.bak`.
