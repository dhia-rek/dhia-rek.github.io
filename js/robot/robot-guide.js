// Aurora, the guide orb: flies to each section and hovers beside its title with a suggestion,
// follows the cursor with its eyes, throws fireworks, and can be grabbed, dragged and thrown.
// A quick tap opens the chat, where Aurora answers questions about Dhia. When no title has room
// beside it (and while the chat is open) Aurora waits in the bottom-right corner, so the chat is
// always one tap away. The "Ask Aurora" button (#valekFab) only shows when Aurora is not running.
// Loaded as a module after the page; does nothing without GPU-accelerated WebGL. three.js and the
// model are imported only after that check passes, so visitors without a GPU never download them.

const STORE_KEY = 'valek-robot';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const TEXT = {
  en: {
    hero: "Hi, I'm Aurora. Ask me anything about Dhia!",
    ask: 'Ask me',
    scanMe: 'Scan me',
    qrAlt: "QR code to all of Dhia's links",
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
  },
  fr: {
    hero: "Salut, moi c'est Aurora. Pose-moi tes questions sur Dhia !",
    ask: 'Me demander',
    scanMe: 'Scanne-moi',
    qrAlt: 'QR code vers tous les liens de Dhia',
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
  },
};
const SECTIONS = ['hero', 'experience', 'education', 'projects', 'capabilities', 'shipped', 'contact'];
// The robot's colours for each section: halo/glow, and the three aurora colours of its core.
const THEMES = {
  hero: { glow: '#8b9cff', a: '#6d5dfc', b: '#22d3ee', c: '#a855f7' },
  experience: { glow: '#5aa9ff', a: '#3a86ff', b: '#2ad4ff', c: '#7b61ff' },
  education: { glow: '#3ddc97', a: '#10b981', b: '#2ad4ff', c: '#a3e635' },
  projects: { glow: '#ffb020', a: '#ff8a00', b: '#ff5c5c', c: '#ffd60a' },
  capabilities: { glow: '#8b8cff', a: '#6366f1', b: '#a855f7', c: '#22d3ee' },
  shipped: { glow: '#34d399', a: '#22c55e', b: '#06b6d4', c: '#a3e635' },
  contact: { glow: '#ff6fae', a: '#ff5c8a', b: '#ffb38a', c: '#c084fc' },
};

const ACTIONS = { projects: 'https://dhiarekik.me/ai-vision-detection/' };

const lang = () => (window.i18n && window.i18n.lang === 'fr' ? 'fr' : 'en');
const t = (key) => TEXT[lang()][key];
const pick = (list) => list[Math.floor(Math.random() * list.length)];

// Only run the 3D robot with real graphics acceleration: without a GPU (software rendering) every
// frame costs the CPU heavily and slows the whole page. ?robot in the URL forces it (for testing).
function supportsWebGL() {
  if (new URLSearchParams(location.search).has('robot')) return true;
  try {
    const c = document.createElement('canvas');
    const opts = { failIfMajorPerformanceCaveat: true };
    const gl = c.getContext('webgl2', opts) || c.getContext('webgl', opts);
    if (!gl) return false;
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const name = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(String(name));
  } catch { return false; }
}

function storedHidden() {
  try { return localStorage.getItem(STORE_KEY) === 'off'; } catch { return false; }
}
function storeHidden(hidden) {
  try { hidden ? localStorage.setItem(STORE_KEY, 'off') : localStorage.removeItem(STORE_KEY); } catch { /* storage blocked */ }
}

