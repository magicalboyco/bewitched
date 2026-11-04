/** Dependency-free cue scheduling. No DOM, audio, or game state imports. */
export function createMiaDirector({
  script,
  onCue,
  now = () => Date.now(),
  random = Math.random,
  enabled = () => true,
} = {}) {
  if (!script?.events || typeof onCue !== 'function') {
    throw new TypeError('Mia director requires script.events and onCue callback');
  }

  const lastEventMs = new Map();
  const lastLineByEvent = new Map();
  let lastAnyMs = -Infinity;
  let lastAnyPriority = 0;
  let lastAnyEvent = '';
  let count = 0;

  function trigger(name, { force = false, mode = 'classic', meta = {} } = {}) {
    const event = script.events[name];
    if (!event || !enabled()) return null;
    const t = now();
    const explicit = name === 'hint_manual' || name === 'game_start' || name === 'game_end';
    const urgent = event.priority >= 7;
    const cooldownMs = event.cooldownMs ?? 0;
    if (!force) {
      if (t - (lastEventMs.get(name) ?? -Infinity) < cooldownMs) return null;
      // Do not barrage players with chatter; urgent reactions can bypass the ambient gate.
      const globalGap = urgent || explicit
        ? 0
        : event.priority >= 4
          ? (script.defaults?.majorGlobalCooldownMs ?? 8500)
          : (script.defaults?.ambientGlobalCooldownMs ?? 24000);
      if (t - lastAnyMs < globalGap) return null;
      if (random() > (event.chance ?? 1)) return null;
      // Zen never receives fast-timer pressure from dialogue.
      if (mode === 'zen' && name.startsWith('time_')) return null;
    }
    const lines = event.lines ?? [];
    if (!lines.length) return null;
    const previous = lastLineByEvent.get(name);
    const alternatives = lines.filter(line => line.id !== previous);
    const pool = alternatives.length ? alternatives : lines;
    const chosen = pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
    const cue = Object.freeze({
      sequence: ++count,
      event: name,
      priority: event.priority,
      id: chosen.id,
      text: chosen.text,
      voiceText: chosen.voiceText ?? chosen.text,
      locale: chosen.locale ?? 'en-US',
      expression: event.animation ?? 'smile',
      durationMs: chosen.durationMs ?? script.defaults?.bubbleMs ?? 3400,
      meta: Object.freeze({ ...meta }),
    });
    lastEventMs.set(name, t);
    lastAnyMs = t;
    lastAnyPriority = cue.priority;
    lastAnyEvent = name;
    lastLineByEvent.set(name, chosen.id);
    onCue(cue);
    return cue;
  }

  function reset() {
    lastEventMs.clear();
    lastLineByEvent.clear();
    lastAnyMs = -Infinity;
    lastAnyPriority = 0;
    lastAnyEvent = '';
  }

  return {
    trigger,
    reset,
    getState: () => ({ lastAnyMs, lastAnyPriority, lastAnyEvent, count }),
  };
}
