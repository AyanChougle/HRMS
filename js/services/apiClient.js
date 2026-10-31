/**
 * DIALLO HRMS — CENTRAL HTTP API CLIENT
 * Handles all communication with Hostinger MySQL PHP Backend
 * Supports session cookies (credentials: 'include') and Bearer tokens
 */

const apiClient = {
  // Production Hostinger API Base URL
  BASE_URL: (window.location.hostname === 'hrmstfw.com' || window.location.hostname.endsWith('hrmstfw.com'))
    ? '/hostinger_backend'
    : 'https://hrmstfw.com/hostinger_backend',

  // Retrieve stored auth token
  getAuthToken() {
    try {
      return sessionStorage.getItem('dh_bearer_token') ||
             localStorage.getItem('dh_bearer_token') ||
             sessionStorage.getItem('dh_session_token') ||
             '';
    } catch (_) {
      return '';
    }
  },

  async request(endpoint, options = {}) {
    const cleanEndpoint = endpoint.replace(/^\//, '');
    const url = endpoint.startsWith('http') ? endpoint : `${this.BASE_URL}/${cleanEndpoint}`;

    const headers = {
      'Accept': 'application/json',
      ...(options.headers || {})
    };

    // Attach Bearer token if available
    const token = this.getAuthToken();
    if (token) {
      if (!headers['Authorization']) headers['Authorization'] = `Bearer ${token}`;
      headers['X-Auth-Token'] = token;
      headers['X-Authorization'] = `Bearer ${token}`;
    }

    // Handle JSON vs FormData
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const fetchConfig = {
      credentials: 'include', // Transmit PHP session cookies across requests
      ...options,
      headers
    };

    try {
      const response = await fetch(url, fetchConfig);
      const contentType = response.headers.get('content-type') || '';

      let data = null;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch (_) {
          data = { raw: text };
        }
      }

      if (!response.ok) {
        const errorMsg = data?.error || data?.message || `Server responded with HTTP ${response.status}`;
        throw new Error(errorMsg);
      }

      return data;
    } catch (err) {
      console.warn(`[apiClient] Request to ${endpoint} failed:`, err.message);
      throw err;
    }
  },

  async get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const separator = endpoint.includes('?') ? '&' : '?';
    const fullEndpoint = query ? `${endpoint}${separator}${query}` : endpoint;
    return this.request(fullEndpoint, { method: 'GET' });
  },

  async post(endpoint, body = {}) {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.request(endpoint, {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body)
    });
  },

  async put(endpoint, body = {}) {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.request(endpoint, {
      method: 'PUT',
      body: isFormData ? body : JSON.stringify(body)
    });
  },

  async delete(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const separator = endpoint.includes('?') ? '&' : '?';
    const fullEndpoint = query ? `${endpoint}${separator}${query}` : endpoint;
    return this.request(fullEndpoint, { method: 'DELETE' });
  }
};

window.apiClient = apiClient;
