// Valeknaar's body: a floating AI orb with a glossy visor, an orbiting halo, floating hands and a magnifying glass,
// floating above the ground like the reference picture. Built from primitives so every part can move.
// createRobot() returns the scene group plus update(dt, state), which animates the body, eyes and arms.
import * as THREE from 'three';

// Palette matched to the site: pearly white shell, deep navy glass, the site's blue for light.
const COLORS = {
  shell: 0xeef1fb,
  visor: 0x0c1433,
  bezel: 0xbfc9ef,
  glow: 0x6ea8ff,
  accent: 0x2f5bea,
  eye: '#8cc4ff',
  eyeCore: '#e9f4ff',
  blush: 'rgba(255, 170, 150, 0.55)',
};

// Ceramic-like shell: soft lacquer, a faint periwinkle sheen at grazing angles.
const ceramic = (color = COLORS.shell, extra = {}) => new THREE.MeshPhysicalMaterial({
  color, roughness: 0.26, metalness: 0, clearcoat: 0.9, clearcoatRoughness: 0.1,
  sheen: 0.12, sheenColor: new THREE.Color(0xc9d4ff), sheenRoughness: 0.5, envMapIntensity: 0.55, ...extra,
});
const glowMat = () => new THREE.MeshBasicMaterial({ color: COLORS.glow, toneMapped: false });


// ---- face: eyes drawn on a canvas, so expressions are just a redraw ----
function createFace() {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);                                  // draw in 320x200 units at twice the resolution
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;                          // smooth at small sizes (mipmaps on), no sparkle
  let last = '';

  // Soft rounded eye: a glowing capsule with a lighter core and a small highlight.
  function softEye(cx, cy, w, h) {
    const grad = ctx.createLinearGradient(0, cy - h / 2, 0, cy + h / 2);
    grad.addColorStop(0, COLORS.eyeCore);
    grad.addColorStop(1, COLORS.eye);
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

  /** Redraw the face. expression: neutral | happy | curious | talk | dizzy | surprised; blink 0..1; look -1..1. */
  function draw({ expression = 'neutral', blink = 0, look = 0, mouth = 0 }) {
    const key = `${expression}|${blink.toFixed(2)}|${look.toFixed(2)}|${mouth.toFixed(2)}`;
    if (key === last) return;
    last = key;
    ctx.clearRect(0, 0, 320, 200);
    ctx.fillStyle = COLORS.eye;
    ctx.strokeStyle = COLORS.eye;
    ctx.shadowColor = COLORS.eye;
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
      // a little blush under each eye
      ctx.save();
      ctx.shadowBlur = 0;
      ctx.fillStyle = COLORS.blush;
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

function createMagnifier() {
  const group = new THREE.Group();
  const chrome = new THREE.MeshStandardMaterial({ color: 0xe8ecf8, metalness: 0.9, roughness: 0.22 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.028, 16, 48), chrome);
  group.add(ring);
  const glowRing = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.008, 8, 48, Math.PI * 0.5), glowMat());
  glowRing.position.z = 0.03;
  glowRing.rotation.z = Math.PI * 1.1;
  group.add(glowRing);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.19, 40), new THREE.MeshPhysicalMaterial({
    color: 0xdbe8ff, transparent: true, opacity: 0.2, roughness: 0.05,
  }));
  group.add(lens);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.32, 16), ceramic(COLORS.accent, { roughness: 0.3 }));
  handle.position.set(0, -0.36, 0);
  group.add(handle);
  return group;
}

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

// ---- the robot: a floating AI orb ----
const R = 0.42;          // head radius
const BASE_Y = 0.8;      // hover height of the head's centre

