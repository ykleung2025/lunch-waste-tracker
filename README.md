# 🥗 午餐剩食追蹤（Lunch Waste Tracker）

校園靜態網站，分成兩頁：

- **登記頁**（`index.html`）：送出今日剩食、看今日已登記／尚未登記。已登記的班會從班級選單移除。這一頁只打輕量 `action=today`，不載入月統計、上月排行、柱狀圖或年級榜。
- **統計頁**（`stats.html`）：本月／上月特別統計、近兩月各班平均柱狀圖、本月與上月年級惜食榜。

各班登記每日午餐剩食重量（公斤）。送出後仍會看到**該班**本月平均，以及高於或低於平均的鼓勵／讚美。

- 班級：`P3A`–`P6D`（介面顯示 **3A–6D**；小一／小二不開放新登記，舊試算表列不刪除）
- 登記日：僅校曆 **D1–D6** 循環日（`school-days-2026-27.json`，163 天；已嵌入 `Code.gs` 與 `app.js`）
- 介面語言：繁體中文
- 前端：純 HTML / CSS / JS（無廣告、無追蹤）
- 後端：Google 試算表 + Google Apps Script 網頁應用程式
- 作者帳號建議：GitHub `ykleung2025`

---

## 資料夾內容

| 檔案 | 說明 |
|------|------|
| `index.html` | 登記頁：表單、送出回饋、今日已登記／尚未登記 |
| `stats.html` | 統計頁：本月／上月特別統計、近兩月圖表、年級榜 |
| `styles.css` | 校園友善樣式（手機友善） |
| `app.js` | 兩頁共用邏輯（含嵌入的 `SCHOOL_DAYS`）。登記頁只呼叫 `today`／`submit` |
| `config.js` | `SCRIPT_URL` 與 `USE_MOCK` 設定 |
| `apps-script/Code.gs` | 完整 Apps Script 後端（含嵌入的 `SCHOOL_DAYS`） |
| `school-days-2026-27.json` | 2026–27 校曆 D1–D6 清單（來源參考） |
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
3. 選擇班級（3A–6D）、輸入重量（例如 `1.25`）→ 送出。
4. 可看到該班本月平均，以及高於／低於平均的鼓勵或讚美。該班會從選單消失，並出現在「已登記」。
5. 打開 `stats.html` 可看本月／上月統計、柱狀圖與年級榜。
6. **同一班級同一天再送一次**會出現友善錯誤（每天限一次；已登記的班也不在選單裡）。
7. **非 D1–D6 日**送出會提示今天不用登記。
8. 示範資料存在瀏覽器 `localStorage`，清除網站資料即可重設。兩頁共用同一份示範資料。

---

## 正式部署：Google 試算表 + Apps Script

### 1. 建立試算表

