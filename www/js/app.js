/* Guerreira Maitê — lógica das telas (versão 3D) */
import { Stage3D } from './stage3d.js';

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const D = window.Doll, Sound = window.Sound, Pages = window.Pages;

/* ---------- armazenamento ---------- */
const store = {
  get(k, def) { try { const v = localStorage.getItem('gm_' + k); return v ? JSON.parse(v) : def; } catch (e) { return def; } },
  set(k, v) { try { localStorage.setItem('gm_' + k, JSON.stringify(v)); return true; } catch (e) { return false; } }
};

/* ---------- opções da boneca 3D ---------- */
const OPT = {
  model: [0, 1, 2, 3],
  hairColor: ['original', '#8a4dff', '#b88cff', '#ff70b8', '#ff3d6e', '#f4c860', '#5aa6ff', '#41d3bf', '#eeeaf7', '#2b1f33'],
  outfitColor: ['original', '#ff3d9a', '#9b5cff', '#2fbfff', '#ffd23f', '#ff7a3d', '#24d9a0', '#ffffff', '#ff5f6d', '#241a3d'],
  shine: ['nenhum', 'purpurina', 'metal', 'holo'],
  head: ['nenhum', 'tiara', 'coroa', 'fones', 'laco', 'estrelas'],
  hand: ['nenhum', 'microfone', 'bastao', 'varinha'],
  back: ['nenhum', 'asas', 'mochila'],
  stage: ['roxo', 'rosa', 'azul', 'dourado', 'noite']
};
const EMOJI = {
  shine: { nenhum: '🚫', purpurina: '✨', metal: '🪙', holo: '🌈' },
  head: { nenhum: '🚫', tiara: '👸', coroa: '👑', fones: '🎧', laco: '🎀', estrelas: '⭐' },
  hand: { nenhum: '🚫', microfone: '🎤', bastao: '💖', varinha: '🪄' },
  back: { nenhum: '🚫', asas: '🦋', mochila: '🎒' }
};
const DEFAULT = { model: 1, hairColor: 'original', outfitColor: '#ff3d9a', shine: 'purpurina', head: 'tiara', hand: 'microfone', back: 'nenhum', stage: 'roxo' };
let state = Object.assign({}, DEFAULT, store.get('look3d', {}));
const saveState = () => store.set('look3d', state);

/* ---------- palco 3D (um só, que passa de tela em tela) ---------- */
const canvas = document.createElement('canvas'); canvas.id = 'stage3d';
let stage = null;
try { stage = new Stage3D(canvas); } catch (e) { console.error(e); }
let busy = 0;
const loading = on => { busy += on ? 1 : -1; $('#loading').classList.toggle('on', busy > 0); };
async function applyLook() {
  if (!stage) return;
  const first = stage.modelIdx !== state.model;
  if (first) loading(true);
  try { await stage.setLook(state); } catch (e) { console.error(e); }
  if (first) loading(false);
}
function mountStage(el, view) { if (stage) { stage.mount(el, view); applyLook(); } }
window.addEventListener('resize', () => stage && stage.resize());

/* ---------- navegação ---------- */
const history = [];
let current = 'home';
function go(id, opts = {}) {
  if (id === current) return;
  if (!opts.noHistory) history.push(current);
  $('#' + current).classList.remove('on');
  current = id;
  $('#' + id).classList.add('on');
  enter(id, opts);
}
function back() {
  if (current === 'home') return false;
  go(history.pop() || 'home', { noHistory: true });
  return true;
}
function enter(id, o) {
  if (stage && !['home', 'dress', 'show'].includes(id)) stage.stop();
  if (id === 'home') renderHome();
  if (id === 'dress') renderDress();
  if (id === 'lr') startLR();
  if (id === 'show') startShow(o);
  if (id === 'colorList') renderPageList();
  if (id === 'memory') startMemory(memLevel);
  if (id === 'gallery') renderGallery();
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-go]'); if (b) { Sound.sfx('tap'); go(b.dataset.go); return; }
  const k = e.target.closest('[data-back]'); if (k) { Sound.sfx('tap'); back(); }
});

