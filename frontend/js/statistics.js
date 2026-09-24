let currentScope = 'today';

document.addEventListener('DOMContentLoaded', () => {
  setupScopeButtons();
  loadStatistics();
});

function setupScopeButtons() {
  const btnToday = document.getElementById('btn-scope-today');
  const btnWeek = document.getElementById('btn-scope-week');
  const btnOverall = document.getElementById('btn-scope-overall');

  btnToday.addEventListener('click', () => setScope('today', btnToday));
  btnWeek.addEventListener('click', () => setScope('week', btnWeek));
  btnOverall.addEventListener('click', () => setScope('overall', btnOverall));
}

function setScope(scope, activeBtn) {
  currentScope = scope;
  document.querySelectorAll('[id^="btn-scope-"]').forEach(btn => btn.classList.remove('active'));
  activeBtn.classList.add('active');
  loadStatistics();
}

async function loadStatistics() {
  try {
    let stats;
    if (currentScope === 'today') {
      stats = await ApiClient.getTodayStats();
    } else if (currentScope === 'week') {
      stats = await ApiClient.getWeekStats();
    } else {
      stats = await ApiClient.getOverviewStats();
    }

    if (stats) {
      renderSummaryCards(stats);
    }

    // Load activities to compute category and priority distributions
    const activities = await ApiClient.getActivities() || [];
    renderCategoryBreakdown(activities);
    renderPriorityBreakdown(activities);
  } catch (err) {
    console.error('Failed to load statistics:', err);
  }
}

function renderSummaryCards(stats) {
  document.getElementById('stat-total').textContent = stats.total ?? 0;
  document.getElementById('stat-completed').textContent = stats.completed ?? 0;
  document.getElementById('stat-pending').textContent = stats.pending ?? 0;
  document.getElementById('stat-rate').textContent = `${Math.round(stats.completionRate || 0)}%`;
}

function renderCategoryBreakdown(activities) {
  const container = document.getElementById('category-distribution-list');

  if (activities.length === 0) {
    container.innerHTML = '<div class="text-center py-4 text-muted">No activity data available yet.</div>';
    return;
  }

  const categoryCounts = {};
  const categoryColors = {};

  activities.forEach(act => {
    const name = (act.category && act.category.name) ? act.category.name : 'Unassigned';
    const color = (act.category && act.category.color) ? act.category.color : '#6c757d';
    categoryCounts[name] = (categoryCounts[name] || 0) + 1;
    categoryColors[name] = color;
  });

  const total = activities.length;

  container.innerHTML = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([catName, count]) => {
      const percentage = Math.round((count / total) * 100);
      const color = categoryColors[catName];
      return `
        <div>
          <div class="d-flex justify-content-between align-items-center mb-1 small fw-semibold">
            <span class="d-flex align-items-center gap-2">
              <span class="d-inline-block rounded-circle" style="width: 10px; height: 10px; background-color: ${color};"></span>
              ${escapeHtml(catName)}
            </span>
            <span class="text-muted">${count} (${percentage}%)</span>
          </div>
          <div class="progress" style="height: 8px;">
            <div class="progress-bar" style="width: ${percentage}%; background-color: ${color};"></div>
          </div>
        </div>
      `;
    }).join('');
}

function renderPriorityBreakdown(activities) {
  const container = document.getElementById('priority-distribution-list');

  if (activities.length === 0) {
    container.innerHTML = '<div class="text-center py-4 text-muted">No data.</div>';
    return;
  }

  const counts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  activities.forEach(act => {
    if (counts[act.priority] !== undefined) {
      counts[act.priority]++;
    }
  });

  const total = activities.length;
  const colors = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#10b981' };

  container.innerHTML = ['HIGH', 'MEDIUM', 'LOW'].map(prio => {
    const count = counts[prio];
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    return `
      <div>
        <div class="d-flex justify-content-between align-items-center mb-1 small fw-semibold">
          <span>${prio}</span>
          <span class="text-muted">${count} (${percentage}%)</span>
        </div>
        <div class="progress" style="height: 8px;">
          <div class="progress-bar" style="width: ${percentage}%; background-color: ${colors[prio]};"></div>
        </div>
      </div>
    `;
  }).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, match => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[match]));
}
