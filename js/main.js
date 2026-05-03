(function () {
  const isTouch = matchMedia('(hover: none), (pointer: coarse)').matches;
  if (isTouch) document.body.classList.add('touch');

  // ===== Theme =====
  const themeBtn = document.getElementById('themeBtn');
  const themeIcon = document.getElementById('themeIcon');
  const moon = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
  const sun = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>';
  let theme = localStorage.getItem('theme') || 'dark';
  function setTheme(t) {
    theme = t;
    localStorage.setItem('theme', t);
    document.body.classList.toggle('light', t === 'light');
    document.querySelector('meta[name="theme-color"]').setAttribute('content', t === 'light' ? '#fbfbfd' : '#000000');
    if (themeIcon) themeIcon.innerHTML = t === 'dark' ? moon : sun;
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: t } }));
  }
  if (themeBtn) themeBtn.addEventListener('click', () => setTheme(theme === 'dark' ? 'light' : 'dark'));
  setTheme(theme);

  // ===== Nav scrolled state =====
  const nav = document.querySelector('nav');
  function onScrollNav() {
    if (window.scrollY > 8) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  // ===== Scroll reveal =====
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

  // ===== Animated counters =====
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const dur = 1400;
      const start = performance.now();
      function frame(now) {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = Math.round(target * eased);
        el.textContent = val + suffix;
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('[data-count]').forEach((el) => counterObserver.observe(el));

  // ===== Card tilt + spotlight (capabilities) =====
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', px * 100 + '%');
      card.style.setProperty('--my', py * 100 + '%');
      const rx = (py - 0.5) * -6;
      const ry = (px - 0.5) * 6;
      card.style.transform = `translateY(-6px) perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  // ===== Custom cursor =====
  if (!isTouch) {
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    let mx = innerWidth / 2, my = innerHeight / 2;
    let rx = mx, ry = my;
    document.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    });
    document.addEventListener('mousedown', () => ring.classList.add('click'));
    document.addEventListener('mouseup', () => ring.classList.remove('click'));
    function raf() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(raf);
    }
    raf();

    // Hover targets
    const hoverSel = 'a, button, [data-magnetic], .feature-card, .project-card, .exp-row, input';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverSel)) ring.classList.add('hover');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverSel)) ring.classList.remove('hover');
    });
  }

  // ===== Magnetic buttons =====
  if (!isTouch) {
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  // ===== CV download — switches with language =====
  const CV_FILES = { en: 'cv/cv-en.pdf', fr: 'cv/cv-fr.pdf' };
  function updateCvLinks(lang) {
    const href = CV_FILES[lang] || CV_FILES.en;
    ['cvBtn', 'cvBtn2'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.setAttribute('href', href);
    });
  }
  if (window.i18n) {
    updateCvLinks(window.i18n.lang);
    window.i18n.onChange(updateCvLinks);
  }

  // ===== Mobile menu =====
  const menuBtn = document.getElementById('menuBtn');
  const drawer = document.getElementById('mobileDrawer');
  if (menuBtn && drawer) {
    menuBtn.addEventListener('click', () => {
      const open = drawer.classList.toggle('open');
      menuBtn.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    drawer.querySelectorAll('[data-drawer-close]').forEach((el) => {
      el.addEventListener('click', () => {
        drawer.classList.remove('open');
        menuBtn.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ===== Typewriter =====
  const tw = document.getElementById('typewriter');
  if (tw) {
    const getList = () => {
      const i18n = window.i18n;
      return [0,1,2,3,4].map((i) => i18n ? i18n.t(`typer.${i}`) : '');
    };
    let list = getList();
    let i = 0, j = 0, deleting = false;
    function tick() {
      if (!list.length || !list[i]) { setTimeout(tick, 300); return; }
      const word = list[i];
      tw.textContent = word.slice(0, j);
      if (!deleting) {
        j++;
        if (j > word.length) { deleting = true; setTimeout(tick, 1400); return; }
      } else {
        j--;
        if (j === 0) { deleting = false; i = (i + 1) % list.length; }
      }
      setTimeout(tick, deleting ? 35 : 70);
    }
    tick();
    if (window.i18n) window.i18n.onChange(() => { list = getList(); });
  }

  // ===== Module chip click-to-pin (mobile) =====
  // ===== Availability banner =====
  const availBanner = document.getElementById('availBanner');
  const availClose  = document.getElementById('availClose');
  if (availBanner && !localStorage.getItem('bannerDismissed')) {
    document.body.classList.add('has-banner');
    availClose.addEventListener('click', () => {
      availBanner.classList.add('hidden');
      document.querySelector('nav').classList.add('banner-gone');
      document.body.classList.remove('has-banner');
      localStorage.setItem('bannerDismissed', '1');
    });
    window.addEventListener('scroll', () => {
      const heroH = document.querySelector('.hero')?.offsetHeight || 600;
      if (window.scrollY > heroH) {
        availBanner.classList.add('hidden');
        document.querySelector('nav').classList.add('banner-gone');
        document.body.classList.remove('has-banner');
      } else if (!localStorage.getItem('bannerDismissed')) {
        availBanner.classList.remove('hidden');
        document.querySelector('nav').classList.remove('banner-gone');
        document.body.classList.add('has-banner');
      }
    }, { passive: true });
  } else if (availBanner) {
    availBanner.classList.add('hidden');
    document.querySelector('nav').classList.add('banner-gone');
  }

  // ===== Back to top =====
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // ===== Copy email =====
  const copyEmailBtn = document.getElementById('copyEmailBtn');
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', () => {
      navigator.clipboard.writeText('dhiarekik.contact@gmail.com').then(() => {
        copyEmailBtn.classList.add('copied');
        setTimeout(() => copyEmailBtn.classList.remove('copied'), 2000);
      });
    });
  }

  document.addEventListener('click', (e) => {
    const chip = e.target.closest('.edu-modules span[data-tip]');
    if (chip) {
      const open = chip.classList.contains('tip-open');
      document.querySelectorAll('.edu-modules span.tip-open').forEach(el => el.classList.remove('tip-open'));
      if (!open) chip.classList.add('tip-open');
      e.stopPropagation();
    } else {
      document.querySelectorAll('.edu-modules span.tip-open').forEach(el => el.classList.remove('tip-open'));
    }
  });
})();
