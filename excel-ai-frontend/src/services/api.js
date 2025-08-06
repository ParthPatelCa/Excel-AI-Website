// API Base URL - adjust this based on your environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

class ApiService {
  // Helper method for making HTTP requests
  async makeRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Don't set Content-Type for FormData (file uploads)
    if (options.body instanceof FormData) {
      delete defaultOptions.headers['Content-Type'];
    }

    try {
      const response = await fetch(url, {
        ...defaultOptions,
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Excel Analysis endpoints
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    return this.makeRequest('/excel/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async analyzeData(data) {
    return this.makeRequest('/excel/analyze', {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  }

  async queryData(data, query) {
    return this.makeRequest('/excel/query', {
      method: 'POST',
      body: JSON.stringify({ data, query }),
    });
  }

  async suggestFormulas(data, intent = 'general analysis') {
    return this.makeRequest('/excel/formulas', {
      method: 'POST',
      body: JSON.stringify({ data, intent }),
    });
  }

  // Google Sheets endpoints
  async analyzeGoogleSheetsUrl(url) {
    return this.makeRequest('/google-sheets/analyze_url', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }

  async queryGoogleSheets(url, query) {
    return this.makeRequest('/google-sheets/query_url', {
      method: 'POST',
      body: JSON.stringify({ url, query }),
    });
  }

  // User endpoints
  async getUsers() {
    return this.makeRequest('/users', {
      method: 'GET',
    });
  }

  async createUser(userData) {
    return this.makeRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }
}

// Create a singleton instance
const apiService = new ApiService();

export default apiService;
