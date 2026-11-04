/** Optional voice prototype; NOT a substitute for an original recorded performance. */
export function createMiaVoice({ enabled = false, rate = 1.08, pitch = 1.2 } = {}) {
  const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
  let isEnabled = Boolean(enabled);
  let selectedVoiceURI = '';
  let current = null;
  let onTalkingChange = () => {};

  const getVoices = () => synth ? synth.getVoices() : [];
  const canSpeak = () => Boolean(synth && typeof SpeechSynthesisUtterance !== 'undefined');

  function findVoice(lang) {
    const voices = getVoices();
    const picked = voices.find(v => v.voiceURI === selectedVoiceURI);
    if (picked && (!lang.startsWith('es') || picked.lang.toLowerCase().startsWith('es'))) return picked;
    return voices.find(v => v.lang.toLowerCase() === lang.toLowerCase())
      ?? voices.find(v => v.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()))
      ?? (lang.startsWith('es') ? null : picked)
      ?? null;
  }

  function stop() {
    if (!synth) return;
    current = null;
    synth.cancel();
    onTalkingChange(false);
  }

  function speak(cue) {
    if (!canSpeak() || !isEnabled) return false;
    if (synth.speaking || synth.pending) stop(); // React to the latest cue, never queue chatter.
    const utterance = new SpeechSynthesisUtterance(cue.voiceText ?? cue.text);
    utterance.lang = cue.locale ?? 'en-US';
    utterance.pitch = pitch;
    utterance.rate = rate;
    utterance.volume = 0.78;
    const voice = findVoice(utterance.lang);
    if (voice) utterance.voice = voice;
    current = utterance;
    utterance.onstart = () => { if (current === utterance) onTalkingChange(true); };
    const done = () => { if (current === utterance) { current = null; onTalkingChange(false); } };
    utterance.onend = done;
    utterance.onerror = done;
    synth.speak(utterance);
    return true;
  }

  return {
    canSpeak, getVoices, speak, stop,
    setEnabled(value) { isEnabled = Boolean(value); if (!isEnabled) stop(); },
    isEnabled() { return isEnabled; },
    setVoiceURI(uri) { selectedVoiceURI = String(uri || ''); },
    setTalkingListener(listener) { onTalkingChange = typeof listener === 'function' ? listener : () => {}; },
  };
}
