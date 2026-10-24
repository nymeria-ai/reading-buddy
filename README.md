# Reading Buddy 🐼 (קוראים עם פנדה)
Hebrew reading practice for kids: one word at a time, syllable highlight, panda cheers out loud.
Adding a text: add to BUILTIN in index.html with `scenes` (one image per part) — see img/panda/CHARACTER.md.

Child gender: Settings → בֵּן / בַּת (default בֵּן, stored on device as `rb_gender`). Panda lines in `phrases.json` / `VOICE` are either neutral strings or `{m,f}` pairs; gendered audio = `audio/<kind>-<i>-m|f.mp3`, made with `tools/gen_tts_gender.py` (Shira, transcribe-back + Gemini gender check). UI strings that address the child use `data-m/data-f` or `G(m,f)`.
Texts with `fixedParts:true` are split only on blank lines (one scene per part).
QA: `node tools/shoot_para_gender.mjs` (para text + both genders, phone + desktop).