/* ---------- cor de fundo conforme o palco ---------- */
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
document.addEventListener('pointerdown', () => { if (unlocked) return; unlocked = true; Sound.unlock(); if (musicOn) Sound.startMusic(0); }, { capture: true });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { Sound.pause(); stage && stage.stop(); }
  else { Sound.resume(); if (stage && ['home', 'dress', 'show'].includes(current)) stage.start(); }
});

let toastT;
function toast(txt) { const t = $('#toast'); t.textContent = txt; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1100); }

/* ---------- INÍCIO ---------- */
function renderHome() {
  applyStage();
  mountStage($('#homeDoll'), { target: 0.85, height: 1.9 });
  if (stage) { stage.setMode('wave'); stage.on('touch', () => { Sound.sfx('sparkle'); stage.setMode('wave'); }); }
}

/* ---------- VESTIR ---------- */
const TABS = [
  { k: 'model', icon: '👧' }, { k: 'hairColor', icon: '💇‍♀️', color: true }, { k: 'outfitColor', icon: '👗', color: true },
  { k: 'shine', icon: '✨' }, { k: 'head', icon: '👑' }, { k: 'hand', icon: '🎤' }, { k: 'back', icon: '🦋' }, { k: 'stage', icon: '🌟', stage: true }
];
let tab = 'model';
function renderDress() {
  applyStage();
  $('#tabs').innerHTML = TABS.map(t => `<button class="tab${t.k === tab ? ' on' : ''}" data-tab="${t.k}">${t.icon}</button>`).join('');
  mountStage($('#dressStage'), { target: 0.85, height: 1.95 });
  if (stage) { stage.setMode('idle'); stage.on('touch', null); }
  renderOptions();
}
function optHtml(k, v) {
  const on = String(state[k]) === String(v) ? ' on' : '';
  if (k === 'model') return `<button class="opt${on}" data-v="${v}"><img src="img/boneca${v + 1}.png" alt=""></button>`;
  if (k === 'stage') { const s = D.STAGES[v]; return `<button class="swatch${on}" data-v="${v}" style="background:radial-gradient(circle at 50% 80%, ${s.bg[2]}, ${s.bg[1]} 55%, ${s.bg[0]})"></button>`; }
  if (k === 'hairColor' || k === 'outfitColor') {
    if (v === 'original') return `<button class="swatch orig${on}" data-v="${v}">↩️</button>`;
    return `<button class="swatch${on}" data-v="${v}" style="background:radial-gradient(circle at 35% 30%, ${D.light(v, .45)}, ${v} 55%, ${D.dark(v, .2)})"></button>`;
  }
  return `<button class="opt emoji${on}" data-v="${v}">${EMOJI[k][v]}</button>`;
}
function renderOptions() {
  const box = $('#options');
  box.innerHTML = OPT[tab].map(v => optHtml(tab, v)).join('');
  const on = box.querySelector('.on'); if (on) on.scrollIntoView({ block: 'nearest', inline: 'center' });
}
$('#tabs').addEventListener('click', e => {
  const b = e.target.closest('[data-tab]'); if (!b) return;
  Sound.sfx('tap'); tab = b.dataset.tab;
  $$('.tab').forEach(x => x.classList.toggle('on', x === b));
  renderOptions();
});
$('#options').addEventListener('click', async e => {
  const b = e.target.closest('[data-v]'); if (!b) return;
  state[tab] = tab === 'model' ? +b.dataset.v : b.dataset.v; saveState(); Sound.sfx('pick');
  $$('#options [data-v]').forEach(x => x.classList.toggle('on', x === b));
  if (tab === 'stage') applyStage();
  await applyLook();
  if (stage) stage.setMode(tab === 'hand' || tab === 'head' ? 'pose' : 'wave');
  setTimeout(() => stage && stage.mode !== 'idle' && stage.setMode('idle'), 2000);
});
function randomLook() {
  const pick = a => a[Math.floor(Math.random() * a.length)];
  Object.keys(OPT).forEach(k => state[k] = pick(OPT[k]));
}
$('#btnRandom').addEventListener('click', async () => { randomLook(); saveState(); Sound.sfx('sparkle'); applyStage(); renderOptions(); await applyLook(); stage && stage.spin(1); });
$('#btnReady').addEventListener('click', () => { Sound.sfx('sparkle'); go('show'); });

