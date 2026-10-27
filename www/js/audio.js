/* Sons e músicas ORIGINAIS no estilo K-pop, gerados pelo próprio app (sem arquivos, sem internet). */
(function () {
  'use strict';
  let ctx = null, master = null, musicGain = null, sfxGain = null, delay = null;
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.32; musicGain.connect(master);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.55; sfxGain.connect(master);
    delay = ctx.createDelay(1); delay.delayTime.value = 0.375;
    const fb = ctx.createGain(); fb.gain.value = 0.3; const dl = ctx.createGain(); dl.gain.value = 0.25;
    delay.connect(fb); fb.connect(delay); delay.connect(dl); dl.connect(musicGain);
  }
  const midi = n => 440 * Math.pow(2, (n - 69) / 12);

  function tone(freq, t, dur, o = {}) {
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'triangle'; osc.frequency.setValueAtTime(freq, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t + dur);
    if (o.detune) osc.detune.value = o.detune;
    const v = o.vol || 0.3, a = o.a || 0.005;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = osc;
    if (o.cut) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.cut; f.Q.value = o.q || 1; osc.connect(f); node = f; }
    node.connect(g); g.connect(o.out || sfxGain);
    if (o.send) g.connect(delay);
    osc.start(t); osc.stop(t + dur + 0.05);
  }
  let noiseBuf = null;
  function noise(t, dur, o = {}) {
    if (!noiseBuf) { noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = o.ftype || 'highpass'; f.frequency.value = o.f || 6000;
    const g = ctx.createGain(); g.gain.setValueAtTime(o.vol || 0.2, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(o.out || sfxGain); s.start(t); s.stop(t + dur + 0.02);
  }

  /* ---------- Efeitos ---------- */
  const SFX = {
    tap() { const t = ctx.currentTime; tone(660, t, 0.08, { type: 'sine', slide: 990, vol: 0.25 }); },
    pick() { const t = ctx.currentTime; [76, 83].forEach((n, i) => tone(midi(n), t + i * 0.07, 0.25, { type: 'triangle', vol: 0.22 })); },
    paint() { const t = ctx.currentTime; tone(300, t, 0.18, { type: 'sine', slide: 700, vol: 0.3 }); noise(t, 0.12, { f: 3000, vol: 0.06 }); },
    flip() { const t = ctx.currentTime; noise(t, 0.15, { ftype: 'bandpass', f: 1800, vol: 0.18 }); tone(520, t, 0.1, { type: 'sine', slide: 780, vol: 0.12 }); },
    match() { const t = ctx.currentTime; [72, 76, 79, 84].forEach((n, i) => tone(midi(n), t + i * 0.07, 0.3, { type: 'triangle', vol: 0.22 })); },
    sparkle() { const t = ctx.currentTime; for (let i = 0; i < 8; i++) tone(midi(84 + [0, 4, 7, 12, 16, 12, 7, 19][i]), t + i * 0.05, 0.25, { type: 'sine', vol: 0.12 }); },
    win() {
      const t = ctx.currentTime;
      [[72, 0], [76, 0.12], [79, 0.24], [84, 0.36], [83, 0.6], [84, 0.72]].forEach(([n, d]) => { tone(midi(n), t + d, 0.4, { type: 'square', vol: 0.09, cut: 3000 }); tone(midi(n - 12), t + d, 0.4, { type: 'triangle', vol: 0.15 }); });
      for (let i = 0; i < 10; i++) tone(midi(96 + (i % 5) * 2), t + 0.8 + i * 0.04, 0.3, { type: 'sine', vol: 0.06 });
    },
    whoosh() { const t = ctx.currentTime; noise(t, 0.5, { ftype: 'bandpass', f: 900, vol: 0.2 }); tone(200, t, 0.5, { type: 'sine', slide: 900, vol: 0.08 }); }
  };

  /* ---------- Músicas originais ---------- */
  // Cada música: bpm, acordes (notas MIDI) por compasso, baixo, melodia em semicolcheias (null = pausa)
  const SONGS = [
    { // "Palco Brilhante" — animada
      bpm: 118,
      chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], // Lá m, Fá, Dó, Sol
      bass: [45, 41, 36, 43],
      mel: [
        [76, null, 79, null, 81, null, 79, 76, null, 74, 76, null, 72, null, null, null],
        [72, null, 74, null, 76, null, 77, 76, null, 74, 72, null, 69, null, null, null],
        [67, null, 72, null, 76, null, 79, null, 81, 79, 76, null, 79, null, null, null],
        [79, null, 81, null, 83, 81, 79, null, 76, null, 74, null, 74, 76, 79, null]
      ]
    },
    { // "Estrela da Noite" — mais tranquila
      bpm: 96,
      chords: [[53, 57, 60, 64], [55, 59, 62, 65], [52, 55, 59, 62], [57, 60, 64, 67]], // Fá7M, Sol7, Mi m7, Lá m7
      bass: [41, 43, 40, 45],
      mel: [
        [81, null, null, 79, 76, null, null, null, 77, null, 76, null, 72, null, null, null],
        [74, null, null, 76, 79, null, null, null, 77, null, 74, null, 71, null, null, null],
        [76, null, 79, null, 83, null, 81, null, 79, null, 76, null, 74, null, 76, null],
        [72, null, null, 74, 76, null, 79, null, 76, null, null, null, null, null, null, null]
      ]
    }
  ];
  let playing = false, songIdx = 0, nextTime = 0, step = 0, timer = null;
  function schedule() {
    const song = SONGS[songIdx], sd = 60 / song.bpm / 4; // duração da semicolcheia
    while (nextTime < ctx.currentTime + 0.25) {
      const bar = Math.floor(step / 16) % 4, s16 = step % 16, t = nextTime, o = musicGain;
      // bateria
      if (s16 % 4 === 0) { tone(150, t, 0.25, { type: 'sine', slide: 45, vol: 0.9, out: o }); }
      if (s16 === 4 || s16 === 12) { noise(t, 0.18, { f: 1500, vol: 0.35, out: o }); tone(220, t, 0.08, { type: 'triangle', vol: 0.15, out: o }); }
      if (s16 % 2 === 0) noise(t, 0.04, { f: 8000, vol: s16 % 4 === 2 ? 0.14 : 0.07, out: o });
      if (songIdx === 0 && s16 === 14) noise(t, 0.04, { f: 9000, vol: 0.08, out: o });
      // baixo
      if ([0, 3, 6, 8, 10, 14].includes(s16)) tone(midi(song.bass[bar]), t, sd * 1.8, { type: 'sawtooth', vol: 0.22, cut: 600, q: 4, out: o });
      // acordes (pad em síncope)
      if (s16 === 0 || s16 === 6 || s16 === 10) song.chords[bar].forEach(n => {
        tone(midi(n + 12), t, sd * 3.5, { type: 'sawtooth', vol: 0.045, cut: 2200, detune: 8, out: o });
        tone(midi(n + 12), t, sd * 3.5, { type: 'sawtooth', vol: 0.045, cut: 2200, detune: -8, out: o });
      });
      // melodia
      const n = song.mel[bar][s16];
      if (n != null) tone(midi(n), t, sd * 2.2, { type: 'square', vol: 0.07, cut: 3200, out: o, send: true });
      // brilho
      if (s16 === 15 && bar === 3) for (let i = 0; i < 4; i++) tone(midi(96 + i * 3), t + i * sd / 2, 0.2, { type: 'sine', vol: 0.03, out: o });
      nextTime += sd; step++;
      if (step >= 16 * 4 * 4) { step = 0; } // repete
    }
  }
  const Audio = {
    unlock() { init(); },
    sfx(name) { try { init(); if (ctx && SFX[name]) SFX[name](); } catch (e) { /* ignora */ } },
    get playing() { return playing; },
    startMusic(i) {
      init(); if (!ctx) return;
      if (i != null) songIdx = i % SONGS.length;
      if (playing) return;
      playing = true; step = 0; nextTime = ctx.currentTime + 0.1;
      timer = setInterval(schedule, 60); schedule();
    },
    stopMusic() { playing = false; clearInterval(timer); timer = null; },
    nextSong() { const was = playing; this.stopMusic(); songIdx = (songIdx + 1) % SONGS.length; if (was) this.startMusic(); return songIdx; },
    pause() { if (ctx && ctx.state === 'running') ctx.suspend(); },
    resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }
  };
  window.Sound = Audio;
})();
