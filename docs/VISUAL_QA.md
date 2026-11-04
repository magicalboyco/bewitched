# Bewitched — Visual Quality Acceptance Tests

## Gem assets (ChatGPT)

- [ ] Seven cuts visible and distinguishable at 56px *in the actual game board*.
- [ ] No faces, flower/clover/moon sticker shapes, or thick black outlines remain.
- [ ] All seven base colors match `docs/ART_DIRECTION.md`.
- [ ] Gems stand out from plum/indigo cells without blinding bloom.
- [ ] All seven SVGs load in desktop Chrome and mobile Safari or a comparable WebKit simulator.
- [ ] No SVG parser errors, broken image placeholders, layout overflow or external image/font dependencies.
- [ ] No bright white flash during idle gameplay.

## Special pieces (Claude's renderer)

- [ ] Spark Charm glows gold and creates at least 3 orbiting star glints.
- [ ] Crystal Ball glows violet/sapphire blue and is visually distinct from Spark.
- [ ] Effects remain distinguishable with reduced motion enabled.
- [ ] Combo activation has a clear beginning, effect and resolution.
- [ ] No special VFX masks or obscures the gemstone color.

## UI / music (shared QA)

- [ ] Uncial Antiqua used for headings; PT Serif Caption used for readable UI text.
- [ ] Main menu uses approved Mia artwork and original grimoire ornaments.
- [ ] Game is navigable on a 375px-wide phone without horizontal scrolling.
- [ ] Original "Moonlit Apothecary" loop plays after an intentional user gesture.
- [ ] User can disable music without disabling SFX, and vice versa.
- [ ] At the 58.18-second loop boundary, no clicks or loud level jumps are audible.
- [ ] Sound defaults are calm and non-fatiguing after 10 minutes.
- [ ] Reduced motion / audio preferences persist between sessions.
- [ ] Preview deployment displays a commit version that matches its source branch.

## Handoff

QA checkboxes remain unchecked until actual browser/audio playtesting confirms them. Visual previews are **not** proof of integration.

## Seven-gem recognition — sapphire update

- [ ] At 40–64 CSS px, `crescent` reads unmistakably saturated sapphire blue (`#2F6BFF`), not lavender/periwinkle.
- [ ] Sapphire crescent and lavender amethyst can be distinguished during cascades and low-attention peripheral glances.
- [ ] Check all seven gems in normal, dimmed, and desaturated conditions; silhouette must provide an additional cue.
- [ ] Runtime procedural palette in `src/palette.js` remains Claude-owned: Claude must update `PIECE_COLORS.periwinkle` (currently `#8FA8FF`) before live board adopts this color. Do not change IDs or gameplay logic.
