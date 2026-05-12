(function () {
  const GITHUB_USER = 'dhia-rek';
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  const CASE_STUDIES = {
    'Grid_shooter': {
      tagline: 'Train a REINFORCE agent to aim, dodge, and survive a staged zombie shooter — built from scratch.',
      problem: 'Learning reinforcement learning from textbooks only goes so far. To genuinely understand policy gradients you need an environment complex enough to produce real emergent strategy — aiming, dodging, prioritizing threats — but structured enough to see exactly what the agent is learning and why.',
      solution: 'Built a custom Gymnasium environment: an 8×8 grid zombie shooter with 4 escalating difficulty stages, directional shooting (9 actions), and carefully shaped rewards. Implemented REINFORCE from scratch in PyTorch with entropy bonus to prevent premature convergence and gradient clipping for stability. Zombies unlock progressively — top-only in stage 1, all four directions by stage 3 — giving the policy time to develop basic skills before full chaos. Pygame visualizes training live so you can watch the agent figure out how to aim.',
      stack: ['Python', 'PyTorch', 'Gymnasium', 'REINFORCE', 'Pygame', 'NumPy'],
      results: [
        'Agent learns to aim directionally, dodge, and advance through 4 difficulty stages without any supervision',
        'Alignment bonus (+0.5) shapes early exploration toward aimed shots before the policy learns anything',
        'Entropy bonus prevents policy collapse; gradient clipping ensures stable training across long episodes',
        'Clean separation: game logic, RL algorithm, and renderer are fully decoupled modules',
      ],
    },
    'multi-agent-multi-llm-rag': {
      tagline: 'Turn a free-text business case into a structured digital transformation roadmap — 6 agents, 3 frameworks, full RAG.',
      problem: 'Digital transformation frameworks are rich and well-researched but locked in dense PDFs and inaccessible without expert interpretation. Small businesses especially cannot afford consulting fees to apply them — yet the frameworks are precisely what\'s needed to avoid wasted budget and failed rollouts.',
      solution: 'Built a RAG pipeline over four DT framework PDFs (Wade 2015, Peter 2018/2024, Elia 2024) using FAISS and local MiniLM embeddings — no API calls, no token cost for retrieval. Six specialist agents chain sequentially: Planner extracts intent and writes retrieval queries; Framework Agent classifies passages; Canvas Analysis scores maturity across 7 fields; Strategist synthesizes purpose and risks; Roadmap Generator produces phased KPIs and milestones; Evaluator critiques the output. A Multi-LLM router assigns fast or powerful Gemini tiers per task based on complexity and criticality, with mock fallback when quota is exhausted. Eight eco-responsible optimizations (persistent index, SHA disk cache, capped context, local embeddings) minimize cost and latency.',
      stack: ['Python', 'FAISS', 'Gemini API', 'sentence-transformers', 'Streamlit', 'FastAPI', 'LangChain', 'pypdf', 'Ollama'],
      results: [
        'Full pipeline: free-text business case → structured roadmap with phases, KPIs, owners, milestones, budget',
        'Multi-LLM routing reduces token cost — fast model handles simple tasks, powerful model only where reasoning is needed',
        'Runs end-to-end in mock mode without any API key — full UI and architecture explorable offline',
        'REST API (FastAPI) exposes the pipeline as HTTP endpoints with auto-generated Swagger docs',
        '8 eco-responsible optimizations including local CPU embeddings and SHA-keyed disk cache',
      ],
    },
    'campus-safety-detection': {
      tagline: 'Zero-shot CCTV bullying detection — no labeled abnormal data required.',
      problem: 'Campus CCTV systems demand constant human monitoring — expensive, error-prone, and impossible to scale. Collecting labeled video of real bullying or violence incidents is also impractical due to rarity and sensitivity of such events.',
      solution: 'Built a zero-shot detection pipeline using CLIP to compare live video frames against natural-language descriptions of anomalies. YOLOv8 crops individual people first, then CLIP scores each crop. Scores are Z-score normalized and Gaussian-smoothed over time to suppress false positives. Audio is independently analyzed with PANNs. A Streamlit dashboard streams live CCTV playback with a real-time anomaly score graph, while a Telegram bot pushes annotated alert frames to subscribers.',
      stack: ['Python', 'CLIP', 'YOLOv8', 'PyTorch', 'Streamlit', 'Telegram Bot', 'PANNs', 'OpenCV', 'NumPy'],
      results: [
        'Anomaly score spikes to 1.771 sustained across 90+ consecutive frames during a bullying event',
        'Zero labeled abnormal samples needed — pure zero-shot generalization via natural language',
        'Real-time Telegram alerts with annotated frame screenshots delivered to subscribers instantly',
      ],
    },
  };

  let cache = null;

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function formatDate(iso) {
    if (!iso) return '';
    const lang = window.i18n ? window.i18n.lang : 'en';
    const days = Math.floor((new Date() - new Date(iso)) / 86400000);
    if (days < 1) return lang === 'fr' ? "aujourd'hui" : 'today';
    if (days < 30) return lang === 'fr' ? `il y a ${days}j` : `${days}d ago`;
    if (days < 365) return lang === 'fr' ? `il y a ${Math.floor(days/30)} mois` : `${Math.floor(days/30)}mo ago`;
    return lang === 'fr' ? `il y a ${Math.floor(days/365)} an` : `${Math.floor(days/365)}y ago`;
  }

  function fullDate(iso) {
    if (!iso) return '';
    const lang = window.i18n ? window.i18n.lang : 'en';
    return new Date(iso).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  const starSvg = '<svg viewBox="0 0 16 16"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg>';
  const forkSvg = '<svg viewBox="0 0 16 16"><path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"/></svg>';
  const repoSvg = '<svg viewBox="0 0 16 16"><path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"/></svg>';

  function renderCard(repo) {
    const langClass = repo.language ? `lang-${repo.language.replace(/\s+/g,'')}` : '';
    const t = window.i18n ? window.i18n.t.bind(window.i18n) : (k, fb) => fb || k;
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
        <div class="project-footer">
          <div class="project-meta">
            ${repo.language ? `<span><span class="lang-dot ${langClass}"></span>${escapeHtml(repo.language)}</span>` : ''}
            <span>${formatDate(repo.pushed_at)}</span>
          </div>
          <button class="case-study-btn">${t('modal.caseStudy', 'Case Study')} →</button>
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
    const problem = cs.problem || '';
    const solution = cs.solution || '';
    const aboutText = (!problem && !solution) ? (cs.about || repo.description || '') : '';
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

      ${problem ? `<h4>${t('modal.problem')}</h4><p>${escapeHtml(problem)}</p>` : ''}
      ${solution ? `<h4>${t('modal.solution')}</h4><p>${escapeHtml(solution)}</p>` : ''}
      ${aboutText ? `<h4>${t('modal.about')}</h4><p>${escapeHtml(aboutText)}</p>` : ''}

      ${stack.length ? `
        <h4>${t('modal.stack')}</h4>
        <div class="topic-list">${stack.map(s => `<span>${escapeHtml(s)}</span>`).join('')}</div>
      ` : ''}

      ${results.length ? `
        <h4>${t('modal.results')}</h4>
        <ul class="modal-results">${results.map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ul>
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
    modal.addEventListener('click', (e) => { if (e.target.closest('[data-modal-close]')) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });
  }

  function render(repos) {
    if (!repos.length) {
      grid.innerHTML = `<div class="projects-empty">${window.i18n ? window.i18n.t('proj.empty') : 'No projects yet.'}</div>`;
      return;
    }
    grid.innerHTML = repos.map(renderCard).join('');
    grid.querySelectorAll('.project-card').forEach((card) => {
      const name = card.getAttribute('data-repo');
      const openThisModal = () => {
        const repo = cache.find(r => r.name === name);
        if (repo) openModal(repo);
      };
      card.addEventListener('click', (e) => { if (!e.target.closest('.case-study-btn')) openThisModal(); });
      const btn = card.querySelector('.case-study-btn');
      if (btn) btn.addEventListener('click', (e) => { e.stopPropagation(); openThisModal(); });
    });
  }

  function load() {
    fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=30`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
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
      .catch(() => {
        const t = window.i18n ? window.i18n.t.bind(window.i18n) : () => 'Failed to load.';
        grid.innerHTML = `<div class="projects-empty"><a href="https://github.com/${GITHUB_USER}" target="_blank" rel="noopener" style="color:var(--accent);text-decoration:none;">${t('proj.error')}</a></div>`;
      });
  }

  setupModal();
  load();

  if (window.i18n) window.i18n.onChange(() => { if (cache) render(cache); });
})();
