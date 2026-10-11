(function () {
  const canvas = document.getElementById('neuralCanvas');
  if (!canvas) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d');
  let w, h, dpr;
  const nodes = [];
  const COUNT = 70;
  const LINK_DIST = 140;
  let mouse = { x: -9999, y: -9999, active: false };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width;
    h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeNode() {
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.6 + 0.6,
    };
  }

  function init() {
    resize();
    nodes.length = 0;
    for (let i = 0; i < COUNT; i++) nodes.push(makeNode());
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);
    const isLight = document.body.classList.contains('light');
    const dotColor = isLight ? 'rgba(60,60,80,' : 'rgba(255,255,255,';
    const lineColor = isLight ? 'rgba(94,92,230,' : 'rgba(120,160,255,';

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;

      if (mouse.active) {
        const dx = mouse.x - n.x;
        const dy = mouse.y - n.y;
        const d2 = dx*dx + dy*dy;
        if (d2 < 22000) {
          const f = (22000 - d2) / 22000 * 0.0009;
          n.vx += dx * f;
          n.vy += dy * f;
        }
      }
      n.vx = Math.max(-0.6, Math.min(0.6, n.vx));
      n.vy = Math.max(-0.6, Math.min(0.6, n.vy));

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = dotColor + '0.55)';
      ctx.fill();
    }

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < LINK_DIST) {
          const alpha = (1 - dist / LINK_DIST) * 0.35;
          ctx.strokeStyle = lineColor + alpha.toFixed(3) + ')';
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    if (mouse.active) {
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const dx = mouse.x - n.x, dy = mouse.y - n.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 180) {
          const alpha = (1 - dist / 180) * 0.6;
          ctx.strokeStyle = `rgba(255,107,157,${alpha.toFixed(3)})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', () => { resize(); });
  window.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    if (e.clientY < r.bottom && e.clientY > r.top) {
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.active = true;
    } else {
      mouse.active = false;
    }
  });
  window.addEventListener('mouseleave', () => { mouse.active = false; });

  init();
  tick();
})();
