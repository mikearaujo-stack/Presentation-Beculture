(function () {
  const STORAGE_KEY = 'billing-checklist-v1';

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getStatusPill(row) {
    const table = row.closest('table');
    if (!table) return null;

    const headers = [...table.querySelectorAll('thead th')].map((th) => th.textContent.trim());
    const statusIndex = headers.indexOf('Status');
    if (statusIndex < 0) return null;

    return row.cells[statusIndex]?.querySelector('.pill') ?? null;
  }

  function setPillStatus(pill, className, text) {
    pill.className = className;
    pill.textContent = text;
  }

  function applyRowState(box, row, checked, userAction = false) {
    box.checked = checked;
    row.classList.toggle('done', checked);

    const pill = getStatusPill(row);
    if (!pill) return;

    if (checked) {
      setPillStatus(pill, 'pill status-definido', 'Definido');
    } else if (userAction) {
      setPillStatus(pill, 'pill status-duvida', 'Dúvida');
    } else if (row.dataset.initialStatusClass) {
      setPillStatus(pill, row.dataset.initialStatusClass, row.dataset.initialStatusText);
    }
  }

  function initChecklist() {
    const state = loadState();
    let stateChanged = false;
    const boxes = document.querySelectorAll('.checklist-table input[type="checkbox"]');

    boxes.forEach((box) => {
      const id = box.dataset.id;
      const row = box.closest('tr');
      if (!row) return;

      const pill = getStatusPill(row);
      if (pill) {
        row.dataset.initialStatusClass = pill.className;
        row.dataset.initialStatusText = pill.textContent;
      }

      const startsDefined = row.dataset.initialStatusClass?.includes('status-definido');
      let checked;
      if (startsDefined && state[id] !== false) {
        checked = true;
        if (state[id] !== true) {
          state[id] = true;
          stateChanged = true;
        }
      } else {
        checked = state[id] ?? false;
      }

      const userUnchecked = state[id] === false;
      applyRowState(box, row, checked, userUnchecked);

      box.addEventListener('change', () => {
        state[id] = box.checked;
        saveState(state);
        applyRowState(box, row, box.checked, true);
        updateProgress();
      });
    });

    if (stateChanged) saveState(state);
    updateProgress();
  }

  function updateProgress() {
    const boxes = document.querySelectorAll('.checklist-table input[type="checkbox"]');
    const total = boxes.length;
    const checked = [...boxes].filter((b) => b.checked).length;
    const pct = total ? Math.round((checked / total) * 100) : 0;

    const fill = document.getElementById('progress-fill');
    const count = document.getElementById('progress-count');
    if (fill) fill.style.width = pct + '%';
    if (count) count.textContent = checked + ' de ' + total + ' validados';
  }

  function initScrollSpy() {
    const links = document.querySelectorAll('.sidebar a[href^="#"]');
    const sections = [...links]
      .map((a) => document.querySelector(a.getAttribute('href')))
      .filter(Boolean);

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = '#' + entry.target.id;
          links.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === id);
          });
        });
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
  }

  document.addEventListener('DOMContentLoaded', () => {
    initChecklist();
    initScrollSpy();
  });
})();
