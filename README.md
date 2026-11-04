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

- **Match 4** in a line creates a **Spark Charm** — matching or swapping it
  clears its whole row or column. A small gold arrow on the gem shows which.
- **Match 5** creates a **Crystal Ball** — matching or swapping it clears
  every piece of that gem's color from the board.
- **Match 6+** in a straight line creates a **Comet** — the biggest single
  charm: clears its whole row *and* column *and* every piece of its color,
  all at once.
- **Match an L or T shape** (a 3-run and a 3-run crossing at a corner, both
  exactly 3 long) creates **Witchfire** instead of two separate clears —
  matching or swapping it bursts a 3x3 area.
- **Swap two specials into each other** to combine them — this always
  activates, even though it doesn't form a 3-match on its own:
  - **Spark + Spark** clears both their rows/columns at once (a cross if
    one is a row-charm and the other a column-charm).
  - **Spark + Crystal Ball** clears a whole color *and* sweeps a row/column
    through it.
  - **Crystal Ball + Crystal Ball** clears two whole colors at once.
  - Swapping a single special into a plain piece (with no 3-match result)
    also activates it solo, rather than reverting like a normal invalid
    swap would.
- In Classic mode, the game ends when no valid moves remain — special
  combinations count as a move, so the board won't call it quits while one
  is still available. Other modes reshuffle automatically instead.
- Stuck? The **Hint** button (💡) finds a valid move (including a special
  combo) and flashes it in gold. A hint also appears on its own after ~8s
  idle, unless turned off in the menu's "Suggest a move when I'm stuck"
  setting.
- **Restart** (🔄) re-deals the board mid-run; tap once to arm it, tap again
  within 3 seconds to confirm.
- The **sound** button (🔊/🔇) mutes/unmutes SFX; **♫** and the slider
  control the ambient music independently. Both choices persist.
- "Reduce motion & flashing effects" in the menu dampens pulsing glows,
  cuts particle counts, and turns off the screen flash on big combos.
- "Vibrate on matches (mobile)" gives a short haptic buzz on matches, a
  stronger one for power-ups, and the strongest for a special-swap combo.
  It's a silent no-op on desktop browsers (no Vibration API), so it's fine
  to leave on everywhere.
- Each mode keeps its own persistent **Top** score, shown next to **Score**.

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
- `src/pieces.js` — the seven board pieces (Lavender Amethyst, Teal
  Princess, Verdant Emerald, Sun Citrine, Amber Cushion, Rose Pear,
  Periwinkle Marquise), each a distinct gem cut rendered as a glossy,
  faceted jewel, plus power-up glow/orbit art and the Spark Charm
  direction glyph.
- `src/board.js` — the `Board` grid: match detection, swap validation,
  cascade resolution, power-up spawning, special+special combo swaps
  (`_resolveComboSwap`), gravity, refill, stuck-board reshuffling, and
  hint-finding (aware of combo-swap moves, not just 3-matches).
- `src/render.js` — canvas rendering: dark gradient board backdrop with
  twinkling dust and a faint rune circle, animated piece positions, score
  popups, combo callouts, a screen flash on big combos, selection/hint
  glow, match particles — all with reduced-motion variants.
- `src/input.js` — pointer handling: tap-to-select-then-swap and
  drag-to-swap, both supported on the same canvas.
- `src/audio.js` — a synthesized sound engine (Web Audio oscillators only,
  no audio files): SFX, a 4-bar generative ambient score with independent
  music volume, and persisted mute/volume settings.
- `src/settings.js` — persisted accessibility/assist prefs (reduced
  motion, auto-hint).
- `src/highscores.js` — per-mode persistent top score.
- `src/haptics.js` — thin Vibration API wrapper, a no-op when the setting
  is off or the device/browser doesn't support it.
- `src/gemImages.js` — optional externally-supplied gem art: if
  `assets/gems/<id>.svg` exists and loads, `pieces.js` draws it instead of
  the procedural gem; otherwise it falls straight through, so this is a
  no-op until those files exist.
- `src/game.js` — `GameSession`: mode config, scoring, leveling, the timed
  countdown, manual + idle auto-hint, restart, audio hookup, and win/end
  state (including reporting high scores).
- `src/main.js` — DOM wiring for the menu, side panel (scoreboard, top
  score, portrait, stats, buttons, music mixer), accessibility toggles,
  and end screen.

## Art and audio note

The gem rendering, power-up effects, and UI chrome are original canvas
drawings built for this project (not traced from any reference) — the
layout takes general inspiration from genre conventions (a glossy gem
board with a side scoreboard panel) without copying any specific game's
assets. All sound is procedurally synthesized at runtime, not sampled or
licensed from anywhere.
