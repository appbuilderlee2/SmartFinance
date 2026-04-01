# Changelog

## v1.0.0 (2026-04-01)

### ✅ Stability / Data Safety
- Use stable IDs (`crypto.randomUUID()` with fallback) for transactions/subscriptions/categories/credit cards.
- Guard subscription auto-posting to reduce duplicate processing risk.
- Make Reset Data safer (avoid unregistering unrelated service workers on the same origin).
- Remove duplicate CSS loading to reduce “white screen / stale asset” issues.

### 📊 Performance
- Improve monthly budget spent calculation (precompute per-category totals; avoid expensive full-object comparisons).

### 🗓️ Date / Timezone Correctness
- Standardize date-only strings to local `YYYY-MM-DD` (reduce UTC offset day-shift issues).
- Improve CSV import date parsing.

### 🧭 UX
- Welcome screen becomes first-run only; subsequent loads default to Dashboard.
- Settings page shows app version.

### 🧰 Engineering
- Add GitHub Actions CI (`npm ci` + `npm run build`).
- Add localStorage schema version marker: `smartfinance_schema_version` (v1).

