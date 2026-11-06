// The announcer. A real recorded-quality voice clip is played when there is one (client/audio/<clip>.mp3);
// if the browser cannot play it, the built-in speech synthesis says the line instead. Everything is injected so it
// runs in Node tests; where neither works the game just stays silent.

const DEEP = /male|david|mark|daniel|george|james|fred|alex/i;

export function createVoice({ synth, Utterance, Audio, isMuted }) {
  let current = null;

  const pickVoice = () => {
    try {
      const voices = synth.getVoices().filter((v) => /^en/i.test(v.lang));
      return voices.find((v) => /male/i.test(v.name) && !/female/i.test(v.name)) ?? voices.find((v) => DEEP.test(v.name)) ?? null;
    } catch { return null; }
  };

  const speak = ({ text, pitch = 1, rate = 1, volume = 1 }) => {
    if (!synth || !Utterance) return;
    try {
      const u = new Utterance(text);
      u.pitch = pitch;
      u.rate = rate;
      u.volume = volume;
      const voice = pickVoice();
      if (voice) u.voice = voice;
      synth.cancel();
      synth.speak(u);
    } catch { /* speech blocked or unavailable */ }
  };

  const stop = () => { try { current?.pause(); if (current) current.currentTime = 0; } catch { /* ignore */ } current = null; };

  return {
    say(line) {
      if (isMuted()) return;
      stop();
      if (line.clip && Audio) {
        try {
          const audio = new Audio(`audio/${line.clip}.mp3`);
          audio.volume = 1;
          current = audio;
          Promise.resolve(audio.play()).catch(() => speak(line));
          return;
        } catch { /* fall through to speech */ }
      }
      speak(line);
    },
  };
}
