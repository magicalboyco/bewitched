# Mia animation acceptance test plan

Scope: small portrait animated companion + captions + opt-in sample voice. This does **not** certify the currently open game PRs; no runtime changes were made.

- [ ] Exact source portrait is preserved (hat, face, hair, flowers, wand, earrings, dress) and no art style drift.
- [ ] Overlay images align with base portrait at 100%, 125%, and 200% browser zoom.
- [ ] Idle bob is subtle; face patches do not leave obvious ghost eyes or clip into hair.
- [ ] `smile`, `wink`, `excited`, `surprised`, and `hint` expressions all appear at small sidebar scale.
- [ ] Bubble isn't cropped against the game canvas, side panel, notch/safe-area, or edge of screen.
- [ ] Caption line breaks are sensible at 320px viewport; long bilingual lines remain legible.
- [ ] Invalid swaps do not cause repeated taunts; Zen gameplay is low pressure.
- [ ] Voice defaults off and must be explicitly enabled; captions stay visible with voice off.
- [ ] If speech synthesis is missing or fails, game still plays with silent captions.
- [ ] `speechSynthesis.getVoices()` may initially return empty; UI responds to `voiceschanged` event.
- [ ] Voice stops immediately on muting, pause, scene change, and navigation.
- [ ] Rapid cues don't queue the audio; one highest-priority response per settled move.
- [ ] Manual hint text occurs only when the game actually finds a legal hint.
- [ ] `prefers-reduced-motion` and app setting disable bouncing and alternating mouth animation.
- [ ] No rapid flashes or screen shake triggered by Mia; sparkles avoid sharp brightness spikes.
- [ ] Screen reader reads bubble appropriately without duplicate aria-live announcements.
- [ ] Gameplay/render frame budget unaffected on midrange Android/iPhone.
- [ ] All assets load with expected paths in Cloudflare Preview and production after merged deployment.
- [ ] Finish full browser/console smoke test and get approval before merging to main.
