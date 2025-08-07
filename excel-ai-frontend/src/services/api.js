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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Helper method for file uploads with progress
  async uploadFileWithProgress(endpoint, file, onProgress = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            onProgress(percentComplete);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new Error(errorData.error || `HTTP error! status: ${xhr.status}`));
          } catch {
            reject(new Error(`HTTP error! status: ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error occurred'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Request timed out'));
      });

      xhr.open('POST', url);
      xhr.timeout = 300000; // 5 minutes timeout
      xhr.send(formData);
    });
  }

  // Excel Analysis endpoints
  async uploadFile(file, onProgress = null) {
    if (onProgress) {
      return this.uploadFileWithProgress('/excel/upload', file, onProgress);
    } else {
      const formData = new FormData();
      formData.append('file', file);

      return this.makeRequest('/excel/upload', {
        method: 'POST',
        body: formData,
      });
    }
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

  // Formula Intelligence endpoints
  async generateFormula(description, { columns = [], platform = 'excel', examples = [] } = {}) {
    return this.makeRequest('/formula/generate', {
      method: 'POST',
      body: JSON.stringify({ description, columns, platform, examples })
    });
  }

  async explainFormula(formula, { columns = [], platform = 'excel' } = {}) {
    return this.makeRequest('/formula/explain', {
      method: 'POST',
      body: JSON.stringify({ formula, columns, platform })
    });
  }

  async debugFormula(formula, { error_message = null, columns = [], platform = 'excel' } = {}) {
    return this.makeRequest('/formula/debug', {
      method: 'POST',
      body: JSON.stringify({ formula, error_message, columns, platform })
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
