// Persistent top score, kept separately per game mode.
const PREFIX = 'bewitched-top-';

export function getTopScore(modeKey) {
  try {
    return Number(localStorage.getItem(PREFIX + modeKey)) || 0;
  } catch {
    return 0;
  }
}

/** Returns true if this score set a new record for the mode. */
export function reportScore(modeKey, score) {
  const top = getTopScore(modeKey);
  if (score <= top) return false;
  try {
    localStorage.setItem(PREFIX + modeKey, String(score));
  } catch {
    /* ignore */
  }
  return true;
}
