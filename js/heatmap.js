(function () {
  const grid = document.getElementById('heatmapGrid');
  const monthsEl = document.getElementById('heatmapMonths');
  const totalEl = document.getElementById('heatmapTotal');
  if (!grid) return;

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const CELL = 11, GAP = 3, STEP = CELL + GAP;

  async function load() {
    try {
      const res = await fetch('https://github-contributions-api.jogruber.de/v4/dhia-rek?y=last');
      if (!res.ok) throw new Error();
      const data = await res.json();
      render(data.contributions);
    } catch {
      const wrap = grid.closest('.heatmap-wrap');
      if (wrap) wrap.style.display = 'none';
    }
  }

  function render(contributions) {
    // Build map from date string → level
    const map = {};
    let yearTotal = 0;
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 1);
    contributions.forEach(c => {
      map[c.date] = c.level;
      if (new Date(c.date) >= cutoff) yearTotal += c.count;
    });

    if (totalEl) {
      const t = window.i18n && window.i18n.lang === 'fr'
        ? `${yearTotal} contributions cette année`
        : `${yearTotal} contributions in the last year`;
      totalEl.textContent = t;
    }

    // Build 53-week grid starting from the Monday on or before (today - 364 days)
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 364);
    const dow = start.getDay();
    start.setDate(start.getDate() - (dow === 0 ? 6 : dow - 1)); // align to Monday

    const weeks = [];
    let week = [];
    const cur = new Date(start);
    while (cur <= today) {
      if (week.length === 7) { weeks.push(week); week = []; }
      const ds = cur.toISOString().slice(0, 10);
      week.push({ date: ds, level: map[ds] || 0, month: cur.getMonth(), day: cur.getDate() });
      cur.setDate(cur.getDate() + 1);
    }
    if (week.length) weeks.push(week);

    // Month labels
    if (monthsEl) {
      monthsEl.innerHTML = '';
      let lastMonth = -1;
      weeks.forEach((w, i) => {
        const m = w[0].month;
        const span = document.createElement('span');
        if (m !== lastMonth) { span.textContent = MONTHS[m]; lastMonth = m; }
        span.style.width = STEP + 'px';
        monthsEl.appendChild(span);
      });
    }

    // Cells
    grid.innerHTML = '';
    grid.style.gridTemplateRows = `repeat(7, ${CELL}px)`;
    weeks.forEach(w => {
      for (let d = 0; d < 7; d++) {
        const cell = document.createElement('div');
        if (w[d]) {
          cell.className = `heatmap-cell level-${w[d].level}`;
          cell.title = `${w[d].date}${w[d].level > 0 ? ` · ${['1 contribution','2–3','4–6','7–9','10+'][w[d].level - 1] || ''}` : ' · no contributions'}`;
        } else {
          cell.className = 'heatmap-cell level-0 heatmap-empty';
        }
        grid.appendChild(cell);
      }
    });
  }

  load();
})();
