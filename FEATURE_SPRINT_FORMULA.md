# Formula Intelligence Sprint (Phase 1 & Incremental Enhancements)

This living document captures the initial implementation (2025-08-07) plus the 2025-08-08 incremental enhancements (history retrieval, usage enforcement expansion, query metadata transparency, fallback UI).

## Summary
Implemented backend + frontend support for three core formula capabilities:
1. Generate: Natural language description -> primary formula + variants + explanation + tips
2. Explain: Paste an existing formula -> structured breakdown (purpose, steps, optimizations, edge cases)
3. Debug: Paste a broken/incorrect formula -> likely issues, fixes, diagnostic steps, optimized rewrite

## Backend Additions (Phase 1)
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

### Technical Notes (Phase 1)
- Model fallback chain (preview-first) now surfaces `fallback_used` flag in responses.
- Defensive OpenAI client initialization; returns fatal error if API key missing.
- JSON parsing tolerant: stores raw content if strict JSON not returned.
- Temperature kept low (0.2) for determinism.
- Auth & usage enforcement: All formula endpoints require JWT (`Authorization: Bearer <token>`) and enforce `User.can_query()` with 429 & `limit_reached` marker.
- Column reference validation: heuristic detection of referenced columns; warns if any not in supplied list and appends guidance in tips.
- Platform guidance injection: Google Sheets requests receive ARRAYFORMULA/INDEX-MATCH guidance vs Excel dynamic array guidance.
- Persistence: `FormulaInteraction` table records input/output, model_used, fallback_used for future history & analytics.

## Frontend Additions (Phase 1)

### New Component
`excel-ai-frontend/src/components/FormulaWorkspace.jsx`
- Three tabs: Generate / Explain / Debug
- Structured responses with copy actions
- Shows available columns context inline
- Fallback notifications (per-result) when downgraded model used
- Quota limit banner (amber) when 429 encountered

### Integration
- Added new "Formulas" tab to Analysis interface (`App.jsx`): now 6 tabs.
- API service extended (`src/services/api.js`) with:
  - `generateFormula(description, opts)`
  - `explainFormula(formula, opts)`
  - `debugFormula(formula, opts)`

## API Discovery Updates
`excel_ai_backend/src/main.py` updated `api_info` to list formula endpoints.
Blueprints registered for both versioned and legacy prefixes.

## Incremental Enhancements (2025-08-08)

### New / Extended Endpoints
`GET /api/v1/formula/history` (auth required)
Query Params:
- `page` (default 1)
- `page_size` (default 10)

Response:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 42,
        "interaction_type": "generate",
        "created_at": "2025-08-08T12:34:56Z",
        "model_used": "gpt-5-preview",
        "fallback_used": false,
        "input_preview": "sum revenue for west region...",
        "output_preview": "=SUMIFS(Revenue,Region,\"West\",...)",
        "tokens_estimate": null
      }
    ],
    "page": 1,
    "page_size": 10,
    "total": 1
  }
}
```

`GET /api/v1/formula/history/<id>` (auth required)
Response:
```json
{
  "success": true,
  "data": {
    "id": 42,
    "interaction_type": "generate",
    "input_payload": {"description": "...", "columns": ["Region"], "platform": "excel"},
    "output_payload": {"primary_formula": "=SUMIFS(...)", "variants": []},
    "model_used": "gpt-4.1-mini",
    "fallback_used": true,
    "models_tried": ["gpt-5-preview", "gpt-4.1-mini"],
    "created_at": "2025-08-08T12:34:56Z"
  }
}
```

### Structured Query Metadata (Excel Analysis)
`POST /api/v1/excel/query` now returns:
```json
{
  "success": true,
  "response": "Plain text answer to user question...",
  "model_used": "gpt-4.1-mini",
  "fallback_used": true
}
```
Internally (not yet fully exposed) the processing retains `models_tried` for analytics.

### Usage Enforcement Expansion
- Added JWT auth + quota checks to `/api/v1/excel/analyze` and `/api/v1/excel/query` (consistent with formula endpoints).
- Returns `429` with body: `{ "error": "Query limit reached for current plan", "limit_reached": true }`.

### Persistence Layer
- `FormulaInteraction` model now actively populated for each generate/explain/debug call.
- History endpoints paginate & summarize interactions (lightweight previews to keep payloads small).

### Fallback Transparency
- Query & formula responses include `model_used` + `fallback_used` (boolean) enabling precise UI signals.
- Backend retry helper tracks `models_tried` for future telemetry.

### Frontend Additions (Incremental)
- `FormulaHistory.jsx`: paginated list, fallback badge, interaction type chips.
- `ChatInterface.jsx`: appends fallback downgrade notice to AI responses when `fallback_used` true.
- `api.js`: added `listFormulaHistory`, `getFormulaHistoryItem` methods, universal Authorization header injection.
- Dashboard (future work): will surface aggregate usage + fallback rate (not yet wired to new endpoints).

### Resilience / Observability Changes
- Retry helper now returns `models_tried`; fallback detection compares final `model_used` vs first attempted.
- Structured query result prepared for future token/latency metrics injection (placeholders reserved in model layer idea list).

## Follow-Up / Next Iterations (Updated)
1. Telemetry: Capture latency_ms, token usage (estimated), fallback counts; expose metrics endpoint.
2. Chat Persistence: Store conversation turns (model metadata) analogous to formula history; provide retrieval & purge.
3. Variant Scoring: Rank generated variants (simplicity, performance, maintainability) and annotate.
4. Multi-Platform Deepening: More granular guidance for Sheets vs Excel (dynamic arrays, LAMBDA, LET, MAP, BYROW).
5. Enhanced Guardrails: Stricter column reference parser; highlight unknown columns inline with diff style.
6. Usage Dashboard: Aggregate charts (queries used %, fallback rate, average latency, top formula types).
7. UI Enhancements: Debug diff comparator, one-click copy into Chat, saved snippet library with tagging.
8. Internationalization: Locale-aware date delimiters, decimal separators in formula guidance.
9. Batch Mode: Multi-description ingestion returning structured library.
10. Global Fallback Analytics: Session-level toast & periodic banner summarizing downgrade frequency.
11. Model Selector: User-facing toggle (Speed / Balanced / Quality / Preview) influencing model ordering.
12. Export / Share: Shareable link or export for formula histories for compliance / audit.

Status Legend:
- DONE: Implemented & documented
- PARTIAL: Some functionality present, more depth required
- PLANNED: Not yet started

Current Status Snapshot:
- History Retrieval: DONE (formula) / PLANNED (chat)
- Usage Enforcement: DONE (formula/analyze/query)
- Fallback Transparency: DONE (formula/query UI)
- Telemetry: PLANNED
- Guardrails: PARTIAL (basic unknown column warning)
- Dashboard: PLANNED

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
