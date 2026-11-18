// Valeknaar's body: a floating AI orb with a glossy visor, an orbiting halo, floating hands and a
// magnifying glass. Three looks share one build (neon, chrome, glass core).
// createRobot({ look }) returns the scene group plus update(dt, state), which animates everything.
import * as THREE from 'three';

export const DEFAULT_LOOK = 'aurora';

export const LOOKS = {
  // dark graphite shell, cyan neon light
  neon: {
    shell: { color: 0x1b2131, roughness: 0.28, metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.08 },
    trim: { color: 0x2c3449, roughness: 0.35, metalness: 0.4, clearcoat: 1, clearcoatRoughness: 0.1 },
    visor: 0x04060c, glow: 0x3ee8ff, eye: '#5cf2ff', eyeCore: '#ecfeff', aura: 'rgba(62,232,255,0.45)', auraMid: 'rgba(62,232,255,0.14)',
    sparks: ['#00c2e8', '#3a86ff', '#ff6b57', '#ffbe0b', '#7b61ff'],
  },
  // mirror-polished metal, blue light
  chrome: {
    shell: { color: 0xeef2fa, roughness: 0.1, metalness: 1, clearcoat: 1, clearcoatRoughness: 0.05 },
    trim: { color: 0x9fb0d6, roughness: 0.18, metalness: 1 },
    visor: 0x0b1230, glow: 0x6ea8ff, eye: '#8cc4ff', eyeCore: '#e9f4ff', aura: 'rgba(110,168,255,0.45)', auraMid: 'rgba(110,168,255,0.14)',
    sparks: ['#3a86ff', '#00c2e8', '#ff6b57', '#ffbe0b'],
  },
  // smoked glass orb: a dark translucent shell, a cool aurora glowing inside, two bright eyes
  smoke: {
    shell: {
      color: 0x0f1324, roughness: 0.08, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.04,
      transparent: true, opacity: 0.6, depthWrite: false,
      iridescence: 0.7, iridescenceIOR: 1.35, iridescenceThicknessRange: [180, 520],
      sheen: 0.6, sheenColor: 0x8fb4ff, sheenRoughness: 0.3,
    },
    trim: { color: 0x1c2238, roughness: 0.2, metalness: 0.3, clearcoat: 1 },
    visor: 0x0a0f24,
    glow: 0x8b9cff, eye: '#dff6ff', eyeCore: '#ffffff',
    aura: 'rgba(139,156,255,0.42)', auraMid: 'rgba(34,211,238,0.14)',
    sparks: ['#6d5dfc', '#22d3ee', '#a855f7', '#ffbe0b'],
    core: ['#6d5dfc', '#22d3ee', '#a855f7'],
    coreRadius: 0.3,
    eyesOnly: true,
    minimal: true,
  },
  // faceless aurora orb: a clear shell around a vivid swirl of light, no eyes
  aurora: {
    shell: {
      color: 0xf4f7ff, roughness: 0.05, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03,
      transparent: true, opacity: 0.22, depthWrite: false,
      iridescence: 1, iridescenceIOR: 1.33, iridescenceThicknessRange: [140, 520],
    },
    trim: { color: 0xffffff, roughness: 0.2, metalness: 0, clearcoat: 1 },
    visor: 0x0a0f24,
    glow: 0x8b9cff, eye: '#dff6ff', eyeCore: '#ffffff',
    aura: 'rgba(139,156,255,0.42)', auraMid: 'rgba(34,211,238,0.14)',
    sparks: ['#6d5dfc', '#22d3ee', '#a855f7', '#ffbe0b'],
    core: ['#6d5dfc', '#22d3ee', '#a855f7'],
    coreRadius: 0.37,
    faceless: true,
    minimal: true,
  },
  // modern liquid glass: clear iridescent shell around a swirling aurora core
  glass: {
    shell: {
      color: 0xf4f7ff, roughness: 0.05, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03,
      transparent: true, opacity: 0.26, depthWrite: false,
      iridescence: 1, iridescenceIOR: 1.33, iridescenceThicknessRange: [140, 520],
      sheen: 1, sheenColor: 0xd7ecff, sheenRoughness: 0.28,
    },
    trim: { color: 0xffffff, roughness: 0.2, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, iridescence: 0.6, iridescenceIOR: 1.3 },
    visor: 0x0a0f24,
    eyesOnly: true,                                        // just two glowing eyes on the glass
    minimal: true,                                         // orb, aurora and eyes: no rings, hands or beams
    glow: 0xb39bff, eye: '#c9f3ff', eyeCore: '#ffffff',
    aura: 'rgba(167,139,250,0.42)', auraMid: 'rgba(244,114,182,0.14)',
    sparks: ['#7b61ff', '#ff5cc8', '#2ad4ff', '#ffbe0b'],
    core: ['#7b61ff', '#ff5cc8', '#2ad4ff'],
  },
};