export function createRobot() {
  const root = new THREE.Group();      // moved around the page
  const chassis = new THREE.Group();   // yaw (turning)
  root.add(chassis);

  // The head floats; it leans, turns and bobs as a whole.
  const body = new THREE.Group();
  body.position.y = BASE_Y;
  chassis.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 48), ceramic());
  head.scale.set(1.08, 0.94, 1);
  body.add(head);

  // Visor: bands of slightly larger spheres across the front (light rim, navy glass with the eyes).
  const face = createFace();
  const mask = roundedMask(0.45);
  const band = (radius, width, height, centre = Math.PI / 2 + 0.03) =>
    new THREE.SphereGeometry(radius, 64, 32, Math.PI / 2 - width / 2, width, centre - height / 2, height);
  const bezel = new THREE.Mesh(band(R * 1.012, 2.05, 0.92), ceramic(COLORS.bezel, { roughness: 0.4, alphaMap: mask, transparent: true }));
  head.add(bezel);
  const glass = new THREE.Mesh(band(R * 1.024, 1.88, 0.78), new THREE.MeshPhysicalMaterial({
    color: COLORS.visor, roughness: 0.1, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.04,
    emissive: 0xffffff, emissiveMap: face.texture, alphaMap: mask, transparent: true,
    toneMapped: false,                                // keep the eyes' glow saturated
  }));
  head.add(glass);

  // Ears: small light discs ringed with light.
  for (const side of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(side * R * 0.99, 0.02, 0);
    ear.rotation.y = side * Math.PI / 2;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 32), ceramic(COLORS.bezel));
    disc.rotation.x = Math.PI / 2;
    ear.add(disc);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.064, 0.007, 8, 40), glowMat());
    ring.position.z = 0.016;
    ear.add(ring);
    head.add(ear);
  }

  // Halo: a thin tilted ring of light orbiting the head, with a small light travelling along it.
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.009, 10, 160), glowMat());
  halo.rotation.x = Math.PI / 2 - 0.38;
  halo.rotation.y = 0.18;
  body.add(halo);
  const satellite = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), glowMat());
  satellite.position.x = 0.64;
  halo.add(satellite);

  // Halo bloom: a wide, faint ring around the thin one, like light spilling from it.
  const haloGlow = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.04, 10, 160), new THREE.MeshBasicMaterial({
    color: COLORS.glow, transparent: true, opacity: 0.16, depthWrite: false, toneMapped: false,
  }));
  halo.add(haloGlow);

  // Aura: a soft blue glow behind the head so the orb stands out on a light page.
  const aura = new THREE.Sprite(new THREE.SpriteMaterial({
    map: radialTexture('rgba(110,168,255,0.5)', 'rgba(110,168,255,0.16)'), transparent: true, depthWrite: false, toneMapped: false,
  }));
  aura.scale.set(1.9, 1.9, 1);
  aura.position.z = -0.7;
  body.add(aura);

  // Visor shine: a soft reflection streak across the top of the glass.
  const shine = new THREE.Mesh(band(R * 1.032, 1.45, 0.1, Math.PI / 2 - 0.2), new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0.22, depthWrite: false, alphaMap: mask,
  }));
  head.add(shine);

  // Hover jet: a soft ring of light under the head.
  const jet = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.012, 10, 48), glowMat());
  jet.rotation.x = Math.PI / 2;
  jet.position.y = -R * 0.94 - 0.05;
  body.add(jet);

  // Hover beam: light fading downwards from the jet, like a small thruster.
  const beamCanvas = document.createElement('canvas');
  beamCanvas.width = 4;
  beamCanvas.height = 64;
  const bctx = beamCanvas.getContext('2d');
  const bgrad = bctx.createLinearGradient(0, 0, 0, 64);
  bgrad.addColorStop(0, 'rgba(110,168,255,0.6)');
  bgrad.addColorStop(1, 'rgba(110,168,255,0)');
  bctx.fillStyle = bgrad;
  bctx.fillRect(0, 0, 4, 64);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.19, 0.3, 32, 1, true), new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(beamCanvas), transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
  }));
  beam.position.y = jet.position.y - 0.15;
  body.add(beam);

  // Floating hands: they swing around a shoulder pivot (wave, point, hold the magnifier).
  const arms = [-1, 1].map((side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.53, -0.1, 0.06);
    const hand = new THREE.Group();
    hand.position.y = -0.2;
    const palm = new THREE.Mesh(new THREE.SphereGeometry(0.08, 32, 24), ceramic());
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

  // Magnifying glass held up in front of the visor.
  const magnifier = createMagnifier();
  magnifier.scale.setScalar(0.8);
  magnifier.position.set(-0.2, -0.02, 0.5);
  magnifier.rotation.set(0.05, 0.28, -0.55);
  body.add(magnifier);

  // Soft contact shadow
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 64;
  const sctx = shadowCanvas.getContext('2d');
  const grad = sctx.createRadialGradient(32, 32, 2, 32, 32, 32);
  grad.addColorStop(0, 'rgba(24,34,84,0.24)');
  grad.addColorStop(1, 'rgba(24,34,84,0)');
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, 64, 64);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.56), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.002;
  root.add(shadow);

  // Hover glow on the ground under the jet.
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowCanvas.height = 128;
  const gctx = glowCanvas.getContext('2d');
  const ggrad = gctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  ggrad.addColorStop(0, 'rgba(110,168,255,0.85)');
  ggrad.addColorStop(0.4, 'rgba(110,168,255,0.35)');
  ggrad.addColorStop(1, 'rgba(110,168,255,0)');
  gctx.fillStyle = ggrad;
  gctx.fillRect(0, 0, 128, 128);
  const hoverGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.4), new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(glowCanvas), transparent: true, depthWrite: false, opacity: 0, toneMapped: false,
  }));
  hoverGlow.rotation.x = -Math.PI / 2;
  hoverGlow.position.y = 0.05;
  root.add(hoverGlow);

  // ---- animation ----
  let time = 0, blinkTimer = 2 + Math.random() * 2, blink = 0;

  /**
   * Advance the animation.
   * state: { speed (units/s, signed), yaw, headYaw, look (-1..1), expression, wave (0..1),
   *          point (0..1), magnify (bool), talking (bool), hover (0..1 glow), lift (units above ground) }
   */
  function update(dt, state) {
    time += dt;
    const lift = state.lift || 0;
    shadow.position.y = 0.002 - lift;
    shadow.scale.setScalar(Math.max(0.35, 1 - lift * 0.9));
    shadow.material.opacity = Math.max(0, 1 - lift * 0.8);
    hoverGlow.material.opacity = Math.max(0.35, state.hover || 0) * (0.75 + Math.sin(time * 6) * 0.15);
    hoverGlow.scale.setScalar(0.9 + Math.sin(time * 6) * 0.05);
    jet.scale.setScalar(1 + Math.sin(time * 6) * 0.08);
    beam.material.opacity = 0.8 + Math.sin(time * 6) * 0.15;
    aura.material.opacity = 0.85 + Math.sin(time * 1.5) * 0.15;

    chassis.rotation.y += (state.yaw - chassis.rotation.y) * Math.min(1, dt * 6);
    body.position.y = BASE_Y + Math.sin(time * 2) * 0.02;   // gentle float
    body.rotation.y += ((state.headYaw || 0) - body.rotation.y) * Math.min(1, dt * 5);
    const lean = Math.max(-0.14, Math.min(0.14, (state.speed || 0) * 0.035));
    body.rotation.x += (lean - body.rotation.x) * Math.min(1, dt * 3);
    const tilt = state.expression === 'curious' ? 0.12 : 0;
    body.rotation.z += (tilt - body.rotation.z) * Math.min(1, dt * 4);

    halo.rotation.z += dt * 0.9;                              // the light travels round the halo

    magnifier.visible = !!state.magnify;
    for (const { shoulder, side } of arms) {
      // rest pose, a slow breath, and a trailing swing when the robot speeds up or slows down
      let roll = side * -0.06 + Math.sin(time * 1.6 + side * 0.8) * 0.03 + (state.swing || 0) * 0.45;
      let pitch = 0;
      if (side === 1 && state.wave) roll = side * (2.5 + Math.sin(time * 12) * 0.35) * state.wave;
      if (side === -1 && state.point) { roll = side * 1.4 * state.point; pitch = -0.5 * state.point; }
      if (side === -1 && state.magnify && !state.point) { roll = -0.12; pitch = -0.45; }
      shoulder.rotation.z += (roll - shoulder.rotation.z) * Math.min(1, dt * 7);
      shoulder.rotation.x += (pitch - shoulder.rotation.x) * Math.min(1, dt * 7);
    }

    blinkTimer -= dt;
    if (blinkTimer < 0) { blink = 1; blinkTimer = 2.5 + Math.random() * 3; }
    blink = Math.max(0, blink - dt * 7);
    face.draw({
      expression: state.talking ? 'talk' : state.expression,
      blink: ['happy', 'dizzy', 'surprised'].includes(state.expression) ? 0 : blink,
      look: state.look || 0,
      mouth: state.talking ? (Math.sin(time * 18) + 1) / 2 : 0,
    });
  }

  return { root, update, height: 1.45 };
}

/**
 * Lights for the robot: a soft room reflection, key light from the upper left and a cool rim from
 * behind, so the white shell reads as a round 3D form instead of a flat cut-out.
 */
export function addRobotLights(scene, renderer, environment) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  scene.environment = environment;
  // Little flat fill, a strong key from the upper left and a blue rim behind the right edge:
  // the shading carries the round form even at a small size on a light page.
  scene.add(new THREE.HemisphereLight(0xffffff, 0x6c78a6, 0.38));
  const key = new THREE.DirectionalLight(0xfff4ea, 3.4);
  key.position.set(-3, 4.5, 4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffd9c7, 0.35);  // peach, like the page washes
  fill.position.set(-4, -1, 2);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0x9fbcff, 2.4);
  rim.position.set(3.5, 2.5, -3);
  scene.add(rim);
}
