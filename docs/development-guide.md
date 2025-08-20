# DataSense AI Platform - Development Guide

## Project Overview

DataSense AI is a comprehensive business intelligence platform with six integrated sections: Connect, Analyze, Visualize, Data Prep, Enrich, and Tools. The platform transforms raw data into actionable insights using advanced AI capabilities, directly competing with FormulaBot.com and Airtable.

**Primary Value Proposition**: The **Analyze** section is our main selling point - advanced AI-powered data analysis that turns any dataset into comprehensive business insights with natural language querying and automated pattern detection.

### Architecture
- **Backend**: Flask 3.1.1 with Python 3.11, pandas for data processing, Plotly for visualizations, OpenAI GPT-4 integration
- **Frontend**: React 19 with Vite, Tailwind CSS, Radix UI components
- **API Structure**: RESTful API with versioning (`/api/v1/`)
- **Database**: SQLite with SQLAlchemy ORM, comprehensive models for all platform features
- **File Support**: Excel (.xlsx, .xls), CSV files up to 16MB, Google Sheets integration

## Platform Sections Overview

### 1. **Connect** - Data Source Integration (First Step)
- **Core Features**: File uploads (Excel, CSV), Google Sheets integration, data source management
- **AI Features**: Automatic data type detection, validation, smart import suggestions
- **Components**: Connection library, upload interface, data preview
- **Backend**: File processing, Google Sheets API, connection pooling

### 2. **Analyze** - Advanced AI-Powered Analysis (**MAIN SELLING POINT**)
- **Core Features**: Statistical analysis, predictive analytics, natural language queries, pattern detection
- **AI Features**: Automated insights, trend analysis, anomaly detection, smart recommendations
- **Components**: Analysis dashboard, query interface, results visualization, report generation
- **Backend**: OpenAI GPT-4 integration, statistical libraries (scipy, scikit-learn), ML model deployment

### 3. **Visualize** - Interactive Data Visualization
- **7 Chart Types**: Bar, Line, Pie, Scatter, Heatmap, Histogram, Box plots
- **AI Features**: Smart chart suggestions, confidence scoring, data structure analysis
- **Components**: Chart builder, configuration UI, chart library management
- **Backend**: Plotly integration, chart generation APIs, suggestion algorithms

### 4. **Data Prep** - AI-Powered Data Preparation  
- **Core Features**: Data quality analysis, cleaning operations, blending, transformations
- **AI Features**: Smart cleaning suggestions, type conversion detection, outlier identification
- **Components**: Analysis dashboard, operation wizards, progress tracking
- **Backend**: Pandas processing, operation history, validation systems

### 5. **Enrich** - AI Text Enhancement
- **5 AI Services**: Sentiment analysis, keyword extraction, classification, summarization, custom prompts
- **Features**: Batch processing, confidence scoring, emotion detection
- **Components**: Multi-tab interface, result visualization, export options
- **Backend**: OpenAI integration, result caching, processing optimization

### 6. **Tools** - Utility Generators
- **6 Tool Types**: Excel formulas, SQL queries, VBA scripts, text conversion, regex patterns
- **AI Features**: Natural language processing, code generation, optimization suggestions
- **Components**: Tool-specific interfaces, testing capabilities, history tracking
- **Backend**: Code generation, validation, template systems

## Development Guidelines

### Code Organization Patterns

#### Backend Structure (`excel_ai_backend/`)
```
src/
├── main.py              # Flask app entry point with comprehensive blueprint registration
├── routes/              # Blueprint-based route organization
│   ├── visualize.py         # Chart creation and visualization APIs
│   ├── data_prep.py         # Data preparation and cleaning endpoints  
│   ├── enrich.py           # AI text enrichment services
│   ├── tools.py            # Utility generators (Excel, SQL, VBA, etc.)
│   ├── analysis.py         # Advanced analysis capabilities
│   ├── connectors.py       # Data source management
│   ├── excel_analysis.py   # Legacy Excel analysis endpoints
│   ├── formula.py          # Formula intelligence system
│   ├── chat.py             # AI chat interface
│   ├── auth.py             # Authentication and user management
│   └── user.py             # User CRUD operations
├── models/              # SQLAlchemy models
│   ├── auth.py             # User, session, and telemetry models
│   ├── connectors.py       # Data connector and analysis models
│   ├── visualization.py    # Platform feature models
│   └── user.py             # Legacy user model
├── database/            # SQLite database files
├── utils/               # Utility functions
│   └── openai_helper.py    # OpenAI integration utilities
└── static/              # Compiled frontend build files
```

