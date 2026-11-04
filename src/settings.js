// Small persisted user preferences: accessibility + assist options.
const KEYS = {
  reducedMotion: 'bewitched-reduced-motion',
  autoHint: 'bewitched-auto-hint',
  haptics: 'bewitched-haptics',
};

function readBool(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === '1';
  } catch {
    return fallback;
  }
}

function writeBool(key, value) {
  try {
    localStorage.setItem(key, value ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export const settings = {
  reducedMotion: readBool(KEYS.reducedMotion, false),
  autoHint: readBool(KEYS.autoHint, true),
  haptics: readBool(KEYS.haptics, true),
};

export function setReducedMotion(value) {
  settings.reducedMotion = !!value;
  writeBool(KEYS.reducedMotion, settings.reducedMotion);
}

export function setAutoHint(value) {
  settings.autoHint = !!value;
  writeBool(KEYS.autoHint, settings.autoHint);
}

export function setHaptics(value) {
  settings.haptics = !!value;
  writeBool(KEYS.haptics, settings.haptics);
}