/* ---------- ESQUERDA OU DIREITA ---------- */
const LR_ROUNDS = [
  { k: 'model', icon: '👧' }, { k: 'hairColor', icon: '💇‍♀️' }, { k: 'outfitColor', icon: '👗' },
  { k: 'shine', icon: '✨' }, { k: 'head', icon: '👑' }, { k: 'hand', icon: '🎤' }, { k: 'back', icon: '🦋' }
];
let lrStep = 0, lrPair = [], lrBusy = false;
function startLR() { applyStage(); lrStep = 0; nextLR(); }
async function nextLR() {
  if (lrStep >= LR_ROUNDS.length) {
    saveState(); Sound.sfx('win');
    history.pop(); go('show', { noHistory: true, celebrate: true });
    return;
  }
  lrBusy = true;
  const r = LR_ROUNDS[lrStep];
  const pool = OPT[r.k].filter(v => v !== 'nenhum' && v !== 'original' && String(v) !== String(state[r.k]));
  pool.sort(() => Math.random() - 0.5);
  lrPair = pool.slice(0, 2);
  $('#lrIcon').textContent = r.icon;
  $('#lrDots').innerHTML = LR_ROUNDS.map((_, i) => `<i class="${i < lrStep ? 'done' : i === lrStep ? 'now' : ''}"></i>`).join('');
  ['#lrA', '#lrB'].forEach(s => { const el = $(s); el.className = 'lr-card ' + (s === '#lrA' ? 'left' : 'right'); el.innerHTML = '<div class="lr-wait">✨</div>'; });
  const imgs = [];
  if (stage) {
    loading(true);
    for (const v of lrPair) {
      try { await stage.setLook(Object.assign({}, state, { [r.k]: v })); imgs.push(stage.snapshot(300, 500)); } catch (e) { imgs.push(''); }
    }
    await stage.setLook(state).catch(() => {});
    loading(false);
  }
  ['#lrA', '#lrB'].forEach((s, i) => {
    const el = $(s);
    el.innerHTML = imgs[i] ? `<img src="${imgs[i]}" alt="">` : `<div class="lr-wait">${EMOJI[r.k] ? EMOJI[r.k][lrPair[i]] : '⭐'}</div>`;
    if (r.k === 'hairColor' || r.k === 'outfitColor') el.insertAdjacentHTML('beforeend', `<span class="lr-dot" style="background:${lrPair[i]}"></span>`);
  });
  lrBusy = false;
}
['#lrA', '#lrB'].forEach((sel, i) => $(sel).addEventListener('click', () => {
  if (lrBusy) return; lrBusy = true;
  const r = LR_ROUNDS[lrStep]; state[r.k] = lrPair[i];
  Sound.sfx('pick');
  $(sel).classList.add('win'); $(i ? '#lrA' : '#lrB').classList.add('lose');
  setTimeout(() => { lrStep++; nextLR(); }, 700);
}));

