# Copilot Prompt for Excel AI Website MVP Preparation

This document provides a series of instructions for Copilot to prepare the Excel-AI-Website repository for its Minimum Viable Product (MVP) launch. The goal is to implement the core features outlined in the MVP Release Plan and ensure the repository is ready for deployment.

## Part 1: Backend (Flask) MVP Implementation

**Objective:** Modify the Flask backend to support only the essential MVP features related to data connection, analysis, and basic user management.

### Instructions for Copilot:

#### 1. Review Backend Architecture
Review `excel_ai_backend/src/main.py` and `excel_ai_backend/src/routes/`: Understand the existing API structure and identify endpoints related to data upload, analysis, and user authentication.

#### 2. Implement Excel and CSV Upload Endpoint
Ensure there is a robust endpoint for uploading `.xlsx`, `.xls`, and `.csv` files. This endpoint should handle file storage (e.g., temporarily on the server or in a designated upload directory) and basic parsing.

- **Focus:** Prioritize reliable file reception and initial data loading.
- **Consideration:** If not already present, add necessary Flask routes and logic to handle POST requests for file uploads.

#### 3. Implement Basic Data Preview Logic
After a file is uploaded and parsed, implement logic to extract and return the first 10 rows of the dataset. This will be used by the frontend for data preview.

- **Focus:** Efficiently read a small subset of the data.
- **Consideration:** Utilize Pandas for data manipulation if the file is loaded into a DataFrame.

#### 4. Implement Simplified Smart Validation
Add basic data type detection for uploaded data. For instance, identify columns as numerical, string, or date types. This doesn't need to be exhaustive error handling, but rather a foundational type inference.

- **Focus:** Identify common data types to enable basic analysis.
- **Consideration:** Pandas `infer_objects()` or similar methods can be helpful.

#### 5. Implement Simplified AI-Powered Insights
Focus on the following core analysis functionalities:

- **Descriptive Statistics:** For numerical columns, calculate and return mean, median, mode, and standard deviation.
- **Trend Analysis:** If a column is identified as a date/time series, implement basic trend detection (e.g., simple linear regression or moving averages to identify general upward/downward trends).
- **Anomaly Detection:** Implement a basic outlier detection mechanism for numerical data (e.g., using IQR or Z-score for simple anomaly flagging).
- **Focus:** Provide actionable, albeit simplified, insights.
- **Consideration:** Ensure these analyses are performed on the uploaded data and the results are structured for easy consumption by the frontend.

#### 6. Implement Limited Natural Language Queries (NQL)
Create an endpoint that accepts simple natural language questions (e.g., "What is the average sales?") and translates them into executable data queries. The scope should be limited to direct questions about descriptive statistics or simple aggregations on numerical columns.

- **Focus:** Basic NQL parsing and execution for predefined question types.
- **Consideration:** This will likely involve integrating with OpenAI GPT-4 as per the existing architecture, but with strict prompt engineering to limit the scope of queries it attempts to answer.

#### 7. Implement Basic User Authentication
Ensure the JWT-based user authentication system is functional for user registration and login. This is crucial for managing user sessions and associating data with specific users.

- **Focus:** Secure and reliable user signup and login.
- **Consideration:** Verify `excel_ai_backend/src/models/auth.py` and `excel_ai_backend/src/routes/auth.py` are correctly configured.

#### 8. Comment out/Disable Non-MVP Backend Endpoints
Temporarily comment out or disable routes and logic related to features excluded from the MVP. Do not delete any code that is intended for future use.

**Features to disable:**
- Google Sheets integration
- Advanced Smart Validation
- Predictive Analytics, Root Cause Analysis, Scenario Planning
- Full-scope Smart Recommendations
- All Data Prep features (Quality Analysis, Smart Cleaning, Data Blending, Transformations, Validation Rules, Progress Tracking)
- All Enrich features (Sentiment Analysis, Keyword Extraction, Text Classification, Summarization, Entity Recognition, Custom Enrichment)
- All Tools features (Excel Formula Generator, SQL Query Builder, VBA Script Creator, Text Converter, Regex Generator, Code Optimization, Schema Detection)

- **Focus:** Streamline the backend to only serve MVP functionalities.
- **Consideration:** Use clear comments for disabled code for easy re-enablement later.

#### 9. Update requirements.txt
Ensure `requirements.txt` only contains the necessary Python packages for the MVP backend. Remove any dependencies that are no longer required due to feature exclusions.

- **Focus:** Minimize dependencies for a leaner deployment.

---

## Part 2: Frontend (React) MVP Implementation

**Objective:** Modify the React frontend to provide a clean, intuitive interface for the MVP features, focusing on data upload, basic analysis display, and user authentication.

### Instructions for Copilot:

#### 1. Review Frontend Architecture
Review `excel-ai-frontend/src/App.jsx` and `excel-ai-frontend/src/components/`: Understand the existing component structure and identify areas for modification.

#### 2. Develop User Authentication UI
Create or refine the user registration and login pages/components. These should be straightforward and functional.

- **Focus:** Clear forms for username/email and password, with appropriate error handling and success messages.

#### 3. Develop File Upload Interface
Create a dedicated UI for users to upload Excel and CSV files. This should include:

- A clear file input element (e.g., a drag-and-drop area or a file selection button).
- Visual feedback during upload (e.g., a loading spinner or progress bar).
- Confirmation of successful upload.
- **Focus:** User-friendly and robust file upload experience.

#### 4. Implement Data Preview Display
After a file is uploaded and the backend returns the preview data, display the first 10 rows in a simple table format on the frontend.

