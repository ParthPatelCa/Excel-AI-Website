// API Base URL - adjust this based on your environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

class ApiService {
  // User model preference endpoints
  async getModelPreference() {
    return this.makeRequest('/users/me/model-preference', { method: 'GET' })
  }

  async setModelPreference(preferred_model) {
    return this.makeRequest('/users/me/model-preference', {
      method: 'POST',
      body: JSON.stringify({ preferred_model })
    })
  }

  // Helper method for making HTTP requests
  async makeRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    // Attach auth token if exists (support both keys)
    const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
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
        const error = new Error(errorData.error || `HTTP error! status: ${response.status}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
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

  async batchGenerateFormulas(descriptions, { columns = [], platform = 'excel' } = {}) {
    return this.makeRequest('/formula/batch-generate', {
      method: 'POST',
      body: JSON.stringify({ descriptions, columns, platform })
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

  async listFormulaHistory({ type, limit = 20, offset = 0 } = {}) {
    const params = new URLSearchParams()
    if (type) params.set('type', type)
    params.set('limit', limit)
    params.set('offset', offset)
    return this.makeRequest(`/formula/history?${params.toString()}`, { method: 'GET' })
  }

  async getFormulaHistoryItem(id) {
    return this.makeRequest(`/formula/history/${id}`, { method: 'GET' })
  }

  // Telemetry endpoints
  async getTelemetryMetrics(days = 30) {
    return this.makeRequest(`/v1/telemetry/metrics?days=${days}`, { method: 'GET' })
  }

  async getHealthStatus() {
    return this.makeRequest('/v1/telemetry/health', { method: 'GET' })
  }

  // Chat conversation endpoints
  async listChatConversations({ page = 1, page_size = 10 } = {}) {
    const params = new URLSearchParams()
    params.set('page', page)
    params.set('page_size', page_size)
    return this.makeRequest(`/chat/conversations?${params.toString()}`, { method: 'GET' })
  }

  async getChatConversation(id) {
    return this.makeRequest(`/chat/conversations/${id}`, { method: 'GET' })
  }

  async createChatConversation(data = {}) {
    return this.makeRequest('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async addChatMessage(conversationId, messageData) {
    return this.makeRequest(`/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(messageData)
    })
  }

  async updateChatConversation(id, updates) {
    return this.makeRequest(`/chat/conversations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  }

  async deleteChatConversation(id) {
    return this.makeRequest(`/chat/conversations/${id}`, { method: 'DELETE' })
  }

  async exportChatConversation(id, format = 'json') {
    return this.makeRequest(`/chat/conversations/${id}/export?format=${format}`, { method: 'GET' })
  }

  // Telemetry endpoints
  async getUserMetrics(days = 30) {
    return this.makeRequest(`/v1/telemetry/metrics?days=${days}`, { method: 'GET' })
  }

  async getSystemHealth() {
    return this.makeRequest('/v1/telemetry/health', { method: 'GET' })
  }

  async getAdminMetrics(days = 7) {
    return this.makeRequest(`/v1/telemetry/admin/metrics?days=${days}`, { method: 'GET' })
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

  // ============ CONNECTORS API ============
  
  async getConnectorTypes() {
    return this.makeRequest('/v1/connectors/types', { method: 'GET' })
  }

  async listConnectors(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString ? `/v1/connectors?${queryString}` : '/v1/connectors'
    return this.makeRequest(endpoint, { method: 'GET' })
  }

  async createConnector(connectorData) {
    return this.makeRequest('/v1/connectors', {
      method: 'POST',
      body: JSON.stringify(connectorData)
    })
  }

  async getConnector(connectorId) {
    return this.makeRequest(`/v1/connectors/${connectorId}`, { method: 'GET' })
  }

  async updateConnector(connectorId, updateData) {
    return this.makeRequest(`/v1/connectors/${connectorId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    })
  }

  async deleteConnector(connectorId) {
    return this.makeRequest(`/v1/connectors/${connectorId}`, { method: 'DELETE' })
  }

  async uploadConnectorData(connectorId, file) {
    const formData = new FormData()
    formData.append('file', file)
    
    return this.makeRequest(`/v1/connectors/${connectorId}/upload`, {
      method: 'POST',
      body: formData
    })
  }

  async syncConnector(connectorId) {
    return this.makeRequest(`/v1/connectors/${connectorId}/sync`, { method: 'POST' })
  }

  // ============ ANALYSIS API ============
  
  async getAnalysisTypes() {
    return this.makeRequest('/v1/analysis/types', { method: 'GET' })
  }

  async listAnalyses(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString ? `/v1/analysis?${queryString}` : '/v1/analysis'
    return this.makeRequest(endpoint, { method: 'GET' })
  }

  async createAnalysis(analysisData) {
    return this.makeRequest('/v1/analysis', {
      method: 'POST',
      body: JSON.stringify(analysisData)
    })
  }

  async getAnalysis(analysisId) {
    return this.makeRequest(`/v1/analysis/${analysisId}`, { method: 'GET' })
  }

  async deleteAnalysis(analysisId) {
    return this.makeRequest(`/v1/analysis/${analysisId}`, { method: 'DELETE' })
  }

  // ============ VISUALIZATION API ============
  
  async getChartTypes() {
    return this.makeRequest('/v1/visualize/types', { method: 'GET' })
  }

  async createVisualization(vizData) {
    return this.makeRequest('/v1/visualize/create', {
      method: 'POST',
      body: JSON.stringify(vizData)
    })
  }

  async suggestChartType(data) {
    return this.makeRequest('/v1/visualize/suggest', {
      method: 'POST',
      body: JSON.stringify({ data })
    })
  }

  async getVisualizations(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString ? `/v1/visualize/list?${queryString}` : '/v1/visualize/list'
    return this.makeRequest(endpoint, { method: 'GET' })
  }

  // ============ DATA PREP API ============
  
  async analyzeDataQuality(data) {
    return this.makeRequest('/v1/data-prep/analyze', {
      method: 'POST',
      body: JSON.stringify({ data })
    })
  }

  async smartValidateData(data, context = {}) {
    return this.makeRequest('/v1/data-prep/smart-validate', {
      method: 'POST',
      body: JSON.stringify({ data, context })
    })
  }

  async cleanData(cleaningData) {
    return this.makeRequest('/v1/data-prep/clean', {
      method: 'POST',
      body: JSON.stringify(cleaningData)
    })
  }

  async blendData(blendData) {
    return this.makeRequest('/v1/data-prep/blend', {
      method: 'POST',
      body: JSON.stringify(blendData)
    })
  }

  async transformData(transformData) {
    return this.makeRequest('/v1/data-prep/transform', {
      method: 'POST',
      body: JSON.stringify(transformData)
    })
  }

  // ============ ENRICHMENT API ============
  
  async analyzeSentiment(data) {
    return this.makeRequest('/v1/enrich/sentiment', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async extractKeywords(data) {
    return this.makeRequest('/v1/enrich/keywords', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async classifyText(data) {
    return this.makeRequest('/v1/enrich/classify', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async summarizeText(data) {
    return this.makeRequest('/v1/enrich/summarize', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async customEnrichment(data) {
    return this.makeRequest('/v1/enrich/custom', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // ============ TOOLS API ============
  
  async getTools() {
    return this.makeRequest('/v1/tools/list', { method: 'GET' })
  }

  async generateExcelFormula(data) {
    return this.makeRequest('/v1/tools/excel-formula', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async generateSQLQuery(data) {
    return this.makeRequest('/v1/tools/sql-query', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async generateVBAScript(data) {
    return this.makeRequest('/v1/tools/vba-script', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async convertPDFToExcel(data) {
    return this.makeRequest('/v1/tools/pdf-to-excel', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async convertTextToExcel(data) {
    return this.makeRequest('/v1/tools/text-to-excel', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async generateRegex(data) {
    return this.makeRequest('/v1/tools/regex-generator', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async getToolHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString ? `/v1/tools/history?${queryString}` : '/v1/tools/history'
    return this.makeRequest(endpoint, { method: 'GET' })
  }

  // ============ CHART BUILDER API ============
  
  async getChartRecommendations(dataset, columns) {
    return this.makeRequest('/v1/features/chart-recommendations', {
      method: 'POST',
      body: JSON.stringify({ dataset, columns })
    })
  }

  // ============ SQL QUERY BUILDER API ============
  
  async generateSQLQuery(question, schema = {}, databaseType = 'mysql') {
    return this.makeRequest('/api/v1/tools/sql-query-builder', {
      method: 'POST',
      body: JSON.stringify({ 
        question, 
        schema, 
        database_type: databaseType 
      })
    })
  }

  // ============ DATA FORMATTER API ============
  
  async formatData(data, rules = {}, targetFormat = 'clean') {
    return this.makeRequest('/api/v1/tools/data-formatter', {
      method: 'POST',
      body: JSON.stringify({ 
        data, 
        rules, 
        target_format: targetFormat 
      })
    })
  }

  // ============ VBA SCRIPT GENERATOR API (Enhanced) ============
  
  async generateVBAScript(description, workbookContext = {}) {
    return this.makeRequest('/api/v1/tools/vba-script', {
      method: 'POST',
      body: JSON.stringify({ 
        description, 
        workbook_context: workbookContext 
      })
    })
  }

  // ============ TEXT TO CODE GENERATOR API ============
  
  async generateCodeFromText(description, language = 'vba', context = {}) {
    return this.makeRequest('/api/v1/tools/text-to-code', {
      method: 'POST',
      body: JSON.stringify({ 
        description, 
        language, 
        context 
      })
    })
  }

  // ============ AI PIVOT BUILDER API ============
  
  async buildPivotTable(description, columns = [], sampleData = []) {
    return this.makeRequest('/api/v1/tools/pivot-builder', {
      method: 'POST',
      body: JSON.stringify({ 
        description, 
        columns, 
        sample_data: sampleData 
      })
    })
  }

  // ============ TEXT TO EXCEL CONVERTER API ============
  
  async convertTextToExcel(textContent, sourceType = 'text', structureHints = {}) {
    return this.makeRequest('/api/v1/tools/text-to-excel', {
      method: 'POST',
      body: JSON.stringify({ 
        text: textContent, 
        source_type: sourceType, 
        structure_hints: structureHints 
      })
    })
  }

  // ============ SENTIMENT ANALYSIS API ============
  
  async analyzeSentiment(textData, analysisType = 'simple') {
    return this.makeRequest('/api/v1/tools/sentiment-analysis', {
      method: 'POST',
      body: JSON.stringify({ 
        text: textData, 
        analysis_type: analysisType 
      })
    })
  }

  // ============ TEXT CLASSIFICATION API ============
  
  async classifyText(textData, categories = [], classificationType = 'single') {
    return this.makeRequest('/api/v1/tools/text-classification', {
      method: 'POST',
      body: JSON.stringify({ 
        text: textData, 
        categories, 
        classification_type: classificationType 
      })
    })
  }
}

// Create a singleton instance
const apiService = new ApiService();

export default apiService;
