/**
 * 午餐剩食追蹤 — Google Apps Script 網頁應用程式
 *
 * 部署步驟見專案 README.md
 * 試算表欄位：date | class | weight_kg | timestamp
 *
 * 前端以 POST + text/plain JSON body 呼叫（避免 CORS preflight）：
 *   { "action": "submit", "class": "P3A", "weight_kg": 1.2, "date": "2026-09-28" }
 *   { "action": "stats",  "date": "2026-09-28" }
 *
 * 亦支援 doGet?action=stats&date=YYYY-MM-DD 讀取統計。
 *
 * 「上學日／登記日」定義：來自校曆 D1–D6 循環日清單（school-days-2026-27.json，
 * 共 163 天）。mostMissed 只計算本月 1 日至今日（含，Asia/Hong_Kong）之間的 D 日。
 * 另回傳 todayMissing、lastMonth*、twoMonthAvgs。
 * 班級僅接受 P3A–P6D（舊試算表列不刪除）。
 */

var SHEET_NAME = '紀錄';
var HEADERS = ['date', 'class', 'weight_kg', 'timestamp'];
var GRADES = ['P3', 'P4', 'P5', 'P6'];
var SECTIONS = ['A', 'B', 'C', 'D'];
var TZ = 'Asia/Hong_Kong';

