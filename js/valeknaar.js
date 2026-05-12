(function () {
  const WORKER_URL = 'https://valeknaar.dhiarekik-contact.workers.dev';
  const isTouch = matchMedia('(hover: none), (pointer: coarse)').matches;

  const history = [];

  const widget     = document.getElementById('valekWidget');
  const backdrop   = document.getElementById('valekBackdrop');
  const toggle     = document.getElementById('valekToggle');
  const toggleWrap = toggle ? toggle.closest('.valek-toggle-wrap') : null;
  const panel      = document.getElementById('valekPanel');
  const closeBtn   = document.getElementById('valekClose');
  const form       = document.getElementById('valekForm');
  const input      = document.getElementById('valekInput');
  const feed       = document.getElementById('valekFeed');
  const chips      = document.getElementById('valekChips');

  if (!toggle || !panel) return;

  function isOpen() { return panel.classList.contains('open'); }

  function openChat() {
    panel.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.classList.add('open');
    if (toggleWrap) toggleWrap.classList.add('open');
    if (backdrop) { backdrop.classList.add('open'); document.body.style.overflow = 'hidden'; }
    if (!isTouch) input.focus();
  }

  function closeChat() {
    panel.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.classList.remove('open');
    if (toggleWrap) toggleWrap.classList.remove('open');
    if (backdrop) { backdrop.classList.remove('open'); document.body.style.overflow = ''; }
  }

  toggle.addEventListener('click', (e) => { e.stopPropagation(); isOpen() ? closeChat() : openChat(); });
  closeBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); closeChat(); });
  if (backdrop) backdrop.addEventListener('click', closeChat);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) closeChat(); });
  document.addEventListener('pointerdown', (e) => { if (isOpen() && !e.target.closest('.valek-widget') && e.target !== backdrop) closeChat(); });

  function userBubble(text) {
    history.push({ role: 'user', content: text });
    const wrap = document.createElement('div');
    wrap.className = 'valek-msg valek-msg--user';
    const p = document.createElement('p');
    p.textContent = text;
    wrap.appendChild(p);
    feed.appendChild(wrap);
    feed.scrollTop = feed.scrollHeight;
  }

  function typingDots() {
    const wrap = document.createElement('div');
    wrap.className = 'valek-msg valek-msg--ai';
    wrap.innerHTML = '<div class="valek-typing"><span></span><span></span><span></span></div>';
    feed.appendChild(wrap);
    feed.scrollTop = feed.scrollHeight;
    return wrap;
  }

  async function typeText(p, text) {
    const speed = text.length > 300 ? 8 : text.length > 150 ? 13 : 20;
    for (let i = 0; i < text.length; i++) {
      p.textContent += text[i];
      if (i % 4 === 0) feed.scrollTop = feed.scrollHeight;
      await new Promise(r => setTimeout(r, speed));
    }
    feed.scrollTop = feed.scrollHeight;
  }

  async function aiBubble(text) {
    history.push({ role: 'assistant', content: text });
    const wrap = document.createElement('div');
    wrap.className = 'valek-msg valek-msg--ai';
    const p = document.createElement('p');
    wrap.appendChild(p);
    feed.appendChild(wrap);
    feed.scrollTop = feed.scrollHeight;
    await typeText(p, text);
  }

  function showSuggestions(questions) {
    if (!questions || !questions.length) return;
    const wrap = document.createElement('div');
    wrap.className = 'valek-suggestions';
    questions.forEach(q => {
      const btn = document.createElement('button');
      btn.className = 'valek-suggestion';
      btn.textContent = q;
      btn.addEventListener('click', () => {
        wrap.remove();
        send(q);
      });
      wrap.appendChild(btn);
    });
    feed.appendChild(wrap);
    feed.scrollTop = feed.scrollHeight;
  }

  async function send(text) {
    text = text.trim();
    if (!text) return;

    userBubble(text);
    input.value = '';
    input.disabled = true;

    const dots = typingDots();

    try {
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      dots.remove();
      await aiBubble(data.reply);
      showSuggestions(data.suggestions);
    } catch {
      dots.remove();
      await aiBubble("I'm having trouble connecting right now. You can reach Dhia directly at dhiarekik.contact@gmail.com");
    } finally {
      input.disabled = false;
      if (isOpen() && !isTouch) input.focus();
    }
  }

  form.addEventListener('submit', e => { e.preventDefault(); send(input.value); });

  if (chips) {
    chips.querySelectorAll('.valek-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        chips.remove();
        send(chip.textContent);
      });
    });
  }
})();
