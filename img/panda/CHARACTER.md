# Panda — Reading Buddy mascot (default)

Reference image: `img/panda/reference.png` (1024x1024, white bg). Always pass it as the reference image when generating new art (gpt-image-2 / Gemini image / any model).

## Character prompt (use verbatim, then add the scene)
Super cute baby panda mascot for a children's reading app. Chubby round body, big sparkling eyes, rosy cheeks, friendly happy smile. Wearing a bright green soccer (football) kit in the adidas style: green jersey with three white stripes on the shoulders and sleeves, white collar trim, green shorts with three white side stripes, white socks, black-and-white soccer cleats. Pixar-like 3D cartoon style, soft lighting. No text, no logos, no letters.

For consistency add: "Same exact panda character (same face, same green soccer kit with three white stripes, same 3D cartoon style)."

## Poses (cut out with Apple Vision → webp 480px)
wave, read, cheer, thumbs, trophy

## Per-text scenes
For every new text: 1 scene per part (4:3 or square, 900px webp, `img/<text-id>/<n>.webp`). The panda appears in each scene, doing something from that part. No readable text in images (models garble Hebrew).

## Voice
OpenAI gpt-4o-mini-tts, voice coral (fallback shimmer/nova), Hebrew instructions, nikud stripped from input.
Every line is QA'd by transcribing it back (tools/gen_tts.py); lines that come back as non-Hebrew are regenerated or rephrased.
