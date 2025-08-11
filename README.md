# DataSense AI - Comprehensive Data Intelligence Platform

## AI-Powered Business Intelligence for Excel, CSV, and Google Sheets

DataSense AI is a comprehensive business intelligence platform that transforms raw data into actionable insights using advanced AI capabilities. Built with a Flask backend and React frontend, it provides enterprise-grade data analysis tools accessible to users of all technical levels.

## 🚀 **Core Platform Sections** (6 Integrated Sections)

### 1. **Connect** - Data Source Integration (First Step)
- **Multi-Source Support**: Excel (.xlsx, .xls), CSV files (up to 16MB), Google Sheets
- **Real-time Import**: URL-based Google Sheets integration with live data sync
- **Connection Management**: Centralized data source library and administration
- **Smart Validation**: Automatic data type detection and error handling
- **Data Preview**: Sample data inspection before full import

### 2. **Analyze** - Advanced AI-Powered Analysis (🎯 MAIN SELLING POINT)
- **Statistical Analysis**: Descriptive statistics, correlation analysis, distribution analysis
- **AI-Powered Insights**: Automatic pattern detection, anomaly identification, trend analysis
- **Natural Language Queries**: Ask questions about your data in plain English
- **Predictive Analytics**: Forecasting, regression analysis, classification models
- **Root Cause Analysis**: AI identifies underlying causes of trends and issues
- **Scenario Planning**: What-if analysis with sensitivity testing and confidence intervals
- **Smart Recommendations**: AI suggests relevant analysis based on data characteristics

### 3. **Visualize** - Interactive Data Visualization
- **Chart Creation**: 7 chart types (Bar, Line, Pie, Scatter, Heatmap, Histogram, Box plots)
- **AI-Powered Suggestions**: Intelligent chart type recommendations based on analysis results
- **Interactive Builder**: Drag-and-drop chart configuration with real-time preview
- **Dashboard Creation**: Multi-chart dashboards with filtering and interactivity
- **Chart Library**: Save, manage, and share visualizations
- **Export Options**: Download charts in multiple formats (PNG, PDF, SVG, HTML)

### 4. **Data Prep** - AI-Powered Data Preparation
- **Quality Analysis**: Automated data quality assessment and issue detection
- **Smart Cleaning**: AI-suggested cleaning operations (missing values, duplicates, outliers)
- **Data Blending**: Merge multiple datasets with intelligent join suggestions
- **Transformations**: Normalize, standardize, create bins, extract date components
- **Validation Rules**: Custom data validation with automated error reporting
- **Progress Tracking**: Real-time progress monitoring for data operations

### 5. **Enrich** - AI Text Enhancement
- **Sentiment Analysis**: Emotion detection and confidence scoring with detailed insights
- **Keyword Extraction**: Relevance-ranked keyword identification with frequency analysis
- **Text Classification**: Custom category classification with confidence scores
- **Summarization**: Configurable text summarization (short/medium/long)
- **Entity Recognition**: Extract people, places, organizations, and dates from text
- **Custom Enrichment**: User-defined AI prompts for specialized text processing

### 6. **Tools** - Utility Generators
- **Excel Formula Generator**: Natural language to Excel formulas with validation
- **SQL Query Builder**: Multi-database SQL generation with optimization tips
- **VBA Script Creator**: Automation script generation with installation guides
- **Text Converter**: Structured text to Excel with smart delimiter detection
- **Regex Generator**: Pattern creation with real-time testing capabilities
- **Code Optimization**: Improve formula performance and readability
- **Schema Detection**: Automatic data type and structure recognition

### **Collaboration & Sharing**
- **User Management**: Role-based access control
- **Dashboard Sharing**: Team collaboration on insights
- **Export Options**: Multiple format support for reports and visualizations
- **Usage Analytics**: Platform usage tracking and optimization

## 🛠 **Technical Architecture**

### **Backend (Flask)**
- **API Design**: RESTful API with versioning (`/api/v1/`)
- **Database**: SQLite with SQLAlchemy ORM
- **AI Integration**: OpenAI GPT-4 with retry logic and fallback handling
- **Data Processing**: Pandas for data manipulation, Plotly for visualizations
- **File Support**: Excel, CSV (up to 16MB), Google Sheets URL integration
- **Authentication**: JWT-based user authentication with usage enforcement

### **Frontend (React)**
- **Framework**: React 19 with Vite build system
- **UI Components**: Radix UI with Tailwind CSS styling
- **State Management**: React hooks with context for global state
- **API Layer**: Centralized service layer with progress tracking
- **Responsive Design**: Mobile-first design with adaptive layouts

### **Key Integrations**
- **OpenAI API**: GPT-4 for AI-powered analysis and suggestions
- **Plotly.js**: Advanced data visualization engine
- **Pandas**: Python data manipulation and analysis
- **JWT Authentication**: Secure user session management

### **Project Structure**

