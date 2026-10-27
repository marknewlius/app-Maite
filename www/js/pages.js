/* Desenhos para colorir (todos originais). */
(function () {
  'use strict';
  const S = 'stroke="#2b2233" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"';
  function star(x, y, ro, ri, rot = 0) {
    let d = '';
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + rot + i * Math.PI / 5, r = i % 2 ? ri : ro; d += (i ? 'L' : 'M') + (x + Math.cos(a) * r).toFixed(1) + ' ' + (y + Math.sin(a) * r).toFixed(1); }
    return d + 'Z';
  }
  function heart(x, y, s) { return `M${x} ${y + s * 0.9}C${x - s * 1.4} ${y - s * 0.1} ${x - s * 0.9} ${y - s * 1.1} ${x} ${y - s * 0.45}C${x + s * 0.9} ${y - s * 1.1} ${x + s * 1.4} ${y - s * 0.1} ${x} ${y + s * 0.9}Z`; }
  const R = (id, d) => `<path data-r="${id}" d="${d}" fill="#fff" ${S}/>`;
  const LN = d => `<path d="${d}" fill="none" ${S} stroke-width="2.4" pointer-events="none"/>`;
  const BG = '<rect data-r="fundo" x="0" y="0" width="400" height="520" fill="#fff"/>';
  const note = (id, x, y) => R(id, `M${x} ${y}L${x} ${y - 60}L${x + 40} ${y - 72}L${x + 40} ${y - 14}A12 10 0 1 1 ${x + 34} ${y - 22}L${x + 34} ${y - 56}L${x + 6} ${y - 48}L${x + 6} ${y + 6}A12 10 0 1 1 ${x} ${y}Z`);

  const STATIC = {
    microfone: BG +
      R('raio1', 'M200 150L60 30L40 70Z') + R('raio2', 'M200 150L340 30L360 70Z') +
      R('mic-cabeca', 'M120 150A80 80 0 1 1 280 150A80 80 0 1 1 120 150Z') +
      LN('M128 120L272 120M122 150L278 150M128 180L272 180M170 76L170 224M200 70L200 230M230 76L230 224') +
      R('anel', 'M136 222Q200 246 264 222L262 252Q200 274 138 252Z') +
      R('cabo', 'M150 256Q200 276 250 256L224 450Q200 468 176 450Z') +
      R('botao', heart(200, 330, 20)) +
      R('estrela1', star(70, 230, 34, 15)) + R('estrela2', star(336, 210, 28, 12, 0.3)) + R('estrela3', star(330, 420, 34, 15, -0.2)) + R('estrela4', star(66, 410, 24, 10, 0.2)) +
      note('nota1', 300, 330) + note('nota2', 60, 340),
    coelhinha: BG +
      R('orelha-e', 'M150 150C120 60 130 10 160 20C190 30 186 100 182 150Z') + R('orelha-d', 'M250 150C280 60 270 10 240 20C210 30 214 100 218 150Z') +
      R('orelha-e2', 'M158 140C140 80 146 44 160 46C174 50 176 100 172 140Z') + R('orelha-d2', 'M242 140C260 80 254 44 240 46C226 50 224 100 228 140Z') +
      R('corpo', 'M130 330C120 420 150 480 200 480C250 480 280 420 270 330Z') +
      R('barriga', 'M165 360C160 420 176 456 200 456C224 456 240 420 235 360Z') +
      R('pe-e', 'M140 470A30 18 0 1 1 196 472Z') + R('pe-d', 'M204 472A30 18 0 1 1 260 470Z') +
      R('cabeca', 'M110 230C110 160 150 130 200 130C250 130 290 160 290 230C290 300 250 340 200 340C150 340 110 300 110 230Z') +
      R('fone-arco', 'M104 240C96 110 304 110 296 240L282 240C290 130 110 130 118 240Z') +
      R('fone-e', 'M92 220Q92 196 112 196L124 196L124 280L112 280Q92 280 92 256Z') + R('fone-d', 'M308 220Q308 196 288 196L276 196L276 280L288 280Q308 280 308 256Z') +
      '<ellipse cx="166" cy="236" rx="13" ry="17" fill="#2b2233"/><ellipse cx="234" cy="236" rx="13" ry="17" fill="#2b2233"/><circle cx="161" cy="229" r="5" fill="#fff"/><circle cx="229" cy="229" r="5" fill="#fff"/>' +
      R('nariz', heart(200, 264, 9)) + LN('M200 272Q200 282 190 286M200 272Q200 282 210 286') +
      R('bochecha-e', 'M130 268A14 9 0 1 1 158 268A14 9 0 1 1 130 268Z') + R('bochecha-d', 'M242 268A14 9 0 1 1 270 268A14 9 0 1 1 242 268Z') +
      R('estrela', star(200, 404, 34, 15)) +
      R('brilho1', star(60, 120, 18, 7)) + R('brilho2', star(344, 110, 22, 9)) + R('brilho3', star(352, 420, 16, 7)),
    palco: BG +
      R('chao', 'M20 420Q200 370 380 420L380 520L20 520Z') +
      R('cortina-e', 'M0 0L120 0Q110 120 90 200Q60 300 70 420L0 430Z') + R('cortina-d', 'M400 0L280 0Q290 120 310 200Q340 300 330 420L400 430Z') +
      R('faixa', 'M0 0L400 0L400 50Q300 80 200 56Q100 80 0 50Z') +
      R('luz-e', 'M150 60L90 400L190 400Z') + R('luz-d', 'M250 60L210 400L310 400Z') +
      R('estrela-grande', star(200, 250, 110, 48)) +
      R('coracao1', heart(90, 470, 22)) + R('coracao2', heart(310, 470, 22)) + R('coracao3', heart(200, 470, 16)) +
      R('estrelinha1', star(200, 250, 30, 13)),
    bastao: BG +
      R('brilho', 'M200 150m-140 0a140 140 0 1 0 280 0a140 140 0 1 0 -280 0Z') +
      R('coracao', heart(200, 150, 92)) +
      R('estrela', star(200, 140, 40, 18)) +
      R('base', 'M160 236Q200 256 240 236L236 270Q200 286 164 270Z') +
      R('cabo', 'M170 270Q200 282 230 270L218 470Q200 482 182 470Z') +
      R('listra1', 'M174 320L226 320L224 340L176 340Z') + R('listra2', 'M178 390L222 390L220 410L180 410Z') +
      R('e1', star(60, 360, 26, 11)) + R('e2', star(340, 360, 26, 11)) + R('e3', star(80, 470, 18, 8)) + R('e4', star(320, 470, 18, 8))
  };

  const PAGES = [
    { id: 'guerreira1', type: 'doll', state: { hair: 'longo', outfit: 'vestido', head: 'tiara', hand: 'microfone', shoes: 'botas', back: 'nenhum' } },
    { id: 'microfone', type: 'static' },
    { id: 'guerreira2', type: 'doll', state: { hair: 'coques', outfit: 'jaqueta', head: 'nenhum', hand: 'bastao', shoes: 'tenis', back: 'asas' } },
    { id: 'coelhinha', type: 'static' },
    { id: 'guerreira3', type: 'doll', state: { hair: 'rabo', outfit: 'heroina', head: 'coroa', hand: 'varinha', shoes: 'sapatilha', back: 'nenhum' } },
    { id: 'palco', type: 'static' },
    { id: 'guerreira4', type: 'doll', state: { hair: 'chiquinhas', outfit: 'moletom', head: 'fones', hand: 'nenhum', shoes: 'plataforma', back: 'mochila' } },
    { id: 'bastao', type: 'static' },
    { id: 'guerreira5', type: 'doll', state: { hair: 'cacheado', outfit: 'macacao', head: 'estrelas', hand: 'microfone', shoes: 'botas', back: 'capa' } }
  ];

  function render(page, fills = {}) {
    if (page.type === 'doll') {
      const r = window.Doll.draw(page.state, { mode: 'line', fills });
      const bg = `<rect data-r="fundo" x="-60" y="0" width="520" height="800" fill="${fills.fundo || '#fff'}"/>`;
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="20 20 360 770"><defs>${r.defs}</defs>${bg}${r.body}</svg>`;
    }
    let svg = STATIC[page.id];
    svg = svg.replace(/data-r="([^"]+)"([^>]*?)fill="#fff"/g, (m, id, mid) => `data-r="${id}"${mid}fill="${fills[id] || '#fff'}"`);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520">${svg}</svg>`;
  }

  window.Pages = { PAGES, render };
})();
