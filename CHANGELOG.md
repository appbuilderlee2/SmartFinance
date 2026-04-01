# 更新日誌（Changelog）

## v1.0.0 (2026-04-01)

### ✅ 穩定性 / 資料安全
- 交易 / 訂閱 / 分類 / 信用卡改用穩定 ID（`crypto.randomUUID()`，並提供 fallback）。
- 訂閱到期自動入帳加入保護（降低重複處理／重複入帳風險）。
- 「重置所有資料」更安全：避免誤解除同一網域下其他應用的 Service Worker。
- 移除重複載入 CSS，減少「白畫面 / 資源快取不一致」問題。

### 📊 效能
- 改善每月預算 spent 計算：先按分類預計支出總和，避免重複掃描交易與昂貴的全物件比較。

### 🗓️ 日期 / 時區正確性
- 日期（date-only）統一使用本地 `YYYY-MM-DD`（減少 UTC offset 造成日期偏移）。
- 改善 CSV 匯入日期解析方式，減少匯入後日期漂移。

### 🧭 使用體驗（UX）
- Welcome 畫面只在首次使用出現；之後預設直接進入 Dashboard。
- 設定頁新增版本號顯示。

### 🧰 工程 / 維護
- 加入 GitHub Actions CI：自動跑 `npm ci` + `npm run build`。
- 加入 localStorage schema version 記號：`smartfinance_schema_version`（v1）。
