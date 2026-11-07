const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401) {
        // Don't auto logout on public endpoints
        if (endpoint !== '/auth/login' && endpoint !== '/auth/register') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.dispatchEvent(new Event('auth:logout'));
        }
      }

      const defaultMsg = response.status === 404
        ? 'Account not found or service route unavailable. Please verify you registered first and that backend server is running.'
        : `Request failed with status ${response.status}`;

      throw new Error(data.message || defaultMsg);
    }

    return data;
  } catch (err) {
    if (err.message && err.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to backend server. Please make sure the server is running on port 5000.');
    }
    throw err;
  }
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  verifyEmail: (data) => request('/auth/verify-email', { method: 'POST', body: JSON.stringify(data) }),
  resendVerification: (data) => request('/auth/resend-verification', { method: 'POST', body: JSON.stringify(data) }),
  getSimulatedInbox: (email) => request(`/auth/simulated-inbox/${encodeURIComponent(email)}`),
  getSmtpStatus: () => request('/auth/smtp-status'),
  configureSmtp: (data) => request('/auth/configure-smtp', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),
  updateProfile: (profileData) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(profileData) }),
  changePassword: (data) => request('/auth/change-password', { method: 'PUT', body: JSON.stringify(data) }),

  // Trips
  getAvailableTrips: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/trips${query ? `?${query}` : ''}`);
  },
  getTripById: (id) => request(`/trips/${id}`),
  getMyTrips: () => request('/trips/my-trips'),
  createTrip: (tripData) => request('/trips', { method: 'POST', body: JSON.stringify(tripData) }),
  updateTrip: (id, tripData) => request(`/trips/${id}`, { method: 'PUT', body: JSON.stringify(tripData) }),
  cancelTrip: (id) => request(`/trips/${id}/cancel`, { method: 'POST' }),

  // Requests
  createRequest: (requestData) => request('/requests', { method: 'POST', body: JSON.stringify(requestData) }),
  getMyRequests: () => request('/requests/my-requests'),
  acceptRequest: (id) => request(`/requests/${id}/accept`, { method: 'POST' }),
  rejectRequest: (id, reason) => request(`/requests/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  cancelRequest: (id, reason) => request(`/requests/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Users & Vehicles
  saveVehicle: (vehicleData) => request('/users/vehicle', { method: 'POST', body: JSON.stringify(vehicleData) }),
  requestVerification: (data) => request('/users/verification', { method: 'POST', body: JSON.stringify(data) }),
  getUserProfile: (id) => request(`/users/profile/${id}`),
  addReview: (reviewData) => request('/users/reviews', { method: 'POST', body: JSON.stringify(reviewData) }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/notifications/mark-all-read', { method: 'PUT' }),

  // Reports
  createReport: (reportData) => request('/reports', { method: 'POST', body: JSON.stringify(reportData) }),
  getReports: () => request('/reports'),
  updateReport: (id, data) => request(`/reports/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Admin
  getAdminStats: () => request('/admin/stats'),
  getAdminVerifications: () => request('/admin/verifications'),
  handleDriverVerification: (id, action, admin_notes) => 
    request(`/admin/verifications/${id}`, { method: 'POST', body: JSON.stringify({ action, admin_notes }) }),
  getAdminUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/users${query ? `?${query}` : ''}`);
  },
  updateUserStatus: (id, data) => request(`/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
  getAdminTrips: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/trips${query ? `?${query}` : ''}`);
  },
  removeAdminTrip: (id, reason) => request(`/admin/trips/${id}/remove`, { method: 'POST', body: JSON.stringify({ reason }) }),
};