async function start() {
  if (!supportsWebGL()) return;
  const [THREE, { RoomEnvironment }, { createRobot, addRobotLights }] = await Promise.all([
    import('three'),
    import('three/addons/environments/RoomEnvironment.js'),
    import('./robot-model.js?v=20261117-24'),
  ]);

  // ---- DOM: canvas, hit area, bubble ----
  const layer = document.createElement('div');
  layer.className = 'robot-layer';
  layer.setAttribute('aria-hidden', 'true');
  const sparkCanvas = document.createElement('canvas');
  sparkCanvas.className = 'robot-sparks';
  sparkCanvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
  const sparkCtx = sparkCanvas.getContext('2d');
  const canvas = document.createElement('canvas');
  canvas.className = 'robot-canvas';
  layer.append(sparkCanvas, canvas);
  const hit = document.createElement('button');
  hit.type = 'button';
  hit.className = 'robot-hit';
  hit.setAttribute('aria-label', 'Aurora: tap to ask about Dhia, drag to move');
  hit.setAttribute('aria-haspopup', 'dialog');
  const bubble = document.createElement('div');
  bubble.className = 'robot-bubble';
  bubble.setAttribute('role', 'status');
  bubble.setAttribute('aria-live', 'polite');
  // "Scan me": a small QR the robot pops up when it has nothing to say (below the hero, desktop).
  const scanPop = document.createElement('a');
  scanPop.className = 'robot-scan';
  scanPop.href = 'links/';
  const scanImg = document.createElement('img');
  scanImg.src = 'assets/qr/dhiarekik-links.svg';
  scanImg.width = scanImg.height = 72;
  const scanLabel = document.createElement('span');
  scanPop.append(scanImg, scanLabel);
  document.body.append(layer, hit, bubble, scanPop);
  // The chat (js/valeknaar.js) and its fallback button.
  const fab = document.getElementById('valekFab');
  const chat = () => window.auroraChat;
  const chatOpen = () => !!chat()?.isOpen();
  function openChat() { bubble.classList.remove('show'); chat()?.open(); }
  const labelScan = () => { scanLabel.textContent = t('scanMe'); scanImg.alt = t('qrAlt'); };
  labelScan();
  new MutationObserver(labelScan).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  let lastTalkAt = performance.now();
  const heroQr = document.querySelector('.hero-qr');   // the QR panel on the page

  // ---- three.js scene: orthographic camera in CSS pixels, y up ----
  // The canvas only covers a box around the robot. Render at the screen's own resolution on
  // high-density screens (already sharp), and at 2x on standard screens for smooth edges.
  // At 3x device pixels edges are already smooth, so skip the costly MSAA there.
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: devicePixelRatio < 3, alpha: true });
  renderer.setPixelRatio(Math.min(3, Math.max(2, devicePixelRatio)));
  const scene = new THREE.Scene();
  addRobotLights(scene, renderer, new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture);
  const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -2000, 2000);
  camera.position.z = 1000;

  // ?look=neon|chrome|glass previews another style
  const robot = createRobot({ look: new URLSearchParams(location.search).get('look') || undefined });
  const pivot = new THREE.Group();          // centre of the robot, so it tumbles around its middle
  const tilt = new THREE.Group();           // slight forward tilt so the top of the head shows
  tilt.rotation.x = 0.22;
  robot.root.position.y = -(robot.center ?? robot.height / 2);
  tilt.add(robot.root);
  pivot.add(tilt);
  scene.add(pivot);

  // ---- layout ----
  let W = 0, H = 0, scale = 60, radius = 50, floor = 0, box = 200;
  function layout() {
    W = innerWidth; H = innerHeight;
    scale = W < 700 ? 50 : 92;              // pixels per robot unit
    radius = (robot.reach ?? robot.height / 2) * scale;
    floor = (W < 700 ? 14 : 16) + radius;   // centre height when standing on the bottom edge
    const nextBox = Math.ceil(Math.max(radius * 3.6, scale * 1.75));
    // On phones the URL bar hides and shows while scrolling, which fires resize with a new height
    // only. Resizing the canvas reallocates its buffers, so only do it when the box really changes.
    if (nextBox !== box || !canvas.style.width) {
      box = nextBox;
      renderer.setSize(box, box, false);
      canvas.style.width = canvas.style.height = `${box}px`;
    }
    pivot.scale.setScalar(scale);
    // the chat panel opens just above Aurora's corner (above the top of her float, too)
    document.documentElement.style.setProperty('--aurora-dock', `${Math.round(floor + radius + scale * 0.24 + 16)}px`);
    const sdpr = Math.min(2, devicePixelRatio || 1);
    sparkCanvas.width = Math.round(W * sdpr);
    sparkCanvas.height = Math.round(H * sdpr);
    sparkCtx.setTransform(sdpr, 0, 0, sdpr, 0, 0);
  }
  layout();
  addEventListener('resize', layout);

  // The bottom-right corner, where a chat button usually sits: Aurora's spot on phones, while the chat
  // is open, and whenever no section title has room beside it. Fixed to the screen, not the page.
  function dockSpot() {
    return { x: Math.round(W - (W < 700 ? 14 : 22) - radius), y: floor, visible: true, name: 'dock' };
  }

  // ---- physics + behaviour state ----
  const pos = new THREE.Vector2(dockSpot().x, floor);
  const vel = new THREE.Vector2();
  let angle = 0, spin = 0, squash = 0;
  let vx = 0, yVel = 0, angVel = 0, swing = 0;   // springs for the natural float
  let mode = 'idle';                         // idle | drive | held | air | recover
  let targetX = pos.x, restY = floor, section = 'hero', faceTimer = 0, recoverTimer = 0;
  function setSpot(spot) { targetX = spot.x; restY = spot.y; }
  const anim = { speed: 0, yaw: 0, headYaw: 0, look: 0, expression: 'neutral', wave: 0, point: 0, magnify: false, talking: false, hover: 0, lift: 0, swing: 0 };
  // Eyes (and a little of the head) follow the cursor while the robot rests.
  let cursorX = null, cursorAt = 0;
  addEventListener('pointermove', (e) => { cursorX = e.clientX; cursorAt = performance.now(); }, { passive: true });
  let hidden = storedHidden();
  let talkUntil = 0, waveUntil = 0, pointRightUntil = 0, qrTimer = 0;
  // greetings that offer the chat (the ones that are not about something else on the page)
  const ASKS = new Set(['hero', 'experience', 'education', 'capabilities']);

  // ---- bubble ----
  let bubbleTimer = 0;
  function say(text, { ms = 4500, action = null, ask = false } = {}) {
    if (hidden || away || chatOpen()) return;
    bubble.replaceChildren();
    const p = document.createElement('p');
    p.textContent = text;
    bubble.append(p);
    const row = document.createElement('div');
    row.className = 'robot-bubble-actions';
    if (ask) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'robot-bubble-ask';
      b.textContent = t('ask');
      b.addEventListener('click', openChat);
      row.append(b);
    }
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
    document.body.classList.toggle('aurora-on', !value);   // the CSS hides the fallback button
    scanPop.classList.remove('show');

    if (!value) { away = true; layer.classList.add('away'); anchorName = null; mode = 'idle'; followDirty = true; pendingGreet = section; }
  }
  // Hidden by the visitor: the "Ask Aurora" button brings Aurora back (and opens the chat).
  fab?.addEventListener('click', () => { if (hidden) setHidden(false); });
  // Opening the chat sends Aurora to her corner, under the panel; closing lets her go back to a title.
  addEventListener('aurora-chat', () => { followDirty = true; if (chatOpen()) { bubble.classList.remove('show'); scanPop.classList.remove('show'); } });

  // ---- sections: drive to a spot and suggest something ----
  // Hover just right of the section's title, where there is empty space, so it never sits on the
  // photo or the text. Phones keep to the bottom-right corner.
  const navEl = document.querySelector('nav');
  function textBox(el) {
    const range = document.createRange();
    range.selectNodeContents(el);
    return range.getBoundingClientRect();
  }
  // Where the robot rests for a section: beside its title, in the empty space around it, never on
  // the content. y is measured from the bottom of the screen. visible is false when the title is out
  // of view or has no free space beside it; the robot then steps out of view instead of covering things.
  function spotFor(name) {
    if (W < 700) return dockSpot();
    const el = name === 'hero' ? document.querySelector('.hero') : document.getElementById(name);
    const none = { x: pos.x, y: pos.y, visible: false, name };
    if (!el) return none;
    const top0 = (navEl ? navEl.getBoundingClientRect().bottom : 0) + 8, bottom0 = H - 8;
    if (name === 'hero') {
      // the whole text block (title and paragraph), between it and the QR panel in the same card
      const parts = [...el.querySelectorAll('h1, .hero-role, .hero-sub')];
      if (!parts.length) return none;
      const b = { right: -Infinity, top: Infinity, bottom: -Infinity };
      for (const part of parts) {
        const r = textBox(part);
        b.right = Math.max(b.right, r.right);
        b.top = Math.min(b.top, r.top);
        b.bottom = Math.max(b.bottom, r.bottom);
      }
      let x = Math.min(Math.max(b.right + 36 + scale * 0.725, 150 + radius), W - 170 - radius);
      const qr = heroQr?.getBoundingClientRect();
      if (qr && qr.width && qr.left > b.right) x = Math.min(x, qr.left - radius - 14);
      const cy = (b.top + b.bottom) / 2 - scale * 0.29;      // a little above the block's middle
      return { x, y: H - cy, visible: cy - radius >= top0 && cy + radius <= bottom0, name };
    }
    const title = el.querySelector('h1, h2');
    if (!title) return none;
    const tb = textBox(title);
    // what sits around the title: its neighbours in the header, and the blocks before and after it
    const row = title.parentElement;
    const rects = [...row.children, row.previousElementSibling, row.nextElementSibling]
      .filter((n) => n && n !== title)
      .map((n) => n.getBoundingClientRect())
      .filter((r) => r.width && r.height);
    let rowRight = W - 10;                                   // free width to the right of the title
    for (const r of rects) if (r.bottom > tb.top && r.top < tb.bottom && r.left >= tb.right) rowRight = Math.min(rowRight, r.left - 10);
    const spot = { name, rects, rowTop: tb.top, rowBottom: tb.bottom, rowRight, top0, bottom0, x: tb.right + 28 + radius, y: pos.y, visible: false };
    const band = freeBand(spot, spot.x - radius - 6, spot.x + radius + 6);
    if (!band || spot.x + radius > rowRight || band.bottom - band.top < radius * 2) return spot;
    const cy = Math.min(Math.max((tb.top + tb.bottom) / 2, band.top + radius), band.bottom - radius);
    spot.y = H - cy;
    // in view: a heading's text box starts above its letters, so it may tuck 10px under the menu bar
    spot.visible = tb.top >= top0 - 18 && tb.bottom <= bottom0;
    return spot;
  }
  // Free vertical room in the column x1..x2 around a title row: between the blocks above and below it,
  // the menu bar and the bottom of the screen. null when something sits in the title row there.
  function freeBand(spot, x1, x2) {
    let top = spot.top0, bottom = spot.bottom0;
    for (const r of spot.rects) {
      if (r.right <= x1 || r.left >= x2) continue;
      if (r.bottom <= spot.rowTop + 2) top = Math.max(top, r.bottom + 8);
      else if (r.top >= spot.rowBottom - 2) bottom = Math.min(bottom, r.top - 8);
      else return null;
    }
    return { top, bottom };
  }
  // The current section's title when it is in view; otherwise the nearest title in view (the robot
  // waits beside it); otherwise the corner. Always the corner while the chat is open.
  function anchorFor(name) {
    if (chatOpen()) return dockSpot();
    const own = spotFor(name);
    if (own.visible || W < 700) return own;
    let best = own, bestD = Infinity;
    for (const other of SECTIONS) {
      if (other === name) continue;
      const spot = spotFor(other);
      const d = Math.abs(H - spot.y - H * 0.4);
      if (spot.visible && d < bestD) { best = spot; bestD = d; }
    }
    return best.visible ? best : dockSpot();
  }
  // ---- fireworks: rockets from the robot that burst into sparks in its colours ----
  const sparks = [];
  const rockets = [];
  const sparkColours = () => { const c = THEMES[section] ?? THEMES.hero; return [c.a, c.b, c.c, c.glow]; };
  function fireworks(count = 3) {
    if (reducedMotion || hidden) return;
    // Each rocket aims at a point on screen around the robot, so every burst is visible.
    const x0 = pos.x, y0 = H - pos.y - radius * 0.3;
    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const tx = Math.min(W - 60, Math.max(60, x0 + side * (120 + Math.random() * 180)));
      const ty = Math.min(H - 140, Math.max(100, y0 - 200 + Math.random() * 230));
      const life = 0.5 + Math.random() * 0.2 + i * 0.08;
      rockets.push({
        x: x0, y: y0,
        vx: (tx - x0) / life, vy: (ty - y0) / life - 0.5 * 380 * life,   // cancels gravity on the way
        life,
        color: pick(sparkColours()),
      });
    }
    anim.expression = 'happy';
    faceTimer = 1.4;
    waveUntil = performance.now() + 1400;
  }
  function burst(x, y, color) {
    const n = 46 + Math.floor(Math.random() * 20);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.2;
      const s = 110 + Math.random() * 180;
      sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, decay: 0.7 + Math.random() * 0.5,
        color: Math.random() < 0.3 ? pick(sparkColours()) : color });
    }
  }
  function drawSparks(dt) {
    if (!sparks.length && !rockets.length) { sparkCtx.clearRect(0, 0, W, H); return; }
    sparkCtx.clearRect(0, 0, W, H);
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.vy += 380 * dt; r.x += r.vx * dt; r.y += r.vy * dt; r.life -= dt;
      sparkCtx.fillStyle = r.color;
      sparkCtx.beginPath(); sparkCtx.arc(r.x, r.y, 3, 0, Math.PI * 2); sparkCtx.fill();
      if (r.life <= 0) { burst(r.x, r.y, r.color); rockets.splice(i, 1); }
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.vx *= 1 - dt * 1.6; s.vy = s.vy * (1 - dt * 1.6) + 160 * dt;
      s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt * s.decay;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      sparkCtx.globalAlpha = Math.min(1, s.life * 1.4);
      sparkCtx.strokeStyle = s.color;
      sparkCtx.lineWidth = 2.8;
      sparkCtx.lineCap = 'round';
      sparkCtx.beginPath(); sparkCtx.moveTo(s.x, s.y); sparkCtx.lineTo(s.x - s.vx * 0.035, s.y - s.vy * 0.035); sparkCtx.stroke();
    }
    sparkCtx.globalAlpha = 1;
  }
  const celebrated = new Set();

  function applyTheme(name) {
    const colours = THEMES[name] ?? THEMES.hero;
    robot.setTheme(colours);
    document.documentElement.style.setProperty('--section-tint', colours.glow);
  }

  function greet(name) {
    if ((name === 'projects' || name === 'contact') && !celebrated.has(name)) {
      celebrated.add(name);
      setTimeout(() => fireworks(3), 250);
    }
    const action = ACTIONS[name] ? { href: ACTIONS[name], label: t(`${name}Action`) } : null;
    say(t(name), { ms: name === 'projects' || name === 'hero' ? 7000 : 5000, action, ask: ASKS.has(name) });
    anim.magnify = name === 'projects';
    if (name === 'hero' && heroQr) {
      pointRightUntil = performance.now() + 3200;
      heroQr.classList.add('holo-active');
      clearTimeout(qrTimer);
      qrTimer = setTimeout(() => heroQr.classList.remove('holo-active'), 5000);
    }
    if (name === 'hero') waveUntil = performance.now() + 1800;
  }
  let pendingGreet = 'hero';
  let followDirty = true;                    // recompute the hover spot (first frame, scroll, resize)
  // away: out of view because no title it can sit beside is on screen. It fades out, and fades back
  // in right beside a title, so it never flies across or rests on the content.
  let away = true, anchorName = null, spotNow = null, lastSY = scrollY, bubbleMax = null;
  layer.classList.add('away');
  function goAway() {
    if (away) return;
    away = true;
    layer.classList.add('away');
    bubble.classList.remove('show');
    scanPop.classList.remove('show');
  }
  function appearAt(spot) {
    if (anchorName && spot.name !== anchorName) bubble.classList.remove('show');   // that line was about the last title
    pos.set(spot.x, spot.y);
    vx = 0; yVel = 0; angVel = 0; angle = 0;
    layer.style.transition = 'none';
    layer.classList.add('away');
    void layer.offsetWidth;                  // start hidden, then fade in where it now is
    layer.style.transition = '';
    layer.classList.remove('away');
    away = false;
    anchorName = spot.name;
    if (mode === 'drive') mode = 'idle';
  }
  // greet a section only once it is visible beside that section's own title (phones: from the corner)
  const canGreet = () => !away && !chatOpen() && (W < 700 || spotNow?.name === pendingGreet);
  addEventListener('scroll', () => { followDirty = true; }, { passive: true });
  addEventListener('resize', () => { followDirty = true; });
  // Sections slide into place as they are revealed (and images and fonts load) without any scroll:
  // re-measure when an animation ends, and every quarter second as a safety net.
  document.addEventListener('transitionend', () => { followDirty = true; }, true);
  document.addEventListener('animationend', () => { followDirty = true; }, true);
  let remeasureAt = 0;
  // Current section: the last one whose top has passed 40% of the screen; at the very bottom of the
  // page, the last section (a short final section may never reach that line).
  function currentSection() {
    const atBottom = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
    let current = 'hero';
    for (const name of SECTIONS) {
      const el = name === 'hero' ? document.querySelector('.hero') : document.getElementById(name);
      if (!el) continue;
      if (atBottom || el.getBoundingClientRect().top <= innerHeight * 0.4) current = name;
    }
    return current;
  }
  applyTheme(section);

  // ---- drag, throw, tap ----
  let dragId = null, downAt = 0, downPos = null, moved = false;
  const trail = [];
  function pointerXY(e) { return { x: e.clientX, y: innerHeight - e.clientY }; }
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
      fireworks(2);
      setTimeout(openChat, 450);
      return;
    }
    if (mode !== 'held') return;
    const a = trail[0], b = trail[trail.length - 1];
    const dt = Math.max(0.016, (b.t - a.t) / 1000);
    vel.set((b.x - a.x) / dt, (b.y - a.y) / dt).clampLength(0, 3200);
    spin = -vel.x * 0.006;
    mode = 'air';
  }
  hit.addEventListener('pointerenter', () => {
    if (hidden || reducedMotion || (mode !== 'idle' && mode !== 'drive')) return;
    anim.expression = 'happy';
    faceTimer = 1.2;
    yVel += 260;                               // a little hop of joy
  });
  hit.addEventListener('pointerup', release);
  hit.addEventListener('pointercancel', release);
  hit.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openChat(); } });

  // ---- floating: springs instead of fixed waves, so it rises, drifts, overshoots and settles ----
  function float(dt, t) {
    const hover = reducedMotion ? scale * 0.12 : scale * 0.24;
    const calm = 1 - Math.min(1, Math.abs(vx) / 220) * 0.6;          // less drift while travelling
    const drift = reducedMotion ? 0 : scale * 0.055 * calm *
      (0.55 * Math.sin(t * 1.13) + 0.3 * Math.sin(t * 2.71 + 1.3) + 0.15 * Math.sin(t * 4.3 + 0.4));
    const targetY = restY + (restY === floor ? hover : 0) + drift;
    yVel += ((targetY - pos.y) * 30 - yVel * 8) * dt;
    yVel = Math.max(-1100, Math.min(1100, yVel));
    pos.y += yVel * dt;
    // Bank into the motion like a drone, with a small idle sway; the spring gives a soft overshoot.
    const sway = reducedMotion ? 0 : 0.02 * Math.sin(t * 0.9) + 0.012 * Math.sin(t * 2.1 + 0.7);
    const targetAngle = -vx * 0.0011 + sway;
    angVel += ((targetAngle - angle) * 32 - angVel * 6.5) * dt;
    angle += angVel * dt;
    anim.lift = Math.max(0, (pos.y - restY) / scale);
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
        setSpot(spotFor(section));
      }
    } else if (mode === 'drive') {
      const dx = targetX - pos.x;
      if (reducedMotion) pos.x = targetX;
      glide(dt, reducedMotion ? 0 : Math.max(-650, Math.min(650, dx * 2.4)));
      if (reducedMotion) pos.y = restY;
      // speak as it arrives, not only once it has fully settled
      if (pendingGreet && Math.abs(targetX - pos.x) < 60 && canGreet()) { greet(pendingGreet); pendingGreet = null; }
      if (Math.abs(targetX - pos.x) < 3 && Math.abs(vx) < 12) mode = 'idle';
      anim.wave = 0; anim.point = 0;
      float(dt, t);
    } else {
      anim.point = 0;
      if (pendingGreet && canGreet()) { greet(pendingGreet); pendingGreet = null; }
      glide(dt, 0);
      float(dt, t);
    }
    if (mode === 'held' || mode === 'air') { anim.hover = 0.6; anim.lift = (pos.y - floor) / scale; }

    if (mode !== 'held' && mode !== 'air') anim.wave = now < waveUntil ? 1 : 0;
    anim.pointRight = (mode === 'idle' || mode === 'drive') && now < pointRightUntil ? 1 : 0;
    faceTimer -= dt;
    if (faceTimer <= 0 && (mode === 'idle' || mode === 'drive')) anim.expression = now < waveUntil ? 'happy' : 'neutral';
    anim.talking = now < talkUntil && anim.expression !== 'dizzy' && mode !== 'held' && mode !== 'air';
    const following = !reducedMotion && cursorX !== null && now - cursorAt < 4000 && (mode === 'idle' || mode === 'drive');
    if (following) {
      const dx = cursorX - pos.x;
      anim.look = Math.max(-1, Math.min(1, dx / 260));
      anim.headYaw = Math.max(-0.45, Math.min(0.45, dx / 900));
    } else {
      anim.look = Math.max(-1, Math.min(1, vx / 160)) * 0.7;
      anim.headYaw = 0;
    }
    squash = Math.max(0, squash - dt * 1.6);
  }

  // ---- render loop ----
  let last = performance.now(), running = true;
  function frame(now) {
    if (!running) return;
    // rAF timestamps can be older than performance.now() taken during setup: never step backwards
    // (a negative step flings the robot off-screen on load).
    const dt = Math.max(0, Math.min(0.033, (now - last) / 1000));
    last = now;
    // The page scrolls under the robot: move with it, so it stays beside its title instead of
    // sliding over the content (not in the corner, which is fixed to the screen).
    const sy = scrollY, dy = sy - lastSY;
    lastSY = sy;
    if (dy && anchorName !== 'dock' && (mode === 'idle' || mode === 'drive')) { pos.y += dy; restY += dy; }
    // while it is on screen, re-measure every frame (sections slide into place as they are revealed)
    if (!away || now > remeasureAt) { remeasureAt = now + 250; followDirty = true; }
    if (!hidden) {
      // keep beside a title while the page scrolls
      if (followDirty) {
        followDirty = false;
        const name = currentSection();
        if (name !== section) { section = name; applyTheme(name); pendingGreet = name; }
        if (mode === 'idle' || mode === 'drive') {
          const spot = anchorFor(section);
          spotNow = spot;
          setSpot(spot);
          if (!spot.visible) goAway();
          else if (away || spot.name !== anchorName) appearAt(spot);
          else if (mode === 'idle') mode = 'drive';
        }
      }
      step(dt);
      drawSparks(dt);
      pivot.position.set(pos.x, pos.y, 0);
      pivot.rotation.z = angle;
      pivot.scale.set(scale * (1 + squash * 0.6), scale * (1 - squash), scale);
      robot.update(dt, anim);
      // Everything is anchored to the bottom of the screen (CSS bottom: 0), so the robot does not
      // jump when a phone's URL bar shows or hides and the viewport height changes.
      // Snap to whole device pixels so the browser never resamples the canvas (keeps it sharp in Safari).
      const dpr = devicePixelRatio || 1;
      const cx = Math.round((pos.x - box / 2) * dpr) / dpr, cy = Math.round((pos.y - box / 2) * dpr) / dpr;
      camera.left = cx; camera.right = cx + box; camera.top = cy + box; camera.bottom = cy;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
      canvas.style.transform = `translate(${cx}px, ${-cy}px)`;
      // HTML hit area and bubble follow the robot (CSS translateY is down, so negate).
      const size = radius * 2.1;
      hit.style.transform = `translate(${pos.x - size / 2}px, ${-(pos.y - size / 2)}px)`;
      hit.style.width = hit.style.height = `${size}px`;
      hit.style.visibility = away ? 'hidden' : '';
      // Speech bubble: beside the robot in its title's row (sections), else above it (hero, phones).
      const cyNow = H - pos.y, side = pos.x + radius + 12;
      let bx = side, by = null;
      const room = spotNow?.rects ? spotNow.rowRight - side : 0;
      if (room >= 200) {
        const mw = Math.min(340, Math.floor(room));
        if (bubbleMax !== mw) { bubble.style.maxWidth = `${mw}px`; bubbleMax = mw; }
        const bw = bubble.offsetWidth, bh = bubble.offsetHeight;
        const band = freeBand(spotNow, bx, bx + bw);
        if (band) by = Math.max(band.top, Math.min(cyNow - bh / 2, band.bottom - bh));
      }
      if (by === null) {
        if (bubbleMax !== null) { bubble.style.maxWidth = ''; bubbleMax = null; }
        bx = Math.min(Math.max(pos.x - 30, 12), W - 292);
        by = cyNow - radius - 12 - bubble.offsetHeight;
      }
      bubble.style.transform = `translate(${Math.round(bx)}px, ${Math.round(by + bubble.offsetHeight - H)}px)`;
      // When silent for a moment beside a section title (large screens), pop up "Scan me" beside it,
      // only where the title row is empty.
      const talking = bubble.classList.contains('show');
      if (talking) lastTalkAt = now;
      let showScan = !talking && !away && W >= 700 && !!spotNow?.rects && (mode === 'idle' || mode === 'drive') && now - lastTalkAt > 1200;
      if (showScan) {
        const pw = scanPop.offsetWidth, ph = scanPop.offsetHeight;
        const band = side + pw <= spotNow.rowRight ? freeBand(spotNow, side, side + pw) : null;
        if (band && band.bottom - band.top >= ph) {
          const sTop = Math.max(band.top, Math.min(cyNow - ph / 2, band.bottom - ph));
          scanPop.style.transform = `translate(${Math.round(side)}px, ${Math.round(sTop + ph - H)}px)`;
        } else showScan = false;
      }
      scanPop.classList.toggle('show', showScan);

    }
    requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) { last = performance.now(); requestAnimationFrame(frame); }
  });

  setHidden(hidden);
  requestAnimationFrame(frame);
  window.valekRobot = { say, setHidden };
}

// Start after the page has loaded and settled, or as soon as the visitor scrolls or touches the page,
// so the 3D work never competes with the page's first paint.
let started = false;
const go = () => {
  if (started) return;
  started = true;
  ['scroll', 'pointerdown', 'keydown'].forEach((e) => removeEventListener(e, go));
  start();
};
['scroll', 'pointerdown', 'keydown'].forEach((e) => addEventListener(e, go, { once: true, passive: true }));
const later = () => setTimeout(() => ('requestIdleCallback' in window ? requestIdleCallback(go, { timeout: 2000 }) : go()), 2500);
if (document.readyState === 'complete') later(); else addEventListener('load', later, { once: true });