```
Excel-AI-Website/
├── excel_ai_backend/          # Flask Backend
│   ├── src/
│   │   ├── main.py           # Flask app entry point
│   │   ├── models/           # Database models
│   │   │   ├── auth.py       # User authentication models
│   │   │   ├── connectors.py # Data connector models
│   │   │   └── visualization.py # Platform feature models
│   │   ├── routes/           # API route blueprints
│   │   │   ├── analysis.py   # Advanced analysis endpoints
│   │   │   ├── connectors.py # Data source management
│   │   │   ├── visualize.py  # Chart creation APIs
│   │   │   ├── data_prep.py  # Data preparation tools
│   │   │   ├── enrich.py     # Text enrichment APIs
│   │   │   ├── tools.py      # Utility generators
│   │   │   ├── formula.py    # Formula intelligence
│   │   │   ├── chat.py       # AI chat interface
│   │   │   └── auth.py       # Authentication
│   │   └── static/           # Compiled frontend assets
│   └── requirements.txt      # Python dependencies
│
├── excel-ai-frontend/         # React Frontend
│   ├── src/
│   │   ├── App.jsx          # Main application component
│   │   ├── components/       # UI components
│   │   │   ├── VisualizePage.jsx    # Chart creation interface
│   │   │   ├── DataPrepPage.jsx     # Data preparation UI
│   │   │   ├── EnrichPage.jsx       # Text enrichment interface
│   │   │   ├── ToolsPage.jsx        # Utility tools UI
│   │   │   ├── AnalysisPage.jsx     # Advanced analysis
│   │   │   ├── ConnectorsPage.jsx   # Data source management
│   │   │   └── ui/                  # Reusable UI components
│   │   ├── services/         # API service layer
│   │   │   └── api.js       # Centralized API calls
│   │   └── utils/           # Utility functions
│   └── package.json         # Node.js dependencies
│
└── docs/                    # Documentation
    ├── README.md           # This file
    ├── PRD.md             # Product requirements
    └── FEATURE_*.md       # Feature documentation
```

## Setup and Local Deployment

Follow these steps to set up and run the application locally.

### Prerequisites

- Python 3.8+
- Node.js (LTS version recommended)
- npm or pnpm (pnpm is used in this guide)

### Step 1: Clone the Repository (or extract the provided zip)

If you received a zip file, extract it to your desired location. If this were a GitHub repository, you would clone it:

```bash
git clone <repository_url>
cd excel_ai_insights
```

### Step 2: Backend Setup (Flask)

1.  **Navigate to the backend directory:**
    ```bash
    cd excel_ai_backend
    ```
2.  **Create a Python virtual environment:**
    ```bash
    python3 -m venv venv
    ```
3.  **Activate the virtual environment:**
    *   On macOS/Linux:
        ```bash
        source venv/bin/activate
        ```
    *   On Windows (Command Prompt):
        ```bash
        .\venv\Scripts\activate
        ```
    *   On Windows (PowerShell):
        ```powershell
        .\venv\Scripts\Activate.ps1
        ```
4.  **Install backend dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
5.  **Set your OpenAI API Key:**
    The backend uses the OpenAI API for AI-powered insights. Set your `OPENAI_API_KEY` as an environment variable:
    *   On macOS/Linux:
        ```bash
        export OPENAI_API_KEY="your_openai_api_key_here"
        ```
    *   On Windows (Command Prompt):
        ```bash
        set OPENAI_API_KEY="your_openai_api_key_here"
        ```
    *   On Windows (PowerShell):
        ```powershell
        $env:OPENAI_API_KEY="your_openai_api_key_here"
        ```

### Step 3: Frontend Setup (React)

1.  **Navigate to the frontend directory:**
    ```bash
    cd ../excel-ai-frontend
    ```
2.  **Install frontend dependencies:**
    ```bash
    pnpm install
    # or npm install
    ```
3.  **Build the frontend for production:**
    ```bash
    pnpm run build
    # or npm run build
    ```
    This will create a `dist` folder inside `excel-ai-frontend` with the optimized production build.

### Step 4: Copy Frontend Build to Backend Static Folder

Navigate back to the root of your project and copy the built frontend files into the backend's static directory. This allows the Flask app to serve the React application.

```bash
cp -r excel-ai-frontend/dist/* excel_ai_backend/src/static/
```

### Step 5: Run the Full-Stack Application

1.  **Ensure your virtual environment is activated** (from Step 2).
2.  **Navigate back to the backend directory:**
    ```bash
    cd excel_ai_backend
    ```
3.  **Run the Flask backend server:**
    ```bash
    python src/main.py
    ```
    The Flask server will start, typically on `http://127.0.0.1:5001` (or `http://localhost:5001`). It will serve both the backend API and the React frontend.

### Step 6: Access the Application

Open your web browser and navigate to `http://localhost:5001`.

## Google Sheets Integration Notes

For the Google Sheets integration to work, ensure any Google Sheet URLs you use are **publicly viewable** (shared with "Anyone with the link can view").

## Cloud Deployment

For cloud deployment, consider platforms like Heroku, Render, Google Cloud Run, or Vercel/Netlify (for frontend) combined with a backend service. Refer to the previous conversation for detailed options and recommendations.

## Contributing

Feel free to fork this repository, make improvements, and submit pull requests.

## License

[Specify your license here, e.g., MIT License]

