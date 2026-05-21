(function () {
  const isTouch = matchMedia('(hover: none), (pointer: coarse)').matches;
  if (isTouch) document.body.classList.add('touch');

  requestAnimationFrame(() => document.body.classList.add('loaded'));

  const themeBtn = document.getElementById('themeBtn');
  const themeIcon = document.getElementById('themeIcon');
  const moon = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
  const sun = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>';
  let theme = localStorage.getItem('theme') || 'light';
  function setTheme(t) {
    theme = t;
    localStorage.setItem('theme', t);
    document.body.classList.toggle('dark', t === 'dark');
    document.body.classList.toggle('light', t === 'light');
    document.querySelector('meta[name="theme-color"]').setAttribute('content', t === 'light' ? '#f6f9fd' : '#0b1220');
    if (themeIcon) themeIcon.innerHTML = t === 'dark' ? sun : moon;
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: t } }));
  }
  if (themeBtn) themeBtn.addEventListener('click', () => setTheme(theme === 'dark' ? 'light' : 'dark'));
  setTheme(theme);

  const nav = document.querySelector('nav');
  function onScrollNav() {
    nav.classList.toggle('scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  const progressBar = document.getElementById('scrollProgress');
  if (progressBar) {
    window.addEventListener('scroll', () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    }, { passive: true });
  }

  const spyLinks = document.querySelectorAll('.nav-links a[href^="#"], .nav-mobile-drawer a[href^="#"]');
  if (spyLinks.length) {
    const spySections = [...new Set([...spyLinks].map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean))];
    const spyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          spyLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    spySections.forEach(s => spyObserver.observe(s));
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

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
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('[data-count]').forEach((el) => counterObserver.observe(el));

  document.querySelectorAll('[data-tilt]').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', px * 100 + '%');
      card.style.setProperty('--my', py * 100 + '%');
      card.style.transform = `translateY(-6px) perspective(800px) rotateX(${(py - 0.5) * -6}deg) rotateY(${(px - 0.5) * 6}deg)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });

  if (!isTouch) {
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.22}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

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

  const tw = document.getElementById('typewriter');
  if (tw) {
    const getList = () => [0,1,2,3,4,5].map((i) => window.i18n ? window.i18n.t(`typer.${i}`) : '');
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

  const availBanner = document.getElementById('availBanner');
  const availClose  = document.getElementById('availClose');
  if (availBanner && !localStorage.getItem('bannerDismissed')) {
    document.body.classList.add('has-banner');
    const dismissBanner = () => {
      availBanner.classList.add('hidden');
      document.querySelector('nav').classList.add('banner-gone');
      document.body.classList.remove('has-banner');
    };
    availClose.addEventListener('click', () => {
      dismissBanner();
      localStorage.setItem('bannerDismissed', '1');
    });
    window.addEventListener('scroll', () => {
      const heroH = document.querySelector('.hero')?.offsetHeight || 600;
      if (window.scrollY > heroH) {
        dismissBanner();
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

  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  const copyEmailBtn = document.getElementById('copyEmailBtn');
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', () => {
      navigator.clipboard.writeText('dhia.rekik@icloud.com').then(() => {
        copyEmailBtn.classList.add('copied');
        setTimeout(() => copyEmailBtn.classList.remove('copied'), 2000);
      });
    });
  }

  // Expandable experience items
  document.querySelectorAll('.exp-item .exp-summary').forEach((summary) => {
    const item = summary.closest('.exp-item');
    const toggle = () => {
      const open = item.classList.toggle('open');
      summary.setAttribute('aria-expanded', String(open));
    };
    summary.addEventListener('click', toggle);
    summary.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });

  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const submitBtn = document.getElementById('formSubmit');
    const statusEl = document.getElementById('formStatus');
    const submitLabel = submitBtn.querySelector('span');

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const t = window.i18n ? window.i18n.t.bind(window.i18n) : (k, fb) => fb || k;

      submitBtn.disabled = true;
      submitLabel.textContent = t('form.sending', 'Sending…');
      statusEl.textContent = '';
      statusEl.className = 'form-status';

      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(contactForm))),
        });
        const data = await res.json();
        if (data.success) {
          statusEl.textContent = t('form.success', "Message sent — I'll get back to you soon.");
          statusEl.className = 'form-status success';
          contactForm.reset();
        } else {
          statusEl.textContent = data.message || t('form.error', 'Something went wrong.');
          statusEl.className = 'form-status error';
        }
      } catch (err) {
        statusEl.textContent = err.message || t('form.error', 'Something went wrong. Try emailing directly.');
        statusEl.className = 'form-status error';
      } finally {
        submitBtn.disabled = false;
        submitLabel.textContent = t('form.send', 'Send message');
      }
    });
  }
})();
