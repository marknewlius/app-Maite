/* Palco 3D: carrega as bonecas (VRM, licença CC0 da Pixiv/VRoid), troca cores,
   aplica brilho nas roupas, coloca acessórios, dança, gira e tira fotos. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

export const MODELS = ['models/boneca1.vrm', 'models/boneca2.vrm', 'models/boneca3.vrm', 'models/boneca4.vrm'];

/* ---------- efeito de brilho dentro do material MToon ---------- */
const FX = { uGmTime: { value: 0 }, uGmCell: { value: 3 } };
function addFx(mat) {
  if (mat.userData.gmFx) return mat.userData.gmFx;
  const u = { uGmGlitter: { value: 0 }, uGmHolo: { value: 0 }, uGmMetal: { value: 0 } };
  Object.assign(mat.uniforms, u, FX);
  const head = 'uniform float uGmTime, uGmCell, uGmGlitter, uGmHolo, uGmMetal;\n';
  const hook = 'gl_FragColor = vec4( col, diffuseColor.a );';
  const at = mat.fragmentShader.lastIndexOf(hook);
  if (at >= 0) {
    const fs = mat.fragmentShader;
    mat.fragmentShader = head + fs.slice(0, at + hook.length) + `
  #ifndef OUTLINE
  {
    float lum0 = dot(gl_FragColor.rgb, vec3(0.3, 0.59, 0.11));
    if (uGmMetal > 0.0) {
      gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * 1.25 + pow(lum0, 2.5) * 0.9, uGmMetal);
    }
    if (uGmHolo > 0.0) {
      vec3 rb = 0.5 + 0.5 * cos(6.2831 * (gl_FragCoord.y / (260.0 * uGmCell / 3.0) + gl_FragCoord.x / (900.0 * uGmCell / 3.0) + uGmTime * 0.2 + vec3(0.0, 0.33, 0.67)));
      gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * 0.55 + rb * 0.6 * (0.4 + lum0), uGmHolo * 0.55);
    }
    if (uGmGlitter > 0.0) {
      vec2 gp = gl_FragCoord.xy / (uGmCell * 2.2);
      vec2 cell = floor(gp), f = fract(gp) - 0.5;
      float h = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
      float h2 = fract(h * 91.7);
      float on = step(1.0 - 0.16 * uGmGlitter, h) * pow(0.5 + 0.5 * sin(uGmTime * 4.0 + h2 * 60.0), 2.0);
      float core = smoothstep(0.32, 0.0, length(f));
      float cross = smoothstep(0.08, 0.0, abs(f.x)) * smoothstep(0.5, 0.0, abs(f.y)) + smoothstep(0.08, 0.0, abs(f.y)) * smoothstep(0.5, 0.0, abs(f.x));
      gl_FragColor.rgb += on * (core * 0.9 + cross * 0.6) * mix(vec3(1.0, 0.95, 0.8), vec3(1.0, 0.8, 1.0), h2) * 1.3;
      gl_FragColor.rgb += uGmGlitter * 0.06 * vec3(1.0, 0.9, 1.0) * lum0;
    }
  }
  #endif
` + fs.slice(at + hook.length);
    mat.needsUpdate = true;
  }
  mat.userData.gmFx = u;
  return u;
}

/* ---------- recolorir texturas ---------- */
function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function colorize(img, hex, kind) {
  const w = img.width, h = img.height, cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, w, h), p = d.data;
  let mn = 255, mx = 0;
  for (let i = 0; i < p.length; i += 16) { if (p[i + 3] < 20) continue; const l = 0.3 * p[i] + 0.59 * p[i + 1] + 0.11 * p[i + 2]; if (l < mn) mn = l; if (l > mx) mx = l; }
  const span = Math.max(30, mx - mn), [tr, tg, tb] = hexToRgb(hex);
  const base = kind === 'hair' ? 0.42 : 0.5, gain = kind === 'hair' ? 0.75 : 0.62;
  for (let i = 0; i < p.length; i += 4) {
    const l = (0.3 * p[i] + 0.59 * p[i + 1] + 0.11 * p[i + 2] - mn) / span;
    const v = base + gain * l, hl = Math.max(0, l - 0.82) * 2.2;
    p[i] = Math.min(255, tr * v + 255 * hl); p[i + 1] = Math.min(255, tg * v + 255 * hl); p[i + 2] = Math.min(255, tb * v + 255 * hl);
  }
  g.putImageData(d, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace; t.flipY = false;
  return t;
}

