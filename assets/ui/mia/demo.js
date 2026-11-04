import { createMiaDirector } from './mia-director.js';
import { createMiaVoice } from './mia-voice.js';

const base = document.querySelector('#mia');
const expression = document.querySelector('#expression');
const bubble = document.querySelector('#bubble');
const status = document.querySelector('#status');
const voiceCheckbox = document.querySelector('#voice');
const reduceCheckbox = document.querySelector('#reduce');
const voiceSelect = document.querySelector('#voice-choose');
const script = await fetch('./dialogue.json').then(r => { if (!r.ok) throw new Error(`Cannot load dialogue (${r.status})`); return r.json(); });
const voice = createMiaVoice();
let resetTimer = null;
let mouthInterval = null;
let chosenExpression = 'smile';
let currentCue = null;

function reducedMotion() {
  return reduceCheckbox.checked || matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function setExpression(name) {
  if (!name || name === 'idle') { expression.hidden = true; return; }
  expression.hidden = false;
  expression.src = `./expressions/${name}.svg`;
}
function stopMouthAnimation() {
  clearInterval(mouthInterval);
  mouthInterval = null;
  if (currentCue) setExpression(chosenExpression);
}
function startMouthAnimation() {
  if (reducedMotion() || mouthInterval !== null || !currentCue) return;
  let phase = false;
  mouthInterval = setInterval(() => {
    phase = !phase;
    setExpression(phase ? 'talk-a' : 'talk-o');
  }, 180);
}
function returnToIdle() {
  clearTimeout(resetTimer);
  resetTimer = null;
  currentCue = null;
  stopMouthAnimation();
  base.dataset.state = 'idle';
  expression.hidden = true;
  bubble.hidden = true;
  status.textContent = 'Mia is watching the board.';
}
function showCue(cue) {
  currentCue = cue;
  chosenExpression = cue.expression;
  clearTimeout(resetTimer);
  stopMouthAnimation();
  base.dataset.state = cue.expression;
  base.dataset.reducedMotion = String(reducedMotion());
  setExpression(cue.expression);
  bubble.hidden = false;
  bubble.textContent = cue.text;
  status.textContent = `Event: ${cue.event} · Expression: ${cue.expression} · No gameplay files modified`;
  if (voice.isEnabled()) {
    const began = voice.speak(cue);
    if (!began) status.textContent += ' · Speech is unavailable on this browser';
  } else if (!reducedMotion()) {
    // Silent comic-book mouth motion gives the caption a talking feel.
    startMouthAnimation();
    setTimeout(stopMouthAnimation, Math.min(cue.durationMs * .55, 1250));
  }
  resetTimer = setTimeout(() => {voice.stop();returnToIdle();}, cue.durationMs);
}
const director = createMiaDirector({ script, onCue: showCue });

for (const button of document.querySelectorAll('[data-cue]')) {
  button.addEventListener('click', () => {
    // Forced only for the manual animation sandbox; game integration uses real cooldowns.
    director.trigger(button.dataset.cue, { force: true });
  });
}
document.querySelector('#idle').addEventListener('click', () => {voice.stop();returnToIdle();});
voiceCheckbox.addEventListener('change', () => {
  voice.setEnabled(voiceCheckbox.checked);
  status.textContent = voiceCheckbox.checked
    ? (voice.canSpeak() ? 'Voice enabled. Tap a reaction to hear Mia.' : 'Voice is unavailable in this browser.')
    : 'Voice off. Captions remain visible.';
});
reduceCheckbox.addEventListener('change', () => {
  base.dataset.reducedMotion = String(reducedMotion());
  if (reducedMotion()) stopMouthAnimation();
});
voice.setTalkingListener(speaking => {if (speaking) startMouthAnimation(); else stopMouthAnimation();});
function refreshVoices() {
  const current = voiceSelect.value;
  const voices = voice.getVoices();
  voiceSelect.replaceChildren(new Option('Automatic voice', ''));
  voices.forEach(v => voiceSelect.add(new Option(`${v.name} (${v.lang})`, v.voiceURI)));
  if ([...voiceSelect.options].some(opt => opt.value === current)) voiceSelect.value = current;
}
voiceSelect.addEventListener('change', () => voice.setVoiceURI(voiceSelect.value));
if (voice.canSpeak()) {
  refreshVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', refreshVoices);
}
base.dataset.reducedMotion = String(reducedMotion());
window.addEventListener('pagehide', () => {voice.stop();clearTimeout(resetTimer);stopMouthAnimation();});