const surface = (spec, extra = {}) => new THREE.MeshPhysicalMaterial({ envMapIntensity: 0.9, ...spec, ...extra });

/** A soft radial gradient texture (centre colour fading out), for glows. */
function radialTexture(inner, middle) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
  grad.addColorStop(0, inner);
  grad.addColorStop(0.5, middle);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

// ---- face: eyes drawn on a canvas, so expressions are just a redraw ----
function createFace(palette) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);                                  // draw in 320x200 units at twice the resolution
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  let last = '';

  // Soft rounded eye: a glowing capsule with a lighter core and a small highlight.
  function softEye(cx, cy, w, h) {
    const grad = ctx.createLinearGradient(0, cy - h / 2, 0, cy + h / 2);
    grad.addColorStop(0, palette.eyeCore);
    grad.addColorStop(1, palette.eye);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(cx - w / 2, cy - h / 2, w, h, Math.min(w, h) / 2);
    ctx.fill();
    if (h > 18) {
      ctx.save();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.arc(cx + w * 0.18, cy - h * 0.24, Math.max(2, w * 0.16), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /** expression: neutral | happy | curious | talk | dizzy | surprised; blink 0..1; look -1..1; scan 0..1 or -1. */
  function draw({ expression = 'neutral', blink = 0, look = 0, mouth = 0, scan = -1 }) {
    const key = `${expression}|${blink.toFixed(2)}|${look.toFixed(2)}|${mouth.toFixed(2)}|${scan.toFixed(2)}`;
    if (key === last) return;
    last = key;
    ctx.clearRect(0, 0, 320, 200);
    ctx.fillStyle = palette.eye;
    ctx.strokeStyle = palette.eye;
    ctx.shadowColor = palette.eye;
    ctx.shadowBlur = 18;
    const dx = look * 26;
    const eyes = [[118 + dx, 96], [202 + dx, 96]];
    if (expression === 'dizzy') {
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      for (const [x, y] of eyes) {
        ctx.beginPath();
        ctx.moveTo(x - 16, y - 16); ctx.lineTo(x + 16, y + 16);
        ctx.moveTo(x + 16, y - 16); ctx.lineTo(x - 16, y + 16);
        ctx.stroke();
      }
    } else if (expression === 'surprised') {
      ctx.lineWidth = 9;
      for (const [x, y] of eyes) {
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (expression === 'happy') {
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      for (const [x, y] of eyes) {
        ctx.beginPath();
        ctx.arc(x, y + 12, 17, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      }
      ctx.save();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255, 170, 150, 0.55)';
      for (const [x, y] of eyes) {
        ctx.beginPath();
        ctx.ellipse(x + (x < 160 ? -14 : 14), y + 30, 14, 7, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else {
      const open = Math.max(0.12, 1 - blink);
      for (const [i, [x, y]] of eyes.entries()) {
        const big = expression === 'curious' && i === 1 ? 1.2 : 1;
        softEye(x, y, 26 * big, 50 * big * open);
      }
    }
    if (expression === 'talk') {
      const w = 26 + mouth * 14;
      ctx.beginPath();
      ctx.roundRect(160 - w / 2 + dx * 0.5, 152, w, 6, 3);
      ctx.fill();
    }
    // Scan line: a soft bar of light sweeping across the visor now and then.
    if (scan >= 0) {
      const x = scan * 360 - 20;
      const grad = ctx.createLinearGradient(x - 26, 0, x + 26, 0);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.5, 'rgba(255,255,255,0.35)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.save();
      ctx.shadowBlur = 0;
      ctx.fillStyle = grad;
      ctx.fillRect(x - 26, 0, 52, 200);
      ctx.restore();
    }
    texture.needsUpdate = true;
  }

  return { texture, draw };
}

// Rounded-rectangle mask, used as alphaMap so the visor bands get soft corners.
function roundedMask(radius = 0.28) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 160;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 256, 160);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.roundRect(2, 2, 252, 156, 160 * radius);
  ctx.fill();
  return new THREE.CanvasTexture(c);
}

function createMagnifier(palette) {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.028, 16, 48), surface({ color: 0xe8ecf8, metalness: 0.9, roughness: 0.22 }));
  group.add(ring);
  const glowRing = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.008, 8, 48, Math.PI * 0.5), new THREE.MeshBasicMaterial({ color: palette.glow, toneMapped: false }));
  glowRing.position.z = 0.03;
  glowRing.rotation.z = Math.PI * 1.1;
  group.add(glowRing);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.19, 40), new THREE.MeshPhysicalMaterial({
    color: 0xdbe8ff, transparent: true, opacity: 0.2, roughness: 0.05,
  }));
  group.add(lens);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.32, 16), surface(palette.trim));
  handle.position.set(0, -0.36, 0);
  group.add(handle);
  return group;
}

