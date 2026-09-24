document.addEventListener('DOMContentLoaded', async () => {
  displayTodayDate();
  await loadDashboard();
});

function displayTodayDate() {
  const dateElement = document.getElementById('current-date-display');
  if (dateElement) {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = now.toLocaleDateString(undefined, options);
  }
}

async function loadDashboard() {
  try {
    const [stats, activities, overdueActivities] = await Promise.allSettled([
      ApiClient.getTodayStats(),
      ApiClient.getTodayActivities(),
      ApiClient.getOverdueActivities()
    ]);

    if (stats.status === 'fulfilled' && stats.value) {
      renderStats(stats.value);
    }

    if (activities.status === 'fulfilled' && Array.isArray(activities.value)) {
      renderTodayActivities(activities.value);
    }

    if (overdueActivities.status === 'fulfilled' && Array.isArray(overdueActivities.value)) {
      renderOverdueAlert(overdueActivities.value.length);
    }
  } catch (err) {
    console.error('Failed to load dashboard data:', err);
  }
}

function renderStats(stats) {
  document.getElementById('stat-total').textContent = stats.total ?? 0;
  document.getElementById('stat-completed').textContent = stats.completed ?? 0;
  document.getElementById('stat-pending').textContent = stats.pending ?? 0;
  document.getElementById('stat-overdue').textContent = stats.overdueCount ?? 0;

  const rate = Math.round(stats.completionRate || 0);
  document.getElementById('completion-rate-text').textContent = `${rate}%`;
  const progressBar = document.getElementById('completion-progress-bar');
  if (progressBar) {
    progressBar.style.width = `${rate}%`;
    progressBar.setAttribute('aria-valuenow', rate);
  }
}

function renderOverdueAlert(count) {
  const banner = document.getElementById('overdue-banner');
  const countText = document.getElementById('overdue-count-alert');
  if (!banner || !countText) return;

  if (count > 0) {
    countText.textContent = `${count} task${count > 1 ? 's' : ''}`;
    banner.classList.remove('d-none');
    banner.classList.add('d-flex');
  } else {
    banner.classList.add('d-none');
    banner.classList.remove('d-flex');
  }
}

function renderTodayActivities(activities) {
  const container = document.getElementById('today-activities-list');
  if (!container) return;

  if (activities.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5">
        <p class="text-muted mb-2">No activities scheduled for today.</p>
        <a href="activities.html?action=new" class="btn btn-sm btn-outline-primary">+ Add an Activity</a>
      </div>
    `;
    return;
  }

  container.innerHTML = activities.map(activity => {
    const isCompleted = activity.status === 'COMPLETED';
    const timeFormatted = formatTimeWindow(activity.startTime, activity.endTime);
    const categoryBadge = activity.category ? `
      <span class="badge badge-category" style="background-color: ${activity.category.color || '#3b82f6'};">
        ${escapeHtml(activity.category.name)}
      </span>
    ` : '';

    return `
      <div class="activity-card p-3 d-flex align-items-center justify-content-between gap-3 ${isCompleted ? 'completed' : ''} ${activity.overdue ? 'overdue-border' : ''}">
        <div class="d-flex align-items-center gap-3 flex-grow-1">
          <input type="checkbox" class="form-check-input mt-0 fs-5" style="cursor: pointer;"
            ${isCompleted ? 'checked' : ''}
            onchange="toggleTaskStatus(${activity.id}, this.checked)">
          <div>
            <div class="d-flex align-items-center gap-2 flex-wrap mb-1">
              <span class="fw-semibold activity-title fs-6">${escapeHtml(activity.title)}</span>
              <span class="badge badge-priority-${activity.priority}">${activity.priority}</span>
              ${categoryBadge}
            </div>
            <div class="small text-muted d-flex align-items-center gap-3">
              ${timeFormatted ? `<span>⏱ ${timeFormatted}</span>` : ''}
              ${activity.description ? `<span>${escapeHtml(activity.description)}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="d-flex align-items-center gap-2">
          <a href="activities.html?edit=${activity.id}" class="btn btn-sm btn-light border" title="Edit">✏️</a>
        </div>
      </div>
    `;
  }).join('');
}

async function toggleTaskStatus(id, isChecked) {
  try {
    if (isChecked) {
      await ApiClient.markComplete(id);
    } else {
      await ApiClient.markPending(id);
    }
    await loadDashboard();
  } catch (err) {
    console.error('Error toggling status:', err);
    await loadDashboard();
  }
}

function formatTimeWindow(start, end) {
  if (!start && !end) return '';
  if (start && !end) return `${start.slice(0, 5)}`;
  return `${start.slice(0, 5)} - ${end.slice(0, 5)}`;
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
