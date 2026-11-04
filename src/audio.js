// Small synthesized sound engine (Web Audio oscillators only — no audio
// files). Everything here is generated on the fly, so there's nothing to
// license or attribute.

const STORAGE_KEY = 'bewitched-muted';

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.ambient = null;
    this.muted = false;
    try {
      this.muted = localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      /* private browsing / blocked storage: default to unmuted */
    }
  }

  ensure() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.9, this.ctx.currentTime, 0.06);
    }
    try {
      localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
    } catch {
      /* ignore */
    }
  }

  toggleMuted() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  _tone(freq, { type = 'sine', dur = 0.12, gain = 0.2, attack = 0.005, decay = 0.14, delay = 0 } = {}) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + attack + decay + dur + 0.05);
  }

  playSwap() {
    this.ensure();
    this._tone(520, { type: 'triangle', dur: 0.04, gain: 0.14, decay: 0.07 });
    this._tone(700, { type: 'triangle', dur: 0.04, gain: 0.1, decay: 0.08, delay: 0.03 });
  }

  playInvalid() {
    this.ensure();
    this._tone(170, { type: 'sawtooth', dur: 0.07, gain: 0.14, decay: 0.09 });
    this._tone(120, { type: 'sawtooth', dur: 0.09, gain: 0.12, decay: 0.12, delay: 0.05 });
  }

  playMatch(combo = 1) {
    this.ensure();
    const base = 660 + Math.min(combo, 6) * 50;
    [0, 1, 2].forEach((i) =>
      this._tone(base * Math.pow(1.19, i), { type: 'sine', dur: 0.07, gain: 0.15, decay: 0.13, delay: i * 0.045 })
    );
  }

  playPower() {
    this.ensure();
    [0, 1, 2, 3].forEach((i) =>
      this._tone(420 * Math.pow(1.26, i), { type: 'square', dur: 0.045, gain: 0.07, decay: 0.09, delay: i * 0.03 })
    );
  }

  playShuffle() {
    this.ensure();
    [0, 1, 2, 3, 4].forEach((i) =>
      this._tone(500 - i * 60, { type: 'triangle', dur: 0.03, gain: 0.08, decay: 0.05, delay: i * 0.025 })
    );
  }

  playHint() {
    this.ensure();
    this._tone(880, { type: 'sine', dur: 0.06, gain: 0.12, decay: 0.1 });
    this._tone(1108, { type: 'sine', dur: 0.08, gain: 0.1, decay: 0.14, delay: 0.07 });
  }

  playLevelUp() {
    this.ensure();
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      this._tone(f, { type: 'triangle', dur: 0.09, gain: 0.16, decay: 0.15, delay: i * 0.07 })
    );
  }

  playGameOver() {
    this.ensure();
    [587.33, 523.25, 440, 349.23].forEach((f, i) =>
      this._tone(f, { type: 'sine', dur: 0.17, gain: 0.18, decay: 0.2, delay: i * 0.14 })
    );
  }

  startAmbient() {
    this.ensure();
    if (this.ambient) return;
    const notes = [220, 261.63, 329.63]; // A3, C4, E4 — soft A-minor drone
    const bus = this.ctx.createGain();
    bus.gain.value = 0.045;
    bus.connect(this.master);

    const oscs = notes.map((f, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = this.ctx.createGain();
      g.gain.value = 0.7 / (i + 1);
      osc.connect(g);
      g.connect(bus);
      osc.start();
      return osc;
    });

    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.06;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.025;
    lfo.connect(lfoGain);
    lfoGain.connect(bus.gain);
    lfo.start();

    const sparkle = setInterval(() => {
      if (!this.ambient || this.muted) return;
      if (Math.random() < 0.45) {
        this._tone(1100 + Math.random() * 700, { type: 'sine', dur: 0.4, gain: 0.02, decay: 0.6 });
      }
    }, 2600);

    this.ambient = { bus, oscs, lfo, sparkle };
  }

  stopAmbient() {
    if (!this.ambient) return;
    const { bus, oscs, lfo, sparkle } = this.ambient;
    clearInterval(sparkle);
    const now = this.ctx.currentTime;
    bus.gain.setTargetAtTime(0, now, 0.15);
    oscs.forEach((o) => o.stop(now + 0.6));
    lfo.stop(now + 0.6);
    this.ambient = null;
  }
}

export const audio = new AudioEngine();
