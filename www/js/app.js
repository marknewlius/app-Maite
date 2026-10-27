/* Guerreira Maitê — lógica das telas */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const D = window.Doll, OPT = D.OPTIONS;

  /* ---------- armazenamento ---------- */
  const store = {
    get(k, def) { try { const v = localStorage.getItem('gm_' + k); return v ? JSON.parse(v) : def; } catch (e) { return def; } },
    set(k, v) { try { localStorage.setItem('gm_' + k, JSON.stringify(v)); } catch (e) { /* sem espaço */ } }
  };
  let state = Object.assign({}, D.DEFAULT, store.get('look', {}));
  const saveState = () => store.set('look', state);

  /* ---------- navegação ---------- */
  const history = [];
  let current = 'home';
  function go(id, opts = {}) {
    if (id === current) return;
    if (!opts.noHistory) history.push(current);
    $('#' + current).classList.remove('on');
    leave(current);
    current = id;
    $('#' + id).classList.add('on');
    enter(id, opts);
  }
  function back() {
    if (current === 'home') return false;
    const prev = history.pop() || 'home';
    go(prev, { noHistory: true });
    return true;
  }
  function enter(id, o) {
    if (id === 'home') renderHome();
    if (id === 'dress') renderDress();
    if (id === 'lr') startLR();
    if (id === 'show') startShow(o);
    if (id === 'colorList') renderPageList();
    if (id === 'memory') startMemory(memLevel);
    if (id === 'gallery') renderGallery();
  }
  function leave(id) { if (id === 'show') stopShow(); }

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-go]'); if (b) { Sound.sfx('tap'); go(b.dataset.go); return; }
    const k = e.target.closest('[data-back]'); if (k) { Sound.sfx('tap'); back(); }
  });

  /* ---------- tema do palco ---------- */
  function applyStage() {
    const st = D.STAGES[state.stage] || D.STAGES.roxo, r = document.documentElement.style;
    r.setProperty('--bg1', st.bg[0]); r.setProperty('--bg2', st.bg[1]); r.setProperty('--bg3', st.bg[2]);
  }

  /* ---------- música ---------- */
  let musicOn = store.get('music', true);
  function updateMusicBtn() { $('#btnMusic').classList.toggle('off', !musicOn); }
  $('#btnMusic').addEventListener('click', () => {
    if (!musicOn) { musicOn = true; Sound.startMusic(); }
    else if (Sound.playing) { const i = Sound.nextSong(); if (i === 0) { musicOn = false; Sound.stopMusic(); } }
    else Sound.startMusic();
    store.set('music', musicOn); updateMusicBtn();
  });
  let unlocked = false;
  document.addEventListener('pointerdown', () => {
    if (unlocked) return; unlocked = true; Sound.unlock(); if (musicOn) Sound.startMusic(0);
  }, { capture: true });
  document.addEventListener('visibilitychange', () => document.hidden ? Sound.pause() : Sound.resume());

  /* ---------- aviso visual (emoji) ---------- */
  let toastT;
  function toast(txt) { const t = $('#toast'); t.textContent = txt; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1100); }

  /* ---------- INÍCIO ---------- */
  function renderHome() { applyStage(); $('#homeDoll').innerHTML = D.svg(state); }
  $('#homeDoll').addEventListener('click', () => { Sound.sfx('sparkle'); go('show'); });

  /* ---------- VESTIR ---------- */
  const TABS = [
    { k: 'hair', icon: '💇‍♀️', vb: '92 24 216 290' },
    { k: 'hairColor', icon: '🌈', color: true },
    { k: 'outfit', icon: '👗', vb: '96 250 208 330' },
    { k: 'outfitColor', icon: '🎨', color: true },
    { k: 'shoes', icon: '👢', vb: '140 590 120 185' },
    { k: 'shoeColor', icon: '🎀', color: true },
    { k: 'head', icon: '👑', vb: '70 0 260 280' },
    { k: 'hand', icon: '🎤', vb: '120 100 240 400' },
    { k: 'back', icon: '🦋', vb: '10 150 380 560', view: 'back' },
    { k: 'eyes', icon: '👀', color: true },
    { k: 'skin', icon: '🙂', color: true },
    { k: 'stage', icon: '✨', stage: true }
  ];
  let tab = 'hair';
  function renderDress() {
    applyStage();
    $('#tabs').innerHTML = TABS.map(t => `<button class="tab${t.k === tab ? ' on' : ''}" data-tab="${t.k}">${t.icon}</button>`).join('');
    renderDoll();
    renderOptions();
  }
  function renderDoll(pop) {
    const h = $('#dressDoll'); h.innerHTML = D.svg(state);
    if (pop) { h.classList.remove('pop'); void h.offsetWidth; h.classList.add('pop'); }
  }
  function renderOptions() {
    const t = TABS.find(x => x.k === tab), box = $('#options');
    const list = OPT[t.k];
    if (t.color) box.innerHTML = list.map(c => `<button class="swatch${state[t.k] === c ? ' on' : ''}" data-v="${c}" style="background:radial-gradient(circle at 35% 30%, ${D.light(c, .45)}, ${c} 55%, ${D.dark(c, .2)})"></button>`).join('');
    else if (t.stage) box.innerHTML = list.map(k => { const s = D.STAGES[k]; return `<button class="swatch${state.stage === k ? ' on' : ''}" data-v="${k}" style="background:radial-gradient(circle at 50% 80%, ${s.bg[2]}, ${s.bg[1]} 55%, ${s.bg[0]})"></button>`; }).join('');
    else box.innerHTML = list.map(v => v === 'nenhum'
      ? `<button class="opt none${state[t.k] === v ? ' on' : ''}" data-v="${v}">🚫</button>`
      : `<button class="opt${state[t.k] === v ? ' on' : ''}" data-v="${v}">${D.svg(Object.assign({}, state, { [t.k]: v }), { viewBox: t.vb, view: t.view })}</button>`).join('');
    const on = box.querySelector('.on'); if (on) on.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  $('#tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    Sound.sfx('tap'); tab = b.dataset.tab;
    $$('.tab').forEach(x => x.classList.toggle('on', x === b));
    renderOptions();
  });
  $('#options').addEventListener('click', e => {
    const b = e.target.closest('[data-v]'); if (!b) return;
    state[tab] = b.dataset.v; saveState(); Sound.sfx('pick');
    $$('#options [data-v]').forEach(x => x.classList.toggle('on', x === b));
    if (tab === 'stage') applyStage();
    renderDoll(true);
    // atualiza as miniaturas quando muda a cor (para refletir na prévia)
    if (TABS.find(x => x.k === tab).color) return;
  });
  function randomLook() {
    const pick = a => a[Math.floor(Math.random() * a.length)];
    ['hair', 'hairColor', 'outfit', 'outfitColor', 'shoes', 'shoeColor', 'head', 'hand', 'back', 'eyes', 'stage'].forEach(k => state[k] = pick(OPT[k]));
    if (Math.random() < 0.5) state.back = 'nenhum';
  }
  $('#btnRandom').addEventListener('click', () => { randomLook(); saveState(); Sound.sfx('sparkle'); applyStage(); renderDoll(true); renderOptions(); });
  $('#btnReady').addEventListener('click', () => { Sound.sfx('sparkle'); go('show'); });

  /* ---------- ESQUERDA OU DIREITA ---------- */
  const LR_ROUNDS = [
    { k: 'hair', icon: '💇‍♀️' }, { k: 'hairColor', icon: '🌈' }, { k: 'outfit', icon: '👗' }, { k: 'outfitColor', icon: '🎨' },
    { k: 'shoes', icon: '👢' }, { k: 'head', icon: '👑' }, { k: 'hand', icon: '🎤' }, { k: 'back', icon: '🦋' }
  ];
  let lrStep = 0, lrPair = [], lrBusy = false;
  function startLR() { applyStage(); lrStep = 0; nextLR(); }
  function nextLR() {
    if (lrStep >= LR_ROUNDS.length) { saveState(); Sound.sfx('win'); go('show', { noHistory: true, celebrate: true }); history.length && history[history.length - 1] === 'lr' && history.pop(); return; }
    const r = LR_ROUNDS[lrStep];
    const pool = OPT[r.k].filter(v => v !== 'nenhum' && v !== state[r.k]);
    pool.sort(() => Math.random() - 0.5);
    lrPair = pool.slice(0, 2);
    $('#lrIcon').textContent = r.icon;
    $('#lrDots').innerHTML = LR_ROUNDS.map((_, i) => `<i class="${i < lrStep ? 'done' : i === lrStep ? 'now' : ''}"></i>`).join('');
    ['#lrA', '#lrB'].forEach((sel, i) => {
      const el = $(sel); el.className = 'lr-card ' + (i ? 'right' : 'left');
      el.innerHTML = D.svg(Object.assign({}, state, { [r.k]: lrPair[i] }), { view: r.k === 'back' ? 'back' : 'front' });
    });
    lrBusy = false;
  }
  ['#lrA', '#lrB'].forEach((sel, i) => $(sel).addEventListener('click', () => {
    if (lrBusy) return; lrBusy = true;
    const r = LR_ROUNDS[lrStep]; state[r.k] = lrPair[i];
    Sound.sfx('pick');
    $(sel).classList.add('win'); $(i ? '#lrA' : '#lrB').classList.add('lose');
    setTimeout(() => { lrStep++; nextLR(); }, 750);
  }));

  /* ---------- PALCO QUE GIRA ---------- */
  let angle = 0, spinAnim = null, dragging = false, lastX = 0, vel = 0, idleT = 0, rafId = 0, lastTs = 0;
  function startShow(o = {}) {
    applyStage();
    $('#faceFront').innerHTML = D.svg(state, { view: 'front' });
    $('#faceBack').innerHTML = D.svg(state, { view: 'back' });
    angle = 0; setAngle(0);
    $('#turn').classList.remove('dance');
    spin(2, 3.2, () => { $('#turn').classList.add('dance'); });
    burst(o.celebrate ? 220 : 140);
    Sound.sfx('whoosh');
    lastTs = 0; cancelAnimationFrame(rafId); rafId = requestAnimationFrame(loop);
  }
  function stopShow() { cancelAnimationFrame(rafId); spinAnim = null; confetti.length = 0; }
  let spinning = false;
  function setAngle(a) {
    const rad = a * Math.PI / 180, c = Math.cos(rad), ac = Math.abs(c);
    const front = c >= 0;
    $('#faceFront').style.display = front ? '' : 'none';
    $('#faceBack').style.display = front ? 'none' : '';
    $('#faceBack').style.transform = 'none';
    // nunca fica fininha: no máximo estreita um pouco, e a troca acontece dentro do brilho
    const sx = 0.72 + 0.28 * ac;
    const edge = Math.max(0, 1 - ac / 0.45);            // 1 no momento da virada
    const lean = Math.sin(rad) * 3;
    $('#spinner').style.transform = `scaleX(${sx.toFixed(3)}) rotate(${lean.toFixed(2)}deg)`;
    $('#spinner').style.filter = edge > 0 ? `brightness(${(1 + edge * 1.6).toFixed(2)}) blur(${(edge * 2.5).toFixed(1)}px)` : 'none';
    $('#flash').style.opacity = (edge * 0.95).toFixed(2);
    $('#flash').style.transform = `scale(${(0.7 + edge * 0.5).toFixed(2)})`;
    const swirlOn = spinning || dragging || Math.abs(vel) > 40 ? 1 : 0;
    const sw = $('#swirl');
    sw.style.opacity = Math.max(edge, swirlOn * 0.85).toFixed(2);
  }
  function spin(turns, secs, done) {
    const from = angle, to = angle + 360 * turns, t0 = performance.now();
    spinning = true;
    spinAnim = { from, to, t0, dur: secs * 1000, done: () => { spinning = false; done && done(); } };
  }
  function loop(ts) {
    const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0; lastTs = ts;
    if (spinAnim && !dragging) {
      const p = Math.min(1, (ts - spinAnim.t0) / spinAnim.dur);
      const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      angle = spinAnim.from + (spinAnim.to - spinAnim.from) * e;
      if (p >= 1) { const d = spinAnim.done; spinAnim = null; angle = 0; d && d(); }
    } else if (!dragging) {
      if (Math.abs(vel) > 5) { angle += vel * dt; vel *= Math.pow(0.08, dt); idleT = 0; }
      else { idleT += dt; if (idleT > 1.2) { const target = Math.round(angle / 360) * 360; angle += (target - angle) * Math.min(1, dt * 4); } }
    }
    setAngle(angle);
    drawConfetti(dt);
    rafId = requestAnimationFrame(loop);
  }
  const stageEl = $('#showStage');
  stageEl.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; vel = 0; spinAnim = null; spinning = false; stageEl.setPointerCapture(e.pointerId); });
  stageEl.addEventListener('pointermove', e => { if (!dragging) return; const dx = e.clientX - lastX; lastX = e.clientX; angle += dx * 0.9; vel = dx * 0.9 * 60; });
  const endDrag = () => { if (!dragging) return; dragging = false; idleT = 0; };
  stageEl.addEventListener('pointerup', endDrag); stageEl.addEventListener('pointercancel', endDrag);
  $('#btnSpin').addEventListener('click', () => { Sound.sfx('whoosh'); spin(2, 2.6); burst(80); });
  $('#btnEdit').addEventListener('click', () => { Sound.sfx('tap'); go('dress'); });
  $('#btnSaveLook').addEventListener('click', () => {
    const g = store.get('gallery', []); g.unshift({ type: 'look', state: Object.assign({}, state), t: Date.now() });
    store.set('gallery', g.slice(0, 40)); Sound.sfx('win'); burst(160); toast('💾⭐');
  });

  /* confete */
  const cv = $('#confetti'), cx = cv.getContext('2d'), confetti = [];
  const CCOL = ['#ff3d9a', '#ffc93c', '#6ff7ff', '#b88cff', '#ffffff', '#7ee05a'];
  function burst(n) {
    const w = cv.clientWidth, h = cv.clientHeight;
    for (let i = 0; i < n; i++) confetti.push({
      x: w / 2 + (Math.random() - 0.5) * w * 0.3, y: h * 0.35, vx: (Math.random() - 0.5) * 900, vy: -Math.random() * 900 - 200,
      r: 4 + Math.random() * 6, c: CCOL[i % CCOL.length], a: Math.random() * 6, va: (Math.random() - 0.5) * 12, star: Math.random() < 0.3, life: 0
    });
  }
  function drawConfetti(dt) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, w, h);
    for (let i = confetti.length - 1; i >= 0; i--) {
      const p = confetti[i];
      p.vy += 900 * dt; p.vx *= Math.pow(0.4, dt); p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.va * dt; p.life += dt;
      if (p.y > h + 20 || p.life > 6) { confetti.splice(i, 1); continue; }
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a); cx.fillStyle = p.c;
      if (p.star) { cx.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? p.r * 0.45 : p.r * 1.3; cx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } cx.fill(); }
      else cx.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r);
      cx.restore();
    }
  }

  /* ---------- COLORIR ---------- */
  const PALETTE = ['#ff3d6e', '#ff7a3d', '#ffc93c', '#fff15c', '#7ee05a', '#24c48a', '#3fd0ff', '#2f7bff', '#8a5cff', '#c86bff', '#ff6fc4', '#ffb3d9',
    '#a5673f', '#f5c6a5', '#ffffff', '#9aa0b4', '#2b2233', 'url(#pGlitterOuro)', 'url(#pGlitterRosa)', 'url(#pGlitterAzul)', 'url(#pArcoIris)'];
  const PREVIEW = { 'url(#pGlitterOuro)': 'radial-gradient(circle,#fff6c2 20%,transparent 22%) 0 0/12px 12px,#ffcf3f', 'url(#pGlitterRosa)': 'radial-gradient(circle,#ffe0f3 20%,transparent 22%) 0 0/12px 12px,#ff6fc4', 'url(#pGlitterAzul)': 'radial-gradient(circle,#e0f7ff 20%,transparent 22%) 0 0/12px 12px,#56c8ff', 'url(#pArcoIris)': 'linear-gradient(135deg,#ff5f6d,#ffb83f,#ffe94a,#4ce08a,#4fb4ff,#b56bff)' };
  let page = null, fills = {}, undo = [], paint = PALETTE[0];
  function renderPageList() {
    $('#pageGrid').innerHTML = Pages.PAGES.map((p, i) => `<button class="thumb" data-page="${i}">${Pages.render(p, store.get('fills_' + p.id, {}))}</button>`).join('');
  }
  $('#pageGrid').addEventListener('click', e => { const b = e.target.closest('[data-page]'); if (!b) return; Sound.sfx('tap'); openPage(Pages.PAGES[+b.dataset.page]); });
  function openPage(p, f) {
    page = p; fills = f ? Object.assign({}, f) : store.get('fills_' + p.id, {}); undo = [];
    go('color');
    $('#drawWrap').innerHTML = Pages.render(page, fills);
    $('#palette').innerHTML = PALETTE.map(c => `<button class="pcolor${c === paint ? ' on' : ''}${c.startsWith('url') ? ' glitter' : ''}" data-c="${c}" style="background:${PREVIEW[c] || c}"></button>`).join('');
  }
  $('#palette').addEventListener('click', e => {
    const b = e.target.closest('[data-c]'); if (!b) return;
    paint = b.dataset.c; Sound.sfx('tap'); $$('.pcolor').forEach(x => x.classList.toggle('on', x === b));
  });
  $('#drawWrap').addEventListener('click', e => {
    const r = e.target.closest('[data-r]'); if (!r) return;
    const id = r.getAttribute('data-r');
    undo.push(Object.assign({}, fills)); if (undo.length > 60) undo.shift();
    fills[id] = paint; Sound.sfx('paint');
    $$('#drawWrap [data-r="' + id + '"]').forEach(el => el.setAttribute('fill', paint));
    store.set('fills_' + page.id, fills);
  });
  $('#btnUndo').addEventListener('click', () => { if (!undo.length) return; fills = undo.pop(); Sound.sfx('tap'); $('#drawWrap').innerHTML = Pages.render(page, fills); store.set('fills_' + page.id, fills); });
  $('#btnClear').addEventListener('click', () => { undo.push(Object.assign({}, fills)); fills = {}; Sound.sfx('whoosh'); $('#drawWrap').innerHTML = Pages.render(page, fills); store.set('fills_' + page.id, fills); });
  $('#btnSaveDraw').addEventListener('click', () => {
    const g = store.get('gallery', []); g.unshift({ type: 'draw', page: page.id, fills: Object.assign({}, fills), t: Date.now() });
    store.set('gallery', g.slice(0, 40)); Sound.sfx('win'); toast('💾🎨');
  });

  /* ---------- MEMÓRIA ---------- */
  const ICONS = ['⭐', '💖', '🎤', '🎵', '👑', '🌈', '🐰', '🎧', '🦋', '💎'];
  let memLevel = store.get('memLevel', 0), memOpen = [], memLock = false, memDone = 0, memPairs = 0;
  function startMemory(level) {
    memLevel = level; store.set('memLevel', level);
    $('#memEasy').classList.toggle('ok', level === 0); $('#memHard').classList.toggle('ok', level === 1);
    memPairs = level ? 6 : 3; memDone = 0; memOpen = []; memLock = false;
    const icons = ICONS.slice().sort(() => Math.random() - 0.5).slice(0, memPairs);
    const deck = icons.concat(icons).sort(() => Math.random() - 0.5);
    const board = $('#memBoard');
    const land = window.innerWidth > window.innerHeight;
    const cols = level ? (land ? 4 : 3) : (land ? 3 : 2), rows = Math.ceil(deck.length / cols);
    const availW = window.innerWidth - 40, availH = window.innerHeight - 140;
    const size = Math.floor(Math.min((availW - (cols - 1) * 10) / cols, (availH - (rows - 1) * 10) / rows / 1.25, 170));
    board.style.gridTemplateColumns = `repeat(${cols}, ${size}px)`;
    board.style.gridAutoRows = Math.round(size * 1.25) + 'px';
    board.innerHTML = deck.map((ic, i) => `<div class="card" data-i="${i}" data-ic="${ic}"><div class="in"><div class="b">✨</div><div class="f" style="font-size:${Math.round(size * 0.55)}px">${ic}</div></div></div>`).join('');
  }
  $('#memBoard').addEventListener('click', e => {
    const c = e.target.closest('.card'); if (!c || memLock || c.classList.contains('flip')) return;
    c.classList.add('flip'); Sound.sfx('flip'); memOpen.push(c);
    if (memOpen.length < 2) return;
    memLock = true;
    const [a, b] = memOpen;
    if (a.dataset.ic === b.dataset.ic) {
      setTimeout(() => {
        a.classList.add('done'); b.classList.add('done'); Sound.sfx('match'); memOpen = []; memLock = false; memDone++;
        if (memDone === memPairs) { setTimeout(() => { Sound.sfx('win'); toast('🏆✨'); setTimeout(() => startMemory(memLevel), 1800); }, 400); }
      }, 350);
    } else setTimeout(() => { a.classList.remove('flip'); b.classList.remove('flip'); memOpen = []; memLock = false; }, 900);
  });
  $('#memEasy').addEventListener('click', () => { Sound.sfx('tap'); startMemory(0); });
  $('#memHard').addEventListener('click', () => { Sound.sfx('tap'); startMemory(1); });

  /* ---------- GALERIA ---------- */
  function renderGallery() {
    const g = store.get('gallery', []);
    $('#galEmpty').style.display = g.length ? 'none' : 'block';
    $('#galGrid').innerHTML = g.map((it, i) => {
      if (it.type === 'look') return `<div class="thumb look" data-g="${i}">${D.svg(it.state)}<button class="del" data-del="${i}">🗑️</button></div>`;
      const p = Pages.PAGES.find(x => x.id === it.page); if (!p) return '';
      return `<div class="thumb" data-g="${i}">${Pages.render(p, it.fills)}<button class="del" data-del="${i}">🗑️</button></div>`;
    }).join('');
  }
  $('#galGrid').addEventListener('click', e => {
    const del = e.target.closest('[data-del]');
    const g = store.get('gallery', []);
    if (del) { g.splice(+del.dataset.del, 1); store.set('gallery', g); Sound.sfx('whoosh'); renderGallery(); return; }
    const t = e.target.closest('[data-g]'); if (!t) return;
    const it = g[+t.dataset.g]; Sound.sfx('tap');
    if (it.type === 'look') { state = Object.assign({}, D.DEFAULT, it.state); saveState(); go('show'); }
    else { const p = Pages.PAGES.find(x => x.id === it.page); if (p) openPage(p, it.fills); }
  });

  /* ---------- botão voltar do Android ---------- */
  try {
    const Cap = window.Capacitor;
    const App = Cap && (Cap.Plugins && Cap.Plugins.App || (Cap.registerPlugin && Cap.registerPlugin('App')));
    if (App && App.addListener) App.addListener('backButton', () => { if (!back()) App.exitApp(); });
    const SB = Cap && (Cap.Plugins && Cap.Plugins.StatusBar || (Cap.registerPlugin && Cap.registerPlugin('StatusBar')));
    if (SB && SB.hide) SB.hide().catch(() => {});
  } catch (e) { /* no navegador comum não há botão voltar */ }

  /* ---------- começo ---------- */
  updateMusicBtn();
  $('#home').classList.add('on');
  renderHome();
  window.addEventListener('resize', () => { if (current === 'memory') startMemory(memLevel); });
})();
