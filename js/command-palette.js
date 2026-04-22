(function () {
  const palette = document.getElementById('cmdk');
  const input = document.getElementById('cmdkInput');
  const list = document.getElementById('cmdkList');
  const trigger = document.getElementById('cmdBtn');
  if (!palette || !input || !list) return;

  const items = [
    { icon: '◐', key: 'cap',  label: 'Capabilities', sub: 'Skill matrix', action: () => goto('#capabilities') },
    { icon: '◇', key: 'proj', label: 'Projects',     sub: 'Live from GitHub', action: () => goto('#projects') },
    { icon: '⬢', key: 'perf', label: 'Performance',  sub: 'The numbers behind the work', action: () => goto('#performance') },
    { icon: '⬡', key: 'exp',  label: 'Experience',   sub: 'A track record', action: () => goto('#experience') },
    { icon: '◈', key: 'stack',label: 'Tech specs',   sub: 'Tools I use', action: () => goto('#stack') },
    { icon: '✉', key: 'mail', label: 'Email Dhia',   sub: 'dhiarekik.contact@gmail.com', action: () => location.href = 'mailto:dhiarekik.contact@gmail.com' },
    { icon: '◉', key: 'gh',   label: 'GitHub',       sub: 'github.com/dhia-rek', action: () => open('https://github.com/dhia-rek', '_blank') },
    { icon: '◆', key: 'in',   label: 'LinkedIn',     sub: 'linkedin.com/in/dhia-rekik', action: () => open('https://linkedin.com/in/dhia-rekik', '_blank') },
    { icon: '☼', key: 'theme',label: 'Toggle theme', sub: 'Dark / light',   action: () => document.getElementById('themeBtn').click() },
    { icon: '⌥', key: 'lang', label: 'Toggle language', sub: 'EN / FR',     action: () => document.getElementById('langBtn').click() },
    { icon: '↑', key: 'top',  label: 'Back to top',  sub: 'Scroll to hero', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
  ];

  let active = 0;
  let filtered = items.slice();

  function goto(hash) {
    const el = document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function score(query, item) {
    if (!query) return 1;
    const q = query.toLowerCase();
    const hay = (item.label + ' ' + item.sub + ' ' + item.key).toLowerCase();
    if (hay.includes(q)) return 2;
    let qi = 0;
    for (let i = 0; i < hay.length && qi < q.length; i++) {
      if (hay[i] === q[qi]) qi++;
    }
    return qi === q.length ? 1 : 0;
  }

  function render() {
    if (!filtered.length) {
      const empty = window.i18n ? window.i18n.t('cmdk.empty') : 'No results';
      list.innerHTML = `<li class="cmdk-empty">${empty}</li>`;
      return;
    }
    list.innerHTML = filtered.map((it, idx) => `
      <li data-idx="${idx}" class="${idx === active ? 'active' : ''}">
        <span class="cmdk-icon">${it.icon}</span>
        <span class="cmdk-text">${it.label}<span class="cmdk-sub">${it.sub}</span></span>
        <span class="cmdk-hint">↵</span>
      </li>
    `).join('');
  }

  function update() {
    const q = input.value.trim();
    const placeholder = window.i18n ? window.i18n.t('cmdk.placeholder') : 'Search…';
    input.placeholder = placeholder;
    filtered = items
      .map((it) => ({ it, s: score(q, it) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.it);
    active = 0;
    render();
  }

  function select(idx) {
    const it = filtered[idx];
    if (!it) return;
    close();
    setTimeout(it.action, 50);
  }

  function open_() {
    palette.classList.add('open');
    palette.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    input.value = '';
    update();
    setTimeout(() => input.focus(), 50);
  }

  function close() {
    palette.classList.remove('open');
    palette.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.addEventListener('keydown', (e) => {
    const isMod = e.metaKey || e.ctrlKey;
    if (isMod && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      palette.classList.contains('open') ? close() : open_();
      return;
    }
    if (!palette.classList.contains('open')) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, filtered.length - 1); render(); ensureVisible(); }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); active = Math.max(active - 1, 0); render(); ensureVisible(); }
    else if (e.key === 'Enter')     { e.preventDefault(); select(active); }
  });

  function ensureVisible() {
    const el = list.querySelector('li.active');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }

  input.addEventListener('input', update);
  list.addEventListener('click', (e) => {
    const li = e.target.closest('li[data-idx]');
    if (!li) return;
    select(parseInt(li.getAttribute('data-idx'), 10));
  });
  palette.addEventListener('click', (e) => {
    if (e.target.closest('[data-cmdk-close]')) close();
  });
  if (trigger) trigger.addEventListener('click', open_);

  if (window.i18n) window.i18n.onChange(update);
})();