/* ---------- acessórios (feitos em 3D aqui mesmo) ---------- */
function starShape(ro, ri) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? ri : ro; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  return s;
}
function heartShape(sz) {
  const s = new THREE.Shape(), k = sz;
  s.moveTo(0, -0.9 * k);
  s.bezierCurveTo(-1.4 * k, 0.1 * k, -0.9 * k, 1.1 * k, 0, 0.45 * k);
  s.bezierCurveTo(0.9 * k, 1.1 * k, 1.4 * k, 0.1 * k, 0, -0.9 * k);
  return s;
}
const ext = (shape, depth) => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: depth * 0.4, bevelSize: depth * 0.4, bevelSegments: 3 });
const M = {
  gold: () => new THREE.MeshStandardMaterial({ color: 0xffc93c, metalness: 0.9, roughness: 0.22, emissive: 0x5a3a00, emissiveIntensity: 0.4 }),
  silver: () => new THREE.MeshStandardMaterial({ color: 0xe8ecf8, metalness: 0.9, roughness: 0.18, emissive: 0x303040 }),
  pink: () => new THREE.MeshStandardMaterial({ color: 0xff4fa3, metalness: 0.3, roughness: 0.3, emissive: 0x60102e, emissiveIntensity: 0.5 }),
  white: () => new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.35 }),
  dark: () => new THREE.MeshStandardMaterial({ color: 0x2a2140, metalness: 0.5, roughness: 0.3 }),
  glow: (c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.95 }),
  gem: (c) => new THREE.MeshStandardMaterial({ color: c, metalness: 0.2, roughness: 0.05, emissive: c, emissiveIntensity: 0.35 })
};
function makeAcc(kind) {
  const g = new THREE.Group();
  switch (kind) {
    case 'tiara': {
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.006, 8, 48, Math.PI), M.gold());
      band.rotation.x = -0.25; g.add(band);
      const st = new THREE.Mesh(ext(starShape(0.032, 0.014), 0.006), M.gem(0xff5fd0)); st.position.set(0, 0.095, 0.0); g.add(st);
      for (const s of [-1, 1]) { const m = new THREE.Mesh(ext(starShape(0.016, 0.007), 0.004), M.gem(0x7fe3ff)); m.position.set(s * 0.06, 0.07, 0.005); g.add(m); }
      g.userData.slot = 'top'; break;
    }
    case 'coroa': {
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.042, 0.025, 32, 1, true), M.gold()); ring.material.side = THREE.DoubleSide; g.add(ring);
      for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; const c = new THREE.Mesh(new THREE.ConeGeometry(0.01, 0.03, 8), M.gold()); c.position.set(Math.sin(a) * 0.044, 0.026, Math.cos(a) * 0.044); g.add(c); const b = new THREE.Mesh(new THREE.SphereGeometry(0.006, 10, 8), M.gem(i % 2 ? 0xff3d8f : 0x7fe3ff)); b.position.set(Math.sin(a) * 0.046, 0.043, Math.cos(a) * 0.046); g.add(b); }
      g.userData.slot = 'crown'; break;
    }
    case 'fones': {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.009, 10, 48, Math.PI), M.pink()); arc.rotation.y = Math.PI / 2; arc.rotation.z = 0; g.add(arc);
      for (const s of [-1, 1]) {
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.025, 28), M.white()); cup.rotation.z = Math.PI / 2; cup.position.set(s * 0.095, -0.005, 0); g.add(cup);
        const h = new THREE.Mesh(ext(heartShape(0.014), 0.004), M.pink()); h.rotation.y = s * Math.PI / 2; h.position.set(s * 0.11, -0.005, 0); g.add(h);
      }
      g.userData.slot = 'ears'; break;
    }
    case 'laco': {
      for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.SphereGeometry(0.04, 20, 14), M.pink()); w.scale.set(1, 0.6, 0.35); w.position.x = s * 0.035; w.rotation.z = s * 0.4; g.add(w); }
      const k = new THREE.Mesh(new THREE.SphereGeometry(0.016, 14, 10), M.gem(0xff7ab8)); g.add(k);
      g.userData.slot = 'side'; break;
    }
    case 'estrelas': {
      [[-0.05, 0, 0x7fe3ff, 0.022], [0.0, 0.03, 0xffd84a, 0.03], [0.05, 0.005, 0xff7ad9, 0.02]].forEach(([x, y, c, r]) => { const m = new THREE.Mesh(ext(starShape(r, r * 0.45), 0.005), M.gem(c)); m.position.set(x, y, 0); m.rotation.z = x * 4; g.add(m); });
      g.userData.slot = 'side'; break;
    }
    case 'microfone': {
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.009, 0.13, 20), M.dark()); handle.position.y = -0.03; g.add(handle);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.015, 0.004, 8, 24), M.pink()); ring.rotation.x = Math.PI / 2; ring.position.y = 0.036; g.add(ring);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.026, 24, 18), M.silver()); head.position.y = 0.058; g.add(head);
      g.userData.slot = 'hand'; break;
    }
    case 'bastao': {
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.16, 16), M.white()); g.add(st);
      const glow = new THREE.Mesh(ext(heartShape(0.04), 0.02), M.glow(0xff6fd0)); glow.position.set(0, 0.12, -0.01); g.add(glow);
      const inner = new THREE.Mesh(ext(starShape(0.02, 0.009), 0.026), M.glow(0xfff6a8)); inner.position.set(0, 0.12, -0.013); g.add(inner);
      const light = new THREE.PointLight(0xff6fd0, 0.6, 0.6); light.position.y = 0.12; g.add(light);
      g.userData.slot = 'hand'; g.userData.pulse = [glow, inner]; break;
    }
    case 'varinha': {
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.2, 12), M.gold()); g.add(st);
      const s = new THREE.Mesh(ext(starShape(0.045, 0.02), 0.012), M.gem(0xffe24a)); s.position.y = 0.13; g.add(s);
      g.userData.slot = 'hand'; g.userData.spin = s; break;
    }
    case 'asas': {
      const mat = new THREE.MeshStandardMaterial({ color: 0xbfeaff, transparent: true, opacity: 0.6, metalness: 0.3, roughness: 0.15, side: THREE.DoubleSide, emissive: 0x6f8fff, emissiveIntensity: 0.25 });
      const mat2 = mat.clone(); mat2.color.set(0xffc8f0); mat2.emissive.set(0xff6fd0);
      for (const s of [-1, 1]) {
        const w = new THREE.Group();
        const up = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 12), mat); up.scale.set(1, 0.55, 0.04); up.position.set(s * 0.17, 0.1, 0); up.rotation.z = s * 0.5; w.add(up);
        const lo = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 10), mat2); lo.scale.set(1, 0.6, 0.04); lo.position.set(s * 0.12, -0.08, 0); lo.rotation.z = -s * 0.5; w.add(lo);
        w.userData.side = s; g.add(w);
      }
      g.userData.slot = 'back'; g.userData.wings = true; break;
    }
    case 'mochila': {
      const h = new THREE.Mesh(ext(heartShape(0.11), 0.05), M.pink()); h.rotation.z = Math.PI; h.position.y = 0.02; g.add(h);
      g.userData.slot = 'back'; break;
    }
  }
  return g;
}