/** 2026–27 校曆循環日（D1–D6），自 school-days-2026-27.json 嵌入 */
var SCHOOL_DAYS = [{"date":"2026-09-04","day":"D1"},{"date":"2026-09-07","day":"D2"},{"date":"2026-09-08","day":"D3"},{"date":"2026-09-09","day":"D4"},{"date":"2026-09-10","day":"D5"},{"date":"2026-09-11","day":"D6"},{"date":"2026-09-15","day":"D1"},{"date":"2026-09-16","day":"D2"},{"date":"2026-09-17","day":"D3"},{"date":"2026-09-18","day":"D4"},{"date":"2026-09-21","day":"D5"},{"date":"2026-09-22","day":"D6"},{"date":"2026-09-23","day":"D1"},{"date":"2026-09-24","day":"D2"},{"date":"2026-09-25","day":"D3"},{"date":"2026-09-28","day":"D4"},{"date":"2026-09-29","day":"D5"},{"date":"2026-09-30","day":"D6"},{"date":"2026-10-02","day":"D1"},{"date":"2026-10-05","day":"D2"},{"date":"2026-10-06","day":"D3"},{"date":"2026-10-07","day":"D4"},{"date":"2026-10-08","day":"D5"},{"date":"2026-10-09","day":"D6"},{"date":"2026-10-12","day":"D1"},{"date":"2026-10-13","day":"D2"},{"date":"2026-10-14","day":"D3"},{"date":"2026-10-15","day":"D4"},{"date":"2026-10-20","day":"D5"},{"date":"2026-10-21","day":"D6"},{"date":"2026-10-22","day":"D1"},{"date":"2026-10-23","day":"D2"},{"date":"2026-10-26","day":"D3"},{"date":"2026-10-27","day":"D4"},{"date":"2026-10-28","day":"D5"},{"date":"2026-10-29","day":"D6"},{"date":"2026-10-30","day":"D1"},{"date":"2026-11-02","day":"D2"},{"date":"2026-11-03","day":"D3"},{"date":"2026-11-04","day":"D4"},{"date":"2026-11-05","day":"D5"},{"date":"2026-11-06","day":"D6"},{"date":"2026-11-09","day":"D1"},{"date":"2026-11-10","day":"D2"},{"date":"2026-11-11","day":"D3"},{"date":"2026-11-13","day":"D4"},{"date":"2026-11-17","day":"D5"},{"date":"2026-11-18","day":"D6"},{"date":"2026-11-19","day":"D1"},{"date":"2026-11-23","day":"D2"},{"date":"2026-11-24","day":"D3"},{"date":"2026-11-25","day":"D4"},{"date":"2026-11-26","day":"D5"},{"date":"2026-11-30","day":"D6"},{"date":"2026-12-01","day":"D1"},{"date":"2026-12-02","day":"D2"},{"date":"2026-12-03","day":"D3"},{"date":"2026-12-04","day":"D4"},{"date":"2026-12-07","day":"D5"},{"date":"2026-12-08","day":"D6"},{"date":"2026-12-09","day":"D1"},{"date":"2026-12-10","day":"D2"},{"date":"2026-12-11","day":"D3"},{"date":"2026-12-14","day":"D4"},{"date":"2026-12-15","day":"D5"},{"date":"2026-12-16","day":"D6"},{"date":"2026-12-17","day":"D1"},{"date":"2026-12-18","day":"D2"},{"date":"2026-12-21","day":"D3"},{"date":"2027-01-04","day":"D4"},{"date":"2027-01-05","day":"D5"},{"date":"2027-01-06","day":"D6"},{"date":"2027-01-07","day":"D1"},{"date":"2027-01-08","day":"D2"},{"date":"2027-01-13","day":"D3"},{"date":"2027-01-14","day":"D4"},{"date":"2027-01-15","day":"D5"},{"date":"2027-01-18","day":"D6"},{"date":"2027-01-19","day":"D1"},{"date":"2027-01-20","day":"D2"},{"date":"2027-01-21","day":"D3"},{"date":"2027-01-22","day":"D4"},{"date":"2027-01-25","day":"D5"},{"date":"2027-01-26","day":"D6"},{"date":"2027-01-27","day":"D1"},{"date":"2027-01-28","day":"D2"},{"date":"2027-02-01","day":"D3"},{"date":"2027-02-02","day":"D4"},{"date":"2027-02-15","day":"D5"},{"date":"2027-02-16","day":"D6"},{"date":"2027-02-17","day":"D1"},{"date":"2027-02-18","day":"D2"},{"date":"2027-02-22","day":"D3"},{"date":"2027-02-23","day":"D4"},{"date":"2027-02-24","day":"D5"},{"date":"2027-02-25","day":"D6"},{"date":"2027-02-26","day":"D1"},{"date":"2027-03-01","day":"D2"},{"date":"2027-03-02","day":"D3"},{"date":"2027-03-03","day":"D4"},{"date":"2027-03-15","day":"D5"},{"date":"2027-03-16","day":"D6"},{"date":"2027-03-17","day":"D1"},{"date":"2027-03-18","day":"D2"},{"date":"2027-03-19","day":"D3"},{"date":"2027-03-22","day":"D4"},{"date":"2027-03-23","day":"D5"},{"date":"2027-03-24","day":"D6"},{"date":"2027-03-25","day":"D1"},{"date":"2027-04-07","day":"D2"},{"date":"2027-04-08","day":"D3"},{"date":"2027-04-09","day":"D4"},{"date":"2027-04-12","day":"D5"},{"date":"2027-04-13","day":"D6"},{"date":"2027-04-14","day":"D1"},{"date":"2027-04-15","day":"D2"},{"date":"2027-04-16","day":"D3"},{"date":"2027-04-19","day":"D4"},{"date":"2027-04-20","day":"D5"},{"date":"2027-04-21","day":"D6"},{"date":"2027-04-22","day":"D1"},{"date":"2027-04-26","day":"D2"},{"date":"2027-04-27","day":"D3"},{"date":"2027-04-28","day":"D4"},{"date":"2027-04-29","day":"D5"},{"date":"2027-04-30","day":"D6"},{"date":"2027-05-03","day":"D1"},{"date":"2027-05-04","day":"D2"},{"date":"2027-05-05","day":"D3"},{"date":"2027-05-06","day":"D4"},{"date":"2027-05-11","day":"D5"},{"date":"2027-05-12","day":"D6"},{"date":"2027-05-14","day":"D1"},{"date":"2027-05-17","day":"D2"},{"date":"2027-05-18","day":"D3"},{"date":"2027-05-19","day":"D4"},{"date":"2027-05-20","day":"D5"},{"date":"2027-05-21","day":"D6"},{"date":"2027-05-24","day":"D1"},{"date":"2027-05-25","day":"D2"},{"date":"2027-05-26","day":"D3"},{"date":"2027-05-27","day":"D4"},{"date":"2027-05-28","day":"D5"},{"date":"2027-05-31","day":"D6"},{"date":"2027-06-01","day":"D1"},{"date":"2027-06-02","day":"D2"},{"date":"2027-06-10","day":"D3"},{"date":"2027-06-11","day":"D4"},{"date":"2027-06-14","day":"D5"},{"date":"2027-06-15","day":"D6"},{"date":"2027-06-16","day":"D1"},{"date":"2027-06-17","day":"D2"},{"date":"2027-06-18","day":"D3"},{"date":"2027-06-21","day":"D4"},{"date":"2027-06-22","day":"D5"},{"date":"2027-06-23","day":"D6"},{"date":"2027-06-24","day":"D1"},{"date":"2027-06-28","day":"D2"},{"date":"2027-06-29","day":"D3"},{"date":"2027-06-30","day":"D4"},{"date":"2027-07-05","day":"D5"},{"date":"2027-07-06","day":"D6"},{"date":"2027-07-07","day":"D1"}];

