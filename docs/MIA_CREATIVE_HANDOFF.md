# Creative update for Claude — Sapphire Contrast + Mia's Animated Companion
Date: 2026-11-04. Owner: ChatGPT creative stream. **Not integrated in running game.**

## Committed art correction (already on this branch)
- `assets/gems/crescent.svg` is now saturated **sapphire blue #2F6BFF**, not pale periwinkle #8FA8FF.
- Lighter facets #B7D3FF / #6698FF; shadows #11295D / #1D48AC. Existing piece ID `crescent` is unchanged.
- `docs/ART_DIRECTION.md`, `docs/ASSET_MANIFEST.md`, and `docs/VISUAL_QA.md` now reflect this revision.
- **Runtime is still procedural**: `src/palette.js` on Claude's branch currently says `periwinkle: '#8FA8FF'`. When convenient, Claude should update its value to **#2F6BFF** and inspect the rendering at tile scale. Do not rename the key or change random gem distribution. Claude owns that file.

## Mia animation prototype — creative work completed, integration pending
Source illustration: existing `assets/mia-de-los-muertos.webp` (1221×1289, opaque, eyes closed). Keep the canonical face, hat, marigolds, curly hair, skull earrings, floral dress and wand. This is a flattened illustration, NOT a joint-rigged puppet.

Prepared in a separate, portable creative pack, not yet committed as individual repo files:
- Seven transparent SVG face overlays: `smile`, `wink`, `surprised`, `excited`, `hint`, `talk-a`, `talk-o` on identical 1221×1289 coordinates.
- Standalone HTML/CSS/JS preview with bob, wiggle, smile, hint tilt, 3 golden sparkles, speech bubble; supports OS/in-game reduced motion.
- Data-driven `dialogue.json` (14 events), dependency-free `mia-director.js` with throttling and priority, separate `mia-voice.js` prototype (browser speech synthesis only, OFF by default).
- An explicit `animation-manifest.json`, human actor recording pickup sheet, design, integration, and QA guides, and a 2.1 MB sample animated GIF.
- A distinct creative concept sheet exists but is **not** approved as a replacement for the canonical art.

## Dialogue / trigger contract
`game_start`, `match_3`, `match_4`, `match_5`, `cascade_big`, `special_created`, `special_combo`, `hint_manual`, `hint_auto`, `invalid_swap`, `reshuffle`, `new_record`, `level_up`, `game_end`.
Examples: “Great job!”, “Let's go!”, “Wowie!”, “¡Ándale!”, “I see it!”, “Check this out!”, “Over here!”, “¡Eso! We did it!”.
- **One cue per SETTLED player action**; prioritize `special_combo > match_5 > cascade_big > special_created > match_4 > match_3`. Don't fire a line per cascade step.
- Ordinary match-3: only 12% chance, after 24-second ambient global gate. Major reactions: 8.5-second gate + event cooldown; manual hints should speak/show promptly.
- Auto-hints must actually highlight a playable move, including special-combo swap rules Claude is building. Never announce “I see it!” without a real highlighted hint.
- Mia **Voice OFF by default**, user opt-in and independent of Music and SFX. Captions remain when speech muted. Use visible text with `aria-live=polite`; no audio or movement in reduced-motion as applicable.
- Browser TTS is only a rough audition with inconsistent device voices. A brand-consistent spoken performance requires approved original recordings later. `talk-a/talk-o` are approximate mouth animations, **not phoneme-synced**.
- For mobile UX, anchor bubble beside Mia, never over tiles; preserve game input and pause/teardown cleanup.

## Safe integration
Claude should finish special-piece combos first. The ChatGPT branch will not change `src/main.js`, `src/game.js`, `src/board.js`, `src/render.js`, `src/audio.js`, `src/palette.js`, `index.html`, or `style.css`.
When integrating, copy the Mia pack's `assets/ui/mia/` and `docs/MIA_*.md` alongside existing art, **then** wire your own app-owned runtime. The preview demo and voice are provisional; don't merge merely because syntax/tests pass.

## Test priorities
1. Saturated blue visually distinct from lavender at 40–64 CSS px; inspect with adjacent gems and color-deficiency simulation.
2. Reduce motion toggles and OS setting; captions readable and keyboard/screen reader friendly.
3. Hint swaps (special-to-special) recognized before Mia speaks.
4. Confirm 1 reaction per move with cascades; no new top score repeat every scoring update.
5. Speech stops on leaving scene or disabling voice; browser incompatibility falls back to captions.
6. Mobile portrait 320 CSS px, no overlapping puzzle cells.
7. Cloudflare production is a separate deployment pipeline issue; a PR does not prove it's live.

## Important status
**Available**: sample GIF and complete creative Mia asset archive linked in ChatGPT conversation, along with sapphire comparison image. **Not yet committed to this PR**: Mia source prototypes. **Not yet tested**: integrated game. Please continue your engineering branch independently until you explicitly choose to integrate.
