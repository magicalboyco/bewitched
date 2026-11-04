# BEWITCHED — Art Direction v0.2

## North star

**A cozy whimsigoth match-three game with magical-girl warmth.** The board should feel like a living grimoire full of glossy jewelry. Cute comes from rounded cuts, luminous color, reflected light and gentle sparkle—**not from faces on pieces**.

## Seven locked gem cuts

| Existing engine ID | Gem | Cut | Base color |
| --- | --- | --- | --- |
| `amethyst` | Lavender Amethyst | Oval | `#A587CA` |
| `moonstone` | Teal Moonstone | Princess | `#36CEDC` |
| `herb` | Verdant Emerald | Emerald | `#8FE968` |
| `star` | Sun Citrine | Round brilliant | `#FFEA56` |
| `marigold` | Amber Topaz | Cushion | `#FFB750` |
| `potion` | Rose Coral | Pear | `#FE797B` |
| `crescent` | Periwinkle Moonstone | Marquise | `#8FA8FF` |

These internal IDs are preserved deliberately. They are **not** license to display the old flower/moon/clover graphics: the new visual identity is the jewel artwork.

## Rendering

- All seven are original standalone SVGs, 256×256 viewBox, fully transparent background.
- Same pale top-left key light and deep lower-right reflection, so the set feels illustrated by one artist.
- Cut silhouettes remain distinguishable at **56–72 CSS px** per tile.
- Standard pieces have a restrained, static white glint; motion comes from the game engine, not SVG animation.
- A normal gem must never appear to have a cartoon face or a thick black sticker outline.
- Occupy roughly 78–88% of a board cell (some vertical / long cuts naturally appear narrower).
- Suggested game board: deep ink plum (`#241638`), slightly inset tile wells, thin gold ornaments at the outer frame.
- Reserve large pulsing glows, orbiting lights, and dramatic sparks **only** for special gems.

## Special-piece effect specification (owned by gameplay renderer)

- **Spark Charm / four-match:** warm antique-gold halo. Soft 1.4-second breathing glow and 3–5 tiny moving four-point glints. Don't draw an ugly slash across the jewel.
- **Crystal Ball / five-match:** lavender-periwinkle halo, slow orbiting crescent/sigil particles, occasional bright gold starburst. Clearly different from Spark.
- **Witchfire / L or T match:** coral–gold heart-shaped flame swirl, distinct from either effect above.
- **Grand spell:** a gently expanding ring and a short shower of dust, not an intense white strobe.
- In reduced-motion mode, render clear static outlines or small badges instead of pulsing/rotation. No flashing above 3 Hz.

## Interface typography

- **Uncial Antiqua:** game logo, chapter/level headlines only. Never use for numeric scores or tiny buttons.
- **PT Serif Caption:** body text, buttons, score labels, chapter descriptions; maintain adequate contrast at smaller sizes.

## UI color hierarchy

- Background: navy `#1E274A`, plum `#4F2C63` and charcoal violet `#2B203A`.
- Panels: deep purple `#6D3D8E` at low opacity / dark glass gradients.
- Primary text: cream `#F6F0E7`.
- Fine ornament, emphasis and progress: antique gold `#C8A24D`.
- Supporting accents: mauve `#B48CC7`, moonlight lilac `#D7C7F2`.

## Mia de los Muertos

Use the actual approved illustrated portrait, not the previous simple temporary SVG. Mia is warm, wise, eccentric and reassuring. Depict her Mexican-American cultural context through authentic character details rather than generic skull or Día de los Muertos decoration everywhere.

## Audio mood

Original 66-BPM, D-minor ambient score **Moonlit Apothecary**. Gentle celesta, airy pads, sparkling glass harp, and purposeful silence. No constant noise, no borrowed game music, and keep SFX and music mixing independent.
