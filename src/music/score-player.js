/**
 * Playback of the original "Moonlit Apothecary" composition.
 * Uses only local Web Audio oscillators; no downloads or third-party samples.
 * All timing is relative to AudioContext.currentTime, not setInterval cadence.
 */
import { ZEN_SCORE, beatToSeconds, midiToFrequency } from './zen-score.js';

const LOOKAHEAD_SECONDS = 1.5;
const TICK_MS = 250;
const MIN_GAIN = 0.00008;
const TRACK_GAIN = { pad: 0.18, celesta: 0.32, harp: 0.28, glints: 0.12 };

function makeTimeline() {
  const notes = [];
  for (const [trackName, track] of Object.entries(ZEN_SCORE.tracks)) {
    for (const event of track.midiEvents) {
      notes.push({ ...event, trackName });
    }
  }
  return notes.sort((a, b) => a.beat - b.beat || a.pitch - b.pitch);
}

export class MoonlitScorePlayer {
  constructor(context, outputBus) {
    this.context = context;
    this.outputBus = outputBus;
    this.timeline = makeTimeline();
    this.nodes = new Set();
    this.interval = null;
    this.running = false;
    this.cursor = 0;
    this.loop = 0;
    this.origin = 0;
  }

  start() {
    if (this.running || !this.context || !this.outputBus) return;
    this.running = true;
    this.cursor = 0;
    this.loop = 0;
    this.origin = this.context.currentTime + 0.1;
    this._schedule();
    this.interval = setInterval(() => this._schedule(), TICK_MS);
  }

  _schedule() {
    if (!this.running || !this.context || !this.timeline.length) return;
    const end = this.context.currentTime + LOOKAHEAD_SECONDS;
    // The scheduler only scans until the end of the lookahead window.
    // It can cover a loop boundary without repeating or skipping notes.
    while (this.running) {
      const event = this.timeline[this.cursor];
      const when = this.origin + beatToSeconds(event.beat + this.loop * ZEN_SCORE.loopBeats);
      if (when > end) break;
      if (when > this.context.currentTime + 0.006) this._play(event, when);
      this.cursor += 1;
      if (this.cursor === this.timeline.length) {
        this.cursor = 0;
        this.loop += 1;
      }
    }
  }

  _play(event, when) {
    const ctx = this.context;
    const duration = Math.max(0.12, beatToSeconds(event.duration));
    const velocity = Math.max(0, Math.min(1, event.velocity));
    const peak = Math.max(MIN_GAIN * 2, (TRACK_GAIN[event.trackName] ?? 0.16) * velocity);
    const pad = event.trackName === 'pad';
    const glint = event.trackName === 'glints';
    const attack = pad ? 0.48 : glint ? 0.008 : 0.014;
    const release = pad ? 0.62 : glint ? 0.15 : 0.36;
    const end = when + duration;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const envelope = ctx.createGain();
    osc.type = pad ? 'sine' : event.trackName === 'harp' ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(midiToFrequency(event.pitch), when);
    filter.type = 'lowpass';
    filter.frequency.value = pad ? 950 : glint ? 4100 : event.trackName === 'celesta' ? 2500 : 1800;

    envelope.gain.setValueAtTime(MIN_GAIN, when);
    const atPeak = Math.min(end - 0.05, when + attack);
    envelope.gain.linearRampToValueAtTime(peak, atPeak);
    if (pad && end - release > atPeak) {
      envelope.gain.setValueAtTime(peak * 0.83, end - release);
    }
    envelope.gain.exponentialRampToValueAtTime(MIN_GAIN, end);

    osc.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.outputBus);
    const voice = { osc, filter, envelope, when, end };
    this.nodes.add(voice);
    osc.onended = () => {
      this.nodes.delete(voice);
      osc.disconnect();
      filter.disconnect();
      envelope.disconnect();
    };
    osc.start(when);
    osc.stop(end + 0.04);
  }

  stop() {
    if (!this.running && !this.interval) return;
    this.running = false;
    clearInterval(this.interval);
    this.interval = null;
    const now = this.context?.currentTime ?? 0;
    // Release scheduled voices so fast restart does not stack two loops.
    for (const voice of this.nodes) {
      try {
        voice.envelope.gain.cancelScheduledValues(now);
        voice.envelope.gain.setValueAtTime(MIN_GAIN, now);
        voice.osc.stop(Math.max(now + 0.015, Math.min(voice.end + 0.04, now + 0.035)));
      } catch { /* already stopped by the audio engine */ }
    }
    this.nodes.clear();
  }
}
