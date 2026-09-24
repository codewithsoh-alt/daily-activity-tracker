/**
 * Centralized API Client for Daily Activity Tracker
 * Connects to Spring Boot backend at http://localhost:8080/api
 */
const BASE_URL = 'http://localhost:8080/api';

class ApiClient {
  static async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {})
      }
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 204) {
        return null;
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = (data && (data.message || data.error)) || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMsg);
      }

      return data;
    } catch (error) {
      console.error(`API Error on ${options.method || 'GET'} ${endpoint}:`, error);
      ApiClient.showToast(error.message || 'Network error occurred while contacting the server', 'danger');
      throw error;
    }
  }

  // --- Activities API ---
  static async getActivities(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.date) searchParams.append('date', params.date);
    if (params.status) searchParams.append('status', params.status);
    if (params.priority) searchParams.append('priority', params.priority);
    if (params.categoryId) searchParams.append('categoryId', params.categoryId);
    if (params.search) searchParams.append('search', params.search);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return await ApiClient.request(`/activities${query}`);
  }

  static async getTodayActivities() {
    return await ApiClient.request('/activities/today');
  }

  static async getActivitiesByDate(dateStr) {
    return await ApiClient.request(`/activities/date/${dateStr}`);
  }

  static async getOverdueActivities() {
    return await ApiClient.request('/activities/overdue');
  }

  static async getActivityById(id) {
    return await ApiClient.request(`/activities/${id}`);
  }

  static async createActivity(activityData) {
    return await ApiClient.request('/activities', {
      method: 'POST',
      body: JSON.stringify(activityData)
    });
  }

  static async updateActivity(id, activityData) {
    return await ApiClient.request(`/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(activityData)
    });
  }

  static async markComplete(id) {
    return await ApiClient.request(`/activities/${id}/complete`, {
      method: 'PATCH'
    });
  }

  static async markPending(id) {
    return await ApiClient.request(`/activities/${id}/pending`, {
      method: 'PATCH'
    });
  }

  static async deleteActivity(id) {
    return await ApiClient.request(`/activities/${id}`, {
      method: 'DELETE'
    });
  }

  // --- Categories API ---
  static async getCategories() {
    return await ApiClient.request('/categories');
  }

  static async createCategory(categoryData) {
    return await ApiClient.request('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
  }

  // --- Statistics API ---
  static async getTodayStats() {
    return await ApiClient.request('/statistics/today');
  }

  static async getWeekStats() {
    return await ApiClient.request('/statistics/week');
  }

  static async getOverviewStats() {
    return await ApiClient.request('/statistics/overview');
  }

  static async getRangeStats(start, end) {
    return await ApiClient.request(`/statistics/range?start=${start}&end=${end}`);
  }

  // --- UI Toast Helper ---
  static showToast(message, type = 'info') {
    let container = document.getElementById('api-alert-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'api-alert-container';
      document.body.appendChild(container);
    }

    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show shadow-sm`;
    alert.role = 'alert';
    alert.innerHTML = `
      <div>${message}</div>
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    container.appendChild(alert);

    setTimeout(() => {
      alert.classList.remove('show');
      setTimeout(() => alert.remove(), 250);
    }, 4500);
  }
}
