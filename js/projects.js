(function () {
  const GITHUB_USER = 'dhia-rek';
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  const CASE_STUDIES = {
    'sagemcom-roco': {
      tagline: 'PFE project at Esprit School of Engineering, completed during internship at Sagemcom. Upload, configure, execute, and evaluate Robot Framework test scripts from a single web platform.',
      problem: 'QA engineers at Sagemcom were running Robot Framework automation scripts ad-hoc across local machines. No centralized interface, no audit trail, no way to trigger or review runs without direct terminal access. Scaling the practice across teams required a shared, reproducible platform.',
      solution: 'Built a full-stack web application in Flask backed by PostgreSQL and a Redis-driven async worker. Engineers upload .robot test files through a web UI, configure parameters via forms, and trigger execution remotely. Results flow through three stages (Landing, Consumer, and Output) with logs and pass/fail breakdowns stored per run. The entire stack is containerized in Docker Compose: app, database, Redis, and worker all spin up with a single command. Install scripts cover both Windows and Unix. A pytest suite covers unit and integration layers end-to-end.',
      stack: ['Python', 'Robot Framework', 'Flask', 'PostgreSQL', 'Redis', 'Docker', 'JavaScript', 'pytest'],
      results: [
        'Centralized platform replaces ad-hoc local execution with a shared, audited interface for all RF test runs',
        'Async worker decouples test execution from the web server, handling long-running suites without blocking the UI',
        'Three-stage pipeline (Landing, Consumer, Output) gives every run a traceable lifecycle from upload to result',
        'One-command Docker Compose deployment eliminates environment drift across developer and CI machines',
      ],
      metric: 'Full Docker stack',
    },
    'Grid_shooter': {
      tagline: 'ECE Paris MSc AI project. Train a REINFORCE agent to aim, dodge, and survive a staged zombie shooter, built from scratch.',
      problem: 'Learning reinforcement learning from textbooks only goes so far. To genuinely understand policy gradients you need an environment complex enough to produce real emergent strategy (aiming, dodging, prioritizing threats) but structured enough to see exactly what the agent is learning and why.',
      solution: 'Built a custom Gymnasium environment: an 8×8 grid zombie shooter with 4 escalating difficulty stages, directional shooting (9 actions), and carefully shaped rewards. Implemented REINFORCE from scratch in PyTorch with entropy bonus to prevent premature convergence and gradient clipping for stability. Zombies unlock progressively: top-only in stage 1, all four directions by stage 3. Pygame visualizes training live so you can watch the agent figure out how to aim.',
      stack: ['Python', 'PyTorch', 'Gymnasium', 'REINFORCE', 'Pygame', 'NumPy'],
      results: [
        'Agent learns to aim directionally, dodge, and advance through 4 difficulty stages without any supervision',
        'Alignment bonus (+0.5) shapes early exploration toward aimed shots before the policy learns anything',
        'Entropy bonus prevents policy collapse; gradient clipping ensures stable training across long episodes',
        'Clean separation: game logic, RL algorithm, and renderer are fully decoupled modules',
      ],
      metric: '4 difficulty stages',
    },
    'multi-agent-multi-llm-rag': {
      tagline: 'MSc AI capstone at ECE Paris. Turn a plain-text business case into a structured digital transformation roadmap: 6 specialist agents, 3 academic frameworks, full RAG.',
      problem: 'Digital transformation frameworks are rich and well-researched but locked in dense PDFs and inaccessible without expert interpretation. Small businesses especially cannot afford consulting fees to apply them, yet the frameworks are precisely what is needed to avoid wasted budget and failed rollouts.',
      solution: 'Built a RAG pipeline over three DT framework documents (Wade 2015, Peter 2018, Elia 2024) embedded offline into a persistent FAISS index using local MiniLM (no API cost for retrieval). Six specialist agents chain sequentially: Planner extracts intent and writes retrieval queries; Framework Agent classifies passages; Canvas Analysis scores maturity across 7 fields; Strategist synthesizes the 11-element Elia canvas; Roadmap Generator produces phased KPIs and milestones; Evaluator critiques the output using LLaMA 3.1 locally. A routing layer maps each task by type, complexity, and criticality to Gemini Flash 2.5 or Gemini Pro 2.5. Results are SHA-keyed and cached to disk so repeated runs skip all LLM calls.',
      stack: ['Python', 'FAISS', 'Gemini API', 'sentence-transformers', 'Streamlit', 'FastAPI', 'pypdf', 'Ollama'],
      results: [
        'Full pipeline: plain-text business case → structured roadmap with phases, KPIs, owners, milestones, and budget',
        'Multi-LLM routing: Gemini Flash for extraction, Gemini Pro for deep reasoning, LLaMA 3.1 locally for evaluation',
        'SHA-keyed disk cache: repeated runs serve all 6 agent steps with zero LLM calls',
        'Runs fully offline in mock mode: complete UI and architecture explorable without any API key',
        'REST API (FastAPI) exposes the pipeline as HTTP endpoints; local CPU embeddings eliminate retrieval API cost',
      ],
      metric: '6 agents · 3 frameworks',
    },
    'campus-safety-detection': {
      tagline: 'ECE Paris MSc AI project. Zero-shot CCTV bullying detection: no labeled abnormal data required.',
      problem: 'Campus CCTV systems demand constant human monitoring (expensive, error-prone, and impossible to scale). Collecting labeled video of real bullying or violence incidents is also impractical due to rarity and sensitivity of such events.',
      solution: 'Built a zero-shot detection pipeline using CLIP to compare live video frames against natural-language descriptions of anomalies. YOLOv8 crops individual people first, then CLIP scores each crop. Scores are Z-score normalized and Gaussian-smoothed over time to suppress false positives. Audio is independently analyzed with PANNs. A Streamlit dashboard streams live CCTV playback with a real-time anomaly score graph, while a Telegram bot pushes annotated alert frames to subscribers.',
      stack: ['Python', 'CLIP', 'YOLOv8', 'PyTorch', 'Streamlit', 'Telegram Bot', 'PANNs', 'OpenCV', 'NumPy'],
      results: [
        'Anomaly score spikes to 1.771 sustained across 90+ consecutive frames during a bullying event',
        'Zero labeled abnormal samples needed: pure zero-shot generalization via natural language',
        'Real-time Telegram alerts with annotated frame screenshots delivered to subscribers instantly',
      ],
      metric: 'Zero-shot · 1.771 peak',
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

  const starSvg = '<svg viewBox="0 0 16 16"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg>';
  const repoSvg = '<svg viewBox="0 0 16 16"><path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"/></svg>';
  const chevSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="6 9 12 15 18 9"/></svg>';

  function renderCard(repo) {
    const t = window.i18n ? window.i18n.t.bind(window.i18n) : (k, fb) => fb || k;
    const cs = CASE_STUDIES[repo.name] || {};
    const langClass = repo.language ? `lang-${repo.language.replace(/\s+/g,'')}` : '';
    const tagline = cs.tagline || repo.description || '';
    const metric = cs.metric || (repo.stargazers_count > 0 ? `${repo.stargazers_count} ★` : formatDate(repo.pushed_at));
    const problem = cs.problem || '';
    const solution = cs.solution || '';
    const stack = cs.stack || (repo.topics && repo.topics.length ? repo.topics : []);
    const results = cs.results || [];
    const demoUrl = cs.demo || repo.homepage;
    const primaryTag = repo.language || (stack[0] || 'Project');

    return `
      <article class="project-card" data-repo="${escapeHtml(repo.name)}">
        <button class="project-card-summary" aria-expanded="false">
          <div class="project-card-top">
            <div class="project-icon-wrap">${repoSvg}</div>
            <span class="project-card-chevron">${chevSvg}</span>
          </div>
          <h3>${escapeHtml(repo.name)}</h3>
          <div class="project-card-meta">
            <span class="project-card-tag"><span class="lang-dot ${langClass}"></span>${escapeHtml(primaryTag)}</span>
            <span class="project-card-metric">${escapeHtml(metric)}</span>
          </div>
        </button>
        <div class="project-details">
          <p class="project-tagline">${escapeHtml(tagline)}</p>
          ${problem ? `<h4>${t('modal.problem', 'The problem')}</h4><p>${escapeHtml(problem)}</p>` : ''}
          ${solution ? `<h4>${t('modal.solution', 'The solution')}</h4><p>${escapeHtml(solution)}</p>` : ''}
          ${stack.length ? `
            <h4>${t('modal.stack', 'Stack')}</h4>
            <div class="topic-list">${stack.map(s => `<span>${escapeHtml(s)}</span>`).join('')}</div>
          ` : ''}
          ${results.length ? `
            <h4>${t('modal.results', 'Results')}</h4>
            <ul class="modal-results">${results.map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ul>
          ` : ''}
          <div class="project-actions">
            <a href="${escapeHtml(repo.html_url)}" target="_blank" rel="noopener" class="btn btn-primary" data-magnetic>${t('modal.viewRepo', 'View on GitHub ↗')}</a>
            ${demoUrl ? `<a href="${escapeHtml(demoUrl)}" target="_blank" rel="noopener" class="btn btn-secondary" data-magnetic>${t('modal.liveDemo', 'Live demo')}</a>` : ''}
          </div>
        </div>
      </article>
    `;
  }

  function render(repos) {
    if (!repos.length) {
      grid.innerHTML = `<div class="projects-empty">${window.i18n ? window.i18n.t('proj.empty') : 'No projects yet.'}</div>`;
      return;
    }
    grid.innerHTML = repos.map(renderCard).join('');
    grid.querySelectorAll('.project-card').forEach((card) => {
      const summary = card.querySelector('.project-card-summary');
      if (!summary) return;
      summary.addEventListener('click', () => {
        const open = card.classList.toggle('open');
        summary.setAttribute('aria-expanded', String(open));
      });
    });
  }

  function pipeline(repos) {
    return repos
      .filter((r) => !r.fork && !r.private && r.name !== `${GITHUB_USER}.github.io`)
      .sort((a, b) => {
        if (b.stargazers_count !== a.stargazers_count) return b.stargazers_count - a.stargazers_count;
        return new Date(b.pushed_at) - new Date(a.pushed_at);
      })
      .slice(0, 6);
  }

  function showError() {
    if (cache) return;
    const t = window.i18n ? window.i18n.t.bind(window.i18n) : () => 'Failed to load.';
    grid.innerHTML = `<div class="projects-empty"><a href="https://github.com/${GITHUB_USER}" target="_blank" rel="noopener" style="color:var(--accent);text-decoration:none;">${t('proj.error')}</a></div>`;
  }

  function load() {
    fetch('repos.json')
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((repos) => { cache = pipeline(repos); render(cache); })
      .catch(() => {})
      .finally(() => {
        fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=30`)
          .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
          .then((repos) => { cache = pipeline(repos); render(cache); })
          .catch(showError);
      });
  }

  load();

  if (window.i18n) window.i18n.onChange(() => { if (cache) render(cache); });
})();
