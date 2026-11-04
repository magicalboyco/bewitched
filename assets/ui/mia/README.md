# Mia de los Muertos — micro-animation pack

Original canonical art: `assets/mia-de-los-muertos.webp` (already in the game).

## Preview (no app modifications)

From the repository root:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/assets/ui/mia/demo.html` in a browser. Click the scene buttons to try reactions. The **Mia Voice** option is OFF by default; enabling it uses browser/device speech synthesis (not a final character voice).

The HTML preview should run in Chrome/Firefox/Safari with a normal HTTP origin, without build steps. It is a **prototype** and still requires true cross-browser smoke testing.

## Files

- `expressions/*.svg`: transparent expression overlays, 1221x1289
- `mia-portrait.css`: subtle motion and sparkle accents
- `dialogue.json`: editable event/cue table, balanced cooldowns
- `mia-director.js`: testable event-to-cue selector with no DOM dependence
- `mia-voice.js`: optional browser-speech adapter
- `animation-manifest.json`: position/format/timing contract
- `voice-recording-sheet.csv`: human voice actor pickup list
- `test-director.mjs`: run with `node assets/ui/mia/test-director.mjs` from repo root

## Critical limitations

Original source is flattened on white, with eyes closed. These expression drawings align with the existing source but do not represent a layered skeletal rig. Mouth frames provide *approximate* visual talking, not lip synchronization. A true expressive puppet will require layer separation and paint-over.

See `docs/MIA_ANIMATION_SPEC.md`, `docs/MIA_DIALOGUE_GUIDE.md`, `docs/MIA_INTEGRATION_HANDOFF.md`, `docs/MIA_QA.md`. Do **not** put this prototype in `main` without game integration, QA, and user approval.
