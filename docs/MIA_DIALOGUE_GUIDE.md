# Mia Dialogue, Character Voice, and Trigger Rules

## Who she is

Mia is a caring, excitable, mildly mischievous *partner*. She is the more confident bruja mentoring the player, but she can be silly and surprised too. Optimistic, quick, friendly, not a nonstop cheerleader. No shame for low scores, no teasing of mistakes, no insult to player ability. Occasional bilingual code-switching should feel natural, not a gimmick. No fabricated accent in phonetic English.

**Casting brief for eventual human voice:** Bright, expressive, warm and playful; medium-light register, smile audible, quick and buoyant when surprised, reassuring and soft when providing hints. Spanish lines should be performed naturally by a bilingual actor. Avoid high-pitched shrieking, exaggerated regional stereotypes, and synthetic chipmunk effects.

## Key lines and pronunciation

| Event | Example | Delivery |
|---|---|---|
| Match 3, rare | “Great job!” | warm little cheer |
| Match 4 | “Let's go!” | pleased, punchy |
| Match 5 | “Wowie!” | genuine surprise |
| Big cascade | “¡Ándale! Look at you!” | delighted, playful |
| Special combo | “Whoa! Double trouble!” | delighted gasp |
| Manual hint | “I see it!” / “Check this out!” | gently conspiratorial |
| Automatic hint | “Psst… I think I see something!” | discreet, not a nag |
| New record | “A new top score! Wowie!” | celebratory |
| Game end | “You did it, apprentice!” | delighted, affectionate |

“¡Ándale!” is spelled with an accent on the **Á**; “¡Eso!” and “¡Qué magia!” use the opening exclamation mark, not the HTML entity. Do not use a literal `*` before the Spanish opening punctuation.

## Scheduling and economy

`assets/ui/mia/dialogue.json` has unique IDs, probabilities, animations, and per-event cooldowns. `mia-director.js` applies the event cooldown and two global cooldown classes:

- Routine ambience: at least **24 seconds** between reactions; a plain three-match has only a **12% chance** after cooldown.
- Major achievements: at least **8.5 seconds** between normal major reactions, with per-event cooldowns; remarkable events can be celebrated more often.
- Manual hint, game start, game end, new record, and a truly special combo are high-priority or explicit cues; don't suppress the requested hint.
- No repeated same wording for two consecutive uses of the same event when alternatives exist.
- One **highest-priority** reaction per completed player action, not every match in a cascade.
- Idle / Zen play should be especially gentle; do not prod the player to hurry.
- In Timed mode, avoid a flood of anxiety-inducing reminders. Don't start celebratory dialogue when the end screen is transitioning.

If the player mutes Mia's voice, **captions still appear**. A separate optional “Mia Dialogue” text toggle could be considered later, default on; voice should default off until opted in.

## Audio plan and limitations

Prototype: browser SpeechSynthesis voices loaded using `speechSynthesis.getVoices()` / the `voiceschanged` event, enabled on user action. This is a test-only voice—timing, accent, language support and available voices differ by device and browser. It is not a cast, approved, recorded voice actor; do not promise the voice sounds consistent or will be usable offline. Speech synthesis may use network voices on some systems.

Production: 1 short audio clip per approved line, normalized for consistent loudness, trimmed and with silent tail; original recordings / clear licensed usage. Delivery format could be mono Opus/Ogg or AAC/M4A fallback at sensible mobile bitrates. **Do not commit a generated or celebrity-imitation voice as Mia's permanent voice.**

Mixer policy: independent `miaVoiceGain`, with music ducking of roughly 3–5 dB only *while she speaks*; preserve game SFX above quiet music, and fade it back afterward. Abort speech on pause/end/menu change/scene teardown. If browser speech isn't supported, display captions silently without errors.

## Dialogue review checklist

- Every sentence is short enough to read on a phone and doesn't obscure tiles.
- No joke at the player's expense; invalid-swap cues stay rare and gentle.
- Spanish punctuation and text encoding render correctly in Chrome/Safari/Firefox.
- One line per event; combo chain aggregation beats repeated notifications.
- Speech user preference respected after restarts; default silent without gesture.
- No cue plays over the game-over overlay after a scene exit.
