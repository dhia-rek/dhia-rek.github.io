// Valeknaar's body: an egg-shaped robot with a glossy visor, flipper arms and a magnifying glass,
// floating above the ground like the reference picture. Built from primitives so every part can move.
// createRobot() returns the scene group plus update(dt, state), which animates the body, eyes and arms.
import * as THREE from 'three';

const COLORS = {
  shell: 0xdde5ea,
  visor: 0x0b0f14,
  bezel: 0x1c232b,
  glow: 0x4fd8ff,
};

const matte = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.02, envMapIntensity: 0.45, ...extra });
const glossy = (color, extra = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.12, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08, ...extra });
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

  // Vertical eye made of horizontal glowing stripes, like a scanline display.
  function stripedEye(cx, cy, w, h) {
    const stripe = 8, gap = 3;
    for (let y = cy - h / 2; y < cy + h / 2; y += stripe + gap) {
      ctx.beginPath();
      ctx.roundRect(cx - w / 2, y, w, Math.min(stripe, cy + h / 2 - y), 2);
      ctx.fill();
    }
  }

  /** Redraw the face. expression: neutral | happy | curious | talk | dizzy | surprised; blink 0..1; look -1..1. */
  function draw({ expression = 'neutral', blink = 0, look = 0, mouth = 0 }) {
    const key = `${expression}|${blink.toFixed(2)}|${look.toFixed(2)}|${mouth.toFixed(2)}`;
    if (key === last) return;
    last = key;
    ctx.clearRect(0, 0, 320, 200);
    ctx.fillStyle = '#4fd8ff';
    ctx.strokeStyle = '#4fd8ff';
    ctx.shadowColor = '#4fd8ff';
    ctx.shadowBlur = 16;
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
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      for (const [x, y] of eyes) {
        ctx.beginPath();
        ctx.arc(x, y + 12, 17, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      }
    } else {
      const open = Math.max(0.12, 1 - blink);
      for (const [i, [x, y]] of eyes.entries()) {
        const big = expression === 'curious' && i === 1 ? 1.2 : 1;
        stripedEye(x, y, 19 * big, 54 * big * open);
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

// Egg profile: superellipse-like, fuller sides and soft round ends, a little wider at the top.
function eggPoint(t, height, width) {
  const r = Math.pow(Math.sin(t), 0.8) * width * (1 + 0.05 * -Math.cos(t));
  const y = -Math.sign(Math.cos(t)) * Math.pow(Math.abs(Math.cos(t)), 0.92) * height / 2;
  return new THREE.Vector2(Math.max(r, 0.0001), y);
}
const EGG = { height: 1.34, width: 0.56 };

function eggGeometry(height = EGG.height, width = EGG.width) {
  const points = [];
  for (let i = 0; i <= 72; i++) points.push(eggPoint((i / 72) * Math.PI, height, width));
  return new THREE.LatheGeometry(points, 96);
}

// A band of the egg's own surface between two heights and around the front, pushed out slightly:
// the visor follows the body's curve instead of sitting on it like a flat box.
function eggBand(yMin, yMax, arc, grow) {
  const points = [];
  for (let i = 0; i <= 240; i++) {
    const p = eggPoint((i / 240) * Math.PI, EGG.height, EGG.width);
    if (p.y >= yMin && p.y <= yMax) points.push(new THREE.Vector2(p.x * grow, p.y));
  }
  return new THREE.LatheGeometry(points, 48, -arc / 2, arc);
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
  const chrome = new THREE.MeshStandardMaterial({ color: 0xdfe6ee, metalness: 1, roughness: 0.18 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.028, 16, 48), chrome);
  group.add(ring);
  const glowRing = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.008, 8, 48, Math.PI * 0.5), glowMat());
  glowRing.position.z = 0.03;
  glowRing.rotation.z = Math.PI * 1.1;
  group.add(glowRing);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.19, 40), new THREE.MeshPhysicalMaterial({
    color: 0xcfefff, transparent: true, opacity: 0.18, roughness: 0, transmission: 0.6, thickness: 0.05,
  }));
  group.add(lens);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.32, 16), matte(0x15191e, { roughness: 0.4 }));
  handle.position.set(0, -0.36, 0);
  group.add(handle);
  return group;
}

