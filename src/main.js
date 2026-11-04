import { GameSession, MODES } from './game.js';
import { audio } from './audio.js';
import { settings, setReducedMotion, setAutoHint, setHaptics } from './settings.js';
import { getTopScore } from './highscores.js';
import { PIECE_TYPES } from './pieces.js';
import { loadGemImages } from './gemImages.js';

// Picks up assets/gems/<id>.svg if/when the art collaborator's branch
// supplies them; a safe no-op today since those files don't exist yet.
loadGemImages(PIECE_TYPES.map((p) => p.id));

const BUILD_VERSION = 'v0.2.0-dev · gameplay-ux';

const menu = document.getElementById('menu');
const play = document.getElementById('play');
const canvas = document.getElementById('board-canvas');
const endOverlay = document.getElementById('end-overlay');
const modeList = document.getElementById('mode-list');

const scoreVal = document.getElementById('score-val');
const topVal = document.getElementById('top-val');
const levelVal = document.getElementById('level-val');
const timerBox = document.getElementById('timer-box');
const timerVal = document.getElementById('timer-val');
const finalScore = document.getElementById('final-score');
const endTitle = document.getElementById('end-title');
const newRecordBadge = document.getElementById('new-record-badge');
const hintBtn = document.getElementById('hint-btn');
const restartBtn = document.getElementById('restart-btn');
const soundBtn = document.getElementById('sound-btn');
const musicBtn = document.getElementById('music-btn');
const musicVolume = document.getElementById('music-volume');
const musicVolumeLabel = document.getElementById('music-volume-label');
const menuSoundBtn = document.getElementById('menu-sound-btn');
const reducedMotionToggle = document.getElementById('reduced-motion-toggle');
const autoHintToggle = document.getElementById('auto-hint-toggle');
const hapticsToggle = document.getElementById('haptics-toggle');
const buildTag = document.getElementById('build-tag');

let session = null;
let lastModeKey = 'classic';
let restartArmedTimeout = null;

function renderModeCards() {
  modeList.innerHTML = '';
  Object.values(MODES).forEach((mode) => {
    const card = document.createElement('button');
    card.className = 'mode-card' + (mode.locked ? ' locked' : '');
    card.innerHTML = `
      <div class="mode-title">${mode.title}</div>
      <div class="mode-subtitle">${mode.subtitle}</div>
      <div class="mode-blurb">${mode.blurb}</div>
    `;
    if (!mode.locked) {
      card.addEventListener('click', () => startGame(mode.key));
    }
    modeList.appendChild(card);
  });
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function updateMusicControls() {
  musicBtn.textContent = audio.musicEnabled ? '♫' : '♫̸';
  musicBtn.setAttribute('aria-pressed', String(audio.musicEnabled));
  musicBtn.title = audio.musicEnabled ? 'Turn off calming music' : 'Turn on calming music';
  musicVolume.value = String(Math.round(audio.musicVolume * 100));
  musicVolumeLabel.textContent = `${Math.round(audio.musicVolume * 100)}%`;
}

function updateSoundIcons() {
  const icon = audio.muted ? '🔇' : '🔊';
  soundBtn.textContent = icon;
  menuSoundBtn.textContent = icon;
}

function disarmRestart() {
  clearTimeout(restartArmedTimeout);
  restartArmedTimeout = null;
  restartBtn.classList.remove('confirm');
  restartBtn.textContent = '🔄';
  restartBtn.title = 'Restart this run';
}

function startGame(modeKey) {
  lastModeKey = modeKey;
  menu.classList.add('hidden');
  endOverlay.classList.add('hidden');
  play.classList.remove('hidden');
  disarmRestart();

  scoreVal.textContent = '0';
  levelVal.textContent = '1';
  topVal.textContent = String(getTopScore(modeKey));
  const mode = MODES[modeKey];
  timerBox.classList.toggle('hidden', !mode.timed);
  timerVal.textContent = mode.timed ? formatTime(mode.duration) : '—';

  session = new GameSession(canvas, modeKey, {
    onScore: (total) => { scoreVal.textContent = String(total); },
    onLevelUp: (level) => { levelVal.textContent = String(level); },
    onTick: (left) => { timerVal.textContent = formatTime(left); },
    onEnd: (finalScoreVal, isNewTop) => showEnd(finalScoreVal, isNewTop),
  });
  session.start();
}

function showEnd(score, isNewTop) {
  play.classList.add('hidden');
  endOverlay.classList.remove('hidden');
  finalScore.textContent = String(score);
  endTitle.textContent = score >= 3000 ? 'Powerful brew!' : 'Well cast!';
  newRecordBadge.classList.toggle('hidden', !isNewTop);
}

hintBtn.addEventListener('click', () => {
  session?.hint();
});

restartBtn.addEventListener('click', () => {
  if (!session || session.ended) return;
  if (restartArmedTimeout) {
    disarmRestart();
    session.restart();
    return;
  }
  restartBtn.classList.add('confirm');
  restartBtn.textContent = '✓?';
  restartBtn.title = 'Click again to confirm restart';
  restartArmedTimeout = setTimeout(disarmRestart, 3000);
});

soundBtn.addEventListener('click', () => {
  audio.toggleMuted();
  updateSoundIcons();
});

musicBtn.addEventListener('click', () => {
  audio.toggleMusic();
  updateMusicControls();
});

musicVolume.addEventListener('input', () => {
  audio.setMusicVolume(Number(musicVolume.value)/100);
  updateMusicControls();
});

menuSoundBtn.addEventListener('click', () => {
  audio.toggleMuted();
  updateSoundIcons();
});

reducedMotionToggle.addEventListener('change', () => {
  setReducedMotion(reducedMotionToggle.checked);
});

autoHintToggle.addEventListener('change', () => {
  setAutoHint(autoHintToggle.checked);
});

hapticsToggle.addEventListener('change', () => {
  setHaptics(hapticsToggle.checked);
});

document.getElementById('menu-btn').addEventListener('click', () => {
  session?.end();
  play.classList.add('hidden');
  endOverlay.classList.add('hidden');
  menu.classList.remove('hidden');
});

document.getElementById('end-btn').addEventListener('click', () => {
  session?.end();
});

document.getElementById('play-again-btn').addEventListener('click', () => {
  startGame(lastModeKey);
});

document.getElementById('back-to-menu-btn').addEventListener('click', () => {
  endOverlay.classList.add('hidden');
  menu.classList.remove('hidden');
});

reducedMotionToggle.checked = settings.reducedMotion;
autoHintToggle.checked = settings.autoHint;
hapticsToggle.checked = settings.haptics;
buildTag.textContent = BUILD_VERSION;
updateSoundIcons();
updateMusicControls();
renderModeCards();