// ---- the robot ----
const R = 0.42;          // head radius
const BASE_Y = 0.8;      // hover height of the head's centre

export function createRobot({ look = DEFAULT_LOOK } = {}) {
  const palette = LOOKS[look] ?? LOOKS[DEFAULT_LOOK];
  const minimal = !!palette.minimal;
  const glowMats = [];
  const glowMat = (extra = {}) => {
    const material = new THREE.MeshBasicMaterial({ color: palette.glow, toneMapped: false, ...extra });
    glowMats.push(material);
    return material;
  };
  const WHITE_GLOW = ['rgba(255,255,255,0.5)', 'rgba(255,255,255,0.15)'];

  const root = new THREE.Group();      // moved around the page
  const chassis = new THREE.Group();   // yaw (turning)
  root.add(chassis);

  // The head floats; it leans, turns and bobs as a whole.
  const body = new THREE.Group();
  body.position.y = BASE_Y;
  chassis.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 48), surface(palette.shell));
  head.scale.set(1.08, 0.94, 1);
  head.renderOrder = 2;
  body.add(head);

  // Glass look: an aurora of light swirling inside the clear shell.
  let core = null, coreUniforms = null, coreGlow = null;
  if (palette.core) {
    coreUniforms = {
      uTime: { value: 0 },
      uA: { value: new THREE.Color(palette.core[0]) },
      uB: { value: new THREE.Color(palette.core[1]) },
      uC: { value: new THREE.Color(palette.core[2]) },
    };
    const coreMat = new THREE.ShaderMaterial({
      uniforms: coreUniforms,
      vertexShader: `
        varying vec3 vNormal; varying vec3 vPos;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform float uTime; uniform vec3 uA; uniform vec3 uB; uniform vec3 uC;
        varying vec3 vNormal; varying vec3 vPos;
        void main() {
          float t = uTime * 0.7;
          float w1 = 0.5 + 0.5 * sin(vPos.x * 9.0 + t * 1.3 + sin(vPos.y * 8.0 + t));
          float w2 = 0.5 + 0.5 * sin(vPos.y * 10.0 - t * 1.1 + sin(vPos.z * 9.0 - t * 0.8));
          vec3 colour = mix(mix(uA, uB, w1), uC, w2 * 0.7);
          float rim = pow(1.0 - abs(vNormal.z), 2.2);
          gl_FragColor = vec4(colour * 1.15 + rim * 0.45, 1.0);
          #include <colorspace_fragment>
        }`,
    });
    core = new THREE.Group();
    core.add(new THREE.Mesh(new THREE.SphereGeometry(palette.coreRadius ?? 0.27, 48, 32), coreMat));
    coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTexture(...WHITE_GLOW), color: palette.core[1], transparent: true, depthWrite: false, toneMapped: false }));
    coreGlow.scale.set(1.15, 1.15, 1);
    core.add(coreGlow);
    core.position.set(0, 0.02, -0.06);
    body.add(core);
  }

  // Visor: bands of slightly larger spheres across the front (rim, glass with the eyes, shine).
  const face = createFace(palette);
  const mask = roundedMask(0.45);
  const band = (radius, width, height, centre = Math.PI / 2 + 0.03) =>
    new THREE.SphereGeometry(radius, 64, 32, Math.PI / 2 - width / 2, width, centre - height / 2, height);
  if (palette.faceless) {
    // no face: the orb itself shows the mood (pulse, bounce, wiggle)
  } else if (palette.eyesOnly) {
    // Only the eyes, glowing on the glass over the aurora.
    const eyes = new THREE.Mesh(band(R * 1.03, 1.55, 0.74, Math.PI / 2 - 0.1), new THREE.MeshBasicMaterial({
      map: face.texture, transparent: true, depthWrite: false, toneMapped: false,
    }));
    eyes.renderOrder = 3;
    head.add(eyes);
  } else {
    const vw = 1.88, vh = 0.78, vc = Math.PI / 2 + 0.03;
    const bezel = new THREE.Mesh(band(R * 1.012, vw + 0.17, vh + 0.14, vc), surface(palette.trim, { alphaMap: mask, transparent: true }));
    head.add(bezel);
    const glass = new THREE.Mesh(band(R * 1.024, vw, vh, vc), new THREE.MeshPhysicalMaterial({
      color: palette.visor, roughness: 0.1, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.04,
      emissive: 0xffffff, emissiveMap: face.texture, alphaMap: mask, transparent: true, toneMapped: false,
    }));
    head.add(glass);
    const shine = new THREE.Mesh(band(R * 1.032, vw * 0.77, vh * 0.13, vc - vh / 2 + vh * 0.2), new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.22, depthWrite: false, alphaMap: mask,
    }));
    head.add(shine);
  }

  // Seam: a thin line of light around the head, below the visor.
  if (!minimal) {
    const seam = new THREE.Mesh(new THREE.TorusGeometry(R * 0.985, 0.0055, 8, 128), glowMat());
    seam.rotation.x = Math.PI / 2;
    seam.position.y = -0.2;
    seam.scale.set(1.08, 1, 1);
    body.add(seam);
  }

  // Ears: small discs ringed with light.
  for (const side of minimal ? [] : [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(side * R * 0.99, 0.02, 0);
    ear.rotation.y = side * Math.PI / 2;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 32), surface(palette.trim));
    disc.rotation.x = Math.PI / 2;
    ear.add(disc);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.064, 0.007, 8, 40), glowMat());
    ring.position.z = 0.016;
    ear.add(ring);
    head.add(ear);
  }

  // Halo: a thin tilted ring of light with a soft bloom and a light travelling along it.
  let halo = null;
  if (!minimal) {
    halo = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.009, 10, 160), glowMat());
    halo.rotation.x = Math.PI / 2 - 0.38;
    halo.rotation.y = 0.18;
    body.add(halo);
    halo.add(new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.04, 10, 160), glowMat({ transparent: true, opacity: 0.16, depthWrite: false })));
    const satellite = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), glowMat());
    satellite.position.x = 0.64;
    halo.add(satellite);
  }

  // Motes: tiny lights orbiting on their own tilted paths.
  const motes = (minimal ? [] : [[0.82, 0.9, 1.3], [0.74, -0.6, -1.7], [0.9, 0.3, 0.9]]).map(([radius, tilt, speed]) => {
    const orbit = new THREE.Group();
    orbit.rotation.set(tilt, 0, tilt * 0.6);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), glowMat());
    dot.position.x = radius;
    orbit.add(dot);
    body.add(orbit);
    return { orbit, speed };
  });

  // Aura: a soft glow behind the head so it stands out on any page.
  const aura = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTexture(...WHITE_GLOW), color: palette.glow, transparent: true, depthWrite: false, toneMapped: false }));
  aura.scale.setScalar(minimal ? 1.45 : 1.9);
  const auraStrength = minimal ? 0.5 : 1;
  aura.position.z = -0.7;
  body.add(aura);

  // Hover jet and beam under the head.
  let jet = null, beam = null;
  if (!minimal) {
  jet = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.012, 10, 48), glowMat());
  jet.rotation.x = Math.PI / 2;
  jet.position.y = -R * 0.94 - 0.05;
  body.add(jet);
  const beamCanvas = document.createElement('canvas');
  beamCanvas.width = 4;
  beamCanvas.height = 64;
  const bctx = beamCanvas.getContext('2d');
  const bgrad = bctx.createLinearGradient(0, 0, 0, 64);
  bgrad.addColorStop(0, 'rgba(255,255,255,0.6)');
  bgrad.addColorStop(1, 'rgba(0,0,0,0)');
  bctx.fillStyle = bgrad;
  bctx.fillRect(0, 0, 4, 64);
  beam = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.19, 0.3, 32, 1, true), new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(beamCanvas), color: palette.glow, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
  }));
  beam.position.y = jet.position.y - 0.15;
  body.add(beam);
  }

  // Floating hands: they swing around a shoulder pivot (wave, point, hold the magnifier).
  const arms = (minimal ? [] : [-1, 1]).map((side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.53, -0.1, 0.06);
    const hand = new THREE.Group();
    hand.position.y = -0.2;
    const palm = new THREE.Mesh(new THREE.SphereGeometry(0.08, 32, 24), surface(palette.shell.transparent ? palette.trim : palette.shell));
    palm.scale.set(1, 1.12, 0.9);
    hand.add(palm);
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.006, 8, 32), glowMat());
    cuff.rotation.x = Math.PI / 2;
    cuff.position.y = 0.06;
    hand.add(cuff);
    shoulder.add(hand);
    shoulder.rotation.z = side * -0.06;
    body.add(shoulder);
    return { shoulder, hand, side };
  });

  const magnifier = minimal ? null : createMagnifier(palette);
  if (magnifier) {
    magnifier.scale.setScalar(0.8);
    magnifier.position.set(-0.2, -0.02, 0.5);
    magnifier.rotation.set(0.05, 0.28, -0.55);
    body.add(magnifier);
  }

  // Soft contact shadow and hover glow on the ground.
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.56), new THREE.MeshBasicMaterial({
    map: radialTexture('rgba(24,34,84,0.24)', 'rgba(24,34,84,0.1)'), transparent: true, depthWrite: false,
  }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.002;
  shadow.visible = !minimal;            // the orb floats beside text: no ground shadow under it
  root.add(shadow);
  const hoverGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.4), new THREE.MeshBasicMaterial({
    map: radialTexture(...WHITE_GLOW), color: palette.glow, transparent: true, depthWrite: false, opacity: 0, toneMapped: false,
  }));
  hoverGlow.rotation.x = -Math.PI / 2;
  hoverGlow.position.y = 0.05;
  root.add(hoverGlow);

  // ---- colour theme: eases towards the colours of the section on screen ----
  const theme = { glow: new THREE.Color(palette.glow) };
  const themeTarget = { glow: new THREE.Color(palette.glow) };
  if (coreUniforms) {
    for (const key of ['a', 'b', 'c']) {
      theme[key] = coreUniforms[`u${key.toUpperCase()}`].value;
      themeTarget[key] = theme[key].clone();
    }
  }
  function setTheme(colours) {
    for (const key of Object.keys(themeTarget)) if (colours[key]) themeTarget[key].set(colours[key]);
  }
  function easeTheme(dt) {
    const k = Math.min(1, dt * 2.5);
    for (const key of Object.keys(theme)) theme[key].lerp(themeTarget[key], k);
    for (const material of glowMats) material.color.copy(theme.glow);
    aura.material.color.copy(theme.glow);
    if (beam) beam.material.color.copy(theme.glow);
    hoverGlow.material.color.copy(theme.glow);
    if (coreGlow) coreGlow.material.color.copy(theme.b);
  }

  // ---- animation ----
  let time = 0, blinkTimer = 2 + Math.random() * 2, blink = 0, scanTimer = 2.5, scan = -1;

  /**
   * Advance the animation.
   * state: { speed (units/s, signed), yaw, headYaw, look (-1..1), expression, wave (0..1),
   *          point (0..1), magnify (bool), talking (bool), hover (0..1 glow), lift (units above ground) }
   */
  function update(dt, state) {
    time += dt;
    easeTheme(dt);
    const lift = state.lift || 0;
    shadow.position.y = 0.002 - lift;
    shadow.scale.setScalar(Math.max(0.35, 1 - lift * 0.9));
    shadow.material.opacity = Math.max(0, 1 - lift * 0.8);
    hoverGlow.material.opacity = Math.max(0.35, state.hover || 0) * (0.75 + Math.sin(time * 6) * 0.15);
    hoverGlow.scale.setScalar(0.9 + Math.sin(time * 6) * 0.05);
    if (jet) jet.scale.setScalar(1 + Math.sin(time * 6) * 0.08);
    if (beam) beam.material.opacity = 0.8 + Math.sin(time * 6) * 0.15;
    aura.material.opacity = (0.85 + Math.sin(time * 1.5) * 0.15) * auraStrength;
    hoverGlow.visible = !minimal;

    chassis.rotation.y += (state.yaw - chassis.rotation.y) * Math.min(1, dt * 6);
    body.position.y = BASE_Y + Math.sin(time * 2) * 0.02;
    body.rotation.y += ((state.headYaw || 0) - body.rotation.y) * Math.min(1, dt * 5);
    const lean = Math.max(-0.14, Math.min(0.14, (state.speed || 0) * 0.035));
    body.rotation.x += (lean - body.rotation.x) * Math.min(1, dt * 3);
    let tilt = state.expression === 'curious' ? 0.12 : 0;
    if (minimal) {
      // body language instead of hands: a happy wiggle, and a lean towards what it shows
      if (state.wave) tilt = Math.sin(time * 9) * 0.12;
      if (state.pointRight) tilt = -0.2;
    }
    body.rotation.z += (tilt - body.rotation.z) * Math.min(1, dt * 6);

    if (halo) halo.rotation.z += dt * 0.9;
    for (const { orbit, speed } of motes) orbit.rotation.y += dt * speed;
    if (core) {
      coreUniforms.uTime.value = time * (state.talking ? 2.2 : 1);
      core.rotation.y += dt * 0.6;
      const talkPulse = palette.faceless && state.talking ? Math.abs(Math.sin(time * 9)) * 0.08 : 0;
      core.scale.setScalar(1 + Math.sin(time * 2.2) * 0.05 + talkPulse);
    }

    if (magnifier) magnifier.visible = !!state.magnify;
    for (const { shoulder, side } of arms) {
      let roll = side * -0.06 + Math.sin(time * 1.6 + side * 0.8) * 0.03 + (state.swing || 0) * 0.45;
      let pitch = 0;
      if (side === 1 && state.wave) roll = side * (2.5 + Math.sin(time * 12) * 0.35) * state.wave;
      if (side === -1 && state.point) { roll = side * 1.4 * state.point; pitch = -0.5 * state.point; }
      if (side === -1 && state.magnify && !state.point) { roll = -0.12; pitch = -0.45; }
      if (side === 1 && state.pointRight) { roll = side * 1.3 * state.pointRight; pitch = -0.35 * state.pointRight; }
      shoulder.rotation.z += (roll - shoulder.rotation.z) * Math.min(1, dt * 7);
      shoulder.rotation.x += (pitch - shoulder.rotation.x) * Math.min(1, dt * 7);
    }

    // a scan sweep across the visor every few seconds
    scanTimer -= dt;
    if (scanTimer < 0 && scan < 0) { scan = 0; scanTimer = 4 + Math.random() * 3; }
    if (scan >= 0) { scan += dt * 1.4; if (scan > 1) scan = -1; }

    blinkTimer -= dt;
    if (blinkTimer < 0) { blink = 1; blinkTimer = 2.5 + Math.random() * 3; }
    blink = Math.max(0, blink - dt * 7);
    face.draw({
      expression: state.talking ? 'talk' : state.expression,
      blink: ['happy', 'dizzy', 'surprised'].includes(state.expression) ? 0 : blink,
      look: state.pointRight ? 1 : (state.look || 0),
      mouth: state.talking ? (Math.sin(time * 18) + 1) / 2 : 0,
      scan,
    });
  }

  // center: height of the visible body's centre; reach: its radius (both in robot units)
  return {
    root, update, setTheme, height: 1.45, sparks: palette.sparks,
    center: minimal ? BASE_Y : 0.725,
    reach: minimal ? R : 0.725,
  };
}

/**
 * Lights for the robot: little flat fill, a strong key from the upper left and a cool rim behind the
 * right edge, so the shading carries the round form even at a small size on a light page.
 */
export function addRobotLights(scene, renderer, environment) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  scene.environment = environment;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x6c78a6, 0.38));
  const key = new THREE.DirectionalLight(0xfff4ea, 3.4);
  key.position.set(-3, 4.5, 4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffd9c7, 0.35);
  fill.position.set(-4, -1, 2);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0x9fbcff, 2.4);
  rim.position.set(3.5, 2.5, -3);
  scene.add(rim);
}