1. 開啟 [Google 試算表](https://sheets.google.com) → 新增空白試算表。
2. 建議將工作表重新命名為 `Records`（腳本也會自動建立／補齊標題列）。
3. 標題列（第 1 列）建議如下：

| A (date) | B (class) | C (weight_kg) | D (timestamp) |
|----------|-----------|---------------|---------------|
| 2026-09-28 | P3A | 1.25 | 2026-09-28T12:00:00 |

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
>
> **這次分頁更新必須重新部署。** 登記頁會呼叫新的 `action=today`。若仍是舊版網頁應用程式，登記頁無法取得今日名單（不會改去拉整份月統計）。統計頁的 `action=stats` 與舊版相容，但送出登記不再一併回傳排行榜，所以上線前請部署新版本。

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

| action | 誰呼叫 | 說明 |
|--------|--------|------|
| `today` | 登記頁 | 只回傳今日 `todayMissing`（`submitted` 與 `missing`）。非循環日不讀試算表。循環日優先用 CacheService；`fresh=true`（重新整理）才重讀 date、class 兩欄。不含月統計、排行或圖表 |
| `submit` | 登記頁 | 寫入一筆：date, class, weight_kg, timestamp。同班同日重複則回錯誤；非 D 日拒絕。成功時回傳該班本月平均，以及更新後的 `todayMissing`。不回傳年級榜、上月統計或圖表 |
| `stats` | 統計頁 | 回傳本月 `gradeMins`／`mostMissed`／`highestAvg`／`cycleDay`，以及 `todayMissing`、`lastMonth*`（包括 `lastMonthGradeMins`）、`twoMonthAvgs` |

- 日期以香港時區 `Asia/Hong_Kong`、格式 `YYYY-MM-DD`。
- 班級必須為 `P3A`–`P6D`；重量必須 `> 0`。
- 僅 `school-days-2026-27.json` 所列 D1–D6 日期可登記。
- 回應為 JSON；前端以 `POST` + `Content-Type: text/plain` 送出，避免 CORS 預檢問題。

### 本月特別統計（`mostMissed`／`highestAvg`）

`stats` 額外欄位（登記頁的 `submit` 成功回應**不再**附帶這些排行／圖表欄位）：

| 欄位 | 說明 |
|------|------|
| `mostMissed` | `{ class, classes, missedDays, totalDays }`：本月最常漏登記的班級。`classes` 為並列名單（平手時列出全部）；`class` 為第一名。 |
| `highestAvg` | `{ class, classes, avg }`：本月平均剩食（kg）最高的班級（至少有一筆紀錄）。平手時 `classes` 列出全部。 |
| `cycleDay` | 今日循環日字串（如 `"D4"`），非 D 日為 `null`。 |

**上學日／登記日定義**：以嵌入的校曆 D1–D6 清單為準。`mostMissed` 的 `totalDays` = 本月 1 日至今日（含，香港時區）之間的 D 日天數；某班某 D 日若無登記則計入該班的 `missedDays`。

原有 `gradeMins` 欄位維持不變（僅含 P3–P6）。

### 今日漏登／上月統計／近兩月平均

| 欄位 | 說明 |
|------|------|
| `todayMissing` | `{ isSchoolDay, cycleDay, missing, submitted }`：今日尚未登記的班級代碼陣列（P3A–P6D）。非 D 日時 `isSchoolDay: false`，`missing` 為空。 |
| `lastMonth` | 上一個日曆月標籤 `YYYY-MM`。 |
| `lastMonthGradeMins` | 上月年級惜食榜；形狀同 `gradeMins`，按上月累計，只含 P3–P6。 |
| `lastMonthMostMissed` | 同上月全部 D 日計算的 `mostMissed`（形狀同 `mostMissed`）。 |
| `lastMonthHighestAvg` | 同上月至少一筆紀錄的 `highestAvg`（形狀同 `highestAvg`）。 |
| `twoMonthAvgs` | `{ months: [上月, 本月], byClass: { P3A: [null\|num, null\|num], … } }`：近兩月各班平均剩食（kg）；無資料為 `null`。 |

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

1. 打開登記頁 → 選擇班級（3A–6D；今天已登記的班不會出現）→ 輸入今天剩食公斤數 → 送出。
2. **不用選日期**，系統自動使用香港今日日期；若今日為循環日會顯示「今日 D4」等。
3. 僅校曆 **D1–D6** 日可登記；非循環日會提示不用登記。
4. 頁面列出今日**已登記**與**尚未登記**的班級。
5. 送出後會顯示：
   - 該班本月平均剩食
   - 今天是高於還是低於（或等於）平均
   - 童趣鼓勵或讚美語句
   - 該班從選單消失，並改列在「已登記」
6. 同一班級同一天只能登記一次。
7. 要看月統計時，按頁首「統計」打開 `stats.html`：
   - 「本月特別統計」：最常漏登記、本月平均剩食最高
   - 「上月特別統計」
   - 「近兩月各班平均剩食」柱狀圖
   - 「本月／上月年級惜食榜」

---

## 疑難排解

| 狀況 | 建議 |
|------|------|
| 示範模式橫幅一直出現 | `config.js` 設 `USE_MOCK: false` 且 `SCRIPT_URL` 已換成真實網址 |
| 送出失敗／連線錯誤 | 確認部署權限為「任何人」、網址正確、已授權 |
| 改了腳本沒生效 | 重新「新增版本」部署 |
| 「今天不用登記」 | 今日不在校曆 D1–D6 清單；請於有循環日的上學日再登記 |
| 登記頁顯示「伺服器尚未支援今日名單」 | 尚未把新版 `Code.gs` 部署成網頁應用程式的新版本 |
| 榜單全是 — | 本月尚無資料，先在登記頁送出幾筆，再到統計頁按「重新整理榜單」 |
| 本地開啟 file:// 有時 fetch 受限 | 改用 `python3 -m http.server` 或 GitHub Pages |

---

## 授權與隱私

本專案為校園教學用途靜態頁；不含廣告與第三方追蹤。正式資料存於你擁有的 Google 試算表，請依學校政策管理存取權。
