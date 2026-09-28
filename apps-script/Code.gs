/**
 * 午餐剩食追蹤 — Google Apps Script 網頁應用程式
 *
 * 部署步驟見專案 README.md
 * 試算表欄位：date | class | weight_kg | timestamp
 *
 * 前端以 POST + text/plain JSON body 呼叫（避免 CORS preflight）：
 *   { "action": "submit", "class": "P1A", "weight_kg": 1.2, "date": "2026-09-28" }
 *   { "action": "stats",  "date": "2026-09-28" }
 *
 * 亦支援 doGet?action=stats&date=YYYY-MM-DD 讀取統計。
 */

var SHEET_NAME = 'Records';
var HEADERS = ['date', 'class', 'weight_kg', 'timestamp'];
var GRADES = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'];
var SECTIONS = ['A', 'B', 'C', 'D'];
var TZ = 'Asia/Hong_Kong';

function validClasses_() {
  var list = [];
  for (var g = 0; g < GRADES.length; g++) {
    for (var s = 0; s < SECTIONS.length; s++) {
      list.push(GRADES[g] + SECTIONS[s]);
    }
  }
  return list;
}

function round2_(n) {
  return Math.round(Number(n) * 100) / 100;
}

function hkToday_() {
  return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  ensureHeaders_(sheet);
  return sheet;
}

function ensureHeaders_(sheet) {
  var lastCol = Math.max(sheet.getLastColumn(), HEADERS.length);
  var range = sheet.getRange(1, 1, 1, HEADERS.length);
  var values = range.getValues()[0];
  var needWrite = false;
  for (var i = 0; i < HEADERS.length; i++) {
    if (String(values[i] || '') !== HEADERS[i]) {
      needWrite = true;
      break;
    }
  }
  if (needWrite && sheet.getLastRow() === 0) {
    range.setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  } else if (needWrite && String(values[0] || '') === '') {
    range.setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
}

function readAllRows_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var data = sheet.getRange(2, 1, lastRow, 4).getValues();
  var rows = [];
  for (var i = 0; i < data.length; i++) {
    var d = data[i];
    if (!d[0] && !d[1]) continue;
    var dateStr = normalizeDate_(d[0]);
    rows.push({
      date: dateStr,
      class: String(d[1]).trim().toUpperCase(),
      weight_kg: Number(d[2]),
      timestamp: d[3] ? String(d[3]) : '',
    });
  }
  return rows;
}

function normalizeDate_(v) {
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime())) {
    return Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  }
  var s = String(v).trim();
  // already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
  return s;
}

function computeGradeMins_(rows, ym) {
  var gradeMins = {};
  for (var g = 0; g < GRADES.length; g++) {
    var grade = GRADES[g];
    var bestTotal = null;
    var bestAvg = null;
    for (var s = 0; s < SECTIONS.length; s++) {
      var cls = grade + SECTIONS[s];
      var clsRows = [];
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].class === cls && String(rows[i].date).indexOf(ym) === 0) {
          clsRows.push(rows[i]);
        }
      }
      if (clsRows.length === 0) continue;
      var total = 0;
      for (var j = 0; j < clsRows.length; j++) {
        total += Number(clsRows[j].weight_kg);
      }
      var avg = total / clsRows.length;
      if (!bestTotal || total < bestTotal.total) {
        bestTotal = { class: cls, total: round2_(total), count: clsRows.length };
      }
      if (!bestAvg || avg < bestAvg.avg) {
        bestAvg = { class: cls, avg: round2_(avg), count: clsRows.length };
      }
    }
    gradeMins[grade] = { lowestTotal: bestTotal, lowestAvg: bestAvg };
  }
  return gradeMins;
}

function classMonthAvg_(rows, className, ym) {
  var weights = [];
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].class === className && String(rows[i].date).indexOf(ym) === 0) {
      weights.push(Number(rows[i].weight_kg));
    }
  }
  if (weights.length === 0) {
    return { avg: null, count: 0 };
  }
  var sum = 0;
  for (var j = 0; j < weights.length; j++) sum += weights[j];
  return { avg: round2_(sum / weights.length), count: weights.length };
}

