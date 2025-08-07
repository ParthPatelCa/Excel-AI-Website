# Product Requirements Document — Excel-AI Website

## Purpose
This project helps users extract insights from Excel, CSV, and Google Sheets using natural language. It uses OpenAI to generate summaries, formulas, and recommendations.

## Target Users
- Analysts and operations teams who use Excel heavily
- Students and educators needing formula help
- Small businesses looking to automate spreadsheet tasks

## Core Features (MVP)
- Upload Excel (.xlsx, .xls) and CSV files
- Input public Google Sheets links
- Ask natural-language questions about the data
- Get:
  - Formula suggestions
  - Statistical summaries (mean, sum, trend)
  - Observations or anomalies
  - Recommendations from GPT
- Download responses if needed

## Architecture Overview
- Backend: Flask app under `excel_ai_backend`
- Frontend: React app under `excel-ai-frontend`
- Frontend is compiled and served via Flask static folder
- Uses OpenAI API for all GPT-powered responses

## Technical Requirements
- Backend supports `.xlsx`, `.xls`, `.csv` parsing
- API key stored via `.env` or environment variable
- Frontend supports multiple file types and text input
- Google Sheets parser must validate link access

## Enhancements Planned
**Post-MVP:**
- “Copy to clipboard” for formula results
- Regenerate AI response
- Prompt/result history with timestamps
- Better error messages for bad files or API limits
- Deployment: Docker + CI/CD (Render, Railway, or similar)

**Later Phases:**
- Chart generation from text prompts
- Apps Script / VBA snippet generation
- Input-based suggestions (e.g., based on selected column)
- Multi-agent prompt handling (complex tasks)

## Out of Scope
- User accounts or billing
- Offline use
- Admin dashboard

## Risks and Mitigation
| Risk                        | Mitigation                                  |
|-----------------------------|---------------------------------------------|
| OpenAI limits or downtime  | Add retries and fallback logic              |
| Bad/malformed file uploads | Validate file structure on backend          |
| Prompt misuse or spam      | Add size/rate limits                        |
| Key leakage                | Use environment variable only, never hardcode |

## Success Metrics
- Uptime > 99% after deployment
- First response under 15 seconds for 90% of queries
- AI suggestions accuracy rated > 90% in manual tests
- At least 100 users within 30 days post-launch

## License
MIT (To be confirmed in repo LICENSE file)