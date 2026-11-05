# Bejeweled 3–style special gem rules (review branch)

Reference rules: [Bejeweled 3 official README](https://bejeweled.wiki.gg/wiki/Bejeweled_3/readme.html) and [PopCap strategy guide](https://images.popcap.com/www/images/product/extras/strategyguides/bejeweled3/1033/bejeweled3strategyguide.pdf).

| Bewitched | Bejeweled 3 counterpart | Created by | Activation | Area |
|---|---|---|---|---|
| Witchfire | Flame Gem | 4 identical in a line | Match 3 of same original color | 3×3 |
| Spark Charm | Star Gem | T/L/+ intersection | Match 3 of same original color | Full row **and** column |
| Crystal Ball | Hypercube | 5 identical in a line | Swap with adjacent gem, regardless of color | All gems of **other** gem's color |
| Comet | Supernova Gem | 6 identical in a line | Match 3 of same original color | 3 rows + 3 columns |

Other rules:
- Colored specials swapped with an unrelated color without creating a match **return to their original positions**; they never activate for free.
- Two colored specials have no unconditional wildcard swap. They can still participate in an ordinary same-color match and chain when affected by another blast.
- Crystal Ball + Crystal Ball clears the entire board.
- Crystal Balls are wildcards for swaps but do **not** count as colored gems in ordinary three-in-a-row runs.
- Hints and dead-board detection use the same swap validator as actual moves.
- Secondary effects caught in a blast chain automatically.
- Existing `spark-col` gems from previous game sessions, if encountered, also use the new cross-clearing behavior.

## Testing

Run `node --test tests/test-special-gem-rules.mjs` in a Node version supporting ES modules; all tests are self-contained and do not require a browser.

No change is included to the website or deployment branches. This review branch starts from `main`, so **PR #4** may need conflict resolution if merged separately (both touch `src/board.js`).

## Not identical to every Bejeweled edition

The target is the *core special-gem mechanics of Bejeweled 3*, not the special+special system of Bejeweled Stars. In particular, our bespoke gem art and original voice/music remain unchanged.