/* ---------- PALCO (gira de verdade em 3D) ---------- */
function startShow(o = {}) {
  applyStage();
  mountStage($('#showStage'), { target: 0.88, height: 2.0 });
  if (stage) {
    stage.on('touch', null);
    stage.setMode('idle');
    stage.on('spinEnd', () => { stage.setMode('dance'); setDanceBtn(); stage.on('spinEnd', null); });
    setTimeout(() => stage.spin(2), 300);
  }
  burst(o.celebrate ? 220 : 140);
  Sound.sfx('whoosh');
  startConfetti();
}
function setDanceBtn() { $$('.act').forEach(b => b.classList.remove('on')); if (stage && stage.mode === 'dance') $('#btnDance').classList.add('on'); }
$('#btnDance').addEventListener('click', () => { if (!stage) return; Sound.sfx('sparkle'); stage.setMode(stage.mode === 'dance' ? 'idle' : 'dance'); setDanceBtn(); });
$('#btnWave').addEventListener('click', () => { if (!stage) return; Sound.sfx('tap'); stage.setMode('wave'); setDanceBtn(); });
$('#btnPose').addEventListener('click', () => { if (!stage) return; Sound.sfx('sparkle'); stage.setMode('pose'); burst(60); setDanceBtn(); });
$('#btnSpin').addEventListener('click', () => { if (!stage) return; Sound.sfx('whoosh'); stage.spin(2); burst(80); });
$('#btnEdit').addEventListener('click', () => { Sound.sfx('tap'); go('dress'); });
$('#btnSaveLook').addEventListener('click', () => {
  const img = stage ? stage.snapshot(180, 300) : '';
  const g = store.get('gallery', []);
  g.unshift({ type: 'look3d', state: Object.assign({}, state), img, t: Date.now() });
  let list = g.slice(0, 30);
  while (!store.set('gallery', list) && list.length > 1) list = list.slice(0, -1);
  Sound.sfx('win'); burst(160); toast('💾⭐');
});

/* confete */
const cv = $('#confetti'), cx = cv.getContext('2d'), confetti = [];
const CCOL = ['#ff3d9a', '#ffc93c', '#6ff7ff', '#b88cff', '#ffffff', '#7ee05a'];
let confRaf = 0, confLast = 0;
function burst(n) {
  const w = cv.clientWidth || 360, h = cv.clientHeight || 640;
  for (let i = 0; i < n; i++) confetti.push({
    x: w / 2 + (Math.random() - 0.5) * w * 0.3, y: h * 0.35, vx: (Math.random() - 0.5) * 900, vy: -Math.random() * 900 - 200,
    r: 4 + Math.random() * 6, c: CCOL[i % CCOL.length], a: Math.random() * 6, va: (Math.random() - 0.5) * 12, star: Math.random() < 0.3, life: 0
  });
}
function startConfetti() { cancelAnimationFrame(confRaf); confLast = 0; confRaf = requestAnimationFrame(confLoop); }
function confLoop(ts) {
  const dt = confLast ? Math.min(0.05, (ts - confLast) / 1000) : 0; confLast = ts;
  const dpr = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
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
  if (current === 'show' || confetti.length) confRaf = requestAnimationFrame(confLoop);
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
  store.set('gallery', g.slice(0, 30)); Sound.sfx('win'); toast('💾🎨');
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
      if (memDone === memPairs) setTimeout(() => { Sound.sfx('win'); toast('🏆✨'); setTimeout(() => startMemory(memLevel), 1800); }, 400);
    }, 350);
  } else setTimeout(() => { a.classList.remove('flip'); b.classList.remove('flip'); memOpen = []; memLock = false; }, 900);
});
$('#memEasy').addEventListener('click', () => { Sound.sfx('tap'); startMemory(0); });
$('#memHard').addEventListener('click', () => { Sound.sfx('tap'); startMemory(1); });

/* ---------- GALERIA ---------- */
function renderGallery() {
  const g = store.get('gallery', []).filter(it => it.type !== 'look');
  store.set('gallery', g);
  $('#galEmpty').style.display = g.length ? 'none' : 'block';
  $('#galGrid').innerHTML = g.map((it, i) => {
    if (it.type === 'look3d') return `<div class="thumb look" data-g="${i}">${it.img ? `<img src="${it.img}" alt="">` : ''}<button class="del" data-del="${i}">🗑️</button></div>`;
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
  if (it.type === 'look3d') { state = Object.assign({}, DEFAULT, it.state); saveState(); go('show'); }
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
window.__gm = { stage, go, state: () => state };