var PRAISE = [
  '太棒了！今天的剩食比平常少，你們真的很惜食！🌟',
  '做得好！少剩一點，地球多一點笑容！💚',
  '讚讚讚！班上同學一起努力，剩食越來越少！👏',
  '超棒！今天的表現值得給自己一個大大的拇指！👍',
];
var ENCOURAGE = [
  '沒關係，明天再一起努力少剩一點！我們可以的！💪',
  '今天雖然多了一點，但下次記得只拿自己吃得完的分量喔！🌱',
  '加油！每一天少剩一點，就是對地球最大的幫忙！🌍',
  '別灰心！惜食是一場馬拉松，明天繼續挑戰吧！🌈',
];

function pick_(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function handleSubmit_(body) {
  var classes = validClasses_();
  var className = String(body['class'] || '').trim().toUpperCase();
  var weight = Number(body.weight_kg);
  var dateStr = String(body.date || '').trim();

  if (classes.indexOf(className) === -1) {
    return jsonOut_({
      ok: false,
      error: 'invalid_class',
      message: '請選擇有效的班級（P1A–P6D）。',
    });
  }
  if (!isFinite(weight) || weight <= 0) {
    return jsonOut_({
      ok: false,
      error: 'invalid_weight',
      message: '請輸入大於 0 的剩食重量（公斤）。',
    });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    dateStr = hkToday_();
  }

  var sheet = getOrCreateSheet_();
  var rows = readAllRows_(sheet);

  for (var i = 0; i < rows.length; i++) {
    if (rows[i].date === dateStr && rows[i].class === className) {
      return jsonOut_({
        ok: false,
        error: 'duplicate',
        message: '這個班級今天已經登記過了喔！每天只能登記一次，明天再來吧！😊',
      });
    }
  }

  var ts = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd'T'HH:mm:ss");
  sheet.appendRow([dateStr, className, weight, ts]);

  // refresh rows after append
  rows.push({ date: dateStr, class: className, weight_kg: weight, timestamp: ts });
  var ym = dateStr.substring(0, 7);
  var avgInfo = classMonthAvg_(rows, className, ym);
  var monthlyAvg = avgInfo.avg;
  var above = monthlyAvg !== null && weight > monthlyAvg;
  var comparison = above ? 'above' : (weight < monthlyAvg ? 'below' : 'equal');
  var message = above ? pick_(ENCOURAGE) : pick_(PRAISE);
  var gradeMins = computeGradeMins_(rows, ym);

  return jsonOut_({
    ok: true,
    todayWeight: round2_(weight),
    monthlyAvg: monthlyAvg,
    sampleCount: avgInfo.count,
    comparison: comparison,
    message: message,
    gradeMins: gradeMins,
    month: ym,
  });
}

function handleStats_(body) {
  var dateStr = String((body && body.date) || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    dateStr = hkToday_();
  }
  var ym = dateStr.substring(0, 7);
  var sheet = getOrCreateSheet_();
  var rows = readAllRows_(sheet);
  var gradeMins = computeGradeMins_(rows, ym);
  return jsonOut_({
    ok: true,
    gradeMins: gradeMins,
    month: ym,
  });
}

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  try {
    return JSON.parse(e.postData.contents);
  } catch (err) {
    return {};
  }
}

/**
 * POST：submit / stats
 */
function doPost(e) {
  try {
    var body = parseBody_(e);
    var action = String(body.action || 'submit').toLowerCase();
    if (action === 'stats') {
      return handleStats_(body);
    }
    if (action === 'submit') {
      return handleSubmit_(body);
    }
    return jsonOut_({ ok: false, error: 'unknown_action', message: '未知的操作' });
  } catch (err) {
    return jsonOut_({
      ok: false,
      error: 'server',
      message: '伺服器錯誤：' + err.message,
    });
  }
}

/**
 * GET：方便瀏覽器測試統計
 * ?action=stats&date=YYYY-MM-DD
 */
function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    var action = String(p.action || 'stats').toLowerCase();
    if (action === 'stats') {
      return handleStats_({ date: p.date || '' });
    }
    return jsonOut_({
      ok: true,
      message: '午餐剩食追蹤 API 運作中。請用 POST 送出 action=submit 或 action=stats。',
    });
  } catch (err) {
    return jsonOut_({
      ok: false,
      error: 'server',
      message: '伺服器錯誤：' + err.message,
    });
  }
}
