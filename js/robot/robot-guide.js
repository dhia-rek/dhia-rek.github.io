// Valeknaar, the robot guide: drives along the bottom of the screen, stops near each section with a
// suggestion, and can be grabbed, dragged and thrown. A quick tap opens the Valeknaar chat.
// Loaded as a module after the page; does nothing without WebGL or when the visitor hid it.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createRobot, addRobotLights } from './robot-model.js?v=20261011-12';

const STORE_KEY = 'valek-robot';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const TEXT = {
  en: {
    hero: "Hi, I'm Valeknaar! Drag me around, or tap me to chat.",
    experience: 'Dhia is an AI Integration Intern at Driveco. Ask me about it!',
    education: 'MSc in Artificial Intelligence at ECE Paris.',
    projects: 'Psst: the vision project runs live in your browser.',
    projectsAction: 'Try it live',
    capabilities: 'Want the short version of his skills? Tap me.',
    shipped: 'These websites are live. Have a look!',
    contact: 'Want to reach Dhia? The form is right here.',
    held: ['Wheee!', 'Put me down!', 'Where are we going?'],
    ouch: ['Ouch!', 'Whoa!', 'I saw stars…', 'Again?!'],
    hide: 'Hide',
    show: 'Show robot',
  },
  fr: {
    hero: 'Salut, je suis Valeknaar ! Déplace-moi, ou touche-moi pour discuter.',
    experience: "Dhia est stagiaire en intégration IA chez Driveco. Demande-moi !",
    education: "MSc en intelligence artificielle à l'ECE Paris.",
    projects: 'Psst : le projet vision tourne en direct dans ton navigateur.',
    projectsAction: 'Essayer',
    capabilities: 'La version courte de ses compétences ? Touche-moi.',
    shipped: 'Ces sites sont en ligne. Jette un œil !',
    contact: 'Pour contacter Dhia, le formulaire est juste ici.',
    held: ['Wiii !', 'Pose-moi !', 'On va où ?'],
    ouch: ['Aïe !', 'Oups !', "J'ai vu des étoiles…", 'Encore ?!'],
    hide: 'Masquer',
    show: 'Afficher le robot',
  },
};
const SECTIONS = ['hero', 'experience', 'education', 'projects', 'capabilities', 'shipped', 'contact'];
const ACTIONS = { projects: 'https://dhiarekik.me/ai-vision-detection/' };

const lang = () => (window.i18n && window.i18n.lang === 'fr' ? 'fr' : 'en');
const t = (key) => TEXT[lang()][key];
const pick = (list) => list[Math.floor(Math.random() * list.length)];

function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

function storedHidden() {
  try { return localStorage.getItem(STORE_KEY) === 'off'; } catch { return false; }
}
function storeHidden(hidden) {
  try { hidden ? localStorage.setItem(STORE_KEY, 'off') : localStorage.removeItem(STORE_KEY); } catch { /* storage blocked */ }
}

