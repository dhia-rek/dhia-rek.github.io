(function () {
  const WORKER_URL = 'https://valeknaar.dhiarekik-contact.workers.dev';
  const history = [];

  // Two synchronized instances — same history, same conversation.
  const hero = {
    feed: document.getElementById('valekFeed'),
    form: document.getElementById('valekForm'),
    input: document.getElementById('valekInput'),
    chips: document.getElementById('valekChips'),
  };
  const pop = {
    feed: document.getElementById('valekPopFeed'),
    form: document.getElementById('valekPopForm'),
    input: document.getElementById('valekPopInput'),
    chips: document.getElementById('valekPopChips'),
  };
  const instances = [hero, pop].filter(i => i.feed && i.form && i.input);
  if (!instances.length) return;

  function appendToAll(builder) {
    return instances.map(inst => {
      const node = builder(inst);
      inst.feed.appendChild(node);
      inst.feed.scrollTop = inst.feed.scrollHeight;
      return { inst, node };
    });
  }

  function removeFromAll(refs) {
    refs.forEach(({ node }) => node.remove());
  }

  function hideChipsAll() {
    instances.forEach(inst => {
      if (inst.chips && inst.chips.parentNode) inst.chips.remove();
    });
  }

  function userBubble(text) {
    history.push({ role: 'user', content: text });
    appendToAll(() => {
      const wrap = document.createElement('div');
      wrap.className = 'valek-msg valek-msg--user';
      const p = document.createElement('p');
      p.textContent = text;
      wrap.appendChild(p);
      return wrap;
    });
  }

  function typingDots() {
    return appendToAll(() => {
      const wrap = document.createElement('div');
      wrap.className = 'valek-typing';
      wrap.innerHTML = '<span></span><span></span><span></span>';
      return wrap;
    });
  }

  async function typeText(refs, text) {
    const speed = text.length > 300 ? 8 : text.length > 150 ? 13 : 20;
    for (let i = 0; i < text.length; i++) {
      refs.forEach(({ node, inst }) => {
        node.textContent += text[i];
        if (i % 4 === 0) inst.feed.scrollTop = inst.feed.scrollHeight;
      });
      await new Promise(r => setTimeout(r, speed));
    }
    refs.forEach(({ inst }) => { inst.feed.scrollTop = inst.feed.scrollHeight; });
  }

  async function aiBubble(text) {
    history.push({ role: 'assistant', content: text });
    const refs = appendToAll(() => {
      const wrap = document.createElement('div');
      wrap.className = 'valek-msg valek-msg--ai';
      const p = document.createElement('p');
      wrap.appendChild(p);
      return wrap;
    }).map(({ inst, node }) => ({ inst, node: node.querySelector('p') }));
    await typeText(refs, text);
  }

  function showSuggestions(questions) {
    if (!questions || !questions.length) return;
    appendToAll(() => {
      const wrap = document.createElement('div');
      wrap.className = 'valek-suggestions';
      questions.forEach(q => {
        const btn = document.createElement('button');
        btn.className = 'valek-suggestion';
        btn.type = 'button';
        btn.textContent = q;
        btn.addEventListener('click', () => {
          document.querySelectorAll('.valek-suggestions').forEach(s => s.remove());
          send(q);
        });
        wrap.appendChild(btn);
      });
      return wrap;
    });
  }

  const heroChatEl = document.querySelector('.hero-chat');

  let sending = false;
  async function send(text) {
    text = text.trim();
    if (!text || sending) return;
    sending = true;

    if (heroChatEl) heroChatEl.classList.add('is-asking');
    hideChipsAll();
    userBubble(text);
    instances.forEach(inst => {
      inst.input.value = '';
      inst.input.disabled = true;
      const btn = inst.form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
    });

    const dots = typingDots();

    try {
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      removeFromAll(dots);
      await aiBubble(data.reply);
      showSuggestions(data.suggestions);
    } catch {
      removeFromAll(dots);
      await aiBubble("I can't reach my server right now. You can email Dhia directly at dhia.rekik@icloud.com");
    } finally {
      sending = false;
      instances.forEach(inst => {
        inst.input.disabled = false;
        const btn = inst.form.querySelector('button[type="submit"]');
        if (btn) btn.disabled = false;
      });
    }
  }

  // Bind forms + chip buttons on both instances
  instances.forEach(inst => {
    inst.form.addEventListener('submit', e => { e.preventDefault(); send(inst.input.value); });
    if (inst.chips) {
      inst.chips.querySelectorAll('button').forEach(chip => {
        chip.addEventListener('click', () => send(chip.textContent));
      });
    }
  });

  // ---- Floating pill open/close + scroll-based visibility ----
  const fab = document.getElementById('valekFab');
  const popEl = document.getElementById('valekPop');
  const popCloseBtn = document.getElementById('valekPopClose');
  const heroSection = document.querySelector('.hero');

  function openPop() {
    popEl.classList.add('open');
    popEl.setAttribute('aria-hidden', 'false');
    fab.setAttribute('aria-expanded', 'true');
    fab.classList.add('hidden');
    setTimeout(() => { pop.input && pop.input.focus({ preventScroll: true }); }, 60);
  }
  function closePop() {
    popEl.classList.remove('open');
    popEl.setAttribute('aria-hidden', 'true');
    fab.setAttribute('aria-expanded', 'false');
    // re-show fab if user is still past hero
    if (shouldShowFab()) fab.classList.remove('hidden');
  }
  function shouldShowFab() {
    if (!heroSection) return true;
    const heroBottom = heroSection.getBoundingClientRect().bottom;
    return heroBottom < 80;
  }
  function updateFab() {
    if (popEl && popEl.classList.contains('open')) return;
    if (shouldShowFab()) fab.classList.add('show');
    else fab.classList.remove('show');
  }

  if (fab && popEl) {
    fab.addEventListener('click', openPop);
    if (popCloseBtn) popCloseBtn.addEventListener('click', closePop);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && popEl.classList.contains('open')) closePop();
    });
    window.addEventListener('scroll', updateFab, { passive: true });
    updateFab();
  }
})();
