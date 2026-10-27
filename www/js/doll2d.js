/* Guerreira Maitê — boneca ilustrada em 2D (SVG), personagem original.
   Desenha vista de frente e de costas, em modo colorido ou só contorno (para colorir). */
(function () {
  'use strict';

  /* ---------- Catálogo ---------- */
  const OPTIONS = {
    hair: ['longo', 'rabo', 'coques', 'chanel', 'chiquinhas', 'cacheado'],
    hairColor: ['#2b1f33', '#5c3824', '#b0502e', '#f4c860', '#ff70b8', '#5aa6ff', '#41d3bf', '#b88cff', '#eeeaf7'],
    skin: ['#fde0cf', '#f5c6a5', '#e2a77f', '#c08358', '#94603c', '#62402a'],
    eyes: ['#7a4a2a', '#2a2238', '#3f86f0', '#2fa866', '#ef5aa2', '#8d5cf0', '#e3a12f'],
    outfit: ['vestido', 'jaqueta', 'pantalona', 'macacao', 'moletom', 'heroina'],
    outfitColor: ['#ff3d9a', '#9b5cff', '#2fbfff', '#ffd23f', '#ff7a3d', '#24d9a0', '#241a3d', '#ffffff', '#ff5f6d', '#b9c2d6'],
    shoes: ['botas', 'tenis', 'sapatilha', 'plataforma'],
    shoeColor: ['#ffffff', '#241a3d', '#ff3d9a', '#9b5cff', '#ffd23f', '#2fbfff', '#b9c2d6'],
    head: ['nenhum', 'tiara', 'fones', 'laco', 'coroa', 'estrelas'],
    hand: ['nenhum', 'microfone', 'bastao', 'varinha'],
    back: ['nenhum', 'asas', 'mochila', 'capa'],
    stage: ['roxo', 'rosa', 'azul', 'dourado', 'noite']
  };
  const STAGES = {
    roxo: { floor: '#6b3fd1', ring: '#ff5fd2', bg: ['#1c0838', '#5a1f9a', '#ff6fd0'] },
    rosa: { floor: '#ff4f9e', ring: '#fff07a', bg: ['#3a0628', '#b02a6e', '#ffb0d6'] },
    azul: { floor: '#2a73ff', ring: '#6ff7ff', bg: ['#050f33', '#1b4fc0', '#78dcff'] },
    dourado: { floor: '#d79a20', ring: '#fff3b0', bg: ['#1e0f04', '#7a4a0c', '#ffcf5e'] },
    noite: { floor: '#3b2f70', ring: '#b78bff', bg: ['#04020c', '#160f38', '#46368a'] }
  };
  const DEFAULT = {
    hair: 'longo', hairColor: '#2b1f33', skin: '#f5c6a5', eyes: '#7a4a2a',
    outfit: 'vestido', outfitColor: '#ff3d9a', shoes: 'botas', shoeColor: '#ffffff',
    head: 'tiara', hand: 'microfone', back: 'nenhum', stage: 'roxo'
  };

  /* ---------- Cores ---------- */
  function rgb(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function toHex(a) { return '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
  function mix(c1, c2, t) { const a = rgb(c1), b = rgb(c2); return toHex(a.map((v, i) => v + (b[i] - v) * t)); }
  const dark = (c, t) => mix(c, '#1a0f2e', t);
  const light = (c, t) => mix(c, '#ffffff', t);
  function lum(c) { const a = rgb(c); return (0.3 * a[0] + 0.59 * a[1] + 0.11 * a[2]) / 255; }
  const INK = '#3a1f47', GOLD = '#ffc93c', GOLD_D = '#d8901a';
  function accentFor(c) { if (c === '#ffd23f') return '#ffffff'; if (lum(c) > 0.82) return '#ff4fa3'; return GOLD; }

  /* ---------- Geometria ---------- */
  // "cápsula" entre dois pontos (membros)
  function capsule(x1, y1, x2, y2, r1, r2) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    const f = v => v.toFixed(1);
    return `M${f(x1 + nx * r1)} ${f(y1 + ny * r1)}L${f(x2 + nx * r2)} ${f(y2 + ny * r2)}A${f(r2)} ${f(r2)} 0 0 0 ${f(x2 - nx * r2)} ${f(y2 - ny * r2)}L${f(x1 - nx * r1)} ${f(y1 - ny * r1)}A${f(r1)} ${f(r1)} 0 0 0 ${f(x1 + nx * r1)} ${f(y1 + ny * r1)}Z`;
  }
  function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
  function starD(x, y, ro, ri, rot = 0) {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + rot + i * Math.PI / 5, r = i % 2 ? ri : ro;
      d += (i ? 'L' : 'M') + (x + Math.cos(a) * r).toFixed(1) + ' ' + (y + Math.sin(a) * r).toFixed(1);
    }
    return d + 'Z';
  }
  function heartD(x, y, s) {
    return `M${x} ${y + s * 0.9}C${x - s * 1.4} ${y - s * 0.1} ${x - s * 0.9} ${y - s * 1.1} ${x} ${y - s * 0.45}C${x + s * 0.9} ${y - s * 1.1} ${x + s * 1.4} ${y - s * 0.1} ${x} ${y + s * 0.9}Z`;
  }
  const mirrorX = d => d.replace(/([MLCQSTAmlcqsta])([^MLCQSTAZmlcqstaz]*)/g, (m, cmd, args) => {
    const n = args.trim().split(/[\s,]+/).filter(Boolean).map(Number);
    if (!n.length) return cmd;
    const rel = cmd === cmd.toLowerCase();
    if (cmd.toUpperCase() === 'A') { for (let i = 0; i < n.length; i += 7) { n[i + 4] = 1 - n[i + 4]; n[i + 5] = rel ? -n[i + 5] : 400 - n[i + 5]; } }
    else for (let i = 0; i < n.length; i += 2) n[i] = rel ? -n[i] : 400 - n[i];
    return cmd + n.map(v => +v.toFixed(1)).join(' ');
  });

  /* ---------- Poses dos braços ---------- */
  function armPose(hand, side) { // side 1 = direita do desenho (x>200)
    const P = (pts) => side === 1 ? pts : pts.map(p => [400 - p[0], p[1]]);
    if (side === 1 && hand === 'microfone') return P([[247, 290], [262, 372], [226, 318]]);
    if (side === 1 && (hand === 'bastao' || hand === 'varinha')) return P([[248, 288], [296, 246], [314, 178]]);
    if (side === -1) return P([[247, 290], [266, 368], [262, 446]]); // esquerda: mão na cintura
    return P([[248, 290], [266, 372], [276, 450]]);
  }

  /* ---------- Desenho ---------- */
  let uid = 0;
  function draw(st, o = {}) {
    const s = Object.assign({}, DEFAULT, st);
    const view = o.view || 'front', line = o.mode === 'line', fills = o.fills || {};
    const id = 'd' + (++uid) + (o.idp || '');
    const defs = [], out = [];
    const gcache = {};

    // gradiente vertical para uma cor
    function grad(c, kind = 'v', a = 0.28, b = 0.18) {
      const k = kind + c + a + b; if (gcache[k]) return gcache[k];
      const gid = id + 'g' + Object.keys(gcache).length;
      if (kind === 'v') defs.push(`<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${light(c, a)}"/><stop offset="1" stop-color="${dark(c, b)}"/></linearGradient>`);
      else if (kind === 'h') defs.push(`<linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${dark(c, b)}"/><stop offset="0.45" stop-color="${light(c, a)}"/><stop offset="1" stop-color="${dark(c, b)}"/></linearGradient>`);
      else defs.push(`<radialGradient id="${gid}" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stop-color="${light(c, a)}"/><stop offset="1" stop-color="${dark(c, b)}"/></radialGradient>`);
      return (gcache[k] = `url(#${gid})`);
    }

    // peça: região colorível. r = nome da região (para o modo colorir)
    function P(d, color, r, ex = {}) {
      if (line) {
        const f = r && fills[r] ? fills[r] : (ex.lineFill || '#ffffff');
        const sw = ex.sw != null ? ex.sw * 1.15 : 3;
        return out.push(`<path d="${d}" fill="${ex.noFill ? 'none' : f}" stroke="#2b2233" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"${r ? ` data-r="${r}"` : ''}/>`);
      }
      const fill = ex.flat ? color : grad(color, ex.g || 'v', ex.ga, ex.gb);
      out.push(`<path d="${d}" fill="${ex.noFill ? 'none' : fill}" stroke="${ex.stroke || INK}" stroke-width="${ex.sw != null ? ex.sw : 2.4}" stroke-linejoin="round" stroke-linecap="round"${ex.op ? ` opacity="${ex.op}"` : ''}${ex.cls ? ` class="${ex.cls}"` : ''}/>`);
    }
    // detalhe só no modo colorido (sombras, brilhos)
    function D(d, fill, op = 1, ex = '') { if (!line) out.push(`<path d="${d}" fill="${fill}" opacity="${op}" ${ex}/>`); }
    // linha de detalhe (aparece nos dois modos)
    function L(d, color, w = 2, op = 1) { out.push(`<path d="${d}" fill="none" stroke="${line ? '#2b2233' : color}" stroke-width="${line ? Math.max(2, w) : w}" stroke-linecap="round" stroke-linejoin="round" opacity="${line ? 1 : op}"/>`); }
    function raw(svg) { out.push(svg); }
    const begin = (t = '') => out.push(`<g${t}>`), end = () => out.push('</g>');

    const skin = s.skin, skinS = dark(skin, 0.22), hairC = s.hairColor;
    const oc = s.outfitColor, acc = accentFor(oc);
    const back = view === 'back';
    const armR = armPose(s.hand, 1), armL = armPose(s.hand, -1);

    if (!line) {
      defs.push(`<pattern id="${id}sp" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="4" cy="5" r="1.6" fill="#fff"/><circle cx="17" cy="14" r="1.1" fill="#fff"/><path d="${starD(9, 21, 2.6, 1)}" fill="#fff"/><circle cx="22" cy="3" r="0.9" fill="#fff"/></pattern>`);
      defs.push(`<radialGradient id="${id}glow"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="0.4" stop-color="#fff6a8" stop-opacity="0.8"/><stop offset="1" stop-color="#ff7ad9" stop-opacity="0"/></radialGradient>`);
    }
    const SPARK = `url(#${id}sp)`;
    const sparkle = (d, op = 0.55) => D(d, SPARK, op);

    /* ===== Camada 1: atrás de tudo ===== */
    if (!back) drawBackItem(true);
    drawHairBack();

    /* ===== Corpo ===== */
    if (back && s.hand === 'microfone') drawArm(armR, 1);
    drawLegs();
    drawTorso();
    drawOutfitLower();
    drawShoes();
    drawOutfitUpper();
    if (back) drawHairBack(true);
    drawArm(armL, -1);
    if (!(back && s.hand === 'microfone')) drawArm(armR, 1);
    drawHead();
    if (back) drawBackItem(false);

    /* ---------------- partes ---------------- */
    function drawLegs() {
      const legL = 'M160 430C155 515 163 595 169 650C172 690 175 722 177 742L195 742C195 704 196 664 197 624C199 562 201 500 201 440Z';
      P(legL, skin, 'perna-e', { g: 'h', ga: 0.15, gb: 0.12 });
      P(mirrorX(legL), skin, 'perna-d', { g: 'h', ga: 0.15, gb: 0.12 });
      L('M171 600Q178 606 186 602', skinS, 1.6, 0.6); L(mirrorX('M171 600Q178 606 186 602'), skinS, 1.6, 0.6);
    }
    function drawTorso() {
      P('M186 234L186 272Q200 280 214 272L214 234Z', skin, 'pescoco');
      D('M186 238Q200 258 214 238L214 254Q200 266 186 254Z', skinS, 0.55);
      P('M200 262C225 262 247 268 252 284C252 304 238 330 233 360C231 381 236 405 242 434L158 434C164 405 169 381 167 360C162 330 148 304 148 284C153 268 175 262 200 262Z', skin, 'corpo', { g: 'h', ga: 0.12, gb: 0.1 });
      L('M178 282Q190 288 196 286M204 286Q210 288 222 282', skinS, 1.4, 0.5);
    }
    function drawOutfitLower() {
      const c = oc;
      switch (s.outfit) {
        case 'vestido': {
          const sk = 'M166 362L234 362C252 420 276 482 294 552Q278 568 263 556Q248 572 232 559Q216 574 200 561Q184 574 168 559Q152 572 137 556Q122 568 106 552C124 482 148 420 166 362Z';
          P('M118 548Q126 574 140 566Q154 580 168 568Q184 584 200 570Q216 584 232 568Q246 580 260 566Q274 574 282 548Z', light(c, 0.65), 'anagua');
          P(sk, c, 'saia');
          sparkle(sk, 0.6);
          L('M185 372Q170 460 150 552M215 372Q230 460 250 552M200 380L200 560', dark(c, 0.3), 1.6, 0.45);
          P('M164 356L236 356L237 372L163 372Z', acc, 'cinto', { ga: 0.3, gb: 0.25 });
          P(heartD(200, 365, 7), light(acc, 0.2), 'fivela', { sw: 1.6 });
          break;
        }
        case 'jaqueta': {
          const sk = 'M164 362L236 362L262 474L138 474Z';
          P(sk, '#2a1f44', 'saia', { ga: 0.18 });
          L('M176 364L166 474M188 364L184 474M200 364L200 474M212 364L216 474M224 364L234 474', '#5a4a80', 1.8, 0.8);
          P('M162 354L238 354L238 368L162 368Z', acc, 'cinto', { ga: 0.3 });
          break;
        }
        case 'pantalona': case 'macacao': {
          const pants = 'M164 360L236 360C242 392 245 418 246 440C254 560 264 650 270 736L206 736C204 640 203 540 200 474C197 540 196 640 194 736L130 736C136 650 146 560 154 440C155 418 158 392 164 360Z';
          P(pants, c, 'calca', { g: 'h', ga: 0.25, gb: 0.15 });
          if (s.outfit === 'macacao') sparkle(pants, 0.55);
          L('M178 470Q176 600 166 728M222 470Q224 600 234 728', dark(c, 0.3), 1.6, 0.4);
          P('M162 354L238 354L239 370L161 370Z', acc, 'cinto', { ga: 0.3 });
          if (!back) P(starD(200, 362, 10, 4.5), light(acc, 0.1), 'fivela', { sw: 1.5 });
          break;
        }
        case 'moletom':
          P('M158 430L242 430L246 486L206 492L200 478L194 492L154 486Z', '#3a6fe0', 'short');
          break;
        case 'heroina': {
          P('M160 362L240 362L276 470Q200 492 124 470Z', acc === GOLD ? '#2a1f52' : '#ffffff', 'saia2');
          const sk = 'M164 362L236 362L262 448Q246 460 232 450Q216 464 200 452Q184 464 168 450Q154 460 138 448Z';
          P(sk, c, 'saia'); sparkle(sk, 0.35);
          P('M163 352L237 352L238 370L162 370Z', GOLD, 'cinto', { ga: 0.4, gb: 0.25 });
          if (!back) P(starD(200, 361, 11, 5), '#ffffff', 'fivela', { sw: 1.5 });
          break;
        }
      }
    }
    function drawOutfitUpper() {
      const c = oc;
      switch (s.outfit) {
        case 'vestido': {
          const top = back ? 'M149 286C153 270 176 266 200 268C224 266 247 270 251 286C251 304 238 332 233 360L233 364L167 364L167 360C162 332 149 304 149 286Z'
            : 'M149 288C152 276 166 272 178 274Q200 294 222 274C234 272 248 276 251 288C251 306 238 332 233 360L233 364L167 364L167 360C162 332 149 306 149 288Z';
          P(top, c, 'blusa'); sparkle(top, 0.6);
          if (!back) P(starD(200, 316, 12, 5.2), GOLD, 'broche', { ga: 0.4, gb: 0.2, sw: 1.6 });
          else P('M186 300Q174 286 180 280Q190 278 200 296Q210 278 220 280Q226 286 214 300Q200 304 186 300Z', acc, 'laco-costas');
          break;
        }
        case 'jaqueta': {
          P('M160 300Q200 312 240 300L236 352L164 352Z', '#ffffff', 'camiseta');
          if (!back) P(heartD(200, 326, 8), c, 'estampa', { sw: 1.4 });
          const jl = 'M148 288C152 272 170 266 186 270L194 330L182 356L160 356C156 330 148 306 148 288Z';
          const jk = back ? 'M148 288C152 272 176 264 200 266C224 264 248 272 252 288C252 306 244 330 240 356L160 356C156 330 148 306 148 288Z' : null;
          if (back) P(jk, c, 'jaqueta');
          else { P(jl, c, 'jaqueta-e'); P(mirrorX(jl), c, 'jaqueta-d'); P('M186 270L176 284L190 300L194 330Z', light(c, 0.25), 'lapela-e', { sw: 1.8 }); P(mirrorX('M186 270L176 284L190 300L194 330Z'), light(c, 0.25), 'lapela-d', { sw: 1.8 }); }
          if (!back) { raw(line ? '' : `<circle cx="178" cy="340" r="3" fill="${acc}" stroke="${INK}" stroke-width="1.2"/>`); }
          break;
        }
        case 'pantalona': {
          const top = 'M149 288C152 276 168 272 180 274Q200 288 220 274C232 272 248 276 251 288C251 302 242 322 238 338Q200 348 162 338C158 322 149 302 149 288Z';
          P(back ? top.replace('Q200 288 220 274', 'Q200 270 220 274') : top, c, 'top');
          if (!back) P(heartD(200, 312, 9), acc, 'coracao', { ga: 0.35, sw: 1.5 });
          L('M162 334Q200 344 238 334', dark(c, 0.3), 1.5, 0.6);
          break;
        }
        case 'macacao': {
          const top = back ? 'M149 286C153 270 176 266 200 268C224 266 247 270 251 286C251 306 238 332 233 360L167 360C162 332 149 306 149 286Z'
            : 'M149 288C152 274 168 270 182 272L200 312L218 272C232 270 248 274 251 288C251 306 238 332 233 360L167 360C162 332 149 306 149 288Z';
          P(top, c, 'blusa'); sparkle(top, 0.6);
          if (!back) L('M182 272L200 312L218 272', GOLD, 2.6, 1);
          break;
        }
        case 'moletom': {
          const h = 'M142 292C146 272 172 264 200 268C228 264 254 272 258 292C262 360 266 420 268 470Q200 486 132 470C134 420 138 360 142 292Z';
          P(h, c, 'moletom');
          if (!back) {
            P('M172 404Q200 398 228 404L232 446Q200 452 168 446Z', dark(c, 0.12), 'bolso', { sw: 2 });
            L('M190 276L188 316M210 276L212 316', light(c, 0.6), 2.2);
            P(heartD(200, 356, 13), acc, 'estampa', { ga: 0.35, sw: 1.8 });
          } else P('M160 270Q200 236 240 270Q236 312 200 318Q164 312 160 270Z', dark(c, 0.08), 'capuz');
          L('M134 462Q200 478 266 462', dark(c, 0.3), 1.8, 0.6);
          break;
        }
        case 'heroina': {
          const top = 'M150 290C153 278 168 274 180 276Q200 286 220 276C232 274 247 278 250 290C250 306 238 330 234 352L166 352C162 330 150 306 150 290Z';
          P(top, c, 'corpete'); sparkle(top, 0.35);
          L('M152 296Q176 288 186 290M248 296Q224 288 214 290', GOLD, 3, 1);
          if (!back) { P(starD(200, 316, 16, 7), GOLD, 'emblema', { ga: 0.45, gb: 0.25, sw: 1.8 }); L('M190 334L210 342M210 334L190 342', GOLD, 2, 1); }
          break;
        }
      }
    }
    function sleeveSpec() {
      switch (s.outfit) {
        case 'vestido': return { puff: true };
        case 'jaqueta': return { upper: 1, lower: 0.8, r: 4, cuff: light(oc, 0.35) };
        case 'macacao': return { upper: 0.45, r: 3 };
        case 'moletom': return { upper: 1, lower: 1, r: 7, cuff: dark(oc, 0.12) };
        case 'heroina': return { cuff2: GOLD };
        case 'pantalona': return { upper: 0.25, r: 3 };
      }
      return {};
    }
    function drawArm(pts, side) {
      const [sh, el, wr] = pts, sp = sleeveSpec(), c = oc;
      const segs = [capsule(sh[0], sh[1], el[0], el[1], 13, 10.5), capsule(el[0], el[1], wr[0], wr[1], 10.5, 8.5)];
      const hand = handD(wr, el, side);
      begin(` data-arm="${side}"`);
      // contorno + preenchimento (une as partes sem costura)
      if (line) {
        out.push(`<path d="${segs.join('')}${hand}" fill="${fills['braco' + side] || '#fff'}" stroke="#2b2233" stroke-width="5.5" stroke-linejoin="round" data-r="braco${side}"/>`);
        out.push(`<path d="${segs.join('')}${hand}" fill="${fills['braco' + side] || '#fff'}" data-r="braco${side}"/>`);
      } else {
        out.push(`<path d="${segs.join('')}${hand}" fill="${skin}" stroke="${INK}" stroke-width="4.8" stroke-linejoin="round"/>`);
        out.push(`<path d="${segs.join('')}${hand}" fill="${grad(skin, 'h', 0.12, 0.1)}"/>`);
      }
      if (sp.puff) {
        const cx = sh[0] + side * 2, cy = sh[1] + 2;
        P(`M${cx - 20} ${cy}C${cx - 22} ${cy - 22} ${cx + 22} ${cy - 22} ${cx + 20} ${cy}C${cx + 22} ${cy + 18} ${cx - 22} ${cy + 18} ${cx - 20} ${cy}Z`, c, 'manga' + side);
        L(`M${cx - 8} ${cy - 12}Q${cx - 4} ${cy} ${cx - 8} ${cy + 10}M${cx + 6} ${cy - 13}Q${cx + 10} ${cy} ${cx + 6} ${cy + 11}`, dark(c, 0.3), 1.4, 0.5);
      }
      if (sp.upper) {
        const e2 = lerp(sh, el, sp.upper);
        let d = capsule(sh[0], sh[1], e2[0], e2[1], 13 + sp.r, 10.5 + sp.r);
        if (sp.lower) { const w2 = lerp(el, wr, sp.lower); d += capsule(el[0], el[1], w2[0], w2[1], 10.5 + sp.r, 8.5 + sp.r); }
        if (line) { out.push(`<path d="${d}" fill="${fills['manga' + side] || '#fff'}" stroke="#2b2233" stroke-width="5.5" data-r="manga${side}"/><path d="${d}" fill="${fills['manga' + side] || '#fff'}" data-r="manga${side}"/>`); }
        else { out.push(`<path d="${d}" fill="${c}" stroke="${INK}" stroke-width="4.8" stroke-linejoin="round"/><path d="${d}" fill="${grad(c, 'h', 0.25, 0.15)}"/>`); }
        if (sp.cuff && sp.lower) {
          const w2 = lerp(el, wr, sp.lower), w1 = lerp(el, wr, sp.lower - 0.14);
          P(capsule(w1[0], w1[1], w2[0], w2[1], 8.5 + sp.r, 8.5 + sp.r), sp.cuff, 'punho' + side, { sw: 2 });
        }
      }
      if (sp.cuff2) { const w1 = lerp(el, wr, 0.55), w2 = lerp(el, wr, 0.85); P(capsule(w1[0], w1[1], w2[0], w2[1], 11, 10), sp.cuff2, 'bracelete' + side, { ga: 0.45, gb: 0.25, sw: 2 }); }
      if (side === 1 && !back) drawHandItem(wr, el);
      if (side === 1 && back) drawHandItem(wr, el);
      end();
    }
    function handD(wr, el, side) {
      const dx = wr[0] - el[0], dy = wr[1] - el[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
      const cx = wr[0] + ux * 9, cy = wr[1] + uy * 9;
      const a = Math.atan2(uy, ux) * 180 / Math.PI - 90;
      // mão: forma oval com polegar
      const rot = (x, y) => { const r = a * Math.PI / 180; return [(cx + x * Math.cos(r) - y * Math.sin(r)).toFixed(1), (cy + x * Math.sin(r) + y * Math.cos(r)).toFixed(1)]; };
      const p = [[-9, -6], [-10, 6], [-6, 15], [3, 16], [9, 9], [12, 2], [9, -6]].map(q => rot(q[0] * (side === 1 ? 1 : -1), q[1]));
      return `M${p[0]}C${p[1]} ${p[2]} ${p[3]}C${p[4]} ${p[5]} ${p[6]}Z`.replace(/,/g, ' ');
    }
    function drawHandItem(wr, el) {
      const dx = wr[0] - el[0], dy = wr[1] - el[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
      const hx = wr[0] + ux * 10, hy = wr[1] + uy * 10;
      switch (s.hand) {
        case 'microfone': {
          begin(` transform="rotate(-18 ${hx} ${hy})"`);
          P(`M${hx - 6} ${hy + 30}L${hx - 8} ${hy - 6}L${hx + 8} ${hy - 6}L${hx + 6} ${hy + 30}Q${hx} ${hy + 34} ${hx - 6} ${hy + 30}Z`, '#3a2d5c', 'mic-cabo');
          P(`M${hx - 10} ${hy - 8}L${hx + 10} ${hy - 8}L${hx + 9} ${hy - 2}L${hx - 9} ${hy - 2}Z`, '#ff4fa3', 'mic-anel', { sw: 1.6 });
          P(`M${hx - 15} ${hy - 24}A15 15 0 1 1 ${hx + 15} ${hy - 24}A15 15 0 1 1 ${hx - 15} ${hy - 24}Z`, '#e4e6f2', 'mic-cabeca', { g: 'r', ga: 0.6, gb: 0.25 });
          L(`M${hx - 13} ${hy - 30}L${hx + 13} ${hy - 30}M${hx - 14} ${hy - 22}L${hx + 14} ${hy - 22}M${hx - 6} ${hy - 37}L${hx - 6} ${hy - 11}M${hx + 6} ${hy - 37}L${hx + 6} ${hy - 11}`, '#9aa0c0', 1, 0.8);
          D(`M${hx - 8} ${hy - 32}A5 4 0 1 1 ${hx - 4} ${hy - 30}Z`, '#fff', 0.9);
          end();
          break;
        }
        case 'bastao': {
          if (!line) raw(`<circle cx="${hx}" cy="${hy - 44}" r="34" fill="url(#${id}glow)" class="pulse"/>`);
          P(`M${hx - 5} ${hy + 18}L${hx - 5} ${hy - 26}L${hx + 5} ${hy - 26}L${hx + 5} ${hy + 18}Q${hx} ${hy + 22} ${hx - 5} ${hy + 18}Z`, '#ffffff', 'bastao-cabo');
          P(heartD(hx, hy - 46, 18), '#ff6fd0', 'bastao-luz', { g: 'r', ga: 0.6, gb: 0.1 });
          D(starD(hx, hy - 47, 9, 4), '#fff8b0', 0.95);
          break;
        }
        case 'varinha': {
          P(`M${hx - 3.5} ${hy + 16}L${hx - 3.5} ${hy - 40}L${hx + 3.5} ${hy - 40}L${hx + 3.5} ${hy + 16}Z`, GOLD, 'varinha', { ga: 0.4 });
          if (!line) raw(`<circle cx="${hx}" cy="${hy - 56}" r="30" fill="url(#${id}glow)" class="pulse"/>`);
          P(starD(hx, hy - 56, 22, 10), '#ffe24a', 'estrela', { g: 'r', ga: 0.6, gb: 0.15 });
          D(starD(hx - 3, hy - 59, 7, 3), '#fff', 0.9);
          break;
        }
      }
    }
    function drawShoes() {
      const c = s.shoeColor;
      for (const side of [-1, 1]) {
        const m = side === 1 ? mirrorX : (d) => d, r = side === 1 ? 'd' : 'e';
        switch (s.shoes) {
          case 'botas':
            P(m('M164 612C163 650 168 700 170 736C164 742 162 756 172 760L200 760C204 752 200 744 197 738C197 700 198 650 200 612Z'), c, 'bota-' + r, { g: 'h', ga: 0.35, gb: 0.2 });
            P(m('M162 604L201 604L201 622L163 622Z'), acc === GOLD ? '#ff7ac8' : GOLD, 'borda-' + r, { sw: 2 });
            if (!back) P(m(heartD(181, 640, 6)).replace(/NaN/g, '0'), '#ff7ac8', 'enfeite-' + r, { sw: 1.4 });
            break;
          case 'tenis':
            P(m('M172 728C168 740 164 750 168 758L204 760C208 752 204 740 198 728Z'), c, 'tenis-' + r);
            P(m('M166 754L206 756L206 766L166 764Z'), '#ffffff', 'sola-' + r, { sw: 2 });
            if (!back) L(m('M176 736L194 738M175 744L196 745'), dark(c, 0.4), 1.6, 0.8);
            break;
          case 'sapatilha':
            P(m('M174 734C168 744 166 754 172 760L200 760C204 752 200 742 196 734Q186 740 174 734Z'), c, 'sapatilha-' + r);
            if (!back) { P(m('M178 740L186 745L178 750Z'), '#ff7ac8', 'laco-' + r, { sw: 1.2 }); P(m('M194 740L186 745L194 750Z'), '#ff7ac8', 'laco2-' + r, { sw: 1.2 }); }
            break;
          case 'plataforma':
            P(m('M174 730C168 742 168 750 172 752L200 752C204 746 200 738 196 730Z'), c, 'salto-' + r);
            P(m('M170 750L203 750L204 768L169 768Z'), '#ffffff', 'plat-' + r, { sw: 2 });
            P(m('M176 712L196 712L196 720L176 720Z'), c, 'tira-' + r, { sw: 1.6 });
            break;
        }
      }
    }

    /* ---------- Cabelo ---------- */
    function hairShade() { return { base: hairC, dk: dark(hairC, 0.32), hl: light(hairC, 0.45) }; }
    function drawHairBack(over) {
      // over = vista de costas, desenhado por cima do corpo
      const h = hairShade();
      if (back && !over) return;
      const HP = (d, r) => P(d, h.base, r, { ga: 0.22, gb: 0.22 });
      switch (s.hair) {
        case 'longo': {
          const d = 'M124 150C108 50 292 50 276 150C288 240 298 340 300 446Q290 470 276 458Q268 486 252 470Q240 492 228 474Q214 494 200 476Q186 494 172 474Q160 492 148 470Q132 486 124 458Q110 470 100 446C102 340 112 240 126 150Z';
          HP(d, 'cabelo-tras');
          L('M150 250Q146 360 140 452M176 260Q174 370 176 470M224 260Q226 370 224 470M250 250Q254 360 260 452', h.dk, 1.8, 0.5);
          break;
        }
        case 'rabo': {
          begin(' class="sway"');
          const d = 'M248 90C300 70 336 110 330 190C326 260 340 330 322 400Q314 430 296 438Q306 400 300 360C296 300 300 240 286 190C278 160 262 130 248 120Z';
          HP(d, 'rabo');
          L('M270 110Q312 150 310 240Q312 320 306 400M290 120Q324 200 320 300', h.dk, 1.8, 0.55);
          end();
          if (!back) HP('M128 160C120 210 124 240 132 262L148 250Q140 210 142 170Z', 'cabelo-tras');
          break;
        }
        case 'coques':
          HP('M128 150C118 210 126 250 140 268Q200 286 260 268C274 250 282 210 272 150Z', 'cabelo-tras');
          break;
        case 'chanel':
          HP('M122 150C108 50 292 50 278 150C282 196 284 236 290 262Q274 276 260 266Q248 280 236 268L164 268Q152 280 140 266Q126 276 110 262C116 236 118 196 124 150Z', 'cabelo-tras');
          break;
        case 'chiquinhas': {
          HP('M128 150C118 210 126 250 140 268Q200 286 260 268C274 250 282 210 272 150Z', 'cabelo-tras');
          begin(' class="sway"');
          for (const side of [-1, 1]) {
            const d = 'M122 132C86 140 74 200 82 260C88 320 74 370 90 420Q98 436 112 430Q100 390 108 340C114 290 124 230 118 190C116 170 124 150 130 142Z';
            HP(side === 1 ? mirrorX(d) : d, 'chiquinha-' + side);
            const l = 'M104 160Q90 240 96 320Q94 380 100 420';
            L(side === 1 ? mirrorX(l) : l, h.dk, 1.8, 0.55);
          }
          end();
          break;
        }
        case 'cacheado': {
          const N = 30, cl = [];
          for (let i = 0; i < N; i++) {
            const t = i / N * Math.PI * 2;
            cl.push([200 + Math.cos(t) * 122, 196 + Math.sin(t) * 140]);
          }
          let d = `M${cl[0][0].toFixed(1)} ${cl[0][1].toFixed(1)}`;
          for (let i = 0; i < N; i++) {
            const p0 = cl[i], q = cl[(i + 1) % N];
            const mx = (p0[0] + q[0]) / 2, my = (p0[1] + q[1]) / 2, ox = mx - 200, oy = my - 196, l = Math.hypot(ox, oy);
            d += `Q${(mx + ox / l * 20).toFixed(1)} ${(my + oy / l * 20).toFixed(1)} ${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
          }
          HP(d + 'Z', 'cachos');
          for (let i = 0; i < 18; i++) {
            const t = i / 18 * Math.PI * 2, x = 200 + Math.cos(t) * 100, y = 196 + Math.sin(t) * 116;
            L(`M${(x - 9).toFixed(1)} ${y.toFixed(1)}q9 -11 18 0`, h.dk, 1.6, 0.5);
          }
          break;
        }
      }
    }
    function drawHead() {
      const h = hairShade();
      begin(' class="head"');
      // orelhas
      P('M130 178C118 172 116 196 132 202Z', skin, 'orelha-e', { sw: 2 });
      P(mirrorX('M130 178C118 172 116 196 132 202Z'), skin, 'orelha-d', { sw: 2 });
      // rosto
      P('M128 158C128 100 164 78 200 78C236 78 272 100 272 158C272 204 248 236 200 248C152 236 128 204 128 158Z', skin, 'rosto', { g: 'r', ga: 0.18, gb: 0.08 });
      if (!back) drawFace();
      drawHairFront(h);
      drawHeadItem();
      end();
    }
    function drawFace() {
      const eye = (d) => d; // olho direito (x>200); o esquerdo é espelhado
      const ex = 232, ey = 182;
      const parts = [];
      const sclera = `M${ex - 22} ${ey - 2}C${ex - 20} ${ey - 26} ${ex + 18} ${ey - 30} ${ex + 24} ${ey - 8}C${ex + 26} ${ey + 14} ${ex + 14} ${ey + 26} ${ex - 2} ${ey + 26}C${ex - 18} ${ey + 24} ${ex - 24} ${ey + 12} ${ex - 22} ${ey - 2}Z`;
      const lash = `M${ex - 27} ${ey}C${ex - 24} ${ey - 30} ${ex + 20} ${ey - 36} ${ex + 31} ${ey - 13}L${ex + 37} ${ey - 19}C${ex + 34} ${ey - 9} ${ex + 31} ${ey - 5} ${ex + 27} ${ey - 4}C${ex + 18} ${ey - 26} ${ex - 16} ${ey - 24} ${ex - 23} ${ey + 3}Z`;
      const brow = `M${ex - 16} ${ey - 40}Q${ex + 2} ${ey - 50} ${ex + 22} ${ey - 40}`;
      for (const side of [1, -1]) {
        const m = side === 1 ? eye : mirrorX;
        if (line) {
          out.push(`<path d="${m(sclera)}" fill="#fff" stroke="#2b2233" stroke-width="2.4"/>`);
          out.push(`<ellipse cx="${side === 1 ? ex + 2 : 398 - ex}" cy="${ey + 3}" rx="15" ry="20" fill="${fills['olho' + side] || '#fff'}" stroke="#2b2233" stroke-width="2.4" data-r="olho${side}"/>`);
          out.push(`<ellipse cx="${side === 1 ? ex + 2 : 398 - ex}" cy="${ey + 4}" rx="7" ry="10" fill="#2b2233"/>`);
          out.push(`<circle cx="${side === 1 ? ex - 4 : 404 - ex}" cy="${ey - 6}" r="5" fill="#fff"/>`);
          out.push(`<path d="${m(lash)}" fill="#2b2233"/>`);
          out.push(`<path d="${m(brow)}" fill="none" stroke="#2b2233" stroke-width="2.6" stroke-linecap="round"/>`);
          continue;
        }
        const cx = side === 1 ? ex + 2 : 398 - ex;
        const gid = id + 'iris';
        if (side === 1) defs.push(`<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${dark(s.eyes, 0.75)}"/><stop offset="0.5" stop-color="${s.eyes}"/><stop offset="1" stop-color="${light(s.eyes, 0.7)}"/></linearGradient>`);
        parts.push(`<g class="eye">`);
        parts.push(`<path d="${m(sclera)}" fill="#fff"/>`);
        parts.push(`<ellipse cx="${cx}" cy="${ey + 3}" rx="16" ry="21" fill="url(#${gid})"/>`);
        parts.push(`<ellipse cx="${cx}" cy="${ey + 1}" rx="16" ry="21" fill="none" stroke="${dark(s.eyes, 0.6)}" stroke-width="1.5"/>`);
        parts.push(`<ellipse cx="${cx}" cy="${ey + 4}" rx="7.5" ry="10.5" fill="${dark(s.eyes, 0.85)}"/>`);
        parts.push(`<path d="${m(`M${ex - 20} ${ey - 4}C${ex - 10} ${ey - 16} ${ex + 14} ${ey - 18} ${ex + 22} ${ey - 4}C${ex + 10} ${ey - 10} ${ex - 8} ${ey - 10} ${ex - 20} ${ey - 4}Z`)}" fill="#3a1f47" opacity="0.25"/>`);
        parts.push(`<ellipse cx="${cx - side * 6}" cy="${ey - 7}" rx="6.5" ry="7.5" fill="#fff"/>`);
        parts.push(`<circle cx="${cx + side * 7}" cy="${ey + 12}" r="3.2" fill="#fff"/>`);
        parts.push(`<path d="${starD(cx + side * 7, ey - 4, 4, 1.6)}" fill="#fff" opacity="0.9"/>`);
        parts.push(`<path d="${m(lash)}" fill="#2a1630"/>`);
        parts.push(`<path d="${m(`M${ex - 6} ${ey + 28}Q${ex + 6} ${ey + 30} ${ex + 14} ${ey + 25}`)}" fill="none" stroke="#2a1630" stroke-width="1.6" stroke-linecap="round" opacity="0.6"/>`);
        parts.push(`</g>`);
        parts.push(`<path d="${m(brow)}" fill="none" stroke="${dark(hairC, 0.2)}" stroke-width="3" stroke-linecap="round"/>`);
        // bochecha
        parts.push(`<ellipse cx="${side === 1 ? 246 : 154}" cy="${212}" rx="17" ry="9" fill="#ff5c95" opacity="0.32"/>`);
        parts.push(`<path d="${m('M240 208l-3 7M247 208l-3 7M254 208l-3 7')}" stroke="#ff5c95" stroke-width="1.4" stroke-linecap="round" opacity="0.55"/>`);
      }
      if (line) {
        L('M199 206q3 4 -1 6', '#2b2233', 2);
        L('M188 222Q200 236 212 222', '#2b2233', 2.6);
        return;
      }
      out.push(...parts);
      out.push(`<path d="M199 205q3.5 4 -1 6.5" fill="none" stroke="${dark(skin, 0.35)}" stroke-width="1.8" stroke-linecap="round"/>`);
      out.push(`<path d="M188 222Q200 238 212 222Q200 227 188 222Z" fill="#c9375f" stroke="#7a1f3a" stroke-width="1.6" stroke-linejoin="round"/>`);
      out.push(`<path d="M194 228Q200 233 206 228Q200 226 194 228Z" fill="#ff8fae"/>`);
      out.push(`<path d="${starD(262, 232, 6, 2.4)}" fill="#ffd84a"/>`);
    }
    function drawHairFront(h) {
      const HP = (d, r) => P(d, h.base, r, { ga: 0.22, gb: 0.22 });
      if (back) {
        // costas da cabeça coberta pelo cabelo
        let d = 'M122 158C112 40 288 40 278 158C280 198 266 232 236 250Q200 262 164 250C134 232 120 198 124 158Z';
        if (s.hair === 'chanel') d = 'M120 158C110 40 290 40 280 158C282 200 286 236 290 262Q274 276 260 266Q248 280 236 268L164 268Q152 280 140 266Q126 276 110 262C116 236 118 200 122 158Z';
        if (s.hair === 'longo') d = 'M122 158C112 40 288 40 278 158C288 240 298 340 300 446Q290 470 276 458Q268 486 252 470Q240 492 228 474Q214 494 200 476Q186 494 172 474Q160 492 148 470Q132 486 124 458Q110 470 100 446C102 340 112 240 124 158Z';
        HP(d, 'cabelo-costas');
        L('M200 80Q196 140 200 250M160 96Q150 160 158 240M240 96Q250 160 242 240', h.dk, 1.8, 0.5);
        shine(h, true);
        if (s.hair === 'coques') drawBuns(h);
        if (s.hair === 'rabo') { P('M240 100A14 14 0 1 1 262 112Z', '#ff6fb8', 'prendedor'); }
        return;
      }
      // franja e mechas da frente
      const caps = {
        base: 'M120 168C106 80 154 46 200 46C246 46 294 80 280 168C274 150 268 134 262 124C262 146 256 160 248 168C248 144 240 122 230 110C226 134 216 150 202 158C210 136 208 118 202 106C190 128 174 144 158 152C164 134 166 118 166 108C150 120 140 140 136 172C132 168 126 168 122 168Z',
        reta: 'M116 176C102 80 154 46 200 46C246 46 298 80 284 176C278 166 272 150 268 138Q262 150 254 140Q246 152 238 140Q230 152 222 140Q214 152 206 140Q200 152 194 140Q186 152 178 140Q170 152 162 140Q154 152 146 140Q138 150 132 138C128 150 122 166 116 176Z'
      };
      const bang = s.hair === 'chanel' ? caps.reta : caps.base;
      // mechas laterais que caem na frente dos ombros
      if (s.hair === 'longo') {
        HP('M128 150C116 210 118 280 112 330Q124 342 136 332C140 280 144 220 146 170Z', 'mecha-e');
        HP(mirrorX('M128 150C116 210 118 280 112 330Q124 342 136 332C140 280 144 220 146 170Z'), 'mecha-d');
      }
      if (s.hair === 'cacheado') {
        HP('M126 150C110 190 112 240 124 268Q136 276 146 262C136 230 140 190 146 168Z', 'mecha-e');
        HP(mirrorX('M126 150C110 190 112 240 124 268Q136 276 146 262C136 230 140 190 146 168Z'), 'mecha-d');
      }
      if (s.hair === 'chanel') {
        HP('M124 150C116 200 116 240 112 262Q126 274 140 264C142 230 144 190 146 166Z', 'mecha-e');
        HP(mirrorX('M124 150C116 200 116 240 112 262Q126 274 140 264C142 230 144 190 146 166Z'), 'mecha-d');
      }
      if (s.hair === 'rabo' || s.hair === 'chiquinhas' || s.hair === 'coques') {
        HP('M128 152C120 190 124 222 128 238Q136 244 142 234C138 210 140 180 146 166Z', 'mecha-e');
        HP(mirrorX('M128 152C120 190 124 222 128 238Q136 244 142 234C138 210 140 180 146 166Z'), 'mecha-d');
      }
      HP(bang, 'franja');
      if (s.hair !== 'chanel') L('M200 62Q196 90 202 106M170 70Q158 96 166 108M232 70Q244 96 230 110', h.dk, 1.6, 0.55);
      shine(h, false);
      if (s.hair === 'coques') drawBuns(h);
      if (s.hair === 'rabo') P('M244 86A12 12 0 1 1 262 100Z', '#ff6fb8', 'prendedor');
      if (s.hair === 'chiquinhas') { P('M114 140A10 10 0 1 1 130 152Z', '#ff6fb8', 'prendedor-e'); P(mirrorX('M114 140A10 10 0 1 1 130 152Z'), '#ff6fb8', 'prendedor-d'); }
    }
    function drawBuns(h) {
      for (const side of [-1, 1]) {
        const cx = side === 1 ? 262 : 138, cy = 74;
        P(`M${cx - 34} ${cy}A34 34 0 1 1 ${cx + 34} ${cy}A34 34 0 1 1 ${cx - 34} ${cy}Z`, h.base, 'coque' + side, { g: 'r', ga: 0.3, gb: 0.25 });
        L(`M${cx - 20} ${cy - 14}Q${cx} ${cy - 30} ${cx + 22} ${cy - 10}M${cx - 24} ${cy + 6}Q${cx} ${cy - 10} ${cx + 24} ${cy + 10}M${cx - 18} ${cy + 22}Q${cx} ${cy + 10} ${cx + 18} ${cy + 24}`, h.dk, 1.6, 0.55);
        P(`M${cx - 26} ${cy + 26}Q${cx} ${cy + 40} ${cx + 26} ${cy + 26}L${cx + 22} ${cy + 34}Q${cx} ${cy + 46} ${cx - 22} ${cy + 34}Z`, '#ff6fb8', 'elastico' + side, { sw: 1.6 });
      }
    }
    function shine(h, isBack) {
      if (line) return;
      // "anel de brilho" do cabelo
      out.push(`<path d="M142 104Q200 ${isBack ? 74 : 80} 258 104Q256 112 250 112Q200 ${isBack ? 88 : 94} 150 112Q144 112 142 104Z" fill="${h.hl}" opacity="0.55"/>`);
      out.push(`<path d="M160 100l-4 12M176 92l-3 14M224 92l3 14M240 100l4 12" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.35"/>`);
    }
    function drawHeadItem() {
      switch (s.head) {
        case 'tiara':
          if (back) { P('M132 132Q200 72 268 132L262 138Q200 84 138 138Z', GOLD, 'tiara', { ga: 0.45, gb: 0.25, sw: 2 }); break; }
          P('M128 128Q200 66 272 128L266 136Q200 78 134 136Z', GOLD, 'tiara', { ga: 0.45, gb: 0.25, sw: 2 });
          P(starD(200, 70, 20, 9), '#ff6fd0', 'tiara-estrela', { g: 'r', ga: 0.5, gb: 0.15 });
          D(starD(196, 66, 6, 2.5), '#fff', 0.9);
          P(starD(160, 90, 9, 4, 0.3), '#7fe3ff', 'tiara-e', { sw: 1.4 });
          P(starD(240, 90, 9, 4, -0.3), '#7fe3ff', 'tiara-d', { sw: 1.4 });
          break;
        case 'fones':
          P('M116 168C108 60 292 60 284 168L274 168C280 80 120 80 126 168Z', '#ff5fb0', 'fone-arco', { ga: 0.35, sw: 2 });
          for (const side of [-1, 1]) {
            const x = side === 1 ? 278 : 122;
            P(`M${x - 16} ${170}Q${x - 16} ${148} ${x} ${148}Q${x + 16} ${148} ${x + 16} ${170}L${x + 16} ${192}Q${x + 16} ${212} ${x} ${212}Q${x - 16} ${212} ${x - 16} ${192}Z`, '#ffffff', 'fone' + side, { ga: 0.2, gb: 0.25 });
            P(heartD(x, 182, 8), '#ff5fb0', 'fone-coracao' + side, { sw: 1.4 });
          }
          break;
        case 'laco': {
          const cx = 252, cy = 88;
          P(`M${cx} ${cy}C${cx - 20} ${cy - 34} ${cx - 54} ${cy - 20} ${cx - 44} ${cy + 4}C${cx - 38} ${cy + 18} ${cx - 16} ${cy + 12} ${cx} ${cy}Z`, '#ff3d8f', 'laco-e', { ga: 0.35 });
          P(`M${cx} ${cy}C${cx + 20} ${cy - 34} ${cx + 54} ${cy - 20} ${cx + 44} ${cy + 4}C${cx + 38} ${cy + 18} ${cx + 16} ${cy + 12} ${cx} ${cy}Z`, '#ff3d8f', 'laco-d', { ga: 0.35 });
          P(`M${cx - 6} ${cy + 2}L${cx - 18} ${cy + 34}L${cx - 6} ${cy + 30}L${cx} ${cy + 38}L${cx + 4} ${cy + 4}Z`, '#ff3d8f', 'laco-fita', { ga: 0.2, sw: 2 });
          P(`M${cx - 9} ${cy}A9 9 0 1 1 ${cx + 9} ${cy}A9 9 0 1 1 ${cx - 9} ${cy}Z`, '#ff7ab8', 'laco-no', { sw: 2 });
          sparkle(`M${cx} ${cy}C${cx - 20} ${cy - 34} ${cx - 54} ${cy - 20} ${cx - 44} ${cy + 4}C${cx - 38} ${cy + 18} ${cx - 16} ${cy + 12} ${cx} ${cy}Z`, 0.5);
          break;
        }
        case 'coroa':
          P('M160 74L166 34L182 56L200 24L218 56L234 34L240 74Q200 84 160 74Z', GOLD, 'coroa', { ga: 0.5, gb: 0.3, sw: 2.2 });
          if (!back) { P('M193 62A7 7 0 1 1 207 62A7 7 0 1 1 193 62Z', '#ff3d8f', 'joia', { g: 'r', ga: 0.6, sw: 1.4 }); P('M172 66A4 4 0 1 1 180 66A4 4 0 1 1 172 66Z', '#7fe3ff', 'joia-e', { sw: 1.2 }); P('M220 66A4 4 0 1 1 228 66A4 4 0 1 1 220 66Z', '#7fe3ff', 'joia-d', { sw: 1.2 }); }
          break;
        case 'estrelas':
          [[146, 104, 14, '#ffd84a', 0.2], [250, 96, 12, '#7fe3ff', -0.25], [268, 128, 9, '#ff7ad9', 0.1]].forEach(([x, y, r, c, rot], i) =>
            P(starD(back ? 400 - x : x, y, r, r * 0.45, rot), c, 'presilha' + i, { g: 'r', ga: 0.5, gb: 0.15, sw: 1.8 }));
          break;
      }
    }
    function drawBackItem(isBehind) {
      switch (s.back) {
        case 'asas': {
          begin(' class="wings"');
          for (const side of [-1, 1]) {
            const m = side === 1 ? mirrorX : (d) => d;
            const up = m('M190 300C150 230 70 200 50 250C36 290 80 330 160 330Z');
            const lo = m('M184 330C140 336 92 360 98 400C104 430 150 420 186 352Z');
            if (line) { P(up, '#fff', 'asa-cima' + side); P(lo, '#fff', 'asa-baixo' + side); continue; }
            out.push(`<path d="${up}" fill="${grad('#9fe6ff', 'v', 0.5, 0.1)}" stroke="#6a8bd8" stroke-width="2" opacity="0.8"/>`);
            out.push(`<path d="${lo}" fill="${grad('#ffb8ee', 'v', 0.4, 0.1)}" stroke="#d07ac8" stroke-width="2" opacity="0.8"/>`);
            sparkle(up, 0.8); sparkle(lo, 0.8);
            L(m('M180 306Q120 260 70 252M176 318Q130 300 90 296'), '#ffffff', 1.6, 0.7);
          }
          end();
          break;
        }
        case 'mochila':
          if (isBehind) { L('M162 282Q160 320 166 352M238 282Q240 320 234 352', '#ff4f9a', 6, 1); }
          else { P(heartD(200, 340, 52), '#ff4f9a', 'mochila', { g: 'r', ga: 0.35, gb: 0.2 }); sparkle(heartD(200, 340, 52), 0.4); P('M180 340Q200 352 220 340', '#fff', 'ziper', { noFill: true, sw: 3, stroke: '#ffffff' }); }
          break;
        case 'capa':
          if (isBehind) P('M156 280C130 380 110 520 96 660Q200 690 304 660C290 520 270 380 244 280Z', '#c92a6b', 'capa', { ga: 0.2, gb: 0.3 });
          else { P('M150 278C126 380 108 520 94 664Q200 694 306 664C292 520 274 380 250 278Q200 300 150 278Z', '#c92a6b', 'capa', { ga: 0.25, gb: 0.25 }); sparkle('M150 278C126 380 108 520 94 664Q200 694 306 664C292 520 274 380 250 278Q200 300 150 278Z', 0.35); }
          if (isBehind && !back) { P(starD(200, 276, 9, 4), GOLD, 'capa-broche', { sw: 1.4 }); }
          break;
      }
    }

    let body = out.join('');
    if (back) body = `<g transform="translate(400 0) scale(-1 1)">${body}</g>`;
    return { defs: defs.join(''), body };
  }

  /* SVG completo */
  function svg(st, o = {}) {
    const r = draw(st, o);
    const vb = o.viewBox || '0 0 400 800';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" class="${o.cls || ''}"><defs>${r.defs}</defs>${r.body}</svg>`;
  }

  window.Doll = { OPTIONS, STAGES, DEFAULT, draw, svg, mix, light, dark };
})();
