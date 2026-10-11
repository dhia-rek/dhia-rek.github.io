// Page behaviour: language from ?lang=, mobile menu, nav shadow, CV links, copy email,
// contact form (web3forms) and the looping vision clips in the hero.
(function () {
  const t = (key, fallback) => (window.i18n ? window.i18n.t(key) : fallback || key);

  // ?lang=fr (used by the hreflang link) picks the language on first load.
  const langParam = new URLSearchParams(location.search).get('lang');
  if (window.i18n && (langParam === 'fr' || langParam === 'en')) {
    const apply = () => window.i18n.setLang(langParam);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
    else apply();
  }

  // Nav: border once the page scrolls; mobile menu.
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const menuBtn = document.getElementById('menuBtn');
  const links = document.getElementById('navLinks');
  const setMenu = (open) => { nav.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', String(open)); };
  menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  links.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

  // CV in the visitor's language.
  const CV = { en: 'cv/cv-dhia-rekik-en.pdf', fr: 'cv/cv-dhia-rekik.pdf' };
  const updateCv = (lang) => ['cvBtn', 'cvBtnNav'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.href = CV[lang] || CV.en;
  });
  if (window.i18n) { updateCv(window.i18n.lang); window.i18n.onChange(updateCv); }

  // Copy email.
  const copyBtn = document.getElementById('copyEmailBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText('dhia.rekik@icloud.com').then(() => {
        copyBtn.textContent = t('contact.copied', 'Copied');
        setTimeout(() => { copyBtn.textContent = t('contact.copy', 'Copy email'); }, 1800);
      }).catch(() => {});
    });
  }

  // Contact form.
  const form = document.getElementById('contactForm');
  if (form) {
    const submit = document.getElementById('formSubmit');
    const label = submit.querySelector('span');
    const status = document.getElementById('formStatus');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      submit.disabled = true;
      label.textContent = t('form.sending', 'Sending…');
      status.textContent = '';
      status.className = 'form-status';
      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(form))),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        status.textContent = t('form.success', 'Message sent.');
        status.classList.add('ok');
        form.reset();
      } catch {
        status.textContent = t('form.error', 'Something went wrong. Try emailing me directly.');
        status.classList.add('err');
      } finally {
        submit.disabled = false;
        label.textContent = t('form.send', 'Send');
      }
    });
  }

  // Hero: cycle the three recorded clips of the vision app (objects, expressions, sign language).
  const clip = document.getElementById('heroClip');
  if (clip) {
    const base = '/ai-vision-detection/static/previews/';
    const order = ['objects', 'faces', 'sign'];
    let i = 0;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      clip.removeAttribute('autoplay');
      clip.pause();
    } else {
      clip.addEventListener('ended', () => {
        i = (i + 1) % order.length;
        clip.poster = `${base}${order[i]}.jpg`;
        clip.src = `${base}${order[i]}.mp4`;
        clip.play().catch(() => {});
      });
    }
  }
})();
