# GitHub Copilot Instructions for Excel AI Website

## Project Overview

This is a full-stack AI-powered data analysis application that helps users extract insights from Excel files and Google Sheets. The project consists of a Flask backend with OpenAI integration and a React frontend with modern UI components.

### Architecture
- **Backend**: Flask 3.1.1 with Python 3.11, pandas for data processing, OpenAI GPT integration
- **Frontend**: React 19 with Vite, Tailwind CSS, Radix UI components
- **API Structure**: RESTful API with versioning (`/api/v1/`)
- **File Support**: Excel (.xlsx, .xls), CSV files up to 16MB, Google Sheets integration

## Development Guidelines

### Code Organization Patterns

#### Backend Structure (`excel_ai_backend/`)
```
src/
├── main.py              # Flask app entry point with API versioning
├── routes/              # Blueprint-based route organization
│   ├── excel_analysis.py    # File upload, analysis, query endpoints
│   ├── google_sheets.py     # Google Sheets integration
│   └── user.py             # User management (basic CRUD)
├── models/              # SQLAlchemy models
│   └── user.py
├── database/            # SQLite database files
└── static/              # Served frontend build files
```

#### Frontend Structure (`excel-ai-frontend/`)
```
src/
├── App.jsx             # Main application component with state management
├── services/           # API service layer
│   └── api.js          # Centralized API calls with progress tracking
├── components/ui/      # Reusable UI components (Radix UI based)
├── utils/              # Utility functions
│   └── validation.js   # Input validation helpers
└── hooks/              # Custom React hooks
```

### API Patterns

#### Endpoint Structure
All API endpoints use versioned routes with `/api/v1/` prefix:

**Excel Analysis:**
- `POST /api/v1/excel/upload` - File upload with validation
- `POST /api/v1/excel/analyze` - Data analysis with AI insights
- `POST /api/v1/excel/query` - Natural language queries
- `POST /api/v1/excel/formulas` - Formula suggestions

**Google Sheets:**
- `POST /api/v1/google-sheets/analyze_url` - Analyze sheets by URL
- `POST /api/v1/google-sheets/query_url` - Query sheets data
- `POST /api/v1/google-sheets/validate_url` - URL validation

#### Response Format Standards
```json
{
  "success": true/false,
  "data": {...},           // On success
  "error": "message",      // On failure
  "file_info": {...},      // For file operations
  "insights": {...},       // Analysis results
  "ai_insights": {...}     // AI-generated insights
}
```

### Environment Configuration

#### Required Environment Variables

**Backend (.env in excel_ai_backend/):**
```env
OPENAI_API_KEY=sk-your-actual-key-here
FLASK_SECRET_KEY=your-secret-key
FLASK_DEBUG=true
FLASK_ENV=development
HOST=0.0.0.0
PORT=5001
```

**Frontend (.env in excel-ai-frontend/):**
```env
VITE_API_BASE_URL=http://localhost:5001/api
```

### Error Handling Patterns

#### Backend Error Responses
```python
try:
    # Operation logic
    return jsonify({'success': True, 'data': result})
except Exception as e:
    return jsonify({'error': f'Error description: {str(e)}'}), 500
```

#### Frontend Error Handling
```javascript
try {
    const response = await apiService.someOperation()
    if (response.success) {
        // Handle success
    } else {
        throw new Error('Operation failed')
    }
} catch (error) {
    setError(`Failed to perform operation: ${error.message}`)
}
```

### File Upload Implementation

#### Backend File Processing
```python
# File validation pattern
file_size = file.tell()
max_size = 16 * 1024 * 1024  # 16MB
if file_size > max_size:
    return jsonify({'error': 'File size exceeds 16MB limit'}), 400

# File type handling
if filename.endswith('.xlsx') or filename.endswith('.xls'):
    df = pd.read_excel(file)
elif filename.endswith('.csv'):
    df = pd.read_csv(file)
```

#### Frontend Upload with Progress
```javascript
// Using XMLHttpRequest for progress tracking
const xhr = new XMLHttpRequest()
xhr.upload.addEventListener('progress', (event) => {
    if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100
        onProgress(percentComplete)
    }
})
```

### OpenAI Integration Patterns

#### Client Initialization
```python
# Always load environment variables in each module
from dotenv import load_dotenv
load_dotenv()

api_key = os.getenv('OPENAI_API_KEY')
if api_key and api_key != 'sk-test-key-replace-with-real-key':
    client = OpenAI(api_key=api_key)
else:
    client = None
```

