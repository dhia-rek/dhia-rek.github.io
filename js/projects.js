(function () {
  const GITHUB_USER = 'dhia-rek';
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  // Optional manual case-study overrides. Add entries keyed by repo name
  // to enrich the modal with hand-written context.
  // Example:
  //   'my-repo': {
  //     tagline: 'One-line pitch.',
  //     about: 'Longer description...',
  //     results: ['Metric 1', 'Metric 2'],
  //     stack: ['Python', 'PyTorch'],
  //     demo: 'https://example.com',
  //   }
  const CASE_STUDIES = {};

  let cache = null;

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function formatDate(iso) {
    if (!iso) return '';
    const lang = window.i18n ? window.i18n.lang : 'en';
    const d = new Date(iso);
    const now = new Date();
    const days = Math.floor((now - d) / 86400000);
    if (days < 1) return lang === 'fr' ? "aujourd'hui" : 'today';
    if (days < 30) return lang === 'fr' ? `il y a ${days}j` : `${days}d ago`;
    if (days < 365) return lang === 'fr' ? `il y a ${Math.floor(days/30)} mois` : `${Math.floor(days/30)}mo ago`;
    return lang === 'fr' ? `il y a ${Math.floor(days/365)} an` : `${Math.floor(days/365)}y ago`;
  }

  function fullDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const lang = window.i18n ? window.i18n.lang : 'en';
    return d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  const starSvg = '<svg viewBox="0 0 16 16"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg>';
  const forkSvg = '<svg viewBox="0 0 16 16"><path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"/></svg>';
  const repoSvg = '<svg viewBox="0 0 16 16"><path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"/></svg>';

  function renderCard(repo) {
    const langClass = repo.language ? `lang-${repo.language.replace(/\s+/g,'')}` : '';
    return `
      <div class="project-card" data-repo="${escapeHtml(repo.name)}">
        <div class="project-header">
          <div class="project-icon-wrap">${repoSvg}</div>
          <div class="project-stats">
            ${repo.stargazers_count > 0 ? `<span>${starSvg}${repo.stargazers_count}</span>` : ''}
            ${repo.forks_count > 0 ? `<span>${forkSvg}${repo.forks_count}</span>` : ''}
          </div>
        </div>
        <h3>${escapeHtml(repo.name)}</h3>
        <p class="desc">${escapeHtml(repo.description || '—')}</p>
        <div class="project-meta">
          ${repo.language ? `<span><span class="lang-dot ${langClass}"></span>${escapeHtml(repo.language)}</span>` : ''}
          <span>${formatDate(repo.pushed_at)}</span>
          <span class="project-arrow">→</span>
        </div>
      </div>
    `;
  }

  function openModal(repo) {
    const modal = document.getElementById('projectModal');
    const body = document.getElementById('modalBody');
    if (!modal || !body) return;
    const t = window.i18n ? window.i18n.t.bind(window.i18n) : (k) => k;
    const cs = CASE_STUDIES[repo.name] || {};

    const tagline = cs.tagline || repo.description || '—';
    const aboutText = cs.about || repo.description || '';
    const stack = cs.stack || (repo.topics && repo.topics.length ? repo.topics : []);
    const results = cs.results || [];
    const demoUrl = cs.demo || repo.homepage;

    body.innerHTML = `
      <h2>${escapeHtml(repo.name)}</h2>
      <p class="modal-tagline">${escapeHtml(tagline)}</p>
      <div class="modal-meta">
        ${repo.language ? `<span><span class="lang-dot lang-${repo.language.replace(/\s+/g,'')}"></span>${escapeHtml(repo.language)}</span>` : ''}
        ${repo.stargazers_count > 0 ? `<span>${starSvg}${repo.stargazers_count} ${repo.stargazers_count === 1 ? 'star' : 'stars'}</span>` : ''}
        ${repo.forks_count > 0 ? `<span>${forkSvg}${repo.forks_count} forks</span>` : ''}
        ${repo.license && repo.license.spdx_id ? `<span>${t('modal.license')}: ${escapeHtml(repo.license.spdx_id)}</span>` : ''}
        <span>${t('modal.updated')}: ${fullDate(repo.pushed_at)}</span>
      </div>

      ${aboutText ? `<h4>${t('modal.about')}</h4><p>${escapeHtml(aboutText)}</p>` : ''}

      ${results.length ? `
        <h4>${t('modal.results')}</h4>
        <p>${results.map(r => '• ' + escapeHtml(r)).join('<br>')}</p>
      ` : ''}

      ${stack.length ? `
        <h4>${t('modal.stack')}</h4>
        <div class="topic-list">${stack.map(s => `<span>${escapeHtml(s)}</span>`).join('')}</div>
      ` : ''}

      <div class="modal-actions">
        <a href="${escapeHtml(repo.html_url)}" target="_blank" rel="noopener" class="btn btn-primary" data-magnetic>${t('modal.viewRepo')}</a>
        ${demoUrl ? `<a href="${escapeHtml(demoUrl)}" target="_blank" rel="noopener" class="btn btn-secondary" data-magnetic>${t('modal.liveDemo')}</a>` : ''}
      </div>
    `;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const modal = document.getElementById('projectModal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function setupModal() {
    const modal = document.getElementById('projectModal');
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      if (e.target.closest('[data-modal-close]')) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });
  }

  function render(repos) {
    if (!repos.length) {
      grid.innerHTML = `<div class="projects-empty">${window.i18n ? window.i18n.t('proj.empty') : 'No projects yet.'}</div>`;
      return;
    }
    grid.innerHTML = repos.map(renderCard).join('');
    grid.querySelectorAll('.project-card').forEach((card) => {
      card.addEventListener('click', () => {
        const name = card.getAttribute('data-repo');
        const repo = cache.find(r => r.name === name);
        if (repo) openModal(repo);
      });
    });
  }

  function load() {
    fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=30`)
      .then((r) => { if (!r.ok) throw new Error('GitHub API error'); return r.json(); })
      .then((repos) => {
        cache = repos
          .filter((r) => !r.fork && !r.private && r.name !== `${GITHUB_USER}.github.io`)
          .sort((a, b) => {
            if (b.stargazers_count !== a.stargazers_count) return b.stargazers_count - a.stargazers_count;
            return new Date(b.pushed_at) - new Date(a.pushed_at);
          })
          .slice(0, 6);
        render(cache);
      })
      .catch((err) => {
        console.error(err);
        const t = window.i18n ? window.i18n.t.bind(window.i18n) : () => 'Failed to load.';
        grid.innerHTML = `<div class="projects-empty"><a href="https://github.com/${GITHUB_USER}" target="_blank" rel="noopener" style="color:var(--accent);text-decoration:none;">${t('proj.error')}</a></div>`;
      });
  }

  setupModal();
  load();

  if (window.i18n) window.i18n.onChange(() => { if (cache) render(cache); });
})();
