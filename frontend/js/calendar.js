let displayedYear;
let displayedMonth; // 0-indexed
let selectedDateStr = null;
let monthActivities = [];

document.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  displayedYear = now.getFullYear();
  displayedMonth = now.getMonth();
  selectedDateStr = formatDate(now);

  setupControls();
  renderMonth();
});

function setupControls() {
  document.getElementById('prev-month-btn').addEventListener('click', () => {
    displayedMonth--;
    if (displayedMonth < 0) {
      displayedMonth = 11;
      displayedYear--;
    }
    renderMonth();
  });

  document.getElementById('next-month-btn').addEventListener('click', () => {
    displayedMonth++;
    if (displayedMonth > 11) {
      displayedMonth = 0;
      displayedYear++;
    }
    renderMonth();
  });

  document.getElementById('today-btn').addEventListener('click', () => {
    const today = new Date();
    displayedYear = today.getFullYear();
    displayedMonth = today.getMonth();
    selectedDateStr = formatDate(today);
    renderMonth();
  });

  document.getElementById('add-to-date-btn').addEventListener('click', () => {
    const targetDate = selectedDateStr || formatDate(new Date());
    window.location.href = `activities.html?action=new&date=${targetDate}`;
  });
}

async function renderMonth() {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  document.getElementById('current-month-label').textContent = `${monthNames[displayedMonth]} ${displayedYear}`;

  // Fetch all activities in this month range
  const startDate = `${displayedYear}-${String(displayedMonth + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(displayedYear, displayedMonth + 1, 0).getDate();
  const endDate = `${displayedYear}-${String(displayedMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  try {
    monthActivities = await ApiClient.getActivities() || [];
  } catch (e) {
    monthActivities = [];
  }

  buildCalendarGrid();
  if (selectedDateStr) {
    loadSelectedDateActivities(selectedDateStr);
  }
}

function buildCalendarGrid() {
  const grid = document.getElementById('calendar-days');
  grid.innerHTML = '';

  const firstDayIndex = new Date(displayedYear, displayedMonth, 1).getDay();
  const daysInMonth = new Date(displayedYear, displayedMonth + 1, 0).getDate();
  const prevMonthLastDay = new Date(displayedYear, displayedMonth, 0).getDate();

  // Previous month trailing days
  for (let x = firstDayIndex; x > 0; x--) {
    const day = prevMonthLastDay - x + 1;
    const cell = document.createElement('div');
    cell.className = 'calendar-cell other-month';
    cell.innerHTML = `<span class="day-num">${day}</span>`;
    grid.appendChild(cell);
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${displayedYear}-${String(displayedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTasks = monthActivities.filter(a => a.activityDate === dateStr);

    const cell = document.createElement('div');
    cell.className = `calendar-cell ${dateStr === selectedDateStr ? 'active-day' : ''}`;
    
    // Task dots
    const dotsHtml = dayTasks.slice(0, 4).map(t => {
      const color = (t.category && t.category.color) ? t.category.color : '#3b82f6';
      return `<div class="task-dot" style="background-color: ${color};" title="${escapeHtml(t.title)}"></div>`;
    }).join('');

    cell.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <span class="day-num">${day}</span>
        ${dayTasks.length > 0 ? `<span class="badge bg-light text-dark border rounded-pill" style="font-size: 0.65rem;">${dayTasks.length}</span>` : ''}
      </div>
      <div class="task-dot-container">${dotsHtml}</div>
    `;

    cell.addEventListener('click', () => {
      selectedDateStr = dateStr;
      document.querySelectorAll('.calendar-cell').forEach(c => c.classList.remove('active-day'));
      cell.classList.add('active-day');
      loadSelectedDateActivities(dateStr);
    });

    grid.appendChild(cell);
  }
}

async function loadSelectedDateActivities(dateStr) {
  const heading = document.getElementById('selected-date-heading');
  const subtitle = document.getElementById('selected-date-subtitle');
  const container = document.getElementById('selected-day-activities');

  heading.textContent = dateStr;
  subtitle.textContent = new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
  container.innerHTML = '<div class="text-center py-3 text-muted">Loading...</div>';

  try {
    const activities = await ApiClient.getActivitiesByDate(dateStr) || [];

    if (activities.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4">
          <p class="text-muted small mb-2">No activities for this day.</p>
          <a href="activities.html?action=new&date=${dateStr}" class="btn btn-sm btn-outline-primary">+ Add Activity</a>
        </div>
      `;
      return;
    }

    container.innerHTML = activities.map(act => {
      const isCompleted = act.status === 'COMPLETED';
      const timeFormatted = formatTimeWindow(act.startTime, act.endTime);
      return `
        <div class="activity-card p-2 ${isCompleted ? 'completed' : ''}">
          <div class="d-flex align-items-start justify-content-between gap-2">
            <div>
              <div class="fw-semibold small activity-title">${escapeHtml(act.title)}</div>
              <div class="text-muted" style="font-size: 0.75rem;">
                ${timeFormatted ? `<span>⏱ ${timeFormatted}</span> &bull; ` : ''}
                <span class="badge badge-priority-${act.priority}" style="font-size: 0.65rem;">${act.priority}</span>
              </div>
            </div>
            <a href="activities.html?edit=${act.id}" class="btn btn-sm btn-light border p-1" style="font-size: 0.75rem;">✏️</a>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div class="text-danger small py-2">Failed to load: ${escapeHtml(err.message)}</div>`;
  }
}

function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