#### Retry Logic Implementation
```python
def call_openai_with_retry(prompt, max_retries=3):
    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(...)
            return response
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
                continue
            raise e
```

### Component Architecture

#### State Management in App.jsx
```javascript
const [currentView, setCurrentView] = useState('home')
const [uploadedFile, setUploadedFile] = useState(null)
const [analysisResults, setAnalysisResults] = useState(null)
const [isLoading, setIsLoading] = useState(false)
const [uploadProgress, setUploadProgress] = useState(0)
const [error, setError] = useState(null)
```

#### UI Component Patterns
```javascript
// Error display
{error && (
  <ErrorAlert 
    error={error} 
    onRetry={() => setCurrentView('home')}
    onDismiss={() => setError(null)}
  />
)}

// Loading states
{isLoading ? (
  <LoadingSpinner message="Analyzing Your Data" />
) : (
  // Content
)}
```

### Data Validation

#### File Validation
```javascript
export const validateFile = (file) => {
  const maxSize = 16 * 1024 * 1024 // 16MB
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ]
  // Validation logic...
}
```

#### Google Sheets URL Validation
```javascript
export const validateGoogleSheetsUrl = (url) => {
  const spreadsheetIdMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return {
    isValid: !!spreadsheetIdMatch,
    spreadsheetId: spreadsheetIdMatch?.[1]
  }
}
```

### Google Sheets Integration

#### URL Conversion Pattern
```python
def convert_to_csv_url(sheets_url):
    sheet_id = extract_sheet_id(sheets_url)
    gid = extract_gid(sheets_url) or '0'
    return f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}"
```

### Development Workflow

#### Starting the Application
1. **Backend**: `cd excel_ai_backend && python src/main.py`
2. **Frontend**: `cd excel-ai-frontend && pnpm run dev`
3. **Production Build**: 
   ```bash
   cd excel-ai-frontend && pnpm run build
   cp -r dist/* ../excel_ai_backend/src/static/
   ```

#### API Testing
- Health check: `GET http://localhost:5001/health`
- API info: `GET http://localhost:5001/api/v1`

### Common Tasks for AI Assistants

#### Adding New Analysis Features
1. Create new endpoint in `routes/excel_analysis.py`
2. Add corresponding method in `services/api.js`
3. Update UI components in `App.jsx`
4. Add validation in `utils/validation.js`

#### Debugging OpenAI Issues
- Check environment variables are loaded with `load_dotenv()`
- Verify API key format and validity
- Implement retry logic with exponential backoff
- Add proper error handling for rate limits

#### UI Component Development
- Use existing Radix UI components from `components/ui/`
- Follow Tailwind CSS patterns for styling
- Implement loading states and error boundaries
- Add proper accessibility attributes

#### File Processing Improvements
- Extend validation in both frontend and backend
- Add new file type support in pandas processing
- Update upload progress tracking
- Enhance error messages for file issues

### Performance Considerations

- File uploads are limited to 16MB
- API requests have 5-minute timeout
- Progress tracking for long operations
- Efficient data serialization with pandas `.to_dict('records')`
- Proper error boundaries to prevent crashes

### Security Notes

- CORS is enabled for development
- File size limits enforced
- Input validation on both frontend and backend
- Environment variables for sensitive data
- No file storage on server (in-memory processing)

## Quick Reference

### Import Patterns
```python
# Backend
from flask import Blueprint, jsonify, request
import pandas as pd
from dotenv import load_dotenv

# Frontend
import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import apiService from '@/services/api.js'
```

### Common Code Snippets

**API Service Call:**
```javascript
const response = await apiService.uploadFile(file, (progress) => {
  setUploadProgress(progress)
})
```

**Error Handling:**
```javascript
catch (error) {
  console.error('Operation failed:', error)
  setError(`Failed to process: ${error.message}`)
}
```

**DataFrame Processing:**
```python
# Basic file info
file_info = {
    'filename': file.filename,
    'rows': len(df),
    'columns': len(df.columns),
    'column_names': df.columns.tolist(),
    'preview': df.head(5).to_dict('records')
}
```

This instruction file should help AI assistants quickly understand the codebase structure, patterns, and best practices for contributing effectively to the Excel AI Website project.
