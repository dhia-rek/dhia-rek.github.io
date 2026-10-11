(function () {
  const GITHUB_USER = 'dhia-rek';
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  const CASE_STUDIES = {
    'dopa-hackathon': {
      title: 'Nekyia',
      tagline: 'Hackathon game: a Greek-mythology roguelike in the browser where AI-written dialogue, trials and omens react to how you play.',
      problem: 'Roguelikes repeat themselves: rooms change, but the world never reacts to who you are. The hackathon goal was a game whose story responds to the player in real time.',
      solution: 'A Binding of Isaac-style roguelike in Phaser 3 and TypeScript. You descend through the underworld as Achilles, Atalanta, Heracles or Orpheus. Sparing, robbing or killing villagers changes your karma; bosses speak before each fight and remember your deeds. Each floor a god sets an AI-written trial, and omens reshape the next floor based on how you play. A small Python server calls Gemini for dialogue, trials and voiced lines; without it the game falls back to a built-in mock and runs fully offline. Works on phones with twin touch sticks.',
      stack: ['TypeScript', 'Phaser 3', 'Gemini API', 'Gemini TTS', 'Python', 'Vite'],
      results: [
        'Choices drive the story: karma changes which boss you face and how it talks to you',
        'AI trials and omens make every floor different, with procedural rooms and replayable seeds',
        'Runs offline without an API key thanks to a built-in mock of the AI server',
        'Playable on desktop and phone (twin-stick touch controls, landscape mode)',
      ],
      metric: 'AI-driven story',
    },
    'ai-vision-detection': {
      title: 'AI Vision Detection',
      lang: 'JavaScript',
      tagline: 'Object detection, facial-expression reading and ASL fingerspelling, live on your camera and entirely in your browser. No server, no upload.',
      problem: 'Most vision apps stream your camera to a server: slow, costly to host, and a privacy problem. Sign-language letters were the hardest part: the first model was right only 47% of the time on photos it had never seen.',
      solution: 'Three modes on one camera. YOLO11n finds 80 kinds of objects, YuNet and MobileFaceNet read the expression on each face, and MediaPipe hand landmarks feed a letter classifier I trained myself. Every model was exported to run in the page with ONNX Runtime Web in Web Workers (WebGPU when available), so frames never leave the device and the site is plain static files. Python trains and evaluates the models; tests check the browser gives the same answers.',
      stack: ['JavaScript', 'ONNX Runtime Web', 'MediaPipe', 'YOLO11', 'Web Workers', 'Python', 'NumPy', 'Playwright'],
      results: [
        'ASL letter accuracy 47% → 76% on a separate photo collection never used for training',
        'Object detection at about 29 fps on a 6-core CPU in the browser, with no GPU',
        'Browser and Python give the same answers on all 22 parity cases',
        'Nothing is uploaded: the camera stays on the visitor\'s device',
      ],
      metric: 'Live in your browser',
      live: 'https://dhiarekik.me/ai-vision-detection/',
    },
    'sagemcom-roco': {
      title: 'Robot Framework Test Platform',
      tagline: 'PFE project at Esprit School of Engineering, completed during internship at Sagemcom. Upload, configure, execute, and evaluate Robot Framework test scripts from a single web platform.',
      problem: 'QA engineers at Sagemcom were running Robot Framework automation scripts ad-hoc across local machines. No centralized interface, no audit trail, no way to trigger or review runs without direct terminal access. Scaling the practice across teams required a shared, reproducible platform.',
      solution: 'Built a full-stack web application in Flask backed by PostgreSQL and a Redis-driven async worker. Engineers upload .robot test files through a web UI, configure parameters via forms, and trigger execution remotely. Results flow through three stages (Landing, Consumer, and Output) with logs and pass/fail breakdowns stored per run. The entire stack is containerized in Docker Compose: app, database, Redis, and worker all spin up with a single command. Install scripts cover both Windows and Unix. A pytest suite covers unit and integration tests.',
      stack: ['Python', 'Robot Framework', 'Flask', 'PostgreSQL', 'Redis', 'Docker', 'JavaScript', 'pytest'],
      results: [
        'Centralized platform replaces ad-hoc local execution with a shared, audited interface for all RF test runs',
        'Async worker decouples test execution from the web server, handling long-running suites without blocking the UI',
        'Three-stage pipeline (Landing, Consumer, Output) gives every run a traceable lifecycle from upload to result',
        'One-command Docker Compose deployment eliminates environment drift across developer and CI machines',
      ],
      metric: 'Full Docker stack',
    },
    'grid-shooter': {
      title: 'Grid Shooter RL Agent',
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
      title: "Multi-Agent RAG Roadmap",
      tagline: "ECE Paris MSc AI project, built with Roy Hayek. Turns a plain-text business case into a digital transformation roadmap with six LLM agents, three academic frameworks and multi-LLM routing.",
      problem: "Digital transformation frameworks are well researched but locked in dense PDFs, and small businesses cannot pay consultants to apply them. Companies have plenty of documents, but it is hard to turn them into a clear transformation strategy.",
      solution: "The three frameworks (Wade 2015, Peter, Elia et al. 2024) are chunked, embedded with MiniLM on CPU and stored in a FAISS index once. A LangGraph pipeline then runs six agents: a planner extracts the need and writes retrieval queries, a framework agent and a canvas agent analyse the retrieved passages in parallel, a strategist builds the strategy, a roadmap agent produces phases, KPIs, owners and budget, and an evaluator scores the result. Each agent declares its task type, complexity and criticality, and a router picks the model from those criteria: Gemini Flash-Lite for simple steps, Gemini Flash for reasoning, or a local Ollama model. Every output is validated as JSON and cached, so a bad answer or a timeout does not restart the whole run.",
      stack: [
        "Python",
        "LangGraph",
        "LangChain",
        "Gemini API",
        "Ollama",
        "FAISS",
        "sentence-transformers",
        "Streamlit",
        "FastAPI",
      ],
      results: [
        "Multi-LLM routing: each agent gets the cheapest model that fits its criteria (task type, complexity, criticality)",
        "18 of 18 agent outputs were valid JSON on 3 live cases; evaluator score 6.0 / 10 on average",
        "About 45 s per full roadmap on the free Gemini tier",
        "Chunking fix raised the share of the corpus actually embedded from 36% to 99%, and retrieval precision from 0.19 to 0.48",
        "Runs without an API key: retrieval is live and the agents replay a recorded Gemini run",
      ],
      metric: "6 agents · multi-LLM routing",
    },
    'campus-safety-detection': {
      title: 'Campus Safety Detection',
      tagline: 'ECE Paris MSc AI project. Zero-shot CCTV bullying detection: no labeled abnormal data required.',
      problem: 'Campus CCTV systems demand constant human monitoring (expensive, error-prone, and impossible to scale). Collecting labeled video of real bullying or violence incidents is also impractical due to rarity and sensitivity of such events.',
      solution: 'Built a zero-shot detection pipeline using CLIP to compare live video frames against natural-language descriptions of anomalies. YOLOv8 crops individual people first, then CLIP scores each crop. Scores are Z-score normalized and Gaussian-smoothed over time to suppress false positives. Audio is independently analyzed with PANNs. A Streamlit dashboard streams live CCTV playback with a real-time anomaly score graph, while a Telegram bot pushes annotated alert frames to subscribers.',
      stack: ['Python', 'CLIP', 'YOLOv8', 'PyTorch', 'Streamlit', 'Telegram Bot', 'PANNs', 'OpenCV', 'NumPy'],
      results: [
        'During a bullying clip the anomaly score stays high for 90+ consecutive frames',
        'Zero labeled abnormal samples needed: pure zero-shot generalization via natural language',
        'Real-time Telegram alerts with annotated frame screenshots delivered to subscribers instantly',
      ],
      metric: 'Zero-shot',
    },
  };


  // French text for the case studies, used on top of the English entries when the site is in French.
  const CASE_STUDIES_FR = {
    "dopa-hackathon": {
      "tagline": "Jeu de hackathon : un roguelike sur la mythologie grecque dans le navigateur, où des dialogues, épreuves et présages écrits par l'IA réagissent à ta façon de jouer.",
      "problem": "Les roguelikes se répètent : les salles changent, mais le monde ne réagit jamais à qui tu es. L'objectif du hackathon : un jeu dont l'histoire répond au joueur en temps réel.",
      "solution": "Un roguelike façon Binding of Isaac en Phaser 3 et TypeScript. Tu descends aux Enfers en incarnant Achille, Atalante, Héraclès ou Orphée. Épargner, voler ou tuer des villageois change ton karma ; les boss parlent avant chaque combat et se souviennent de tes actes. À chaque étage, un dieu impose une épreuve écrite par l'IA, et des présages modifient l'étage suivant selon ta façon de jouer. Un petit serveur Python appelle Gemini pour les dialogues, les épreuves et les voix ; sans lui, le jeu bascule sur une version simulée et fonctionne hors ligne. Jouable sur téléphone avec deux joysticks tactiles.",
      "results": [
        "Les choix pilotent l'histoire : le karma change le boss affronté et la façon dont il te parle",
        "Les épreuves et présages de l'IA rendent chaque étage différent, avec des salles procédurales et des parties rejouables",
        "Fonctionne hors ligne sans clé API grâce à une version simulée du serveur IA",
        "Jouable sur ordinateur et téléphone (commandes tactiles, mode paysage)"
      ],
      "metric": "Histoire pilotée par l'IA"
    },
    "ai-vision-detection": {
      "tagline": "Détection d'objets, lecture des expressions faciales et alphabet ASL, en direct sur ta caméra et entièrement dans ton navigateur. Pas de serveur, rien n'est envoyé.",
      "problem": "La plupart des applis de vision envoient la caméra à un serveur : lent, coûteux à héberger et problématique pour la vie privée. Les lettres en langue des signes étaient la partie la plus dure : le premier modèle n'avait raison que 47 % du temps sur des photos jamais vues.",
      "solution": "Trois modes sur une seule caméra. YOLO11n trouve 80 types d'objets, YuNet et MobileFaceNet lisent l'expression de chaque visage, et les points de la main de MediaPipe alimentent un classifieur de lettres que j'ai entraîné. Chaque modèle a été exporté pour tourner dans la page avec ONNX Runtime Web dans des Web Workers (WebGPU si disponible) : les images ne quittent jamais l'appareil et le site n'est que des fichiers statiques. Python entraîne et évalue les modèles ; des tests vérifient que le navigateur donne les mêmes réponses.",
      "results": [
        "Précision sur les lettres ASL : 47 % → 76 % sur une collection de photos jamais utilisée pour l'entraînement",
        "Détection d'objets à environ 29 images/s sur un CPU 6 cœurs dans le navigateur, sans GPU",
        "Le navigateur et Python donnent les mêmes réponses sur les 22 cas de parité",
        "Rien n'est envoyé : la caméra reste sur l'appareil du visiteur"
      ],
      "metric": "En direct dans ton navigateur"
    },
    "sagemcom-roco": {
      "tagline": "Projet de fin d'études à ESPRIT, réalisé en stage chez Sagemcom. Importer, configurer, lancer et analyser des scripts de test Robot Framework depuis une seule plateforme web.",
      "problem": "Chez Sagemcom, les ingénieurs QA lançaient leurs scripts Robot Framework au cas par cas sur leurs machines : pas d'interface commune, pas d'historique, impossible de lancer ou relire un test sans accès au terminal.",
      "solution": "Application web complète en Flask avec PostgreSQL et un worker asynchrone sur Redis. Les ingénieurs importent leurs fichiers .robot, règlent les paramètres dans des formulaires et lancent l'exécution à distance. Chaque exécution passe par trois étapes (réception, traitement, résultat) avec logs et détail réussite/échec. Toute la stack tourne dans Docker Compose et démarre en une commande ; des scripts d'installation couvrent Windows et Unix, et une suite pytest couvre les tests unitaires et d'intégration.",
      "results": [
        "Une plateforme commune remplace les exécutions locales, avec un historique de chaque test",
        "Le worker asynchrone exécute les longues suites sans bloquer l'interface",
        "Chaque exécution est traçable de l'import au résultat",
        "Déploiement en une commande avec Docker Compose, identique sur chaque machine"
      ],
      "metric": "Stack Docker complète"
    },
    "grid-shooter": {
      "tagline": "Projet du MSc IA de l'ECE Paris. Entraîner un agent REINFORCE à viser, esquiver et survivre dans un jeu de zombies par niveaux, construit de zéro.",
      "problem": "Les livres ne suffisent pas pour comprendre l'apprentissage par renforcement. Il faut un environnement assez riche pour faire émerger une vraie stratégie (viser, esquiver, choisir ses cibles) mais assez simple pour voir ce que l'agent apprend et pourquoi.",
      "solution": "Un environnement Gymnasium sur mesure : un jeu de tir contre des zombies sur une grille 8×8, avec 4 niveaux de difficulté, des tirs dans 9 directions et des récompenses bien dosées. REINFORCE est implémenté de zéro en PyTorch, avec un bonus d'entropie pour éviter une convergence trop rapide et un écrêtage du gradient pour la stabilité. Les zombies arrivent progressivement : seulement par le haut au niveau 1, de partout au niveau 3. Pygame affiche l'entraînement en direct pour voir l'agent apprendre à viser.",
      "results": [
        "L'agent apprend à viser, esquiver et franchir les 4 niveaux sans supervision",
        "Un bonus d'alignement (+0,5) oriente l'exploration vers des tirs visés dès le début",
        "Le bonus d'entropie évite l'effondrement de la politique ; l'écrêtage du gradient stabilise l'entraînement",
        "Logique du jeu, algorithme et affichage sont des modules séparés"
      ],
      "metric": "4 niveaux de difficulté"
    },
    "multi-agent-multi-llm-rag": {
      "tagline": "Projet du MSc IA de l'ECE Paris, réalisé avec Roy Hayek. Transforme un cas d'entreprise en texte libre en feuille de route de transformation digitale, avec six agents LLM, trois cadres académiques et un routage multi-LLM.",
      "problem": "Les cadres de transformation digitale sont solides mais enfermés dans des PDF denses, et les petites entreprises ne peuvent pas payer des consultants pour les appliquer. Les entreprises ont beaucoup de documents, mais il est difficile d'en tirer une stratégie claire.",
      "solution": "Les trois cadres (Wade 2015, Peter, Elia et al. 2024) sont découpés, vectorisés avec MiniLM sur CPU et stockés une fois dans un index FAISS. Un pipeline LangGraph enchaîne ensuite six agents : un planificateur extrait le besoin et écrit les requêtes, un agent cadres et un agent canvas analysent en parallèle les passages retrouvés, un stratège construit la stratégie, un agent feuille de route produit les phases, KPIs, responsables et budget, et un évaluateur note le résultat. Chaque agent déclare son type de tâche, sa complexité et sa criticité, et un routeur choisit le modèle selon ces critères : Gemini Flash-Lite pour les étapes simples, Gemini Flash pour le raisonnement, ou un modèle local Ollama. Chaque sortie est validée en JSON et mise en cache : une mauvaise réponse ou un timeout ne relance pas tout.",
      "results": [
        "Routage multi-LLM : chaque agent reçoit le modèle le moins coûteux qui correspond à ses critères (type de tâche, complexité, criticité)",
        "18 sorties d'agents sur 18 en JSON valide sur 3 cas réels ; note moyenne de l'évaluateur : 6,0 / 10",
        "Environ 45 s par feuille de route complète avec l'offre gratuite de Gemini",
        "La correction du découpage a fait passer la part du corpus réellement vectorisée de 36 % à 99 %, et la précision de recherche de 0,19 à 0,48",
        "Fonctionne sans clé API : la recherche tourne en vrai et les agents rejouent un enregistrement Gemini"
      ],
      "metric": "6 agents · routage multi-LLM"
    },
    "campus-safety-detection": {
      "tagline": "Projet du MSc IA de l'ECE Paris. Détection du harcèlement sur vidéosurveillance sans exemples annotés.",
      "problem": "La vidéosurveillance demande une surveillance humaine constante : coûteuse, source d'erreurs et impossible à généraliser. Et il est très difficile d'obtenir des vidéos annotées de vrais incidents, rares et sensibles.",
      "solution": "Un pipeline zero-shot : CLIP compare les images de la caméra à des descriptions en langage naturel de comportements normaux et anormaux. YOLOv8 isole d'abord chaque personne, puis CLIP note chacune. Les scores sont normalisés et lissés dans le temps pour limiter les fausses alertes. L'audio est analysé séparément avec PANNs. Un tableau de bord Streamlit affiche la vidéo avec la courbe de score en direct, et un bot Telegram envoie les images d'alerte annotées.",
      "results": [
        "Pendant une vidéo de harcèlement, le score d'anomalie reste élevé sur plus de 90 images consécutives",
        "Aucun exemple anormal annoté nécessaire : la détection repose sur des descriptions en langage naturel",
        "Alertes Telegram en temps réel avec l'image annotée"
      ],
      "metric": "Zero-shot"
    }
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

  const repoSvg = '<svg viewBox="0 0 16 16"><path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"/></svg>';
  const chevSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="6 9 12 15 18 9"/></svg>';

  function renderCard(repo) {
    const t = window.i18n ? window.i18n.t.bind(window.i18n) : (k, fb) => fb || k;
    const fr = window.i18n && window.i18n.lang === 'fr' ? (CASE_STUDIES_FR[repo.name] || {}) : {};
    const cs = { ...(CASE_STUDIES[repo.name] || {}), ...fr };
    const langClass = repo.language ? `lang-${repo.language.replace(/\s+/g,'')}` : '';
    const tagline = cs.tagline || repo.description || '';
    const metric = cs.metric || (repo.stargazers_count > 0 ? `${repo.stargazers_count} ★` : formatDate(repo.pushed_at));
    const problem = cs.problem || '';
    const solution = cs.solution || '';
    const stack = cs.stack || (repo.topics && repo.topics.length ? repo.topics : []);
    const results = cs.results || [];
    const liveUrl = cs.live || repo.homepage;
    const primaryTag = cs.lang || repo.language || (stack[0] || 'Project');

    return `
      <article class="project-card" data-repo="${escapeHtml(repo.name)}">
        <button class="project-card-summary" aria-expanded="false">
          <div class="project-card-top">
            <div class="project-icon-wrap">${repoSvg}</div>
            ${liveUrl ? `<span class="project-live-badge">${t('proj.live', 'Live')}</span>` : ''}
            <span class="project-card-chevron">${chevSvg}</span>
          </div>
          <h3>${escapeHtml(cs.title || repo.name)}</h3>
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
            ${liveUrl ? `<a href="${escapeHtml(liveUrl)}" target="_blank" rel="noopener" class="btn btn-primary" data-magnetic>${t('modal.tryLive', 'Try it live ›')}</a>` : ''}
            <a href="${escapeHtml(repo.html_url)}" target="_blank" rel="noopener" class="btn ${liveUrl ? 'btn-secondary' : 'btn-primary'}" data-magnetic>${t('modal.viewRepo', 'View on GitHub ↗')}</a>
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
        const live = (r) => (CASE_STUDIES[r.name] && CASE_STUDIES[r.name].live) || r.homepage ? 1 : 0;
        if (live(b) !== live(a)) return live(b) - live(a);
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
