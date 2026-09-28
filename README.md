# 🥗 午餐剩食追蹤（Lunch Waste Tracker）

校園靜態網站：各班登記每日午餐剩食重量（公斤），查本月平均，並顯示各年級「總量最少／平均最少」班級。

- 班級：`P1A`–`P6D`（小一至小六，A–D 班）
- 介面語言：繁體中文
- 前端：純 HTML / CSS / JS（無廣告、無追蹤）
- 後端：Google 試算表 + Google Apps Script 網頁應用程式
- 作者帳號建議：GitHub `ykleung2025`

---

## 資料夾內容

| 檔案 | 說明 |
|------|------|
| `index.html` | 登記表單、回饋訊息、年級榜 |
| `styles.css` | 校園友善樣式（手機友善） |
| `app.js` | 表單與 API 邏輯 |
| `config.js` | `SCRIPT_URL` 與 `USE_MOCK` 設定 |
| `apps-script/Code.gs` | 完整 Apps Script 後端 |
| `README.md` | 本說明 |

---

## 快速體驗（示範模式，無需 Google）

1. 確認 `config.js` 內：
   ```js
   USE_MOCK: true
   ```
2. 用瀏覽器直接開啟 `index.html`，或在本機啟動靜態伺服器：
   ```bash
   cd lunch-waste-tracker
   python3 -m http.server 8080
   ```
   然後開啟 http://localhost:8080
3. 選擇班級、輸入重量（例如 `1.25`）→ 送出。
4. 可看到本月平均、高於／低於平均的鼓勵或讚美，以及年級榜。
5. **同一班級同一天再送一次**會出現友善錯誤（每天限一次）。
6. 示範資料存在瀏覽器 `localStorage`，清除網站資料即可重設。

---

## 正式部署：Google 試算表 + Apps Script

### 1. 建立試算表

1. 開啟 [Google 試算表](https://sheets.google.com) → 新增空白試算表。
2. 建議將工作表重新命名為 `Records`（腳本也會自動建立／補齊標題列）。
3. 標題列（第 1 列）建議如下：

| A (date) | B (class) | C (weight_kg) | D (timestamp) |
|----------|-----------|---------------|---------------|
| 2026-09-28 | P1A | 1.25 | 2026-09-28T12:00:00 |

範例列可留空；首次送出後會自動寫入。

### 2. 貼上 Apps Script

1. 試算表選單：**擴充功能 → Apps Script**。
2. 刪除編輯器中的預設程式碼，將本專案 `apps-script/Code.gs` **全部內容貼上** → 儲存。
3. （可選）專案名稱改為「午餐剩食追蹤」。

### 3. 部署為網頁應用程式

1. 右上角 **部署 → 新增部署作業**。
2. 類型選 **網頁應用程式**。
3. 設定：
   - **說明**：例如 `v1`
   - **執行身分**：**我**（你的 Google 帳號）
   - **具有存取權的使用者**：**任何人**（Anyone）
4. 按 **部署**，首次需授權：
   - 選擇帳號 →「進階」→「前往……（不安全）」→ 允許。
5. 複製 **網頁應用程式網址**（形如 `https://script.google.com/macros/s/xxxxx/exec`）。

> 之後若修改 `Code.gs`，需再 **部署 → 管理部署作業 → 編輯 → 新版本**，否則線上仍跑舊程式。

### 4. 填入前端設定

編輯 `config.js`：

```js
window.LUNCH_WASTE_CONFIG = {
  SCRIPT_URL: 'https://script.google.com/macros/s/你的部署ID/exec',
  USE_MOCK: false,
  TIMEZONE: 'Asia/Hong_Kong',
};
```

儲存後重新整理網站即可連到正式後端。

### 5. API 行為摘要

| action | 說明 |
|--------|------|
| `submit` | 寫入一筆：date, class, weight_kg, timestamp；同班同日重複則回錯誤 |
| `stats` | 回傳本月各年級最低總量／最低平均班級 |

- 日期以香港時區 `Asia/Hong_Kong`、格式 `YYYY-MM-DD`。
- 班級必須為 `P1A`–`P6D`；重量必須 `> 0`。
- 回應為 JSON；前端以 `POST` + `Content-Type: text/plain` 送出，避免 CORS 預檢問題。

---

## 啟用 GitHub Pages

1. 將本資料夾推到 GitHub 儲存庫（例如 `ykleung2025/lunch-waste-tracker`）。
2. 儲存庫 **Settings → Pages**：
   - Source：Deploy from a branch
   - Branch：`main`（或 `master`），資料夾 `/ (root)` 或放置本專案的子路徑
3. 儲存後數分鐘即可用：
   `https://ykleung2025.github.io/lunch-waste-tracker/`
4. **請勿**把含有機密的金鑰放進 repo；Apps Script 網址本身是公開可呼叫的 endpoint，請搭配「每天每班限一次」等伺服器驗證即可。

若網站放在子路徑，請確認 `index.html` 以相對路徑載入 `styles.css`、`config.js`、`app.js`（目前已是相對路徑）。

---

## 使用說明（給老師／同學）

1. 打開網站 → 選擇班級 → 輸入今天剩食公斤數 → 送出。
2. **不用選日期**，系統自動使用香港今日日期。
3. 送出後會顯示：
   - 該班本月平均剩食
   - 今天是高於還是低於（或等於）平均
   - 童趣鼓勵或讚美語句
4. 下方「本月年級惜食榜」顯示各年級總量最少、平均最少的班級。
5. 同一班級同一天只能登記一次。

---

## 疑難排解

| 狀況 | 建議 |
|------|------|
| 示範模式橫幅一直出現 | `config.js` 設 `USE_MOCK: false` 且 `SCRIPT_URL` 已換成真實網址 |
| 送出失敗／連線錯誤 | 確認部署權限為「任何人」、網址正確、已授權 |
| 改了腳本沒生效 | 重新「新增版本」部署 |
| 榜單全是 — | 本月尚無資料，先送出幾筆再按「重新整理榜單」 |
| 本地開啟 file:// 有時 fetch 受限 | 改用 `python3 -m http.server` 或 GitHub Pages |

---

## 授權與隱私

本專案為校園教學用途靜態頁；不含廣告與第三方追蹤。正式資料存於你擁有的 Google 試算表，請依學校政策管理存取權。
