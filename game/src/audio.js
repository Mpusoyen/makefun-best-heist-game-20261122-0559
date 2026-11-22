// Tiny synthesized sounds from the WebAudio API: no files, no network. The context is
// created on the first user gesture (browsers refuse it earlier) and every call is a
// no-op until then, so screenshot scenes and muted tabs stay silent and safe.

export function createAudio() {
  let ctx = null;

  function unlock() {
    if (!ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) ctx = new AC();
      } catch {
        ctx = null;
      }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function tone(freq, dur, { type = 'sine', gain = 0.05, delay = 0, slide = 0 } = {}) {
    if (!ctx) return;
    try {
      const t0 = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
      amp.gain.setValueAtTime(gain, t0);
      amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(amp).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    } catch {
      // Sound is garnish: a failed tone never breaks the game.
    }
  }

  return {
    unlock,
    pickup() {
      tone(880, 0.07, { type: 'triangle', gain: 0.06 });
      tone(1318, 0.1, { type: 'triangle', gain: 0.05, delay: 0.05 });
    },
    diamond() {
      tone(1046, 0.09, { type: 'triangle', gain: 0.06 });
      tone(1318, 0.09, { type: 'triangle', gain: 0.06, delay: 0.07 });
      tone(1760, 0.16, { type: 'triangle', gain: 0.06, delay: 0.14 });
    },
    toss() {
      tone(1560, 0.05, { type: 'square', gain: 0.025 });
      tone(1174, 0.07, { type: 'square', gain: 0.025, delay: 0.16 });
    },
    spotted() {
      tone(233, 0.14, { type: 'sawtooth', gain: 0.035 });
    },
    busted() {
      tone(392, 0.22, { type: 'sawtooth', gain: 0.05 });
      tone(311, 0.22, { type: 'sawtooth', gain: 0.05, delay: 0.16 });
      tone(233, 0.4, { type: 'sawtooth', gain: 0.05, delay: 0.32 });
    },
    win() {
      tone(523, 0.12, { type: 'triangle', gain: 0.06 });
      tone(659, 0.12, { type: 'triangle', gain: 0.06, delay: 0.1 });
      tone(784, 0.12, { type: 'triangle', gain: 0.06, delay: 0.2 });
      tone(1046, 0.3, { type: 'triangle', gain: 0.07, delay: 0.3 });
    },
  };
}