function schoolDayMap_() {
  var map = {};
  for (var i = 0; i < SCHOOL_DAYS.length; i++) {
    map[SCHOOL_DAYS[i].date] = SCHOOL_DAYS[i].day;
  }
  return map;
}

function cycleDayFor_(dateStr) {
  var map = schoolDayMap_();
  return map[dateStr] || null;
}

function isSchoolDay_(dateStr) {
  return !!cycleDayFor_(dateStr);
}

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
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
  return s;
}

/**
 * 本月 1 日至 asOfDate（含）之間的校曆 D1–D6 日期清單。
 */
function schoolDayList_(asOfDate) {
  var ym = String(asOfDate).substring(0, 7);
  var list = [];
  for (var i = 0; i < SCHOOL_DAYS.length; i++) {
    var d = SCHOOL_DAYS[i].date;
    if (d.indexOf(ym) === 0 && d <= asOfDate) {
      list.push(d);
    }
  }
  return list;
}

/**
 * 本月最常漏登記的班級。
 * missedDays = 本月 D1–D6 上學日中沒有該班紀錄的天數；平手則全部列入 classes。
 */
function computeMostMissed_(rows, asOfDate) {
  var ym = String(asOfDate).substring(0, 7);
  var days = schoolDayList_(asOfDate);
  var totalDays = days.length;
  var classes = validClasses_();

  if (totalDays === 0) {
    return { class: null, classes: [], missedDays: 0, totalDays: 0 };
  }

  var submitted = {};
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (String(r.date).indexOf(ym) !== 0) continue;
    if (!submitted[r.class]) submitted[r.class] = {};
    submitted[r.class][r.date] = true;
  }

  var maxMissed = -1;
  var winners = [];
  for (var c = 0; c < classes.length; c++) {
    var cls = classes[c];
    var missed = 0;
    for (var di = 0; di < days.length; di++) {
      if (!submitted[cls] || !submitted[cls][days[di]]) {
        missed++;
      }
    }
    if (missed > maxMissed) {
      maxMissed = missed;
      winners = [cls];
    } else if (missed === maxMissed) {
      winners.push(cls);
    }
  }

  return {
    class: winners.length ? winners[0] : null,
    classes: winners,
    missedDays: maxMissed < 0 ? 0 : maxMissed,
    totalDays: totalDays,
  };
}

function computeHighestAvg_(rows, ym) {
  var classes = validClasses_();
  var bestAvg = null;
  var winners = [];

  for (var c = 0; c < classes.length; c++) {
    var cls = classes[c];
    var weights = [];
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].class === cls && String(rows[i].date).indexOf(ym) === 0) {
        weights.push(Number(rows[i].weight_kg));
      }
    }
    if (weights.length === 0) continue;
    var sum = 0;
    for (var j = 0; j < weights.length; j++) sum += weights[j];
    var avg = sum / weights.length;
    if (bestAvg === null || avg > bestAvg) {
      bestAvg = avg;
      winners = [cls];
    } else if (avg === bestAvg) {
      winners.push(cls);
    }
  }

  if (winners.length === 0) {
    return { class: null, classes: [], avg: null };
  }
  return {
    class: winners[0],
    classes: winners,
    avg: round2_(bestAvg),
  };
}


/**
 * 上一個日曆月 YYYY-MM（相對目前 ym）。
 */
function prevMonth_(ym) {
  var y = parseInt(String(ym).substring(0, 4), 10);
  var m = parseInt(String(ym).substring(5, 7), 10);
  if (m === 1) {
    y--;
    m = 12;
  } else {
    m--;
  }
  return y + '-' + (m < 10 ? '0' : '') + m;
}

/**
 * 該月最後一天 YYYY-MM-DD。
 */
function lastDayOfMonth_(ym) {
  var y = parseInt(String(ym).substring(0, 4), 10);
  var m = parseInt(String(ym).substring(5, 7), 10);
  var last = new Date(y, m, 0); // JS：月份 0-based，day 0 = 上月最後一天
  var day = last.getDate();
  return String(ym) + '-' + (day < 10 ? '0' : '') + day;
}

/**
 * 今日尚未登記的班級（僅 D1–D6 日有意義）。
 * 回傳 { isSchoolDay, cycleDay, missing, submitted }
 */
function computeTodayMissing_(rows, today) {
  var cycleDay = cycleDayFor_(today);
  var classes = validClasses_();
  if (!cycleDay) {
    return { isSchoolDay: false, cycleDay: null, missing: [], submitted: [] };
  }
  var submittedMap = {};
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].date === today) {
      submittedMap[rows[i].class] = true;
    }
  }
  var missing = [];
  var submitted = [];
  for (var c = 0; c < classes.length; c++) {
    var cls = classes[c];
    if (submittedMap[cls]) {
      submitted.push(cls);
    } else {
      missing.push(cls);
    }
  }
  return {
    isSchoolDay: true,
    cycleDay: cycleDay,
    missing: missing,
    submitted: submitted,
  };
}

