// Valeknaar's body: an egg-shaped robot with a glossy visor, flipper arms and a magnifying glass,
// riding on small tank treads. Built from primitives so every part can move.
// createRobot() returns the scene group plus update(dt, state), which animates treads, eyes, arms.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const COLORS = {
  shell: 0xd9e1e7,
  visor: 0x0b0f14,
  bezel: 0x1c232b,
  glow: 0x4fd8ff,
  tread: 0x2b3440,
  treadBody: 0x161c23,
};

const matte = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.05, ...extra });
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
  texture.anisotropy = 8;
  let last = '';

  // Vertical eye made of horizontal glowing stripes, like a scanline display.
  function stripedEye(cx, cy, w, h) {
    const stripe = 7, gap = 4;
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
      ctx.lineWidth = 11;
      ctx.lineCap = 'round';
      for (const [x, y] of eyes) {
        ctx.beginPath();
        ctx.arc(x, y + 14, 22, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      }
    } else {
      const open = Math.max(0.12, 1 - blink);
      for (const [i, [x, y]] of eyes.entries()) {
        const big = expression === 'curious' && i === 1 ? 1.2 : 1;
        stripedEye(x, y, 26 * big, 72 * big * open);
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

// ---- treads: a stadium path with cleats that travel around it ----
function stadiumPoint(s, length, radius) {
  const half = length / 2, arc = Math.PI * radius, perimeter = 2 * length + 2 * arc;
  s = ((s % perimeter) + perimeter) % perimeter;
  if (s < length) return { z: -half + s, y: -radius, angle: 0 };
  s -= length;
  if (s < arc) { const a = -Math.PI / 2 + s / radius; return { z: half + Math.cos(a) * radius, y: Math.sin(a) * radius, angle: a + Math.PI / 2 }; }
  s -= arc;
  if (s < length) return { z: half - s, y: radius, angle: Math.PI };
  s -= length;
  const a = Math.PI / 2 + s / radius;
  return { z: -half + Math.cos(a) * radius, y: Math.sin(a) * radius, angle: a + Math.PI / 2 };
}

function createTread(side, { length = 0.5, radius = 0.15, width = 0.2, offset = 0.33 } = {}) {
  const group = new THREE.Group();
  group.position.set(side * offset, radius, 0);

  const shape = new THREE.Shape();
  shape.absarc(length / 2, 0, radius * 0.9, -Math.PI / 2, Math.PI / 2, false);
  shape.absarc(-length / 2, 0, radius * 0.9, Math.PI / 2, Math.PI * 1.5, false);
  const body = new THREE.ExtrudeGeometry(shape, { depth: width * 0.9, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, curveSegments: 20 });
  body.rotateY(-Math.PI / 2);
  body.translate(width * 0.45, 0, 0);
  group.add(new THREE.Mesh(body, matte(COLORS.treadBody)));

  // Wheels with glowing hubs on the outer face.
  const wheelGeo = new THREE.CylinderGeometry(radius * 0.6, radius * 0.6, 0.02, 24);
  wheelGeo.rotateZ(Math.PI / 2);
  const hubGeo = new THREE.TorusGeometry(radius * 0.3, 0.012, 8, 24);
  hubGeo.rotateY(Math.PI / 2);
  const wheels = [];
  for (const z of [-length / 2, 0, length / 2]) {
    const wheel = new THREE.Group();
    wheel.position.set(side * (width * 0.47 + 0.012), 0, z);
    wheel.add(new THREE.Mesh(wheelGeo, matte(COLORS.tread)));
    const hub = new THREE.Mesh(hubGeo, glowMat());
    hub.position.x = side * 0.012;
    wheel.add(hub);
    group.add(wheel);
    wheels.push(wheel);
  }

  const perimeter = 2 * length + 2 * Math.PI * radius;
  const count = 20;
  const cleatGeo = new RoundedBoxGeometry(width, 0.04, perimeter / count * 0.7, 2, 0.012);
  const cleatMat = matte(COLORS.tread, { roughness: 0.75 });
  const cleats = [];
  for (let i = 0; i < count; i++) {
    const cleat = new THREE.Mesh(cleatGeo, cleatMat);
    group.add(cleat);
    cleats.push(cleat);
  }

  let travel = 0;
  function update(distance) {
    travel += distance;
    for (let i = 0; i < count; i++) {
      const p = stadiumPoint(i * perimeter / count - travel, length, radius);
      cleats[i].position.set(0, p.y, p.z);
      cleats[i].rotation.x = -p.angle;
    }
    for (const wheel of wheels) wheel.rotation.x += distance / (radius * 0.6);
  }
  update(0);
  return { group, update };
}

// Egg profile for a LatheGeometry: rounder and a little wider at the top, like the reference.
function eggGeometry(height = 1.2, width = 0.6) {
  const points = [];
  for (let i = 0; i <= 72; i++) {
    const t = (i / 72) * Math.PI;
    const r = Math.sin(t) * width * (1 + 0.06 * -Math.cos(t));
    points.push(new THREE.Vector2(Math.max(r, 0.0001), -Math.cos(t) * height / 2));
  }
  return new THREE.LatheGeometry(points, 96);
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

  const left = createTread(-1), right = createTread(1);
  chassis.add(left.group, right.group);
  const axle = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.12, 0.34, 3, 0.04), matte(COLORS.treadBody));
  axle.position.y = 0.26;
  chassis.add(axle);

  // Body: one egg; it leans and turns as a whole, like the reference.
  const body = new THREE.Group();
  body.position.y = 0.9;
  chassis.add(body);
  const shell = new THREE.Mesh(eggGeometry(1.3, 0.6), matte(COLORS.shell, { roughness: 0.55 }));
  body.add(shell);

  // Visor: dark bezel, glossy black glass, eyes on a canvas just in front.
  const visor = new THREE.Group();
  visor.position.set(0, 0.02, 0.56);
  visor.rotation.x = -0.06;
  body.add(visor);
  const bezel = new THREE.Mesh(new RoundedBoxGeometry(0.86, 0.56, 0.24, 6, 0.12), matte(COLORS.bezel, { roughness: 0.35 }));
  visor.add(bezel);
  const glass = new THREE.Mesh(new RoundedBoxGeometry(0.76, 0.46, 0.06, 6, 0.1), glossy(COLORS.visor));
  glass.position.z = 0.1;
  visor.add(glass);
  const face = createFace();
  const eyes = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.45), new THREE.MeshBasicMaterial({ map: face.texture, transparent: true, toneMapped: false }));
  eyes.position.z = 0.135;
  visor.add(eyes);

  // Ears: black glossy domes with a glowing ring.
  for (const side of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(side * 0.585, 0.08, 0.04);
    ear.rotation.y = side * Math.PI / 2;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), glossy(COLORS.visor));
    dome.rotation.x = Math.PI / 2;
    ear.add(dome);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.014, 10, 40), glowMat());
    ear.add(ring);
    body.add(ear);
  }

  // Flipper arms with a glowing seam at the shoulder.
  const arms = [-1, 1].map((side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.5, -0.18, 0.22);
    const seam = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 8, 32), glowMat());
    seam.rotation.x = Math.PI / 2;
    shoulder.add(seam);
    const flipper = new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.3, 8, 16), matte(COLORS.shell, { roughness: 0.55 }));
    flipper.scale.set(1, 1, 0.75);
    flipper.position.y = -0.24;
    shoulder.add(flipper);
    const hand = new THREE.Group();
    hand.position.y = -0.42;
    shoulder.add(hand);
    shoulder.rotation.z = side * 0.25;
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
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.0), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.002;
  root.add(shadow);

  // Hover glow: a soft cyan disc under the treads, visible while floating.
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowCanvas.height = 128;
  const gctx = glowCanvas.getContext('2d');
  const ggrad = gctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  ggrad.addColorStop(0, 'rgba(56,189,248,0.9)');
  ggrad.addColorStop(0.4, 'rgba(56,189,248,0.4)');
  ggrad.addColorStop(1, 'rgba(79,216,255,0)');
  gctx.fillStyle = ggrad;
  gctx.fillRect(0, 0, 128, 128);
  const hoverGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.9), new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(glowCanvas), transparent: true, depthWrite: false, opacity: 0, toneMapped: false,
  }));
  hoverGlow.rotation.x = -Math.PI / 2;
  hoverGlow.position.y = -0.02;
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
    hoverGlow.material.opacity = (state.hover || 0) * (0.75 + Math.sin(time * 6) * 0.15);
    hoverGlow.scale.setScalar(0.9 + Math.sin(time * 6) * 0.05);
    const dist = state.speed * dt;
    left.update(dist);
    right.update(dist);

    chassis.rotation.y += (state.yaw - chassis.rotation.y) * Math.min(1, dt * 6);
    const moving = Math.abs(state.speed) > 0.01;
    chassis.position.y = moving ? Math.abs(Math.sin(time * 14)) * 0.01 : 0;
    body.position.y = 0.9 + (moving ? 0 : Math.sin(time * 2) * 0.012);
    body.rotation.y += ((state.headYaw || 0) - body.rotation.y) * Math.min(1, dt * 5);
    const lean = moving ? 0.08 * Math.sign(state.speed) : 0;
    body.rotation.x += (lean - body.rotation.x) * Math.min(1, dt * 4);
    body.rotation.z = Math.sin(time * 1.3) * 0.025 + (state.expression === 'curious' ? 0.12 : 0);

    magnifier.visible = !!state.magnify;
    for (const { shoulder, side } of arms) {
      let roll = side * 0.25 + Math.sin(time * 2 + side) * 0.03;
      let pitch = 0;
      if (side === 1 && state.wave) roll = side * (2.5 + Math.sin(time * 12) * 0.35) * state.wave;
      if (side === -1 && state.point) { roll = side * 1.4 * state.point; pitch = -0.5 * state.point; }
      if (side === -1 && state.magnify && !state.point) { roll = -0.7; pitch = -1.1; }
      shoulder.rotation.z += (roll - shoulder.rotation.z) * Math.min(1, dt * 10);
      shoulder.rotation.x += (pitch - shoulder.rotation.x) * Math.min(1, dt * 10);
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

  return { root, update, height: 1.55 };
}
