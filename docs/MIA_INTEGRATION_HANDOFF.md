# Claude Code integration handoff — Mia expressions / dialogue

> **This is a handoff, not a request to immediately change code.** Please finish and test your current special-combination milestone first. ChatGPT commits only new `assets/ui/mia/**` and `docs/MIA_*.md` files on `chatgpt/art-audio` (draft PR #1), and does not edit your `src/`, `index.html`, `style.css` or tests.

## Assets

Source art: existing `assets/mia-de-los-muertos.webp` (1221x1289, closed eyes). All face expression SVG overlays are transparent 1221x1289 with corresponding coordinates. Keep the *exact same intrinsic dimensions* and positioning of original + overlay; put both inside a `position:relative` block with identical `width:100%;height:100%;object-fit:contain`. Note: the portrait has baked-in white background. A prototype is in `assets/ui/mia/demo.html`; run an HTTP server from repo root and navigate to `/assets/ui/mia/demo.html` (loading as `file://` does not support module/fetch CORS).

Other assets:

- `expressions/smile.svg`, `talk-a.svg`, `talk-o.svg`, `excited.svg`, `surprised.svg`, `wink.svg`, `hint.svg`.
- `mia-portrait.css` for subtle keyed movement, sparkle accents, and reduced-motion fallbacks.
- `dialogue.json` for lines, weights, triggers, animations, pacing.
- `mia-director.js` for a framework-independent cue scheduler: `createMiaDirector({script, onCue, now?,random?,enabled?})`.
- `mia-voice.js` optional prototype browser voice adapter, `createMiaVoice({enabled:false})` (no audio engine integration).

## Example integration pseudocode (adapt to actual game APIs)

```js
import { createMiaDirector } from '../assets/ui/mia/mia-director.js';
import { createMiaVoice } from '../assets/ui/mia/mia-voice.js';
const dialogue = await fetch('assets/ui/mia/dialogue.json').then(r => r.json());
const voice = createMiaVoice({ enabled: settings.miaVoice === true });
const director = createMiaDirector({
  script: dialogue,
  onCue(cue) {
    showMiaBubble(cue.text); // Always visible while on screen.
    setMiaExpression(cue.expression);
    voice.speak(cue); // Silent until explicit opt-in.
    // Cleanup on scene exit; reset overlay after cue.durationMs.
  },
});
```

**Do not copy/paste the game hooks below as if method names are guaranteed to exist.** They describe events the runtime should emit after settled state transitions.

| Game event | Director event | Important conditions |
|---|---|---|
| New run started | `game_start` | Once, not at every reset/re-render |
| A settled normal match of 3 | `match_3` | No duplicate reaction for each cascade |
| Settled match of 4 | `match_4` | Prefer highest-impact result from entire move |
| Settled match of 5+ | `match_5` | Prefer to `match_3` / `match_4` |
| Cascade of 3+ steps | `cascade_big` | Prefer if no bigger special combo occurred |
| A special gem created | `special_created` | Prefer to routine match cue |
| Player swaps and detonates 2 special gems | `special_combo` | High-priority, one cue per action |
| Manual Hint button yields a valid move | `hint_manual` | Synchronize with actual board highlight, never fake a hint |
| Auto-hint highlight actually appears | `hint_auto` | Rare (38% after 45 s event cooldown); no ghost lines |
| Illegal swap | `invalid_swap` | Very rare, suppress on accidental tap/drag |
| Deterministic reshuffle performed | `reshuffle` | Only when board actually reshuffles |
| New top score confirmed | `new_record` | Once per *run*, not every point over record |
| Level-up committed | `level_up` | Once per level transition |
| End screen | `game_end` | Once; do not speak over navigation transition |

## Prioritization

**One Mia cue per settled move**. If a move creates special gems and also triggers a big cascade, prefer `special_combo` > `match_5` > `cascade_big` > `special_created` > `match_4` > `match_3`. UI milestones (`new_record`, `level_up`) may supersede the match cue according to game screen state, not occur simultaneously. Aggregate at gameplay layer, don't call `trigger()` for every intermediate match and trust cooldown to pick one—first event would win incorrectly.

## Event lifecycle

- The game must not halt while Mia speaks; dialogue is nonblocking.
- When the player navigates away, disable timers and call voice.stop().
- Reset the bubble after display duration, *not* before a browser TTS utterance finishes; with long spoken clips, couple the bubble timer to speech completion as appropriate.
- When a new high-priority event arrives, cancel the earlier animation/dialogue and replace it; never queue 5 voice lines.
- In the user's voice settings, expose a separate **Mia Voice** toggle; don't conflate with game music/SFX.
- On iPhone/Android test muted browser autoplay policy. Call speech only after the player explicitly enables voice through a user gesture.
- Game setting `reducedMotion` and `prefers-reduced-motion` must both disable nonessential portrait movement; don't override users' wishes with inline animation timing.

## Known prototype limitations / risks

1. Original portrait and overlays are not a true skeletal rig; wiggle and bounce transform the whole sprite. Full hat/wand/hair puppetry needs separately painted assets and user approval.
2. Original eyes are **closed**. The `wink` overlay opens one of the two eyes; no separate blink cycle is implemented because the resting source already looks like the blink key frame. We shouldn't mislabel this as a finished blink rig.
3. Browser speech synthesis is variable and unreliable for a consistent branded voice; final voice should use recorded or explicitly licensed audio if approved.
4. Face-patch SVGs are tuned for 1221x1289 art; automatic CSS cropping, `object-fit:cover` or image focal-point adjustment would misalign them.
5. Do not merge PR #1 to production solely on the strength of this prototype; visually inspect both the board-scale portrait and menu illustration and check support across devices.

## Integration and regression checks

1. Load demo directly from local HTTP and click all buttons; verify captions and expressions.
2. On game board, hint must correctly identify a valid swap, including new special-to-special playable moves Claude is implementing.
3. Test a cascade + special combo and confirm **one** caption, not 3–8 rapid lines.
4. Toggle Voice on/off while speaking; speech must stop when off, menu changed, or game ended.
5. Test tab backgrounding; no leaked intervals/queued speech.
6. Test reduced motion OS setting + in-app setting independently, mobile at 320px CSS width, landscape, and device scaling.
7. Confirm adding assets does not change original game scoring, input, or board rendering.
