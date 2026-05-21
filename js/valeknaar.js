(function () {
  const WORKER_URL = 'https://valeknaar.dhiarekik-contact.workers.dev';
  const history = [];

  const form  = document.getElementById('valekForm');
  const input = document.getElementById('valekInput');
  const feed  = document.getElementById('valekFeed');
  const chips = document.getElementById('valekChips');
  const submitBtn = form ? form.querySelector('button[type="submit"]') : null;

  if (!form || !input || !feed) return;

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
    wrap.className = 'valek-typing';
    wrap.innerHTML = '<span></span><span></span><span></span>';
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
      btn.type = 'button';
      btn.textContent = q;
      btn.addEventListener('click', () => { wrap.remove(); send(q); });
      wrap.appendChild(btn);
    });
    feed.appendChild(wrap);
    feed.scrollTop = feed.scrollHeight;
  }

  async function send(text) {
    text = text.trim();
    if (!text) return;

    if (chips && chips.parentNode) chips.remove();
    userBubble(text);
    input.value = '';
    input.disabled = true;
    if (submitBtn) submitBtn.disabled = true;

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
      await aiBubble("I can't reach my server right now. You can email Dhia directly at dhia.rekik@icloud.com");
    } finally {
      input.disabled = false;
      if (submitBtn) submitBtn.disabled = false;
      input.focus();
    }
  }

  form.addEventListener('submit', e => { e.preventDefault(); send(input.value); });

  if (chips) {
    chips.querySelectorAll('button').forEach(chip => {
      chip.addEventListener('click', () => send(chip.textContent));
    });
  }
})();
