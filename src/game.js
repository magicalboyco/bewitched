import { Board } from './board.js';
import { BoardRenderer } from './render.js';
import { attachInput } from './input.js';

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

export class GameSession {
  constructor(canvas, modeKey, hooks = {}) {
    this.mode = MODES[modeKey];
    this.score = 0;
    this.combo = 0;
    this.level = 1;
    this.levelProgress = 0;
    this.timeLeft = this.mode.timed ? this.mode.duration : 0;
    this.ended = false;
    this.hooks = hooks;

    this.board = new Board({
      onScore: (delta, combo) => this._addScore(delta, combo),
      onParticles: (pts) => this.renderer.addParticles(pts),
      onShuffle: () => this.hooks.onShuffle?.(),
      onNoMoves: () => { if (this.mode.key === 'classic') { this.end(); return true; } return false; },
    });
    this.renderer = new BoardRenderer(canvas, this.board);
    this.detachInput = attachInput(canvas, this.board, this.renderer, {
      onInvalidSwap: () => this.hooks.onInvalidSwap?.(),
    });

    this._raf = null;
    this._timerInterval = null;

    this._loop = this._loop.bind(this);
  }

  start() {
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
  }

  _addScore(delta, combo) {
    this.score += delta;
    this.combo = combo;
    this.levelProgress += delta;
    while (this.levelProgress >= LEVEL_UP_SCORE) {
      this.levelProgress -= LEVEL_UP_SCORE;
      this.level += 1;
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
    if (this._raf) cancelAnimationFrame(this._raf);
    this.detachInput();
    this.hooks.onEnd?.(this.score);
  }
}