# Mia de los Muertos — Animated Portrait Art Direction

**Status:** v0.1 animation prototype and integration handoff, *not yet shipped in the game*.  
**Source of truth:** Existing `assets/mia-de-los-muertos.webp` (1221 × 1289 px, RGB).  
**Owner:** ChatGPT creative branch `chatgpt/art-audio`; Claude owns existing app logic and integration.

## Character promise

Mia is a playful, bubbly, slightly mischievous Mexican-American bruja who celebrates *with* her apprentice, not at them. Her joy is immediate, bright, and kind. Her Spanish comes naturally and occasionally: e.g. “¡Ándale!”, “¡Eso!”, not obligatory on every cue. Preserve the existing hat, marigolds, brown curly hair, sugar-skull earrings, purple floral dress, wand, face shape, and original illustration's graphic style.

## Actual source constraints (verified)

The existing illustration is a **single flattened image** with a white background; it is **not a layered puppet**. The eyes are illustrated **closed at rest**. It has no separate eyelids, mouth, head, hat, arm, wand, or hair layers. We cannot truthfully claim a physically rigged full character from it without redrawing/reconstructing hidden pixels and separating the figure. The first-stage preview deliberately keeps the source image intact and draws optional transparent vector expression overlays in the **original image's 1221 × 1289 coordinate system**.

### Files prepared

- `assets/ui/mia/expressions/smile.svg`: default closed-eye smile with new mouth.
- `assets/ui/mia/expressions/talk-a.svg`, `talk-o.svg`: alternating basic lip positions, *approximate* mouth motion, not phoneme-synchronized.
- `assets/ui/mia/expressions/excited.svg`: open eyes and happy large mouth.
- `assets/ui/mia/expressions/surprised.svg`: open eyes and O-shaped mouth.
- `assets/ui/mia/expressions/wink.svg`: wink expression.
- `assets/ui/mia/expressions/hint.svg`: eyes glance toward the board, soft crooked smile.
- `assets/ui/mia/mia-portrait.css`: gentle sway, happy bounce, tiny wiggle, hint head tilt, optional sparkles.
- `assets/ui/mia/demo.html`: interactive standalone playground; no game engine edits.

**Important:** The vector expressions are a ***first-pass*** 2D overlay. The skin-colored patches can be visible on some displays at enlarged sizes. Need final art polish / manual inpainting before accepting as production-quality full-screen character art. This stage is intended mainly for the game's small portrait (~80–160 CSS px).

## Animation map

| State | Source | Behavior | Duration | Trigger |
|:--|:--|:--|:--|:--|
| `idle` | Original image | gentle 4.8 s bob; source eyes appear closed | loop | otherwise |
| `smile` | smile.svg | small expression lift | ~2.4 s | routine matches, hello, finished |
| `wink` | wink.svg | ~0.4 s playful tip | ~2.8 s | 4-match, rare failed swap |
| `excited` | excited.svg | ~0.56 s bounce + decorative sparks | ~3.4 s | 5-match, big cascades, record |
| `hint` | hint.svg | ~0.7 s lean toward board | ~3.4 s | real available hint |
| `surprised` | surprised.svg | expressive look | ~2.8 s | reshuffle |
| `talk-a`/`talk-o` | SVG overlays | optional 180 ms alternating lip positions | while talking | captions or opt-in speech |

**Motion budget:** portrait idle bob no more than ~2.5% of its height; celebration bounce up to ~6% once; avoid continuous aggressive wobble or flashes; never animate the entire screen when Mia responds.

## Why not full puppetry yet

For true 2D character rigging, an artist must prepare transparent source layers:

1. Background matte removed without jagged halo, including wisps of curly hair and glitter.
2. Head and face base retouched under hat/hair edges; separate upper/lower eyelids, pupil highlights, brows, mouth phonemes (`rest`, `A`, `O`, `M/B/P`, `smile`).
3. Hat/body separated and missing parts painted behind brim/collar.
4. Wand and gripping hand as independent sprites with proper pivot at wrist; hand and wand shouldn't drift apart.
5. Hair curls on 2–4 broad layers, dress/feet, decorative aura and sparkles.
6. Pivot metadata in a stable 1221 × 1289 coordinate system, all layers same transparent canvas size.
7. Export to atlas or transparent WebP layers and automate tests at actual portrait resolution and device scale.

**Do not** stretch/squash Mia's face to simulate talking, and **do not** replace her with a redesigned character without user approval. The alternate expression concept sheet generated during exploration is *not approved production art*; the game source portrait remains canonical.

## A note on existing UI

Claude currently owns `src/main.js`, `src/render.js`, `index.html`, `style.css`, `src/audio.js` and all core gameplay. The creative pack only supplies assets, reusable helpers, and documentation under `assets/ui/mia/` and `docs/`; Claude can integrate later after finishing special-piece logic.

## Accessibility

- Respect the operating-system `prefers-reduced-motion: reduce` setting and the in-game reduced-motion toggle; in reduced mode keep the static portrait and captions, without blinking/pulsing/translation.
- Keep speech bubble on-screen long enough to read (nominal 3.4 s; use longer duration for long lines).
- Avoid fast strobes, repeated sparkle bursts, or forced audio.
- Never make speech/animation the *only* way to learn a hint: the suggested tiles should still highlight on the board.
- No speech without affirmative Voice setting, and offer a visible on/off control separate from music and SFX.