#### Frontend Structure (`excel-ai-frontend/`)
```
src/
├── App.jsx             # Main application with 12-tab navigation system
├── services/           # API service layer
│   └── api.js          # Centralized API calls for all platform sections
├── components/         # UI components
│   ├── VisualizePage.jsx       # Complete visualization interface
│   ├── DataPrepPage.jsx        # Data preparation and cleaning UI
│   ├── EnrichPage.jsx          # AI text enrichment interface
│   ├── ToolsPage.jsx           # Utility generators interface
│   ├── AnalysisPage.jsx        # Advanced analysis dashboard
│   ├── ConnectorsPage.jsx      # Data source management
│   ├── FormulaWorkspace.jsx    # Formula intelligence interface
│   ├── ChatInterface.jsx       # AI chat component
│   ├── FormulaDisplay.jsx      # Formula display with validation
│   ├── ColumnValidationAlert.jsx # Column validation feedback
│   └── ui/                     # Reusable UI components (Radix UI based)
├── utils/              # Utility functions
│   └── validation.js   # Input validation helpers
└── hooks/              # Custom React hooks
```

### API Patterns

#### Comprehensive Endpoint Structure
All API endpoints use versioned routes with `/api/v1/` prefix:

**Visualization APIs:**
- `GET /api/v1/visualize/types` - Available chart types with descriptions
- `POST /api/v1/visualize/create` - Create new visualization with Plotly
- `POST /api/v1/visualize/suggest` - AI-powered chart type suggestions
- `GET /api/v1/visualize/list` - User's visualization library

**Data Preparation APIs:**
- `POST /api/v1/data-prep/analyze` - Data quality analysis
- `POST /api/v1/data-prep/clean` - Apply cleaning operations
- `POST /api/v1/data-prep/blend` - Data blending and merging
- `POST /api/v1/data-prep/transform` - Data transformations

**AI Enrichment APIs:**
- `POST /api/v1/enrich/sentiment` - Sentiment analysis with emotions
- `POST /api/v1/enrich/keywords` - Keyword extraction and ranking
- `POST /api/v1/enrich/classify` - Text classification
- `POST /api/v1/enrich/summarize` - Text summarization
- `POST /api/v1/enrich/custom` - Custom AI enrichment prompts

**Tools APIs:**
- `POST /api/v1/tools/excel-formula` - Excel formula generation
- `POST /api/v1/tools/sql-query` - SQL query generation
- `POST /api/v1/tools/vba-script` - VBA script creation
- `POST /api/v1/tools/text-to-excel` - Text conversion
- `POST /api/v1/tools/regex-generator` - Regex pattern generation
- `GET /api/v1/tools/list` - Available tools overview
- `GET /api/v1/tools/history` - User tool generation history

**Data Connectors APIs:**
- `GET /api/v1/connectors/types` - Available connector types
- `POST /api/v1/connectors/` - Create data connector
- `GET /api/v1/connectors/` - List user connectors
- `POST /api/v1/connectors/{id}/upload` - Upload data to connector
- `POST /api/v1/connectors/{id}/sync` - Sync external data

**Advanced Analysis APIs:**
- `GET /api/v1/analysis/types` - Available analysis types
- `POST /api/v1/analysis/` - Create and run analysis
- `GET /api/v1/analysis/` - List user analyses
- `GET /api/v1/analysis/{id}` - Get analysis results

**Legacy Excel Analysis (maintained for compatibility):**
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
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
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

