let activityModalInstance = null;
let currentCategories = [];

document.addEventListener('DOMContentLoaded', async () => {
  const modalEl = document.getElementById('activityModal');
  if (modalEl && window.bootstrap) {
    activityModalInstance = new bootstrap.Modal(modalEl);
  }

  setupEventListeners();
  await loadCategories();
  await handleUrlParams();
  await loadActivities();
});

function setupEventListeners() {
  const searchInput = document.getElementById('search-input');
  const filterStatus = document.getElementById('filter-status');
  const filterPriority = document.getElementById('filter-priority');
  const filterCategory = document.getElementById('filter-category');
  const filterDate = document.getElementById('filter-date');

  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadActivities, 300);
  });

  filterStatus.addEventListener('change', loadActivities);
  filterPriority.addEventListener('change', loadActivities);
  filterCategory.addEventListener('change', loadActivities);
  filterDate.addEventListener('change', loadActivities);
}

async function handleUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('action') === 'new') {
    openCreateModal();
  } else if (urlParams.get('edit')) {
    const editId = urlParams.get('edit');
    await openEditModal(editId);
  } else if (urlParams.get('filter') === 'overdue') {
    // For overdue filter, default search to pending and clear date
    document.getElementById('filter-status').value = 'PENDING';
  }
}

async function loadCategories() {
  try {
    currentCategories = await ApiClient.getCategories() || [];
    populateCategoryDropdowns(currentCategories);
  } catch (err) {
    console.error('Failed to load categories:', err);
  }
}

function populateCategoryDropdowns(categories) {
  const filterSelect = document.getElementById('filter-category');
  const formSelect = document.getElementById('form-category');

  const filterOptions = categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
  filterSelect.innerHTML = `<option value="">All Categories</option>${filterOptions}`;

  const formOptions = categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
  formSelect.innerHTML = `<option value="">None / Unassigned</option>${formOptions}`;
}

async function loadActivities() {
  const container = document.getElementById('activities-list');
  container.innerHTML = '<div class="text-center py-4 text-muted">Loading activities...</div>';

  const params = {
    search: document.getElementById('search-input').value.trim(),
    status: document.getElementById('filter-status').value,
    priority: document.getElementById('filter-priority').value,
    categoryId: document.getElementById('filter-category').value,
    date: document.getElementById('filter-date').value
  };

  try {
    const activities = await ApiClient.getActivities(params) || [];
    renderActivities(activities);
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">Error loading activities: ${escapeHtml(err.message)}</div>`;
  }
}

function renderActivities(activities) {
  const container = document.getElementById('activities-list');

  if (activities.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5">
        <p class="text-muted mb-2">No matching activities found.</p>
        <button class="btn btn-sm btn-outline-primary" onclick="openCreateModal()">+ Create an Activity</button>
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
            onchange="toggleStatus(${activity.id}, this.checked)">
          <div>
            <div class="d-flex align-items-center gap-2 flex-wrap mb-1">
              <span class="fw-semibold activity-title fs-6">${escapeHtml(activity.title)}</span>
              <span class="badge badge-priority-${activity.priority}">${activity.priority}</span>
              ${categoryBadge}
              ${activity.overdue ? '<span class="badge bg-danger">Overdue</span>' : ''}
            </div>
            <div class="small text-muted d-flex align-items-center gap-3 flex-wrap">
              <span>📅 ${activity.activityDate}</span>
              ${timeFormatted ? `<span>⏱ ${timeFormatted}</span>` : ''}
              ${activity.description ? `<span>${escapeHtml(activity.description)}</span>` : ''}
              ${activity.notes ? `<span class="text-secondary fst-italic">📝 ${escapeHtml(activity.notes)}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-sm btn-light border" onclick="openEditModal(${activity.id})" title="Edit">✏️</button>
          <button class="btn btn-sm btn-light border text-danger" onclick="deleteActivity(${activity.id})" title="Delete">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

function openCreateModal() {
  document.getElementById('activityModalLabel').textContent = 'Add Activity';
  document.getElementById('activity-id').value = '';
  document.getElementById('form-title').value = '';
  document.getElementById('form-desc').value = '';
  document.getElementById('form-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('form-start-time').value = '';
  document.getElementById('form-end-time').value = '';
  document.getElementById('form-priority').value = 'MEDIUM';
  document.getElementById('form-category').value = '';
  document.getElementById('form-notes').value = '';

  if (activityModalInstance) {
    activityModalInstance.show();
  }
}

async function openEditModal(id) {
  try {
    const activity = await ApiClient.getActivityById(id);
    if (!activity) return;

    document.getElementById('activityModalLabel').textContent = 'Edit Activity';
    document.getElementById('activity-id').value = activity.id;
    document.getElementById('form-title').value = activity.title || '';
    document.getElementById('form-desc').value = activity.description || '';
    document.getElementById('form-date').value = activity.activityDate || '';
    document.getElementById('form-start-time').value = activity.startTime ? activity.startTime.slice(0, 5) : '';
    document.getElementById('form-end-time').value = activity.endTime ? activity.endTime.slice(0, 5) : '';
    document.getElementById('form-priority').value = activity.priority || 'MEDIUM';
    document.getElementById('form-category').value = activity.category ? activity.category.id : '';
    document.getElementById('form-notes').value = activity.notes || '';

    if (activityModalInstance) {
      activityModalInstance.show();
    }
  } catch (err) {
    console.error('Failed to fetch activity for editing:', err);
  }
}

async function saveActivity(event) {
  event.preventDefault();
  const id = document.getElementById('activity-id').value;
  const startTimeVal = document.getElementById('form-start-time').value;
  const endTimeVal = document.getElementById('form-end-time').value;

  const payload = {
    title: document.getElementById('form-title').value.trim(),
    description: document.getElementById('form-desc').value.trim(),
    activityDate: document.getElementById('form-date').value,
    startTime: startTimeVal ? `${startTimeVal}:00` : null,
    endTime: endTimeVal ? `${endTimeVal}:00` : null,
    priority: document.getElementById('form-priority').value,
    categoryId: document.getElementById('form-category').value ? Number(document.getElementById('form-category').value) : null,
    notes: document.getElementById('form-notes').value.trim()
  };

  try {
    if (id) {
      await ApiClient.updateActivity(id, payload);
      ApiClient.showToast('Activity updated successfully', 'success');
    } else {
      await ApiClient.createActivity(payload);
      ApiClient.showToast('Activity created successfully', 'success');
    }

    if (activityModalInstance) {
      activityModalInstance.hide();
    }
    await loadActivities();
  } catch (err) {
    console.error('Failed to save activity:', err);
  }
}

async function toggleStatus(id, isChecked) {
  try {
    if (isChecked) {
      await ApiClient.markComplete(id);
    } else {
      await ApiClient.markPending(id);
    }
    await loadActivities();
  } catch (err) {
    console.error('Error toggling status:', err);
    await loadActivities();
  }
}

async function deleteActivity(id) {
  if (!confirm('Are you sure you want to delete this activity?')) return;

  try {
    await ApiClient.deleteActivity(id);
    ApiClient.showToast('Activity deleted', 'info');
    await loadActivities();
  } catch (err) {
    console.error('Failed to delete activity:', err);
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
