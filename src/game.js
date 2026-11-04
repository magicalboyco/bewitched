import { Board } from './board.js';
import { BoardRenderer } from './render.js';
import { attachInput } from './input.js';
import { audio } from './audio.js';
import { settings } from './settings.js';
import { reportScore } from './highscores.js';
import { haptics } from './haptics.js';

export const MODES = {
  classic: {
    key: 'classic',
    title: 'Classic',
    subtitle: "The Apprentice's Practice",
    blurb: 'Untimed matching. Fill your spell-point bar and level up for as long as you like.',
    timed: false,
  },
  timed: {
    key: 'timed',
    title: 'Timed',
    subtitle: 'Midnight Madness',
    blurb: 'Match as fast as you can before the 90-second countdown runs out.',
    timed: true,
    duration: 90,
  },
  zen: {
    key: 'zen',
    title: 'Zen',
    subtitle: 'Moonlight Meditation',
    blurb: 'No clock, no pressure — just cascades and sparkle. Ends whenever you like.',
    timed: false,
    zen: true,
  },
  story: {
    key: 'story',
    title: 'Story',
    subtitle: "The Bruja's Apprentice",
    blurb: 'Potion recipes and curse-breaking chapters. Coming soon!',
    locked: true,
  },
};

const LEVEL_UP_SCORE = 500;
const AUTO_HINT_IDLE_MS = 8000;

export class GameSession {
  constructor(canvas, modeKey, hooks = {}) {
    this.mode = MODES[modeKey];
    this.hooks = hooks;
    this.ended = false;

    this.board = new Board({
      onScore: (delta, combo) => this._addScore(delta, combo),
      onParticles: (pts) => this.renderer.addParticles(pts),
      onCombo: (info) => {
        if (this.ended) return;
        this.renderer.handleCombo(info);
        this.hooks.onCombo?.(info);
        if (info.comboKind && info.comboKind !== 'solo-activation') {
          audio.playComboSwap();
          haptics.comboSwap();
        } else {
          haptics.match();
        }
      },
      onShuffle: () => {
        if (this.ended) return;
        audio.playShuffle();
        this.hooks.onShuffle?.();
      },
      onPower: () => {
        if (this.ended) return;
        audio.playPower();
        haptics.power();
      },
      onNoMoves: () => {
        if (this.mode.key === 'classic') {
          this.end();
          return true;
        }
        return false;
      },
    });
    this.renderer = new BoardRenderer(canvas, this.board);
    this.detachInput = attachInput(canvas, this.board, this.renderer, {
      onSwapAttempt: () => {
        audio.playSwap();
        this._touch();
      },
      onInvalidSwap: () => {
        audio.playInvalid();
        haptics.invalid();
        this.hooks.onInvalidSwap?.();
      },
    });

    this._raf = null;
    this._timerInterval = null;
    this._autoHintInterval = null;
    this._lastActivity = performance.now();

    this._resetRunState();

    this._loop = this._loop.bind(this);
  }

  _resetRunState() {
    this.score = 0;
    this.combo = 0;
    this.level = 1;
    this.levelProgress = 0;
    this.timeLeft = this.mode.timed ? this.mode.duration : 0;
  }

  _touch() {
    this._lastActivity = performance.now();
  }

  hint() {
    if (this.ended) return false;
    const found = this.board.showHint();
    if (found) {
      audio.playHint();
      this._touch();
      this.hooks.onHint?.('manual');
    }
    return found;
  }

  /** Re-deals the board and resets score/level/timer without tearing down
   *  the session (input, renderer, and ambient audio keep running). */
  restart() {
    // Do not discard a live grid during asynchronous removal/cascade;
    // a pending clear would otherwise mutate the newly reset board.
    if (this.ended || this.board.busy) return false;
    this._resetRunState();
    this.board.reset();
    this.renderer.particles = [];
    this.renderer.popups = [];
    this.renderer.callout = null;
    this.renderer.flash = null;
    this._touch();
    this.hooks.onScore?.(this.score, 0, 0);
    this.hooks.onLevelUp?.(this.level);
    this.hooks.onTick?.(this.timeLeft);
    return true;
  }

  start() {
    audio.ensure();
    audio.startAmbient();
    this._touch();
    this._loop();
    if (this.mode.timed) {
      this._timerInterval = setInterval(() => {
        if (this.ended) return;
        this.timeLeft -= 1;
        this.hooks.onTick?.(this.timeLeft);
        if (this.timeLeft <= 0) {
          this.timeLeft = 0;
          this.end();
        }
      }, 1000);
    }
    this._autoHintInterval = setInterval(() => {
      if (this.ended || this.board.busy || !settings.autoHint) return;
      if (performance.now() - this._lastActivity >= AUTO_HINT_IDLE_MS) {
        const found = this.board.showHint();
        if (found) {
          audio.playHint();
          this._touch();
          this.hooks.onHint?.('auto');
        }
      }
    }, 1000);
  }

  _addScore(delta, combo) {
    // Freeze scores once the player finishes or leaves a running cascade.
    if (this.ended) return;
    this.score += delta;
    this.combo = combo;
    audio.playMatch(combo);
    this.levelProgress += delta;
    while (this.levelProgress >= LEVEL_UP_SCORE) {
      this.levelProgress -= LEVEL_UP_SCORE;
      this.level += 1;
      audio.playLevelUp();
      this.hooks.onLevelUp?.(this.level);
    }
    this.hooks.onScore?.(this.score, delta, combo);
  }

  _loop() {
    if (this.ended) return;
    this.renderer.draw();
    this._raf = requestAnimationFrame(this._loop);
  }

  end() {
    if (this.ended) return;
    this.ended = true;
    if (this._timerInterval) clearInterval(this._timerInterval);
    if (this._autoHintInterval) clearInterval(this._autoHintInterval);
    if (this._raf) cancelAnimationFrame(this._raf);
    this.detachInput();
    audio.playGameOver();
    audio.stopAmbient();
    const isNewTop = reportScore(this.mode.key, this.score);
    this.hooks.onEnd?.(this.score, isNewTop);
  }
}