## Supabase Email Template Customization

### Accessing Email Templates
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Email Templates**
4. Choose the template to customize (Confirm signup, Invite user, Magic link, etc.)

### MVP-Appropriate Email Templates

#### Option 1: Minimal Professional Template
```html
<h2>Welcome to DataSense AI</h2>
<p>Thank you for joining our data analytics platform!</p>
<p>Click the link below to confirm your email address and get started:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Your Email</a></p>
<p>Key features you'll have access to:</p>
<ul>
  <li>📊 Interactive data visualization</li>
  <li>🤖 AI-powered insights</li>
  <li>📈 Advanced analytics</li>
</ul>
<p>Best regards,<br>The DataSense AI Team</p>
```

#### Option 2: Feature-Rich Template
```html
<h2>Welcome to DataSense AI Platform</h2>
<p>Get ready to transform your data into actionable insights!</p>
<p>Click the link below to confirm your email and start your journey:</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Confirm Email & Get Started</a></p>

<h3>🚀 What you can do with DataSense AI:</h3>
<ul>
  <li><strong>Connect:</strong> Upload Excel, CSV files or connect Google Sheets</li>
  <li><strong>Analyze:</strong> Get AI-powered insights and statistical analysis</li>
  <li><strong>Visualize:</strong> Create interactive charts and dashboards</li>
  <li><strong>Enrich:</strong> Enhance your data with sentiment analysis and classification</li>
  <li><strong>Tools:</strong> Generate Excel formulas, SQL queries, and more</li>
</ul>

<p>Questions? Reply to this email - we're here to help!</p>
<p>Best regards,<br>The DataSense AI Team</p>
```

#### Option 3: Simple & Clean Template
```html
<h2>Confirm Your DataSense AI Account</h2>
<p>Welcome! Please confirm your email address to complete your registration.</p>
<p><a href="{{ .ConfirmationURL }}">Click here to confirm your email</a></p>
<p>Once confirmed, you'll be able to:</p>
<ul>
  <li>Upload and analyze your data files</li>
  <li>Create beautiful visualizations</li>
  <li>Get AI-powered insights</li>
</ul>
<p>Welcome aboard!<br>DataSense AI Team</p>
```

### Customization Steps
1. **Select Template**: Choose the email template type (Confirm signup recommended)
2. **Edit Subject**: Update subject line (e.g., "Welcome to DataSense AI - Confirm Your Email")
3. **Replace Content**: Copy one of the templates above into the email body
4. **Customize Variables**: Use Supabase variables like `{{ .ConfirmationURL }}`, `{{ .Email }}`, etc.
5. **Test**: Use the "Send test email" feature to preview
6. **Save**: Click "Save" to apply the new template

### Available Supabase Variables
- `{{ .ConfirmationURL }}` - Email confirmation link
- `{{ .Email }}` - User's email address
- `{{ .RedirectTo }}` - Redirect URL after confirmation
- `{{ .SiteURL }}` - Your site's base URL
- `{{ .TokenHash }}` - Token for confirmation

### Best Practices
- Keep confirmation links prominent and clearly labeled
- Include your branding and value proposition
- Make it mobile-friendly with simple HTML
- Test emails across different clients
- Provide support contact information

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

## Current Development Status

### Completed Features
- ✅ Professional landing page with feature showcase
- ✅ Interactive demo mode with 6 sections
- ✅ Supabase authentication integration
- ✅ Responsive design with Tailwind CSS v4
- ✅ Environment variable configuration
- ✅ Text visibility and styling fixes

### In Progress
- 🔄 Email template customization for MVP messaging
- 🔄 Production deployment configuration
- 🔄 Backend API implementation for platform features

### Next Steps
1. Configure production environment variables
2. Implement MVP-appropriate email templates
3. Deploy to production platform (Vercel/Netlify/Railway)
4. Test full authentication flow in production
5. Begin backend API development for core features

This development guide should help AI assistants quickly understand the codebase structure, patterns, and best practices for contributing effectively to the DataSense AI platform.
