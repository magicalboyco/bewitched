// Node-based smoke test for original 16-bar score scheduling, repeat and stop.
import assert from 'node:assert/strict';
import { MoonlitScorePlayer } from '../src/music/score-player.js';
import { ZEN_SCORE } from '../src/music/zen-score.js';
let time = 0, created = 0, started = 0, stopped = 0;
const ramp = () => ({
  setValueAtTime(){}, linearRampToValueAtTime(){},
  exponentialRampToValueAtTime(){}, cancelScheduledValues(){},
});
const ctx = {
  get currentTime() { return time; },
  createGain() { return { gain:ramp(), connect(){}, disconnect(){} }; },
  createBiquadFilter() { return { frequency:{ value:0 }, connect(){}, disconnect(){} }; },
  createOscillator() {
    created += 1;
    return {
      frequency:{ setValueAtTime(){} }, connect(){}, disconnect(){},
      start(){ started += 1; }, stop(){ stopped += 1; }, onended:null,
    };
  },
};
const player = new MoonlitScorePlayer(ctx, {});
assert.equal(player.timeline.length,
  Object.values(ZEN_SCORE.tracks).reduce((n, t) => n + t.midiEvents.length, 0));
player.start();
assert.equal(player.running, true);
assert(created > 0 && created === started);
const first = created;
time = 59.4;
player._schedule();
assert(created > first, 'must schedule notes into the second 16-bar loop');
player.stop();
assert.equal(player.running, false);
assert.equal(player.nodes.size, 0);
const final = created;
player._schedule();
assert.equal(created, final, 'stopped scheduler must not start voices');
console.log('Moonlit Apothecary scheduler passed:', player.timeline.length, 'notes in the loop');