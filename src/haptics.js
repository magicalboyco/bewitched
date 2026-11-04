// Thin wrapper around the Vibration API — a no-op on desktop browsers and
// anywhere the setting is off, so call sites never need to guard it.
import { settings } from './settings.js';

function fire(pattern) {
  if (!settings.haptics) return;
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  navigator.vibrate(pattern);
}

export const haptics = {
  match: () => fire(10),
  power: () => fire([15, 30, 25]),
  comboSwap: () => fire([20, 40, 20, 40, 35]),
  invalid: () => fire(8),
};
