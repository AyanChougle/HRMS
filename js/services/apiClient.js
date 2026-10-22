/**
 * DIALLO HRMS — CENTRAL HOSTINGER REST API CLIENT
 * Handles all dynamic communication with Hostinger MySQL backend endpoints.
 * Automatically falls back to offline/local mode if network unavailable.
 */

const apiClient = {
  // Production Hostinger API Base URL
  BASE_URL: (window.location.hostname === 'hrmstfw.com' || window.location.hostname.endsWith('hrmstfw.com'))
    ? '/hostinger_backend'
    : 'https://hrmstfw.com/hostinger_backend',

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.BASE_URL}/${endpoint.replace(/^\//, '')}`;
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {})
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const contentType = response.headers.get('content-type') || '';
      let data = null;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }
      }

      if (!response.ok) {
        throw new Error(data?.error || `Server responded with HTTP ${response.status}`);
      }

      return data;
    } catch (err) {
      console.warn(`[apiClient] Request to ${endpoint} failed:`, err.message);
      throw err;
    }
  },

  async get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const fullEndpoint = query ? `${endpoint}?${query}` : endpoint;
    return this.request(fullEndpoint, { method: 'GET' });
  },

  async post(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  async put(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  async delete(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const fullEndpoint = query ? `${endpoint}?${query}` : endpoint;
    return this.request(fullEndpoint, { method: 'DELETE' });
  }
};

window.apiClient = apiClient;
