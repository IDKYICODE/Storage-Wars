// The announcer: speaks short lines with the browser's built-in speech synthesis (free, no audio files).
// Everything is injected so it runs in Node tests; where speech is missing or blocked it just stays silent.

const DEEP = /male|david|mark|daniel|george|james|fred|alex/i;

export function createVoice(synth, Utterance, isMuted) {
  const pickVoice = () => {
    try {
      const voices = synth.getVoices().filter((v) => /^en/i.test(v.lang));
      return voices.find((v) => /male/i.test(v.name) && !/female/i.test(v.name)) ?? voices.find((v) => DEEP.test(v.name)) ?? null;
    } catch { return null; }
  };
  return {
    say({ text, pitch = 1, rate = 1, volume = 1 }) {
      if (!synth || !Utterance || isMuted()) return;
      try {
        const u = new Utterance(text);
        u.pitch = pitch;
        u.rate = rate;
        u.volume = volume;
        const voice = pickVoice();
        if (voice) u.voice = voice;
        synth.cancel();
        synth.speak(u);
      } catch { /* speech blocked or unavailable: the game works without it */ }
    },
  };
}
