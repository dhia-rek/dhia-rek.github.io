(function () {
  const STORAGE_KEY = 'lang';
  const FALLBACK = 'en';

  const state = {
    lang: localStorage.getItem(STORAGE_KEY) || FALLBACK,
    listeners: [],
  };

  function t(key) {
    const dict = window.translations[state.lang] || window.translations[FALLBACK];
    return dict[key] != null ? dict[key] : (window.translations[FALLBACK][key] || key);
  }

  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const val = t(key);
      if (val) el.innerHTML = val;
    });
    document.querySelectorAll('[data-tip-i18n]').forEach((el) => {
      const key = el.getAttribute('data-tip-i18n');
      const val = t(key);
      if (val) el.setAttribute('data-tip', val);
    });
    document.documentElement.lang = state.lang;
  }

  function setLang(lang) {
    state.lang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    applyTranslations();
    state.listeners.forEach((fn) => fn(lang));
    const btn = document.getElementById('langBtn');
    if (btn) btn.textContent = lang.toUpperCase();
  }

  function onChange(fn) { state.listeners.push(fn); }

  function init() {
    const btn = document.getElementById('langBtn');
    if (btn) {
      btn.textContent = state.lang.toUpperCase();
      btn.addEventListener('click', () => setLang(state.lang === 'en' ? 'fr' : 'en'));
    }
    applyTranslations();
  }

  window.i18n = { t, setLang, onChange, get lang() { return state.lang; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