- **Focus:** Clear presentation of sample data.

#### 5. Develop Basic Analysis Display
Create components to display the results of the simplified AI-powered insights (descriptive statistics, trend analysis, anomaly detection). This could be simple text summaries or basic tables.

- **Focus:** Present analysis results clearly and concisely.

#### 6. Implement Limited Chart Display
Integrate a charting library (e.g., Plotly.js as per existing architecture) to display 2-3 basic chart types (Bar, Line, Pie) based on the AI-powered suggestions. Provide a button to download the chart as a PNG image.

- **Focus:** Functional and visually clear basic charts.

#### 7. Develop Natural Language Query Input
Create an input field where users can type simple questions about their data. Display the NQL results returned from the backend.

- **Focus:** Intuitive input for NQL and clear display of responses.

#### 8. Comment out/Disable Non-MVP Frontend Components/Routes
Temporarily comment out or disable UI elements, pages, and routing related to features excluded from the MVP. Do not delete any code that is intended for future use.

**Features to disable:**
- Google Sheets integration UI
- Advanced analysis configuration UIs (for predictive, root cause, scenario planning)
- Full-scope visualization options and dashboard builder
- All Data Prep UIs
- All Enrich UIs
- All Tools UIs
- Collaboration & Sharing UIs

- **Focus:** Present a clean, uncluttered interface focused solely on MVP features.
- **Consideration:** Use clear comments for disabled code for easy re-enablement later.

#### 9. Ensure Responsive Design
Verify that the MVP frontend is responsive and provides a good user experience on both desktop and mobile devices.

- **Focus:** Basic cross-device compatibility.

---

## Part 3: Testing and Deployment Preparation

**Objective:** Ensure the MVP is thoroughly tested and ready for deployment to a staging environment.

### Instructions for Copilot:

#### 1. Conduct End-to-End Testing
Perform comprehensive testing of the entire user flow for the MVP features:

- User registration and login.
- File upload (Excel and CSV).
- Data preview.
- Basic analysis execution and display.
- Limited NQL queries and result display.
- Chart generation and PNG export.
- **Focus:** Verify all MVP features work as expected from user perspective.

#### 2. Bug Fixing and Performance Tuning
Address any bugs identified during testing. Perform basic performance tuning to ensure the application is reasonably fast and responsive for the MVP scope.

- **Focus:** Stability and basic usability.

#### 3. Update Documentation
Update the `README.md` and any other relevant documentation to reflect the MVP features and how to set up and run the MVP version of the application.

- **Focus:** Clear and concise instructions for developers and early adopters.

#### 4. Prepare for Staging Deployment
Ensure the `Dockerfile` and any Vercel/Railway deployment configurations are updated to reflect the MVP codebase. This might involve adjusting build commands or environment variables.

- **Focus:** Smooth deployment to a staging environment.

---

## Part 4: General Guidelines for Copilot

### Core Principles:

- **Prioritize Simplicity:** For the MVP, always opt for the simplest functional implementation over complex or highly optimized solutions.

- **Maintain Code Quality:** Even with a focus on speed, ensure the code is clean, readable, and follows best practices for maintainability.

- **Use Existing Libraries:** Leverage existing libraries and frameworks (Flask, React, Pandas, Plotly.js, OpenAI API) as much as possible.

- **Clear Comments:** Add comments for any significant changes, especially for features that are temporarily disabled or simplified.

- **Version Control:** Ensure all changes are committed to a new branch (e.g., `mvp-release`) and follow standard Git practices.

---

## MVP Feature Scope Summary

### ✅ **Included in MVP:**
1. **User Authentication** (Registration, Login, JWT)
2. **File Upload** (Excel .xlsx/.xls, CSV)
3. **Data Preview** (First 10 rows display)
4. **Basic Data Analysis:**
   - Descriptive Statistics (mean, median, mode, std dev)
   - Basic Trend Analysis
   - Simple Anomaly Detection
5. **Limited Natural Language Queries** (Simple statistical questions)
6. **Basic Charts** (Bar, Line, Pie with PNG export)
7. **Simple Data Type Detection**

### ❌ **Excluded from MVP:**
1. Google Sheets Integration
2. Advanced Analytics (Predictive, Root Cause, Scenario Planning)
3. Full Data Prep Suite
4. Text Enrichment Features
5. Advanced Tools (Formula Generator, SQL Builder, etc.)
6. Collaboration Features
7. Advanced Visualizations
8. Dashboard Builder

---

## Implementation Priority Order

### Phase 1: Core Infrastructure
1. User Authentication System
2. File Upload Backend & Frontend
3. Basic Data Processing Pipeline

### Phase 2: Analysis Features
1. Data Preview Implementation
2. Basic Statistical Analysis
3. Simple Chart Generation

### Phase 3: Advanced MVP Features
1. Natural Language Query System
2. Anomaly Detection
3. Trend Analysis

### Phase 4: Polish & Testing
1. UI/UX Refinement
2. Error Handling
3. Performance Optimization
4. End-to-End Testing

---

## Success Criteria for MVP

The MVP will be considered successful when:

1. ✅ Users can register and log in securely
2. ✅ Users can upload Excel/CSV files (≤16MB)
3. ✅ Users see a preview of their data (first 10 rows)
4. ✅ Users receive basic statistical insights about their data
5. ✅ Users can ask simple questions in natural language
6. ✅ Users can generate and download basic charts
7. ✅ The application is stable and responsive
8. ✅ The application is deployed and accessible online

This MVP provides a solid foundation for the DataSense AI platform while maintaining focus on core value proposition: making data analysis accessible through AI-powered insights.
