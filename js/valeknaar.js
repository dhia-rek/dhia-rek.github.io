(function () {
  const WORKER_URL = 'https://valeknaar.dhiarekik-contact.workers.dev';
  const isTouch = matchMedia('(hover: none), (pointer: coarse)').matches;

  const history = [];

  const widget      = document.getElementById('valekWidget');
  const toggle      = document.getElementById('valekToggle');
  const toggleWrap  = toggle ? toggle.closest('.valek-toggle-wrap') : null;
  const panel    = document.getElementById('valekPanel');
  const closeBtn = document.getElementById('valekClose');
  const form     = document.getElementById('valekForm');
  const input    = document.getElementById('valekInput');
  const feed     = document.getElementById('valekFeed');
  const chips    = document.getElementById('valekChips');

  if (!toggle || !panel) return;

  function isOpen() { return panel.classList.contains('open'); }

  function openChat() {
    panel.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.classList.add('open');
    if (toggleWrap) toggleWrap.classList.add('open');
    if (!isTouch) input.focus();
  }

  function closeChat() {
    panel.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.classList.remove('open');
    if (toggleWrap) toggleWrap.classList.remove('open');
  }

  toggle.addEventListener('click', (e) => { e.stopPropagation(); isOpen() ? closeChat() : openChat(); });
  closeBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); closeChat(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) closeChat(); });
  document.addEventListener('pointerdown', (e) => { if (isOpen() && !e.target.closest('.valek-widget')) closeChat(); });


  function bubble(role, text) {
    history.push({ role, content: text });
    const wrap = document.createElement('div');
    wrap.className = `valek-msg valek-msg--${role === 'user' ? 'user' : 'ai'}`;
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

  async function send(text) {
    text = text.trim();
    if (!text) return;

    bubble('user', text);
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
      bubble('assistant', data.reply);
    } catch {
      dots.remove();
      bubble('assistant', "I'm having trouble connecting right now. You can reach Dhia directly at dhiarekik.contact@gmail.com");
    } finally {
      input.disabled = false;
      if (isOpen()) input.focus();
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
