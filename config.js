/**
 * 午餐剩食追蹤 — 設定檔
 *
 * 【如何設定 Google Apps Script】
 * 1. 依照 README.md 建立 Google Sheet，並貼上 apps-script/Code.gs
 * 2. 部署為「網頁應用程式」（執行身分：自己；存取權限：任何人）
 * 3. 複製部署後的網址，貼到下方 SCRIPT_URL
 * 4. 將 USE_MOCK 設為 false
 *
 * 【本機預覽／無 Apps Script】
 * 將 USE_MOCK 設為 true，資料會存在瀏覽器 localStorage，可完整測試提交與統計。
 */
window.LUNCH_WASTE_CONFIG = {
  // 部署後的 Google Apps Script 網頁應用程式 URL（請替換）
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbw6A9qVaF96E8ulxE51TcYcD7zG_7fkX5gxBRU-TaCcdAs2BSFkkGAmWlOaSJWl0pJ7/exec',

  // true = 使用 localStorage 模擬，無需後端；false = 呼叫 SCRIPT_URL
  USE_MOCK: false,

  // 時區標籤（顯示用；實際日期由程式以 Asia/Hong_Kong 計算）
  TIMEZONE: 'Asia/Hong_Kong',
};