function start() {
  if (!supportsWebGL()) return;

  // ---- DOM: canvas, hit area, bubble, show button ----
  const layer = document.createElement('div');
  layer.className = 'robot-layer';
  layer.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas');
  canvas.className = 'robot-canvas';
  layer.append(canvas);
  const hit = document.createElement('button');
  hit.type = 'button';
  hit.className = 'robot-hit';
  hit.setAttribute('aria-label', 'Valeknaar robot: tap to chat, drag to move');
  const bubble = document.createElement('div');
  bubble.className = 'robot-bubble';
  bubble.setAttribute('role', 'status');
  bubble.setAttribute('aria-live', 'polite');
  const showBtn = document.createElement('button');
  showBtn.type = 'button';
  showBtn.className = 'robot-show';
  document.body.append(layer, hit, bubble, showBtn);

  // ---- three.js scene: orthographic camera in CSS pixels, y up ----
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  // The canvas only covers a box around the robot, so it can render at twice the screen's resolution
  // (an exact 2:1 downscale keeps edges smooth and sharp).
  renderer.setPixelRatio(Math.min(6, Math.max(2, Math.round(devicePixelRatio) * 2)));
  const scene = new THREE.Scene();
  addRobotLights(scene, renderer, new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture);
  const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -2000, 2000);
  camera.position.z = 1000;

  const robot = createRobot();
  const pivot = new THREE.Group();          // centre of the robot, so it tumbles around its middle
  const tilt = new THREE.Group();           // slight forward tilt so the top of the head shows
  tilt.rotation.x = 0.22;
  robot.root.position.y = -robot.height / 2;
  tilt.add(robot.root);
  pivot.add(tilt);
  scene.add(pivot);

  // ---- layout ----
  let W = 0, H = 0, scale = 60, radius = 50, floor = 0, box = 200;
  function layout() {
    W = innerWidth; H = innerHeight;
    scale = W < 700 ? 52 : 70;              // pixels per robot unit
    radius = (robot.height / 2) * scale;
    floor = (W < 700 ? 10 : 16) + radius;   // centre height when standing on the bottom edge
    box = Math.ceil(radius * 3.6);
    renderer.setSize(box, box, false);
    canvas.style.width = canvas.style.height = `${box}px`;
    pivot.scale.setScalar(scale);
  }
  layout();
  addEventListener('resize', layout);

  // ---- physics + behaviour state ----
  const pos = new THREE.Vector2(W < 700 ? 60 : 120, floor);
  const vel = new THREE.Vector2();
  let angle = 0, spin = 0, squash = 0;
  let vx = 0, yVel = 0, angVel = 0, swing = 0;   // springs for the natural float
  let mode = 'idle';                         // idle | drive | held | air | recover
  let targetX = pos.x, section = 'hero', faceTimer = 0, recoverTimer = 0;
  const anim = { speed: 0, yaw: 0, headYaw: 0, look: 0, expression: 'neutral', wave: 0, point: 0, magnify: false, talking: false, hover: 0, lift: 0, swing: 0 };
  let hidden = storedHidden();
  let talkUntil = 0, waveUntil = 0;

  // ---- bubble ----
  let bubbleTimer = 0;
  function say(text, { ms = 4500, action = null } = {}) {
    if (hidden) return;
    bubble.replaceChildren();
    const p = document.createElement('p');
    p.textContent = text;
    bubble.append(p);
    const row = document.createElement('div');
    row.className = 'robot-bubble-actions';
    if (action) {
      const a = document.createElement('a');
      a.href = action.href;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = action.label;
      row.append(a);
    }
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = t('hide');
    close.addEventListener('click', () => setHidden(true));
    row.append(close);
    bubble.append(row);
    bubble.classList.add('show');
    talkUntil = performance.now() + Math.min(ms, 1800);
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.remove('show'), ms);
  }

  function setHidden(value) {
    hidden = value;
    storeHidden(value);
    layer.classList.toggle('off', value);
    hit.hidden = value;
    bubble.classList.remove('show');
    showBtn.hidden = !value;
    showBtn.textContent = t('show');
    if (!value) { pos.set(-radius, floor); mode = 'drive'; targetX = W < 700 ? 60 : 120; greet('hero'); }
  }
  showBtn.addEventListener('click', () => setHidden(false));

  // ---- sections: drive to a spot and suggest something ----
  function spotFor(name) {
    const i = SECTIONS.indexOf(name);
    const lo = W < 700 ? 50 : 90, hi = W < 700 ? W * 0.45 : Math.min(W * 0.32, 460);
    return lo + ((i * 0.37) % 1) * (hi - lo);
  }
  function greet(name) {
    const action = ACTIONS[name] ? { href: ACTIONS[name], label: t(`${name}Action`) } : null;
    say(t(name), { ms: name === 'projects' ? 7000 : 5000, action });
    anim.magnify = name === 'projects';
    if (name === 'hero') waveUntil = performance.now() + 1800;
  }
  let pendingGreet = 'hero';
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const name = entry.target.classList.contains('hero') ? 'hero' : entry.target.id;
      if (!SECTIONS.includes(name) || name === section) continue;
      section = name;
      if (mode === 'idle' || mode === 'drive') { targetX = spotFor(name); mode = 'drive'; }
      pendingGreet = name;
    }
  }, { threshold: 0.45 });
  for (const name of SECTIONS) {
    const el = name === 'hero' ? document.querySelector('.hero') : document.getElementById(name);
    if (el) observer.observe(el);
  }

  // ---- drag, throw, tap ----
  let dragId = null, downAt = 0, downPos = null, moved = false;
  const trail = [];
  function pointerXY(e) { return { x: e.clientX, y: H - e.clientY }; }
  hit.addEventListener('pointerdown', (e) => {
    if (hidden) return;
    dragId = e.pointerId;
    hit.setPointerCapture(e.pointerId);
    downAt = performance.now();
    downPos = pointerXY(e);
    moved = false;
    trail.length = 0;
    trail.push({ ...downPos, t: downAt });
  });
  hit.addEventListener('pointermove', (e) => {
    if (e.pointerId !== dragId) return;
    const p = pointerXY(e);
    if (!moved && Math.hypot(p.x - downPos.x, p.y - downPos.y) > 6) {
      moved = true;
      if (!reducedMotion) { mode = 'held'; say(pick(t('held')), { ms: 1800 }); }
    }
    trail.push({ ...p, t: performance.now() });
    if (trail.length > 6) trail.shift();
  });
  function release(e) {
    if (e.pointerId !== dragId) return;
    dragId = null;
    if (!moved && performance.now() - downAt < 400) {
      document.getElementById('valekFab')?.click();
      waveUntil = performance.now() + 1200;
      return;
    }
    if (mode !== 'held') return;
    const a = trail[0], b = trail[trail.length - 1];
    const dt = Math.max(0.016, (b.t - a.t) / 1000);
    vel.set((b.x - a.x) / dt, (b.y - a.y) / dt).clampLength(0, 3200);
    spin = -vel.x * 0.006;
    mode = 'air';
  }
  hit.addEventListener('pointerup', release);
  hit.addEventListener('pointercancel', release);
  hit.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.getElementById('valekFab')?.click(); } });

  // ---- floating: springs instead of fixed waves, so it rises, drifts, overshoots and settles ----
  function float(dt, t) {
    const hover = reducedMotion ? scale * 0.12 : scale * 0.24;
    const calm = 1 - Math.min(1, Math.abs(vx) / 220) * 0.6;          // less drift while travelling
    const drift = reducedMotion ? 0 : scale * 0.055 * calm *
      (0.55 * Math.sin(t * 1.13) + 0.3 * Math.sin(t * 2.71 + 1.3) + 0.15 * Math.sin(t * 4.3 + 0.4));
    const targetY = floor + hover + drift;
    yVel += ((targetY - pos.y) * 38 - yVel * 8.5) * dt;
    pos.y += yVel * dt;
    // Bank into the motion like a drone, with a small idle sway; the spring gives a soft overshoot.
    const sway = reducedMotion ? 0 : 0.02 * Math.sin(t * 0.9) + 0.012 * Math.sin(t * 2.1 + 0.7);
    const targetAngle = -vx * 0.0011 + sway;
    angVel += ((targetAngle - angle) * 32 - angVel * 6.5) * dt;
    angle += angVel * dt;
    anim.lift = Math.max(0, (pos.y - floor) / scale);
    anim.hover = Math.min(1, anim.lift / 0.2);
  }

  // Horizontal glide with smooth acceleration; arms trail behind changes of speed.
  function glide(dt, desired) {
    const before = vx;
    vx += (desired - vx) * Math.min(1, dt * 3.2);
    pos.x += vx * dt;
    const accel = (vx - before) / Math.max(dt, 1e-3);
    swing += ((-accel / 900) - swing) * Math.min(1, dt * 5);
    anim.swing = Math.max(-1, Math.min(1, swing));
    anim.speed = vx / scale;
    anim.yaw = Math.max(-1, Math.min(1, vx / 200)) * 0.5;               // half-turn toward travel
  }

  // ---- simulation ----
  const GRAVITY = 2600;
  function impact(strength) {
    squash = Math.min(0.3, strength / 6000);
    if (strength > 1100) {
      anim.expression = 'dizzy';
      faceTimer = 1.8;
      say(pick(t('ouch')), { ms: 1600 });
    }
  }
  function step(dt) {
    const now = performance.now();
    const t = now / 1000;
    anim.speed = 0;
    if (mode === 'held') {
      const p = trail[trail.length - 1];
      const tx = p.x, ty = Math.max(floor, p.y - radius * 0.2);
      const nx = pos.x + (tx - pos.x) * Math.min(1, dt * 18), ny = pos.y + (ty - pos.y) * Math.min(1, dt * 18);
      const vx = (nx - pos.x) / dt;
      pos.set(nx, ny);
      angle += ((-vx * 0.0006) - angle) * Math.min(1, dt * 8);
      anim.expression = 'surprised';
      anim.wave = 1; anim.point = 1;
      anim.speed = 6;                        // treads spin in the air
    } else if (mode === 'air') {
      vel.y -= GRAVITY * dt;
      pos.addScaledVector(vel, dt);
      angle += spin * dt;
      if (pos.y < floor) {
        pos.y = floor;
        const hitSpeed = -vel.y;
        if (hitSpeed > 120) impact(hitSpeed);
        vel.y = hitSpeed * 0.42;
        vel.x *= 0.75;
        spin *= 0.6;
        if (vel.y < 140) { vel.set(0, 0); mode = 'recover'; recoverTimer = 0; }
      }
      if (pos.y > H - radius) { pos.y = H - radius; vel.y = -Math.abs(vel.y) * 0.5; impact(Math.abs(vel.y) * 2); }
      if (pos.x < radius) { pos.x = radius; impact(Math.abs(vel.x)); vel.x = Math.abs(vel.x) * 0.55; spin = -spin * 0.7; }
      if (pos.x > W - radius) { pos.x = W - radius; impact(Math.abs(vel.x)); vel.x = -Math.abs(vel.x) * 0.55; spin = -spin * 0.7; }
      anim.wave = 1; anim.point = 1;
      if (faceTimer <= 0) anim.expression = 'surprised';
    } else if (mode === 'recover') {
      recoverTimer += dt;
      vx = 0; yVel = 0; angVel = 0;
      anim.lift = 0;
      anim.hover = 0;
      const upright = Math.round(angle / (Math.PI * 2)) * Math.PI * 2;
      angle += (upright - angle) * Math.min(1, dt * 5);
      pos.y = floor;
      anim.wave = 0; anim.point = 0;
      if (recoverTimer > 0.9 && Math.abs(upright - angle) < 0.02) {
        angle = 0;
        mode = 'drive';
        targetX = spotFor(section);
      }
    } else if (mode === 'drive') {
      const dx = targetX - pos.x;
      if (reducedMotion) pos.x = targetX;
      glide(dt, reducedMotion ? 0 : Math.max(-200, Math.min(200, dx * 1.5)));
      if (Math.abs(targetX - pos.x) < 3 && Math.abs(vx) < 12) {
        mode = 'idle';
        if (pendingGreet) { greet(pendingGreet); pendingGreet = null; }
      }
      anim.wave = 0; anim.point = 0;
      float(dt, t);
    } else {
      anim.point = 0;
      if (pendingGreet) { greet(pendingGreet); pendingGreet = null; }
      glide(dt, 0);
      float(dt, t);
    }
    if (mode === 'held' || mode === 'air') { anim.hover = 0.6; anim.lift = (pos.y - floor) / scale; }

    if (mode !== 'held' && mode !== 'air') anim.wave = now < waveUntil ? 1 : 0;
    faceTimer -= dt;
    if (faceTimer <= 0 && (mode === 'idle' || mode === 'drive')) anim.expression = now < waveUntil ? 'happy' : 'neutral';
    anim.talking = now < talkUntil && anim.expression !== 'dizzy' && mode !== 'held' && mode !== 'air';
    anim.look = Math.max(-1, Math.min(1, vx / 160)) * 0.7;
    squash = Math.max(0, squash - dt * 1.6);
  }

  // ---- render loop ----
  let last = performance.now(), running = true;
  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    if (!hidden) {
      step(dt);
      pivot.position.set(pos.x, pos.y, 0);
      pivot.rotation.z = angle;
      pivot.scale.set(scale * (1 + squash * 0.6), scale * (1 - squash), scale);
      robot.update(dt, anim);
      // Snap to whole device pixels so the browser never resamples the canvas (keeps it sharp in Safari).
      const dpr = devicePixelRatio || 1;
      const cx = Math.round((pos.x - box / 2) * dpr) / dpr, cy = Math.round((H - pos.y - box / 2) * dpr) / dpr;
      camera.left = cx; camera.right = cx + box; camera.top = H - cy; camera.bottom = H - cy - box;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
      canvas.style.transform = `translate(${cx}px, ${cy}px)`;
      // HTML hit area and bubble follow the robot (CSS coordinates are y-down).
      const size = radius * 2.1;
      hit.style.transform = `translate(${pos.x - size / 2}px, ${H - pos.y - size / 2}px)`;
      hit.style.width = hit.style.height = `${size}px`;
      const bx = Math.min(Math.max(pos.x - 30, 12), W - 292);
      bubble.style.transform = `translate(${bx}px, ${H - pos.y - radius - 12}px) translateY(-100%)`;
    }
    requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) { last = performance.now(); requestAnimationFrame(frame); }
  });

  if (hidden) setHidden(true);
  else { showBtn.hidden = true; pos.x = -radius; mode = 'drive'; targetX = spotFor('hero'); }
  requestAnimationFrame(frame);
  window.valekRobot = { say, setHidden };
}

const go = () => start();
if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 2500 });
else setTimeout(go, 800);
