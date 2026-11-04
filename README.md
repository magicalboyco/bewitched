# Bewitched

A browser-based match-3 puzzle game in the spirit of Bejeweled — swap
adjacent pieces, chain cascades, and trigger magical power-ups — built with
plain HTML5 Canvas and vanilla JavaScript. No build step, no dependencies.

Guided by **Mia de los Muertos**, a Mexican-American bruja and keeper of the
Book of Shadows.

## Running it

```
python3 tools/dev-server.py
```

Then open http://localhost:8422 in a browser.

## How to play

Click or tap a piece, then click/tap an adjacent piece to swap them (drag
also works). A swap that lines up 3+ matching pieces clears them and scores
points; everything above falls to fill the gaps, which can chain into
cascades for combo multipliers.

- **Match 4** in a line creates a **Spark Charm** — swap or match it and it
  clears its whole row or column.
- **Match 5+** creates a **Crystal Ball** — swap or match it and it clears
  every piece of one color from the board.
- In Classic mode, the game ends when no valid moves remain. Other modes reshuffle automatically.

## Game modes

- **Classic — The Apprentice's Practice**: untimed, play as long as you like.
- **Timed — Midnight Madness**: 90-second score attack.
- **Zen — Moonlight Meditation**: relaxed and endless, same engine as
  Classic, framed without the pressure.
- **Story — The Bruja's Apprentice**: potion-recipe and curse-breaking
  chapters. Not implemented yet — shows as "coming soon" in the menu.

## Project structure

- `src/util.js` — small math/async helpers (lerp, easing, sleep).
- `src/palette.js` — the two palettes: bright pastel pieces vs. witchy
  purple/gold/navy/cream UI.
- `src/pieces.js` — the seven board pieces (Amethyst Shard, Moonstone,
  Witch's Herb, Star Charm, Marigold Bloom, Love Potion, Crescent Charm),
  drawn procedurally as distinct silhouettes, plus power-up overlay art.
- `src/board.js` — the `Board` grid: match detection, swap validation,
  cascade/combo resolution, power-up spawning and triggering, gravity,
  refill, and stuck-board reshuffling.
- `src/render.js` — canvas rendering: board, animated piece positions
  (swap/fall/pop-in/pop-out), selection glow, match particles.
- `src/input.js` — pointer handling: tap-to-select-then-swap and
  drag-to-swap, both supported on the same canvas.
- `src/game.js` — `GameSession`: mode config, scoring, leveling, the timed
  countdown, and win/end state.
- `src/main.js` — DOM wiring for the menu, HUD, and end screen.

## Art note

The piece shapes, power-up effects, and UI chrome are original canvas
drawings built for this project (not traced from any reference). The GitHub preview currently uses an original vector stand-in for Mia.
The uploaded Mia portrait is included in the downloadable local test archive;
replace `assets/mia.svg` with the provided artwork when binary asset upload is available.