// ---- the robot ----
export function createRobot() {
  const root = new THREE.Group();      // moved around the page
  const chassis = new THREE.Group();   // yaw (turning) and bounce
  root.add(chassis);


  // Body: one egg; it leans and turns as a whole, like the reference.
  const body = new THREE.Group();
  body.position.y = 0.9;
  chassis.add(body);
  const shell = new THREE.Mesh(eggGeometry(), matte(COLORS.shell, { roughness: 0.55 }));
  body.add(shell);

  // Visor: two curved bands of the egg surface (dark rim, glossy black glass) with rounded corners;
  // the eyes are drawn on the glass itself as an emissive texture.
  const face = createFace();
  const mask = roundedMask();
  const bezel = new THREE.Mesh(eggBand(-0.2, 0.3, 1.75, 1.018), matte(COLORS.bezel, { roughness: 0.35, alphaMap: mask, transparent: true }));
  body.add(bezel);
  const glass = new THREE.Mesh(eggBand(-0.165, 0.265, 1.55, 1.03), new THREE.MeshPhysicalMaterial({
    color: COLORS.visor, roughness: 0.12, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.06,
    emissive: 0xffffff, emissiveMap: face.texture, alphaMap: mask, transparent: true,
    toneMapped: false,                                // keep the cyan glow saturated
  }));
  body.add(glass);

  // Ears: black glossy domes with a glowing ring.
  for (const side of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(side * 0.555, 0.1, 0.02);
    ear.rotation.y = side * Math.PI / 2;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.095, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), glossy(COLORS.visor));
    dome.rotation.x = Math.PI / 2;
    ear.add(dome);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 10, 40), glowMat());
    ear.add(ring);
    body.add(ear);
  }

  // Flipper arms with a glowing seam at the shoulder.
  const arms = [-1, 1].map((side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.5, -0.06, 0.1);
    const seam = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.01, 8, 32), glowMat());
    seam.rotation.x = Math.PI / 2;
    shoulder.add(seam);
    const flipper = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.22, 8, 16), matte(COLORS.shell, { roughness: 0.4 }));
    flipper.scale.set(1, 1, 0.8);
    flipper.position.y = -0.17;
    shoulder.add(flipper);
    const hand = new THREE.Group();
    hand.position.y = -0.33;
    shoulder.add(hand);
    shoulder.rotation.z = side * -0.06;
    body.add(shoulder);
    return { shoulder, hand, side };
  });

  const magnifier = createMagnifier();
  magnifier.position.set(0.02, -0.02, 0.12);
  magnifier.rotation.set(0.2, 0.5, -0.5);
  arms[0].hand.add(magnifier);

  // Soft contact shadow
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 64;
  const sctx = shadowCanvas.getContext('2d');
  const grad = sctx.createRadialGradient(32, 32, 2, 32, 32, 32);
  grad.addColorStop(0, 'rgba(10,14,31,0.35)');
  grad.addColorStop(1, 'rgba(10,14,31,0)');
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, 64, 64);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.85), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.002;
  root.add(shadow);

  // Hover glow: a soft cyan disc under the body, like a hover light.
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowCanvas.height = 128;
  const gctx = glowCanvas.getContext('2d');
  const ggrad = gctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  ggrad.addColorStop(0, 'rgba(56,189,248,0.9)');
  ggrad.addColorStop(0.4, 'rgba(56,189,248,0.4)');
  ggrad.addColorStop(1, 'rgba(79,216,255,0)');
  gctx.fillStyle = ggrad;
  gctx.fillRect(0, 0, 128, 128);
  const hoverGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.55), new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(glowCanvas), transparent: true, depthWrite: false, opacity: 0, toneMapped: false,
  }));
  hoverGlow.rotation.x = -Math.PI / 2;
  hoverGlow.position.y = 0.14;                       // just under the egg
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

    chassis.rotation.y += (state.yaw - chassis.rotation.y) * Math.min(1, dt * 6);
    body.position.y = 0.9 + Math.sin(time * 2) * 0.012;   // smooth float, no wheel jitter
    body.rotation.y += ((state.headYaw || 0) - body.rotation.y) * Math.min(1, dt * 5);
    const lean = Math.max(-0.14, Math.min(0.14, (state.speed || 0) * 0.035));   // nose dips with speed
    body.rotation.x += (lean - body.rotation.x) * Math.min(1, dt * 3);
    const tilt = state.expression === 'curious' ? 0.12 : 0;
    body.rotation.z += (tilt - body.rotation.z) * Math.min(1, dt * 4);

    magnifier.visible = !!state.magnify;
    for (const { shoulder, side } of arms) {
      // rest pose, a slow breath, and a trailing swing when the robot speeds up or slows down
      let roll = side * -0.06 + Math.sin(time * 1.6 + side * 0.8) * 0.02 + (state.swing || 0) * 0.45;
      let pitch = 0;
      if (side === 1 && state.wave) roll = side * (2.5 + Math.sin(time * 12) * 0.35) * state.wave;
      if (side === -1 && state.point) { roll = side * 1.4 * state.point; pitch = -0.5 * state.point; }
      if (side === -1 && state.magnify && !state.point) { roll = -0.7; pitch = -1.1; }
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

  return { root, update, height: 1.6 };
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
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a96ac, 0.75));
  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(-2.5, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xcfeeff, 1.4);
  rim.position.set(3, 2, -4);
  scene.add(rim);
}
