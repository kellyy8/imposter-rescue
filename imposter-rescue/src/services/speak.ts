let lockedDexterVoiceURI: string | null = null;

function pickDexterVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  if (lockedDexterVoiceURI) {
    const lockedVoice = voices.find((voice) => voice.voiceURI === lockedDexterVoiceURI);
    if (lockedVoice) {
      return lockedVoice;
    }
  }

  const normalizedVoices = voices.map((voice) => ({
    voice,
    name: voice.name.toLowerCase(),
    lang: voice.lang.toLowerCase(),
  }));

  const preferred =
    normalizedVoices.find((item) => item.name.includes('google us english male'))?.voice ||
    normalizedVoices.find((item) => item.lang.startsWith('en-us') && item.name.includes('male'))?.voice ||
    normalizedVoices.find((item) => item.name.includes('male'))?.voice ||
    voices[0] ||
    null;

  if (preferred) {
    lockedDexterVoiceURI = preferred.voiceURI;
  }

  return preferred;
}

export const speakDexter = (text: string, rate: number): boolean => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  // Keep one voice identity, modulate only speaking speed.
  utterance.rate = Math.max(0.1, Math.min(10, rate));
  
  // Lock to one selected male voice so Dexter sounds consistent across the mission.
  const voices = window.speechSynthesis.getVoices();
  utterance.voice = pickDexterVoice(voices);

  window.speechSynthesis.speak(utterance);
  return true;
};