/* ---------- palco ---------- */
const STAGE_COL = { roxo: [0x6b3fd1, 0xff5fd2], rosa: [0xff4f9e, 0xfff07a], azul: [0x2a73ff, 0x6ff7ff], dourado: [0xd79a20, 0xfff3b0], noite: [0x3b2f70, 0xb78bff] };

export class Stage3D {
  constructor(canvas) {
    this.canvas = canvas;
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.setClearColor(0x000000, 0);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(26, 1, 0.1, 30);
    this.scene.add(new THREE.HemisphereLight(0xfff0ff, 0x6040a0, 1.4));
    const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(1, 2.2, 2.5); this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xff8fe0, 1.2); rim.position.set(-2, 1.2, -1.5); this.scene.add(rim);
    // chão do palco
    this.floor = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.76, 0.06, 72), new THREE.MeshStandardMaterial({ color: 0x6b3fd1, metalness: 0.5, roughness: 0.25, emissive: 0x2a0f50 }));
    disc.position.y = -0.03; this.floor.add(disc); this.disc = disc;
    this.ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.012, 8, 120), new THREE.MeshBasicMaterial({ color: 0xff5fd2 }));
    this.ring.rotation.x = Math.PI / 2; this.floor.add(this.ring);
    const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.5, 'rgba(255,180,240,0.35)'); gr.addColorStop(1, 'rgba(255,120,220,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false }));
    glow.rotation.x = -Math.PI / 2; glow.position.y = 0.002; this.floor.add(glow);
    this.scene.add(this.floor);
    // luzinhas flutuando
    const pg = new THREE.BufferGeometry(), N = 90, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { const a = Math.random() * 6.28, rr = 0.4 + Math.random() * 0.6; pos[i * 3] = Math.cos(a) * rr; pos[i * 3 + 1] = Math.random() * 1.9; pos[i * 3 + 2] = Math.sin(a) * rr; }
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.sparks = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.025, color: 0xfff6c0, transparent: true, opacity: 0.85, map: glowTex, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.scene.add(this.sparks);

    this.holder = new THREE.Group(); this.scene.add(this.holder);
    this.loader = new GLTFLoader(); this.loader.register(p => new VRMLoaderPlugin(p));
    this.cache = new Map(); this.vrm = null; this.modelIdx = -1;
    this.look = null; this.acc = {};
    this.mode = 'idle'; this.modeT = 0; this.t = 0;
    this.yaw = 0; this.yawVel = 0; this.dragging = false; this.spinT = -1;
    this.blinkT = 2; this.cur = {}; this.listeners = {};
    this.clock = new THREE.Clock();
    this.view = { target: 0.82, height: 1.95 };
    this._bindDrag();
    this._loop = this._loop.bind(this);
    this.running = false;
  }

  /* encaixa o canvas num elemento da tela */
  mount(el, view) {
    if (this.canvas.parentElement !== el) el.appendChild(this.canvas);
    if (view) this.view = Object.assign({ target: 0.82, height: 1.95 }, view);
    this.resize(); this.start();
  }
  resize() {
    const w = this.canvas.clientWidth || 1, h = this.canvas.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this._frame(); this.camera.updateProjectionMatrix();
    FX.uGmCell.value = 3 * Math.min(window.devicePixelRatio || 1, 2) * Math.max(0.6, Math.min(1.4, h / 700));
  }
  _frame(cam = this.camera, view = this.view) {
    const fov = cam.fov * Math.PI / 180, H = view.height;
    let dist = (H / 2) / Math.tan(fov / 2);
    const needW = 1.15; // largura mínima visível (asas, braços)
    const wDist = (needW / 2) / (Math.tan(fov / 2) * cam.aspect);
    dist = Math.max(dist, wDist);
    cam.position.set(0, view.target + 0.12, dist);
    cam.lookAt(0, view.target, 0);
  }
  start() { if (!this.running) { this.running = true; this.clock.getDelta(); requestAnimationFrame(this._loop); } }
  stop() { this.running = false; }

  async loadModel(i) {
    if (this.modelIdx === i && this.vrm) return this.vrm;
    let vrm = this.cache.get(i);
    if (!vrm) {
      const gltf = await this.loader.loadAsync(MODELS[i]);
      vrm = gltf.userData.vrm; vrm.gm = {};
      VRMUtils.removeUnnecessaryVertices(gltf.scene);
      VRMUtils.combineSkeletons ? VRMUtils.combineSkeletons(gltf.scene) : null;
      VRMUtils.rotateVRM0(vrm);
      vrm.scene.traverse(o => { o.frustumCulled = false; });
      // física só no cabelo e acessórios: saia e corpo ficam firmes (sem levantar)
      const sbm = vrm.springBoneManager;
      if (sbm) {
        for (const j of Array.from(sbm.joints)) {
          const n = (j.bone && j.bone.name) || '';
          if (/skirt|bust|coat|onepiece|tops|bottoms|cloth/i.test(n)) { sbm.deleteJoint ? sbm.deleteJoint(j) : sbm.joints.delete(j); }
        }
        sbm.setInitState && sbm.setInitState();
      }
      this._prepMaterials(vrm);
      this._measure(vrm);
      // guarda no máximo 2 modelos na memória
      if (this.cache.size >= 2) { for (const [k, v] of this.cache) { if (k !== this.modelIdx) { VRMUtils.deepDispose(v.scene); this.cache.delete(k); break; } } }
      this.cache.set(i, vrm);
    }
    if (this.vrm) this.holder.remove(this.vrm.scene);
    this.vrm = vrm; this.modelIdx = i;
    this.holder.add(vrm.scene);
    if (vrm.lookAt) vrm.lookAt.target = this.camera;
    for (const k in this.acc) { const g = this.acc[k]; if (g && g.parent) g.parent.remove(g); }
    this.cur = {}; this.acc = {};
    return vrm;
  }
  _prepMaterials(vrm) {
    const mats = new Map();
    vrm.scene.traverse(o => {
      if (!o.isMesh) return;
      const arr = Array.isArray(o.material) ? o.material : [o.material];
      arr.forEach(m => { if (!mats.has(m)) mats.set(m, o); });
    });
    vrm.gm.mats = [];
    for (const m of mats.keys()) {
      const n = (m.name || '').toUpperCase();
      const kind = n.includes('HAIR') ? 'hair' : (n.includes('CLOTH') && !n.includes('SHOES')) ? 'cloth' : n.includes('SHOES') ? 'shoes' : n.includes('SKIN') ? 'skin' : 'face';
      const info = { m, kind, map: m.map || null, shade: m.shadeMultiplyTexture || null, color: m.color ? m.color.clone() : null, shadeColor: m.shadeColorFactor ? m.shadeColorFactor.clone() : null };
      if (m.parametricRimColorFactor) { m.parametricRimColorFactor.setRGB(0.55, 0.3, 0.7); m.parametricRimFresnelPowerFactor = 4; m.parametricRimLiftFactor = 0.05; }
      if (kind === 'cloth' || kind === 'shoes') info.fx = addFx(m);
      vrm.gm.mats.push(info);
    }
  }
  _measure(vrm) {
    vrm.scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(vrm.scene);
    const hb = vrm.humanoid;
    const head = hb.getNormalizedBoneNode('head'), eye = hb.getNormalizedBoneNode('leftEye') || head;
    const hp = head.getWorldPosition(new THREE.Vector3()), ep = eye.getWorldPosition(new THREE.Vector3());
    const hand = hb.getNormalizedBoneNode('rightHand').getWorldPosition(new THREE.Vector3());
    vrm.gm.m = { top: box.max.y, headY: hp.y, eyeY: ep.y, forward: (Math.sign(ep.z - hp.z) || 1), bf: -(Math.sign(ep.z - hp.z) || 1), height: box.max.y - box.min.y, handX: hand.x };
  }

  /* aplica o visual: {model, hairColor, outfitColor, shine, head, hand, back, stage} */
  async setLook(look) {
    const vrm = await this.loadModel(look.model | 0);
    const prev = this.look || {};
    this.look = Object.assign({}, look);
    const mats = vrm.gm.mats;
    const need = (k) => prev[k] !== look[k] || vrm.gm['ap_' + k] !== look[k];
    if (need('hairColor')) { this._recolor(mats.filter(x => x.kind === 'hair'), look.hairColor, 'hair'); vrm.gm.ap_hairColor = look.hairColor; }
    if (need('outfitColor')) { this._recolor(mats.filter(x => x.kind === 'cloth'), look.outfitColor, 'cloth'); vrm.gm.ap_outfitColor = look.outfitColor; }
    const sh = look.shine || 'nenhum';
    mats.forEach(x => { if (!x.fx) return; const k = x.kind === 'shoes' ? 0.6 : 1; x.fx.uGmGlitter.value = (sh === 'nenhum' ? 0 : sh === 'purpurina' ? 1 : 0.6) * k; x.fx.uGmMetal.value = sh === 'metal' ? 0.8 : 0; x.fx.uGmHolo.value = sh === 'holo' ? 1 : 0; });
    for (const slot of ['head', 'hand', 'back']) this._setAcc(slot, look[slot]);
    const sc = STAGE_COL[look.stage] || STAGE_COL.roxo;
    this.disc.material.color.setHex(sc[0]); this.ring.material.color.setHex(sc[1]);
  }
  _recolor(list, color, kind) {
    for (const x of list) {
      const m = x.m;
      if (x.cur) { x.cur.forEach(t => t.dispose()); x.cur = null; }
      if (!color || color === 'original') {
        m.map = x.map; if ('shadeMultiplyTexture' in m) m.shadeMultiplyTexture = x.shade;
        if (x.color) m.color.copy(x.color); if (x.shadeColor) m.shadeColorFactor.copy(x.shadeColor);
      } else {
        const img = x.map && x.map.image;
        if (img) { const t = colorize(img, color, kind); m.map = t; if ('shadeMultiplyTexture' in m && x.shade) m.shadeMultiplyTexture = t; x.cur = [t]; }
        if (m.color) m.color.setRGB(1, 1, 1);
        if (m.shadeColorFactor) { const c = new THREE.Color(color); m.shadeColorFactor.copy(c.multiplyScalar(0.75)); }
      }
      m.needsUpdate = true;
    }
  }
  _setAcc(slot, kind) {
    const vrm = this.vrm, cur = this.acc[slot];
    if (cur && cur.userData.kind === kind) return;
    if (cur) { cur.parent && cur.parent.remove(cur); cur.traverse(o => { o.geometry && o.geometry.dispose(); }); this.acc[slot] = null; }
    if (!kind || kind === 'nenhum') return;
    const g = makeAcc(kind); g.userData.kind = kind;
    const hb = vrm.humanoid, me = vrm.gm.m, fw = me.bf;
    const headN = hb.getNormalizedBoneNode('head');
    const headTop = me.top - me.headY;
    if (g.userData.slot === 'top') { headN.add(g); g.position.set(0, headTop - 0.035, 0.015 * fw); g.rotation.y = fw > 0 ? 0 : Math.PI; g.rotation.x = -0.35 * fw; }
    else if (g.userData.slot === 'crown') { headN.add(g); g.position.set(0, headTop - 0.015, -0.005 * fw); g.rotation.x = -0.12 * fw; }
    else if (g.userData.slot === 'ears') { headN.add(g); g.position.set(0, (me.eyeY - me.headY) + 0.01, -0.01 * fw); }
    else if (g.userData.slot === 'side') { headN.add(g); g.position.set(-0.075, headTop - 0.04, 0.035 * fw); g.rotation.y = fw > 0 ? -0.3 : Math.PI + 0.3; }
    else if (g.userData.slot === 'back') { const ch = hb.getNormalizedBoneNode('upperChest') || hb.getNormalizedBoneNode('chest'); ch.add(g); g.position.set(0, 0.0, -0.1 * fw); g.rotation.y = fw > 0 ? 0 : Math.PI; }
    else if (g.userData.slot === 'hand') { this.scene.add(g); }
    this.acc[slot] = g;
  }

  /* ---------- poses e animação ---------- */
  setMode(m) { if (this.mode !== m) { this.mode = m; this.modeT = 0; } }
  spin(turns = 1) { this.spinT = 0; this.spinTurns = turns; this.spinFrom = this.yaw; }
  on(ev, fn) { this.listeners[ev] = fn; }

  _bindDrag() {
    let lastX = 0;
    this.canvas.style.touchAction = 'none';
    this.canvas.addEventListener('pointerdown', e => { this.dragging = true; lastX = e.clientX; this.yawVel = 0; this.spinT = -1; this.canvas.setPointerCapture(e.pointerId); this.listeners.touch && this.listeners.touch(); });
    this.canvas.addEventListener('pointermove', e => { if (!this.dragging) return; const dx = e.clientX - lastX; lastX = e.clientX; this.yaw += dx * 0.012; this.yawVel = dx * 0.012 * 60; });
    const end = () => { this.dragging = false; this.idleSnap = 0; };
    this.canvas.addEventListener('pointerup', end); this.canvas.addEventListener('pointercancel', end);
  }
  _pose(dt) {
    const vrm = this.vrm; if (!vrm) return;
    const hb = vrm.humanoid, t = this.t, mt = this.modeT, fw = vrm.gm.m.bf;
    const T = {}; // alvo: osso -> [x,y,z]
    const set = (b, x, y, z) => { T[b] = [x, y, z]; };
    const beat = t * 118 / 60 * Math.PI; // batida da música
    const hand = this.look && this.look.hand;
    // base (parada)
    set('leftUpperArm', 0, 0, 1.25); set('rightUpperArm', 0, 0, -1.25);
    set('leftLowerArm', 0, 0.15, 0); set('rightLowerArm', 0, -0.15, 0);
    set('spine', Math.sin(t * 1.6) * 0.015, 0, 0); set('neck', 0, 0, 0); set('head', Math.sin(t * 0.9) * 0.03, Math.sin(t * 0.6) * 0.06, Math.sin(t * 0.7) * 0.03);
    set('hips', 0, 0, 0); set('leftUpperLeg', 0, 0, 0); set('rightUpperLeg', 0, 0, 0); set('leftLowerLeg', 0, 0, 0); set('rightLowerLeg', 0, 0, 0);
    let hipsY = 0;
    if (this.mode === 'idle') {
      set('leftUpperArm', 0, 0, 1.2 + Math.sin(t * 1.6) * 0.03); set('rightUpperArm', 0, 0, -1.2 - Math.sin(t * 1.6) * 0.03);
      if (hand && hand !== 'nenhum') { set('rightUpperArm', 0, -0.55 * fw, -1.0); set('rightLowerArm', 0, -1.9 * fw, 0); set('rightHand', 0, 0, 0.2); }
      set('leftUpperArm', 0, 0.3 * fw, 1.0); set('leftLowerArm', 0, 1.6 * fw, 0); set('leftHand', 0, 0, -0.3); // mão na cintura
    } else if (this.mode === 'wave') {
      set('rightUpperArm', 0, -0.2 * fw, 0.35); set('rightLowerArm', 0, 0, 0.6 + Math.sin(t * 10) * 0.45);
      set('head', 0, 0, 0.12);
      if (mt > 2.2) this.setMode('idle');
    } else if (this.mode === 'dance') {
      const b = Math.sin(beat), ab = Math.abs(b), phase = Math.floor(t * 118 / 60 / 2) % 4;
      hipsY = -ab * 0.035;
      set('hips', 0, Math.sin(beat / 2) * 0.25, Math.sin(beat) * 0.05);
      set('spine', 0.05, -Math.sin(beat / 2) * 0.15, -Math.sin(beat) * 0.08);
      set('head', 0, Math.sin(beat / 2) * 0.15, Math.sin(beat) * 0.12);
      set('leftUpperLeg', -0.25 * ab, 0, 0.05); set('rightUpperLeg', -0.25 * ab, 0, -0.05);
      set('leftLowerLeg', 0.45 * ab, 0, 0); set('rightLowerLeg', 0.45 * ab, 0, 0);
      if (phase === 0) { set('rightUpperArm', 0, 0, -0.1 + b * 0.3); set('rightLowerArm', 0, 0, 0.2); set('leftUpperArm', 0, 0.3 * fw, 1.0); set('leftLowerArm', 0, 1.6 * fw, 0); }
      else if (phase === 1) { set('leftUpperArm', 0, 0, 0.1 - b * 0.3); set('leftLowerArm', 0, 0, -0.2); set('rightUpperArm', 0, -0.3 * fw, -1.0); set('rightLowerArm', 0, -1.6 * fw, 0); }
      else if (phase === 2) { set('leftUpperArm', 0, -0.6 * fw, 0.5 + b * 0.3); set('rightUpperArm', 0, 0.6 * fw, -0.5 - b * 0.3); set('leftLowerArm', 0, 0.8 * fw, 0); set('rightLowerArm', 0, -0.8 * fw, 0); }
      else { set('leftUpperArm', 0, 0, 0.25 + ab * 0.3); set('rightUpperArm', 0, 0, -0.25 - ab * 0.3); set('leftLowerArm', 0, 0, 0.4 * b); set('rightLowerArm', 0, 0, 0.4 * b); }
      if (hand && hand !== 'nenhum' && phase !== 0 && phase !== 2) { set('rightUpperArm', 0, -0.55 * fw, -1.0); set('rightLowerArm', 0, -1.9 * fw, 0); }
    } else if (this.mode === 'pose') {
      set('rightUpperArm', 0, 0, -0.25); set('rightLowerArm', 0, 0, 0.3);
      set('leftUpperArm', 0, 0.3 * fw, 1.0); set('leftLowerArm', 0, 1.6 * fw, 0);
      set('head', 0, 0, 0.15); set('hips', 0, 0, 0.06);
    }
    // aplica com suavização
    const k = 1 - Math.pow(0.0005, dt);
    for (const b in T) {
      const node = hb.getNormalizedBoneNode(b); if (!node) continue;
      const c = this.cur[b] || (this.cur[b] = [0, 0, 0]);
      for (let i = 0; i < 3; i++) c[i] += (T[b][i] - c[i]) * k;
      node.rotation.set(c[0], c[1], c[2]);
    }
    const hips = hb.getNormalizedBoneNode('hips');
    if (!this.hipsRest) this.hipsRest = new Map();
    if (!this.hipsRest.has(vrm)) this.hipsRest.set(vrm, hips.position.y);
    hips.position.y = this.hipsRest.get(vrm) + hipsY;
    // expressões
    const em = vrm.expressionManager;
    if (em) {
      this.blinkT -= dt;
      let blink = 0;
      if (this.blinkT < 0) { blink = Math.max(0, 1 - Math.abs(this.blinkT + 0.08) / 0.08); if (this.blinkT < -0.16) this.blinkT = 2 + Math.random() * 3; }
      const happy = this.mode === 'dance' || this.mode === 'wave' ? 1 : 0.55;
      try { em.setValue('blink', blink); em.setValue('happy', happy * (1 - blink)); em.setValue('aa', this.mode === 'dance' && hand === 'microfone' ? Math.max(0, Math.sin(t * 9)) * 0.5 : 0); } catch (e) { }
    }
  }
  _placeHandItem() {
    const g = this.acc.hand; if (!g || !this.vrm) return;
    const hb = this.vrm.humanoid, fw = this.vrm.gm.m.forward;
    const hand = hb.getNormalizedBoneNode('rightHand'), low = hb.getNormalizedBoneNode('rightLowerArm');
    const p = hand.getWorldPosition(new THREE.Vector3()), pl = low.getWorldPosition(new THREE.Vector3());
    const dir = p.clone().sub(pl).normalize();
    g.position.copy(p).addScaledVector(dir, 0.055);
    // fica sempre em pé, virado como a boneca
    g.quaternion.setFromEuler(new THREE.Euler(0.25 * fw, this.holder.rotation.y, 0.15));
    if (g.userData.pulse) { const s = 1 + Math.sin(this.t * 6) * 0.08; g.userData.pulse.forEach(m => m.scale.setScalar(s)); }
    if (g.userData.spin) g.userData.spin.rotation.y = this.t * 2;
  }
  _loop() {
    if (!this.running) return;
    requestAnimationFrame(this._loop);
    const dt = Math.min(0.05, this.clock.getDelta());
    this.t += dt; this.modeT += dt; FX.uGmTime.value = this.t;
    // giro
    if (this.spinT >= 0) {
      this.spinT += dt; const d = 1.4 * this.spinTurns, p = Math.min(1, this.spinT / d);
      const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      this.yaw = this.spinFrom + e * Math.PI * 2 * this.spinTurns;
      this.holder.position.y = Math.sin(p * Math.PI) * 0.08;
      if (p >= 1) { this.spinT = -1; this.yaw = this.spinFrom; this.holder.position.y = 0; this.listeners.spinEnd && this.listeners.spinEnd(); }
    } else if (!this.dragging) {
      if (Math.abs(this.yawVel) > 0.05) { this.yaw += this.yawVel * dt; this.yawVel *= Math.pow(0.05, dt); this.idleSnap = 0; }
      else { this.idleSnap = (this.idleSnap || 0) + dt; if (this.idleSnap > 1.5) { const tgt = Math.round(this.yaw / (Math.PI * 2)) * Math.PI * 2; this.yaw += (tgt - this.yaw) * Math.min(1, dt * 3); } }
    }
    const fw = this.vrm ? this.vrm.gm.m.forward : 1;
    this.holder.rotation.y = this.yaw + (fw > 0 ? 0 : Math.PI);
    this._pose(dt);
    if (this.vrm) this.vrm.update(dt);
    this._placeHandItem();
    const w = this.acc.back; if (w && w.userData.wings) w.children.forEach(c => { c.rotation.y = c.userData.side * (0.35 + Math.sin(this.t * 3) * 0.15); });
    this.sparks.rotation.y += dt * 0.15;
    this.ring.material.color.offsetHSL(0, 0, 0);
    this.renderer.render(this.scene, this.camera);
  }

  /* foto da boneca (para miniaturas e galeria) */
  snapshot(w = 240, h = 400) {
    const r = this.renderer, cam = new THREE.PerspectiveCamera(26, w / h, 0.1, 30);
    this._frame(cam, { target: 0.82, height: 1.9 });
    const rt = new THREE.WebGLRenderTarget(w, h, { samples: 4, colorSpace: THREE.SRGBColorSpace });
    const yaw = this.holder.rotation.y, fw = this.vrm ? this.vrm.gm.m.forward : 1;
    this.holder.rotation.y = (fw > 0 ? 0 : Math.PI) - 0.3;
    if (this.vrm) { this.modeT = 0; this.mode = 'idle'; this.cur = {}; this._pose(1); this.vrm.update(0); this.scene.updateMatrixWorld(true); }
    this._placeHandItem(); this.scene.updateMatrixWorld(true);
    r.setRenderTarget(rt); r.setClearColor(0, 0); r.clear(); r.render(this.scene, cam); r.setRenderTarget(null);
    this.holder.rotation.y = yaw;
    const px = new Uint8Array(w * h * 4); r.readRenderTargetPixels(rt, 0, 0, w, h, px); rt.dispose();
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); const id = g.createImageData(w, h);
    for (let y = 0; y < h; y++) id.data.set(px.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4);
    g.putImageData(id, 0, 0);
    return c.toDataURL('image/png');
  }
}
