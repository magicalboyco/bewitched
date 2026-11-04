import { GameSession, MODES } from './game.js';
import { audio } from './audio.js';

const menu = document.getElementById('menu');
const play = document.getElementById('play');
const canvas = document.getElementById('board-canvas');
const endOverlay = document.getElementById('end-overlay');
const modeList = document.getElementById('mode-list');

const scoreVal = document.getElementById('score-val');
const levelVal = document.getElementById('level-val');
const timerBox = document.getElementById('timer-box');
const timerVal = document.getElementById('timer-val');
const finalScore = document.getElementById('final-score');
const endTitle = document.getElementById('end-title');
const hintBtn = document.getElementById('hint-btn');
const soundBtn = document.getElementById('sound-btn');
const musicBtn = document.getElementById('music-btn');
const musicVolume = document.getElementById('music-volume');
const musicVolumeLabel = document.getElementById('music-volume-label');
const menuSoundBtn = document.getElementById('menu-sound-btn');

let session = null;
let lastModeKey = 'classic';

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

function startGame(modeKey) {
  lastModeKey = modeKey;
  menu.classList.add('hidden');
  endOverlay.classList.add('hidden');
  play.classList.remove('hidden');

  scoreVal.textContent = '0';
  levelVal.textContent = '1';
  const mode = MODES[modeKey];
  timerBox.classList.toggle('hidden', !mode.timed);
  timerVal.textContent = mode.timed ? formatTime(mode.duration) : '—';

  session = new GameSession(canvas, modeKey, {
    onScore: (total) => { scoreVal.textContent = String(total); },
    onLevelUp: (level) => { levelVal.textContent = String(level); },
    onTick: (left) => { timerVal.textContent = formatTime(left); },
    onEnd: (finalScoreVal) => showEnd(finalScoreVal),
  });
  session.start();
}

function showEnd(score) {
  play.classList.add('hidden');
  endOverlay.classList.remove('hidden');
  finalScore.textContent = String(score);
  endTitle.textContent = score >= 3000 ? 'Powerful brew!' : 'Well cast!';
}

hintBtn.addEventListener('click', () => {
  session?.hint();
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

updateSoundIcons();
updateMusicControls();
renderModeCards();
