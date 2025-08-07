# Formula Intelligence Sprint (Phase 1)

This document captures the initial implementation of Formula Intelligence features added on 2025-08-07.

## Summary
Implemented backend + frontend support for three core formula capabilities:
1. Generate: Natural language description -> primary formula + variants + explanation + tips
2. Explain: Paste an existing formula -> structured breakdown (purpose, steps, optimizations, edge cases)
3. Debug: Paste a broken/incorrect formula -> likely issues, fixes, diagnostic steps, optimized rewrite

## Backend Additions
File: `excel_ai_backend/src/routes/formula.py`

### Endpoints
`POST /api/v1/formula/generate`
Body:
```json
{
  "description": "sum revenue for west region in 2024", 
  "columns": ["Region", "Revenue", "Date"],
  "platform": "excel", 
  "examples": []
}
```
Response (success):
```json
{
  "success": true,
  "data": {
    "primary_formula": "=SUMIFS(Revenue,Region,\"West\",Date,\">=1/1/2024\",Date,\"<=12/31/2024\")",
    "variants": [ {"formula": "...", "description": "...", "tradeoffs": "..."} ],
    "explanation": "...",
    "tips": ["..."],
    "raw": null
  },
  "model_used": "gpt-5-preview"
}
```

`POST /api/v1/formula/explain`
Body:
```json
{ "formula": "=SUMIFS(...)", "columns": ["Region","Revenue","Date"], "platform": "excel" }
```
Response includes: steps, purpose, optimization_suggestions, edge_cases, simplified_alternative.

`POST /api/v1/formula/debug`
Body:
```json
{ "formula": "=VLOOKUP(A2,Table,5)" , "error_message": "#N/A", "columns": ["A","Table"], "platform": "excel" }
```
Response includes: likely_issues, fixes, diagnostic_steps, optimized_formula, notes.

### Technical Notes
- Shares model fallback approach (preview-first) with other OpenAI usage.
- Defensive OpenAI client initialization; returns fatal error if API key missing.
- JSON parsing tolerant: stores raw content if strict JSON not returned.
- Temperature kept low (0.2) for determinism.

## Frontend Additions

### New Component
`excel-ai-frontend/src/components/FormulaWorkspace.jsx`
- Three tabs: Generate / Explain / Debug
- Displays structured responses
- Copy button for primary and optimized formulas
- Shows available columns context inline

### Integration
- Added new "Formulas" tab to Analysis interface (`App.jsx`): now 6 tabs.
- API service extended (`src/services/api.js`) with:
  - `generateFormula(description, opts)`
  - `explainFormula(formula, opts)`
  - `debugFormula(formula, opts)`

## API Discovery Updates
`excel_ai_backend/src/main.py` updated `api_info` to list formula endpoints.
Blueprints registered for both versioned and legacy prefixes.

## Follow-Up / Next Iterations
1. Persistence: Log formula requests & responses for user history (with opt-out & privacy safeguards).
2. Usage Enforcement: Tie into user subscription & monthly quotas.
3. Variant Scoring: Rank variants by simplicity vs flexibility.
4. Multi-Platform: Add `platform` branching for Google Sheets nuance (e.g., ARRAYFORMULA, LET differences).
5. Guardrails: Inject column name validation to reduce hallucinated references.
6. Telemetry: Capture model_used, latency_ms, token estimate, success/failure type.
7. UI Enhancements: Diff view for debug fixes; quick insert into chat; share/save formula snippets library.
8. Internationalization: Locale-aware date and separator guidance.
9. Batch Mode: Accept multiple descriptions to produce a library in one call.
10. Fallback Notice: Surface when model downgraded from preferred (toast + badge state change).

## Testing Notes (Manual)
- Basic happy paths executed locally (requires valid OPENAI_API_KEY).
- Non-JSON responses gracefully wrapped under `raw` key (Generate path).
- Missing required field returns 400 with helpful error.

## Environment Variables
Reuses existing:
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (preferred model selection)

## Risks / Mitigations
| Risk | Mitigation |
|------|------------|
| Hallucinated column references | Provide explicit `columns` array; future: validate & warn |
| Model timeout for long prompts | Max tokens capped; retries with backoff |
| Non-JSON LLM output | Safe parse with `raw` fallback |
| User overuse / cost spike | Future: quota checks before call |

## Owner
Initial implementation automated by AI assistant (Formula Intelligence Sprint Phase 1).

---
This document should be updated as new formula-related features (library, persistence, quota, telemetry) are added.