/**
 * 近兩個月（上月＋本月）各班平均剩食。
 * 回傳 { months: [prev, current], byClass: { P3A: [null|num, null|num], ... } }
 */
function computeTwoMonthAvgs_(rows, currentYm) {
  var prevYm = prevMonth_(currentYm);
  var months = [prevYm, currentYm];
  var classes = validClasses_();
  var byClass = {};
  for (var c = 0; c < classes.length; c++) {
    var cls = classes[c];
    var avgs = [];
    for (var mi = 0; mi < months.length; mi++) {
      var ym = months[mi];
      var weights = [];
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].class === cls && String(rows[i].date).indexOf(ym) === 0) {
          weights.push(Number(rows[i].weight_kg));
        }
      }
      if (weights.length === 0) {
        avgs.push(null);
      } else {
        var sum = 0;
        for (var j = 0; j < weights.length; j++) sum += weights[j];
        avgs.push(round2_(sum / weights.length));
      }
    }
    byClass[cls] = avgs;
  }
  return { months: months, byClass: byClass };
}

/**
 * 彙總 stats 共用欄位（本月＋上月＋今日漏登＋兩月平均）。
 */
function buildStatsPayload_(rows, dateStr) {
  var ym = String(dateStr).substring(0, 7);
  var lastYm = prevMonth_(ym);
  var lastAsOf = lastDayOfMonth_(lastYm);
  return {
    gradeMins: computeGradeMins_(rows, ym),
    mostMissed: computeMostMissed_(rows, dateStr),
    highestAvg: computeHighestAvg_(rows, ym),
    month: ym,
    cycleDay: cycleDayFor_(dateStr),
    todayMissing: computeTodayMissing_(rows, dateStr),
    lastMonth: lastYm,
    lastMonthMostMissed: computeMostMissed_(rows, lastAsOf),
    lastMonthHighestAvg: computeHighestAvg_(rows, lastYm),
    twoMonthAvgs: computeTwoMonthAvgs_(rows, ym),
  };
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
      message: '請選擇有效的班級（3A–6D）。',
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

  var cycleDay = cycleDayFor_(dateStr);
  if (!cycleDay) {
    return jsonOut_({
      ok: false,
      error: 'not_school_day',
      message: '今天不是校曆上的循環日（D1–D6），不用登記午餐剩食喔！請在有 D 日的上學日再來登記。📅',
      cycleDay: null,
    });
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

  rows.push({ date: dateStr, class: className, weight_kg: weight, timestamp: ts });
  var ym = dateStr.substring(0, 7);
  var avgInfo = classMonthAvg_(rows, className, ym);
  var monthlyAvg = avgInfo.avg;
  var above = monthlyAvg !== null && weight > monthlyAvg;
  var comparison = above ? 'above' : (weight < monthlyAvg ? 'below' : 'equal');
  var message = above ? pick_(ENCOURAGE) : pick_(PRAISE);
  var stats = buildStatsPayload_(rows, dateStr);

  return jsonOut_({
    ok: true,
    todayWeight: round2_(weight),
    monthlyAvg: monthlyAvg,
    sampleCount: avgInfo.count,
    comparison: comparison,
    message: message,
    gradeMins: stats.gradeMins,
    mostMissed: stats.mostMissed,
    highestAvg: stats.highestAvg,
    month: stats.month,
    cycleDay: cycleDay,
    todayMissing: stats.todayMissing,
    lastMonth: stats.lastMonth,
    lastMonthMostMissed: stats.lastMonthMostMissed,
    lastMonthHighestAvg: stats.lastMonthHighestAvg,
    twoMonthAvgs: stats.twoMonthAvgs,
  });
}

function handleStats_(body) {
  var dateStr = String((body && body.date) || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    dateStr = hkToday_();
  }
  var sheet = getOrCreateSheet_();
  var rows = readAllRows_(sheet);
  var stats = buildStatsPayload_(rows, dateStr);
  return jsonOut_({
    ok: true,
    gradeMins: stats.gradeMins,
    mostMissed: stats.mostMissed,
    highestAvg: stats.highestAvg,
    month: stats.month,
    cycleDay: stats.cycleDay,
    todayMissing: stats.todayMissing,
    lastMonth: stats.lastMonth,
    lastMonthMostMissed: stats.lastMonthMostMissed,
    lastMonthHighestAvg: stats.lastMonthHighestAvg,
    twoMonthAvgs: stats.twoMonthAvgs,
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
