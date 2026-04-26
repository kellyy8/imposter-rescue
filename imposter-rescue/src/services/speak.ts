let lockedDexterVoiceURI: string | null = null;
let lockedIsabellaVoiceURI: string | null = null;

type VoicePreference = 'male' | 'female';

function pickVoice(voices: SpeechSynthesisVoice[], preference: VoicePreference): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  const lockedVoiceURI = preference === 'male' ? lockedDexterVoiceURI : lockedIsabellaVoiceURI;
  if (lockedVoiceURI) {
    const lockedVoice = voices.find((voice) => voice.voiceURI === lockedVoiceURI);
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
    (preference === 'male'
      ? normalizedVoices.find((item) => item.name.includes('google us english male'))?.voice ||
        normalizedVoices.find((item) => item.lang.startsWith('en-us') && item.name.includes('male'))?.voice ||
        normalizedVoices.find((item) => item.name.includes('male'))?.voice
      : normalizedVoices.find((item) => item.name.includes('google uk english female'))?.voice ||
        normalizedVoices.find((item) => item.name.includes('female'))?.voice ||
        normalizedVoices.find((item) => item.name.includes('samantha'))?.voice ||
        normalizedVoices.find((item) => item.name.includes('victoria'))?.voice ||
        normalizedVoices.find((item) => item.name.includes('zira'))?.voice ||
        normalizedVoices.find((item) => item.name.includes('tessa'))?.voice ||
        normalizedVoices.find((item) => item.name.includes('zira'))?.voice ||
        normalizedVoices.find((item) => item.name.includes('female'))?.voice) ||
    voices[0] ||
    null;

  if (preferred) {
    if (preference === 'male') {
      lockedDexterVoiceURI = preferred.voiceURI;
    } else {
      lockedIsabellaVoiceURI = preferred.voiceURI;
    }
  }

  return preferred;
}

function speak(text: string, rate: number, preference: VoicePreference): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  // Keep one voice identity, modulate only speaking speed.
  utterance.rate = Math.max(0.1, Math.min(10, rate));
  
  // Lock to one selected voice so the character sounds consistent across the mission.
  const voices = window.speechSynthesis.getVoices();
  utterance.voice = pickVoice(voices, preference);

  window.speechSynthesis.speak(utterance);
  return true;
};

export const speakDexter = (text: string, rate: number): boolean => speak(text, rate, 'male');

export const speakIsabella = (text: string, rate: number): boolean => speak(text, rate, 'female');