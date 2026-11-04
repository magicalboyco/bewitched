# Bewitched — Asset Manifest & Integration Contract

## Ownership

This entire asset folder and `src/music/zen-score.js` belong to the ChatGPT art/audio workstream (`chatgpt/art-audio`). Claude should integrate them on `claude/gameplay-ux` without rewriting their source. When ready, synchronize branches or cherry-pick the asset commits, then integrate in a separate commit. Do not merge into production automatically.

## Gemstone files

All SVG files have intrinsic `width="256" height="256"` so they can be loaded in an HTML `Image` and drawn with Canvas `drawImage()`; no external scripts, stylesheets, or fonts are referenced.

| Existing `type` ID | File path | Color | Cut |
| --- | --- | --- | --- |
| `amethyst` | `assets/gems/amethyst.svg` | `#A587CA` | Oval |
| `moonstone` | `assets/gems/moonstone.svg` | `#36CEDC` | Princess |
| `herb` | `assets/gems/herb.svg` | `#8FE968` | Emerald |
| `star` | `assets/gems/star.svg` | `#FFEA56` | Round |
| `marigold` | `assets/gems/marigold.svg` | `#FFB750` | Cushion |
| `potion` | `assets/gems/potion.svg` | `#FE797B` | Pear |
| `crescent` | `assets/gems/crescent.svg` | `#8FA8FF` | Horizontal marquise |

### Renderer handoff (Claude)

- Keep `PIECE_TYPES` IDs in the board engine unchanged.
- Preload via `new Image()` for each URL and `await image.decode()` before switching render strategies.
- Draw to existing `ctx` with `ctx.drawImage(image, centerX-size/2, centerY-size/2, size, size)` and use a 256-square source drawing region.
- Prefer `size = cellSize * 0.90` when starting; verify portrait and marquise pieces read at actual device width. If necessary adjust per-cut scale, not gemstone file contents.
- On load error, gracefully fall back to the current geometry renderer; never crash gameplay.
- Special-gameplay VFX live in `src/render.js`, not baked in the SVG files.
- Test all seven cuts on dark board and varied device pixel ratios; retain faceted transparency.

## UI files

- `assets/ui/grimoire-seal.svg`: main menu/level sigil.
- `assets/ui/moon-divider.svg`: fine horizontal divider (800×92).
- `assets/ui/filigree-corner.svg`: antique-gold frame ornament (260×260), mirrored through CSS if needed.

## Music composition (engine-independent)

`src/music/zen-score.js` exports:

- `ZEN_SCORE`: 16 bars of a deterministic original composition, keyed by `tracks` (`pad`, `celesta`, `harp`, `glints`).
- `midiToFrequency(midi)`: 12-tone equal-tempered MIDI-to-Hz utility.
- `beatToSeconds(beat)`: beat offsets to seconds at 66 BPM.

Each `midiEvents` entry is `{ beat, pitch, duration, velocity }`; `beat` and `duration` are in quarter notes. Loop at `ZEN_SCORE.loopBeats` (64 beats, about 58.18 seconds). Synthesizer patch descriptions are suggestions, not new audio hardware requirements. Apply gentle attack/release envelopes, pad filtering and short reverb, and keep master music quiet beneath SFX. The current SFX engine remains Claude's responsibility.

**Do not** implement loading music by injecting audio into the match SFX chain. Keep user settings separate and respect autoplay restrictions.
