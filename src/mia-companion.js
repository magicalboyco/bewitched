/**
 * Mia de los Muertos: playful companion reactions, captions, expression layers,
 * and optional speech. Does not touch the board or change game outcomes.
 */
import { createMiaDirector } from '../assets/ui/mia/mia-director.js';
import { createMiaVoice } from '../assets/ui/mia/mia-voice.js';

const MIA_VOICE_KEY = 'bewitched-mia-voice';
const EXPRESSIONS = new Set(['smile', 'wink', 'surprised', 'excited', 'hint', 'talk-a', 'talk-o']);
const PRIORITY = { match_3: 1, match_4: 3, special_created: 4, cascade_big: 5, match_5: 6, level_up: 7, special_combo: 8 };
const ASSET_BASE = 'assets/ui/mia/expressions/';

function readVoicePreference() {
  try { return localStorage.getItem(MIA_VOICE_KEY) === '1'; }
  catch { return false; }
}

export class MiaCompanion {
  constructor({ portrait, expression, bubble, endLine } = {}) {
    this.portrait = portrait;
    this.expression = expression;
    this.bubble = bubble;
    this.endLine = endLine;
    this.active = false;
    this.runId = 0;
    this.bubbleTimer = null;
    this.moveTimer = null;
    this.mouthTimer = null;
    this.pendingMove = null;
    this.currentExpression = 'smile';
    this.voice = createMiaVoice({ enabled: readVoicePreference() });
    this.voice.setTalkingListener((talking) => this._setTalking(talking));
    this.director = null;
    this.scriptPromise = fetch('assets/ui/mia/dialogue.json')
      .then((response) => {
        if (!response.ok) throw new Error(`Mia dialogue: HTTP ${response.status}`);
        return response.json();
      })
      .then((script) => {
        this.director = createMiaDirector({
          script,
          onCue: (cue) => this._show(cue),
          enabled: () => this.active,
        });
        return script;
      })
      .catch((error) => {
        console.warn('Mia captions unavailable:', error);
        return null;
      });
    this._setExpression(null);
    this.setReducedMotion(false);
  }

  get voiceEnabled() { return this.voice.isEnabled(); }
  get voiceAvailable() { return this.voice.canSpeak(); }

  setVoiceEnabled(value) {
    const enabled = this.voiceAvailable && Boolean(value);
    this.voice.setEnabled(enabled);
    try { localStorage.setItem(MIA_VOICE_KEY, enabled ? '1' : '0'); } catch {}
    return enabled;
  }

  setReducedMotion(value) {
    if (!this.portrait) return;
    this.portrait.dataset.reducedMotion = value ? 'true' : 'false';
  }

  start(mode = 'classic') {
    this.stop();
    this.active = true;
    this.mode = mode;
    const runId = ++this.runId;
    this.scriptPromise.then(() => {
      if (this.active && this.runId === runId) {
        this.director?.reset();
        this.react('game_start', { force: true });
      }
    });
  }

  react(event, options = {}) {
    if (!this.active) return null;
    return this.director?.trigger(event, { mode: this.mode, ...options }) ?? null;
  }

  /** Collate events from an entire cascade into one high-value reaction. */
  onCombo(info = {}) {
    let event = 'match_3';
    const specials = info.spawnKinds ?? [];
    if (info.comboKind && info.comboKind !== 'solo-activation') event = 'special_combo';
    else if (specials.includes('comet') || specials.includes('crystalball')) event = 'match_5';
    else if (info.combo >= 3) event = 'cascade_big';
    else if (specials.length) event = 'special_created';
    else if (info.cellCount >= 4) event = 'match_4';
    this._queueMove(event);
  }

  onLevelUp() { this._queueMove('level_up'); }

  _queueMove(event) {
    if (!this.active) return;
    if (!this.pendingMove || (PRIORITY[event] ?? 0) > (PRIORITY[this.pendingMove] ?? 0)) {
      this.pendingMove = event;
    }
    // Board resolution animates one chain step at a time; debounce until
    // its last callback so the same action never generates several lines.
    clearTimeout(this.moveTimer);
    this.moveTimer = setTimeout(() => {
      this.moveTimer = null;
      const winner = this.pendingMove;
      this.pendingMove = null;
      if (winner && this.active) this.react(winner);
    }, 850);
  }

  _setExpression(name) {
    if (!this.expression || !this.portrait) return;
    const valid = name && EXPRESSIONS.has(name);
    this.expression.hidden = !valid;
    if (valid) this.expression.src = `${ASSET_BASE}${name}.svg`;
    this.portrait.dataset.state = valid ? name : 'idle';
    if (valid && name !== 'talk-a' && name !== 'talk-o') this.currentExpression = name;
  }

  _show(cue) {
    clearTimeout(this.bubbleTimer);
    this._setTalking(false);
    if (this.bubble) {
      this.bubble.hidden = false;
      this.bubble.textContent = cue.text;
    }
    this._setExpression(cue.expression);
    if (this.voiceEnabled) this.voice.speak(cue);
    this.bubbleTimer = setTimeout(() => {
      if (!this.active) return;
      this.voice.stop();
      this._clearBubble();
    }, Math.max(1700, cue.durationMs));
  }

  _setTalking(talking) {
    clearInterval(this.mouthTimer);
    this.mouthTimer = null;
    if (!this.active) return;
    if (talking) {
      let open = false;
      this.mouthTimer = setInterval(() => {
        if (!this.active) return;
        open = !open;
        this._setExpression(open ? 'talk-a' : 'talk-o');
      }, 165);
    } else if (this.bubble && !this.bubble.hidden) {
      this._setExpression(this.currentExpression);
    }
  }

  _clearBubble() {
    if (this.bubble) {
      this.bubble.textContent = '';
      this.bubble.hidden = true;
    }
    this._setExpression(null);
  }

  finish(isNewRecord = false) {
    if (this.endLine) this.endLine.textContent = isNewRecord
      ? 'Wowie! A new top score!'
      : '¡Eso! You did it, apprentice!';
    this.stop();
  }

  stop() {
    this.active = false;
    ++this.runId;
    clearTimeout(this.moveTimer);
    clearTimeout(this.bubbleTimer);
    clearInterval(this.mouthTimer);
    this.moveTimer = null;
    this.bubbleTimer = null;
    this.mouthTimer = null;
    this.pendingMove = null;
    this.voice.stop();
    this._clearBubble();
  }
}
