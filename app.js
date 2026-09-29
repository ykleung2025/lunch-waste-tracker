/**
 * 午餐剩食追蹤 — 前端邏輯
 * 支援 Google Apps Script API 與 localStorage 示範模式
 */
(function () {
  'use strict';

  const GRADES = ['P3', 'P4', 'P5', 'P6'];
  const SECTIONS = ['A', 'B', 'C', 'D'];
  const CLASSES = GRADES.flatMap((g) => SECTIONS.map((s) => g + s));
  const MOCK_KEY = 'lunch_waste_tracker_records_v1';

  /** 2026–27 校曆循環日（D1–D6），自 school-days-2026-27.json 嵌入 */
  const SCHOOL_DAYS = [{"date":"2026-09-04","day":"D1"},{"date":"2026-09-07","day":"D2"},{"date":"2026-09-08","day":"D3"},{"date":"2026-09-09","day":"D4"},{"date":"2026-09-10","day":"D5"},{"date":"2026-09-11","day":"D6"},{"date":"2026-09-15","day":"D1"},{"date":"2026-09-16","day":"D2"},{"date":"2026-09-17","day":"D3"},{"date":"2026-09-18","day":"D4"},{"date":"2026-09-21","day":"D5"},{"date":"2026-09-22","day":"D6"},{"date":"2026-09-23","day":"D1"},{"date":"2026-09-24","day":"D2"},{"date":"2026-09-25","day":"D3"},{"date":"2026-09-28","day":"D4"},{"date":"2026-09-29","day":"D5"},{"date":"2026-09-30","day":"D6"},{"date":"2026-10-02","day":"D1"},{"date":"2026-10-05","day":"D2"},{"date":"2026-10-06","day":"D3"},{"date":"2026-10-07","day":"D4"},{"date":"2026-10-08","day":"D5"},{"date":"2026-10-09","day":"D6"},{"date":"2026-10-12","day":"D1"},{"date":"2026-10-13","day":"D2"},{"date":"2026-10-14","day":"D3"},{"date":"2026-10-15","day":"D4"},{"date":"2026-10-20","day":"D5"},{"date":"2026-10-21","day":"D6"},{"date":"2026-10-22","day":"D1"},{"date":"2026-10-23","day":"D2"},{"date":"2026-10-26","day":"D3"},{"date":"2026-10-27","day":"D4"},{"date":"2026-10-28","day":"D5"},{"date":"2026-10-29","day":"D6"},{"date":"2026-10-30","day":"D1"},{"date":"2026-11-02","day":"D2"},{"date":"2026-11-03","day":"D3"},{"date":"2026-11-04","day":"D4"},{"date":"2026-11-05","day":"D5"},{"date":"2026-11-06","day":"D6"},{"date":"2026-11-09","day":"D1"},{"date":"2026-11-10","day":"D2"},{"date":"2026-11-11","day":"D3"},{"date":"2026-11-13","day":"D4"},{"date":"2026-11-17","day":"D5"},{"date":"2026-11-18","day":"D6"},{"date":"2026-11-19","day":"D1"},{"date":"2026-11-23","day":"D2"},{"date":"2026-11-24","day":"D3"},{"date":"2026-11-25","day":"D4"},{"date":"2026-11-26","day":"D5"},{"date":"2026-11-30","day":"D6"},{"date":"2026-12-01","day":"D1"},{"date":"2026-12-02","day":"D2"},{"date":"2026-12-03","day":"D3"},{"date":"2026-12-04","day":"D4"},{"date":"2026-12-07","day":"D5"},{"date":"2026-12-08","day":"D6"},{"date":"2026-12-09","day":"D1"},{"date":"2026-12-10","day":"D2"},{"date":"2026-12-11","day":"D3"},{"date":"2026-12-14","day":"D4"},{"date":"2026-12-15","day":"D5"},{"date":"2026-12-16","day":"D6"},{"date":"2026-12-17","day":"D1"},{"date":"2026-12-18","day":"D2"},{"date":"2026-12-21","day":"D3"},{"date":"2027-01-04","day":"D4"},{"date":"2027-01-05","day":"D5"},{"date":"2027-01-06","day":"D6"},{"date":"2027-01-07","day":"D1"},{"date":"2027-01-08","day":"D2"},{"date":"2027-01-13","day":"D3"},{"date":"2027-01-14","day":"D4"},{"date":"2027-01-15","day":"D5"},{"date":"2027-01-18","day":"D6"},{"date":"2027-01-19","day":"D1"},{"date":"2027-01-20","day":"D2"},{"date":"2027-01-21","day":"D3"},{"date":"2027-01-22","day":"D4"},{"date":"2027-01-25","day":"D5"},{"date":"2027-01-26","day":"D6"},{"date":"2027-01-27","day":"D1"},{"date":"2027-01-28","day":"D2"},{"date":"2027-02-01","day":"D3"},{"date":"2027-02-02","day":"D4"},{"date":"2027-02-15","day":"D5"},{"date":"2027-02-16","day":"D6"},{"date":"2027-02-17","day":"D1"},{"date":"2027-02-18","day":"D2"},{"date":"2027-02-22","day":"D3"},{"date":"2027-02-23","day":"D4"},{"date":"2027-02-24","day":"D5"},{"date":"2027-02-25","day":"D6"},{"date":"2027-02-26","day":"D1"},{"date":"2027-03-01","day":"D2"},{"date":"2027-03-02","day":"D3"},{"date":"2027-03-03","day":"D4"},{"date":"2027-03-15","day":"D5"},{"date":"2027-03-16","day":"D6"},{"date":"2027-03-17","day":"D1"},{"date":"2027-03-18","day":"D2"},{"date":"2027-03-19","day":"D3"},{"date":"2027-03-22","day":"D4"},{"date":"2027-03-23","day":"D5"},{"date":"2027-03-24","day":"D6"},{"date":"2027-03-25","day":"D1"},{"date":"2027-04-07","day":"D2"},{"date":"2027-04-08","day":"D3"},{"date":"2027-04-09","day":"D4"},{"date":"2027-04-12","day":"D5"},{"date":"2027-04-13","day":"D6"},{"date":"2027-04-14","day":"D1"},{"date":"2027-04-15","day":"D2"},{"date":"2027-04-16","day":"D3"},{"date":"2027-04-19","day":"D4"},{"date":"2027-04-20","day":"D5"},{"date":"2027-04-21","day":"D6"},{"date":"2027-04-22","day":"D1"},{"date":"2027-04-26","day":"D2"},{"date":"2027-04-27","day":"D3"},{"date":"2027-04-28","day":"D4"},{"date":"2027-04-29","day":"D5"},{"date":"2027-04-30","day":"D6"},{"date":"2027-05-03","day":"D1"},{"date":"2027-05-04","day":"D2"},{"date":"2027-05-05","day":"D3"},{"date":"2027-05-06","day":"D4"},{"date":"2027-05-11","day":"D5"},{"date":"2027-05-12","day":"D6"},{"date":"2027-05-14","day":"D1"},{"date":"2027-05-17","day":"D2"},{"date":"2027-05-18","day":"D3"},{"date":"2027-05-19","day":"D4"},{"date":"2027-05-20","day":"D5"},{"date":"2027-05-21","day":"D6"},{"date":"2027-05-24","day":"D1"},{"date":"2027-05-25","day":"D2"},{"date":"2027-05-26","day":"D3"},{"date":"2027-05-27","day":"D4"},{"date":"2027-05-28","day":"D5"},{"date":"2027-05-31","day":"D6"},{"date":"2027-06-01","day":"D1"},{"date":"2027-06-02","day":"D2"},{"date":"2027-06-10","day":"D3"},{"date":"2027-06-11","day":"D4"},{"date":"2027-06-14","day":"D5"},{"date":"2027-06-15","day":"D6"},{"date":"2027-06-16","day":"D1"},{"date":"2027-06-17","day":"D2"},{"date":"2027-06-18","day":"D3"},{"date":"2027-06-21","day":"D4"},{"date":"2027-06-22","day":"D5"},{"date":"2027-06-23","day":"D6"},{"date":"2027-06-24","day":"D1"},{"date":"2027-06-28","day":"D2"},{"date":"2027-06-29","day":"D3"},{"date":"2027-06-30","day":"D4"},{"date":"2027-07-05","day":"D5"},{"date":"2027-07-06","day":"D6"},{"date":"2027-07-07","day":"D1"}];

  const SCHOOL_DAY_MAP = Object.create(null);
  SCHOOL_DAYS.forEach((entry) => {
    SCHOOL_DAY_MAP[entry.date] = entry.day;
  });

  const cfg = window.LUNCH_WASTE_CONFIG || {};
  const USE_MOCK = cfg.USE_MOCK !== false && (
    cfg.USE_MOCK === true ||
    !cfg.SCRIPT_URL ||
    cfg.SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE'
  );

  // ——— DOM ———
  const el = {
    classSelect: document.getElementById('class-select'),
    todayDate: document.getElementById('today-date'),
    headerDate: document.getElementById('header-date'),
    cycleDayBadge: document.getElementById('cycle-day-badge'),
    weightInput: document.getElementById('weight-input'),
    form: document.getElementById('waste-form'),
    submitBtn: document.getElementById('submit-btn'),
    feedback: document.getElementById('feedback'),
    feedbackTitle: document.getElementById('feedback-title'),
    feedbackMsg: document.getElementById('feedback-msg'),
    feedbackStats: document.getElementById('feedback-stats'),
    mockBanner: document.getElementById('mock-banner'),
    refreshBtn: document.getElementById('refresh-btn'),
    lbEmpty: document.getElementById('lb-empty'),
    lbTable: document.getElementById('lb-table'),
    lbBody: document.getElementById('lb-body'),
    mostMissedValue: document.getElementById('most-missed-value'),
    mostMissedDetail: document.getElementById('most-missed-detail'),
    highestAvgValue: document.getElementById('highest-avg-value'),
    highestAvgDetail: document.getElementById('highest-avg-detail'),
    todayMissingStatus: document.getElementById('today-missing-status'),
    todayMissingList: document.getElementById('today-missing-list'),
    lastMonthLabel: document.getElementById('last-month-label'),
    lastMostMissedValue: document.getElementById('last-most-missed-value'),
    lastMostMissedDetail: document.getElementById('last-most-missed-detail'),
    lastHighestAvgValue: document.getElementById('last-highest-avg-value'),
    lastHighestAvgDetail: document.getElementById('last-highest-avg-detail'),
    chartLegend: document.getElementById('chart-legend'),
    chartBody: document.getElementById('chart-body'),
    chartEmpty: document.getElementById('chart-empty'),
  };

  // ——— 香港日期 YYYY-MM-DD ———
  function hkToday() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Hong_Kong',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }

  function monthPrefix(dateStr) {
    return dateStr.slice(0, 7); // YYYY-MM
  }

  function cycleDayFor(dateStr) {
    return SCHOOL_DAY_MAP[dateStr] || null;
  }

  function isSchoolDay(dateStr) {
    return !!cycleDayFor(dateStr);
  }

  /**
   * 本月 1 日至 asOfDate（含）之間的校曆 D1–D6 日期清單。
   */
  function schoolDayList(asOfDate) {
    const ym = monthPrefix(asOfDate);
    return SCHOOL_DAYS
      .filter((entry) => entry.date.startsWith(ym) && entry.date <= asOfDate)
      .map((entry) => entry.date);
  }


  function prevMonth(ym) {
    let y = Number(ym.slice(0, 4));
    let m = Number(ym.slice(5, 7));
    if (m === 1) {
      y -= 1;
      m = 12;
    } else {
      m -= 1;
    }
    return y + '-' + String(m).padStart(2, '0');
  }

  function lastDayOfMonth(ym) {
    const y = Number(ym.slice(0, 4));
    const m = Number(ym.slice(5, 7));
    const last = new Date(y, m, 0);
    return ym + '-' + String(last.getDate()).padStart(2, '0');
  }

  /**
   * 今日尚未登記的班級（僅 D1–D6 日有意義）。
   */
  function computeTodayMissing(rows, today) {
    const day = cycleDayFor(today);
    if (!day) {
      return { isSchoolDay: false, cycleDay: null, missing: [], submitted: [] };
    }
    const submittedMap = {};
    rows.forEach((r) => {
      if (r.date === today) submittedMap[r.class] = true;
    });
    const missing = [];
    const submitted = [];
    CLASSES.forEach((cls) => {
      if (submittedMap[cls]) submitted.push(cls);
      else missing.push(cls);
    });
    return {
      isSchoolDay: true,
      cycleDay: day,
      missing,
      submitted,
    };
  }

  /**
   * 近兩個月（上月＋本月）各班平均剩食。
   */
  function computeTwoMonthAvgs(rows, currentYm) {
    const prevYm = prevMonth(currentYm);
    const months = [prevYm, currentYm];
    const byClass = {};
    CLASSES.forEach((cls) => {
      byClass[cls] = months.map((ym) => {
        const weights = rows
          .filter((r) => r.class === cls && String(r.date).startsWith(ym))
          .map((r) => Number(r.weight_kg));
        if (weights.length === 0) return null;
        return round2(weights.reduce((a, b) => a + b, 0) / weights.length);
      });
    });
    return { months, byClass };
  }

  // ——— 鼓勵／讚美文案 ———
  const PRAISE = [
    '太棒了！今天的剩食比平常少，你們真的很惜食！🌟',
    '做得好！少剩一點，地球多一點笑容！💚',
    '讚讚讚！班上同學一起努力，剩食越來越少！👏',
    '超棒！今天的表現值得給自己一個大大的拇指！👍',
  ];
  const ENCOURAGE = [
    '沒關係，明天再一起努力少剩一點！我們可以的！💪',
    '今天雖然多了一點，但下次記得只拿自己吃得完的分量喔！🌱',
    '加油！每一天少剩一點，就是對地球最大的幫忙！🌍',
    '別灰心！惜食是一場馬拉松，明天繼續挑戰吧！🌈',
  ];

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ——— UI helpers ———
  function displayClassName(classCode) {
    const value = String(classCode || '');
    return /^P\d[A-D]$/.test(value) ? value.slice(1) : value;
  }

  function fillClassOptions() {
    CLASSES.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = displayClassName(c);
      el.classSelect.appendChild(opt);
    });
  }

  function showCycleDay(today) {
    const day = cycleDayFor(today);
    if (el.cycleDayBadge) {
      if (day) {
        el.cycleDayBadge.hidden = false;
        el.cycleDayBadge.textContent = '今日 ' + day;
      } else {
        el.cycleDayBadge.hidden = false;
        el.cycleDayBadge.textContent = '今日非循環日';
        el.cycleDayBadge.classList.add('is-off');
      }
    }
    if (el.todayDate) {
      el.todayDate.textContent = day ? today + '（' + day + '）' : today;
    }
    if (el.headerDate) {
      el.headerDate.textContent = day
        ? today + '（香港）· 今日 ' + day
        : today + '（香港）';
    }
  }

  function showFeedback(kind, title, msg, statsHtml) {
    el.feedback.className = 'feedback visible ' + kind;
    el.feedbackTitle.textContent = title;
    el.feedbackMsg.textContent = msg;
    if (statsHtml) {
      el.feedbackStats.hidden = false;
      el.feedbackStats.innerHTML = statsHtml;
    } else {
      el.feedbackStats.hidden = true;
      el.feedbackStats.innerHTML = '';
    }
  }

  function hideFeedback() {
    el.feedback.className = 'feedback';
  }

  function setSubmitting(busy) {
    el.submitBtn.disabled = busy;
    el.submitBtn.innerHTML = busy
      ? '<span class="loading" aria-hidden="true"></span> 送出中…'
      : '送出登記';
  }

  // ——— Mock storage ———
  function mockLoad() {
    try {
      const raw = localStorage.getItem(MOCK_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function mockSave(rows) {
    localStorage.setItem(MOCK_KEY, JSON.stringify(rows));
  }

  /**
   * 本月最常漏登記的班級（僅計本月 D1–D6 至今日含）。
   */
  function computeMostMissed(rows, asOfDate) {
    const ym = monthPrefix(asOfDate);
    const days = schoolDayList(asOfDate);
    const totalDays = days.length;
    if (totalDays === 0) {
      return { class: null, classes: [], missedDays: 0, totalDays: 0 };
    }
    const submitted = {};
    rows.forEach((r) => {
      if (!String(r.date).startsWith(ym)) return;
      if (!submitted[r.class]) submitted[r.class] = {};
      submitted[r.class][r.date] = true;
    });

    let maxMissed = -1;
    let winners = [];
    CLASSES.forEach((cls) => {
      let missed = 0;
      days.forEach((day) => {
        if (!submitted[cls] || !submitted[cls][day]) missed++;
      });
      if (missed > maxMissed) {
        maxMissed = missed;
        winners = [cls];
      } else if (missed === maxMissed) {
        winners.push(cls);
      }
    });

    return {
      class: winners.length ? winners[0] : null,
      classes: winners,
      missedDays: maxMissed < 0 ? 0 : maxMissed,
      totalDays: totalDays,
    };
  }

  /**
   * 本月平均剩食最高的班級（至少一筆）。
   */
  function computeHighestAvg(rows, ym) {
    let bestAvg = null;
    let winners = [];

    CLASSES.forEach((cls) => {
      const weights = rows
        .filter((r) => r.class === cls && String(r.date).startsWith(ym))
        .map((r) => Number(r.weight_kg));
      if (weights.length === 0) return;
      const avg = weights.reduce((a, b) => a + b, 0) / weights.length;
      if (bestAvg === null || avg > bestAvg) {
        bestAvg = avg;
        winners = [cls];
      } else if (avg === bestAvg) {
        winners.push(cls);
      }
    });

    if (winners.length === 0) {
      return { class: null, classes: [], avg: null };
    }
    return {
      class: winners[0],
      classes: winners,
      avg: round2(bestAvg),
    };
  }

  function computeStats(rows, className, today) {
    const ym = monthPrefix(today);
    const classMonth = rows.filter(
      (r) => r.class === className && String(r.date).startsWith(ym)
    );
    const weights = classMonth.map((r) => Number(r.weight_kg));
    const monthlyAvg =
      weights.length === 0
        ? null
        : weights.reduce((a, b) => a + b, 0) / weights.length;

    const gradeMins = {};
    GRADES.forEach((g) => {
      const gradeClasses = SECTIONS.map((s) => g + s);
      let bestTotal = null;
      let bestAvg = null;

      gradeClasses.forEach((cls) => {
        const clsRows = rows.filter(
          (r) => r.class === cls && String(r.date).startsWith(ym)
        );
        if (clsRows.length === 0) return;
        const total = clsRows.reduce((a, r) => a + Number(r.weight_kg), 0);
        const avg = total / clsRows.length;
        if (!bestTotal || total < bestTotal.total) {
          bestTotal = { class: cls, total: round2(total), count: clsRows.length };
        }
        if (!bestAvg || avg < bestAvg.avg) {
          bestAvg = { class: cls, avg: round2(avg), count: clsRows.length };
        }
      });

      gradeMins[g] = { lowestTotal: bestTotal, lowestAvg: bestAvg };
    });

    const lastYm = prevMonth(ym);
    const lastAsOf = lastDayOfMonth(lastYm);
    return {
      monthlyAvg: monthlyAvg === null ? null : round2(monthlyAvg),
      sampleCount: weights.length,
      gradeMins,
      mostMissed: computeMostMissed(rows, today),
      highestAvg: computeHighestAvg(rows, ym),
      month: ym,
      cycleDay: cycleDayFor(today),
      todayMissing: computeTodayMissing(rows, today),
      lastMonth: lastYm,
      lastMonthMostMissed: computeMostMissed(rows, lastAsOf),
      lastMonthHighestAvg: computeHighestAvg(rows, lastYm),
      twoMonthAvgs: computeTwoMonthAvgs(rows, ym),
    };
  }

  function round2(n) {
    return Math.round(Number(n) * 100) / 100;
  }

  function mockSubmit(className, weight, today) {
    if (!isSchoolDay(today)) {
      return {
        ok: false,
        error: 'not_school_day',
        message:
          '今天不是校曆上的循環日（D1–D6），不用登記午餐剩食喔！請在有 D 日的上學日再來登記。📅',
        cycleDay: null,
      };
    }

    const rows = mockLoad();
    const dup = rows.find((r) => r.date === today && r.class === className);
    if (dup) {
      return {
        ok: false,
        error: 'duplicate',
        message: '這個班級今天已經登記過了喔！每天只能登記一次，明天再來吧！😊',
      };
    }

    const ts = new Date().toISOString();
    rows.push({
      date: today,
      class: className,
      weight_kg: weight,
      timestamp: ts,
    });
    mockSave(rows);

    const stats = computeStats(rows, className, today);
    const above =
      stats.monthlyAvg !== null && weight > stats.monthlyAvg;
    const message = above ? pick(ENCOURAGE) : pick(PRAISE);

    return {
      ok: true,
      todayWeight: weight,
      monthlyAvg: stats.monthlyAvg,
      sampleCount: stats.sampleCount,
      comparison: above ? 'above' : weight < (stats.monthlyAvg || weight) ? 'below' : 'equal',
      message,
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
    };
  }

  function mockStats(today) {
    const rows = mockLoad();
    const stats = computeStats(rows, null, today);
    return {
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
    };
  }

  // ——— API ———
  async function apiCall(payload) {
    if (USE_MOCK) {
      if (payload.action === 'submit') {
        return mockSubmit(payload.class, Number(payload.weight_kg), payload.date);
      }
      if (payload.action === 'stats') {
        return mockStats(payload.date || hkToday());
      }
      return { ok: false, message: '未知的操作' };
    }

    const url = cfg.SCRIPT_URL;
    const res = await fetch(url, {
      method: 'POST',
      // text/plain avoids CORS preflight with Apps Script
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });
    if (!res.ok) {
      throw new Error('伺服器回應錯誤：' + res.status);
    }
    return res.json();
  }

  // ——— Extra monthly stats render ———
  function formatClassList(info) {
    if (!info) return '—';
    const list =
      Array.isArray(info.classes) && info.classes.length
        ? info.classes.map(displayClassName)
        : info.class
          ? [displayClassName(info.class)]
          : [];
    return list.length ? list.join('、') : '—';
  }

  function renderExtraStats(mostMissed, highestAvg, month) {
    if (el.mostMissedValue) {
      if (!mostMissed || mostMissed.class == null) {
        el.mostMissedValue.textContent = '—';
        el.mostMissedDetail.textContent =
          '本月（' + (month || '') + '）尚無足夠資料可計算。';
      } else {
        el.mostMissedValue.textContent = formatClassList(mostMissed);
        el.mostMissedDetail.textContent =
          '漏登記 ' +
          mostMissed.missedDays +
          ' 天／本月循環日共 ' +
          mostMissed.totalDays +
          ' 天' +
          (Array.isArray(mostMissed.classes) && mostMissed.classes.length > 1
            ? '（並列）'
            : '');
      }
    }

    if (el.highestAvgValue) {
      if (!highestAvg || highestAvg.class == null || highestAvg.avg == null) {
        el.highestAvgValue.textContent = '—';
        el.highestAvgDetail.textContent =
          '本月（' + (month || '') + '）尚無登記資料。';
      } else {
        el.highestAvgValue.textContent = formatClassList(highestAvg);
        el.highestAvgDetail.textContent =
          '本月平均 ' +
          Number(highestAvg.avg).toFixed(2) +
          ' kg' +
          (Array.isArray(highestAvg.classes) && highestAvg.classes.length > 1
            ? '（並列）'
            : '');
      }
    }
  }


  function renderTodayMissing(info) {
    if (!el.todayMissingStatus) return;
    if (!info || !info.isSchoolDay) {
      el.todayMissingStatus.textContent =
        '今天不是校曆循環日（D1–D6），無需登記午餐剩食。';
      el.todayMissingStatus.className = 'today-missing-status is-off';
      if (el.todayMissingList) {
        el.todayMissingList.innerHTML = '';
        el.todayMissingList.hidden = true;
      }
      return;
    }
    const missing = Array.isArray(info.missing) ? info.missing : [];
    const dayLabel = info.cycleDay ? '（' + info.cycleDay + '）' : '';
    if (missing.length === 0) {
      el.todayMissingStatus.textContent =
        '今日' + dayLabel + '所有班級（3A–6D）都已登記！🎉';
      el.todayMissingStatus.className = 'today-missing-status is-ok';
      if (el.todayMissingList) {
        el.todayMissingList.innerHTML = '';
        el.todayMissingList.hidden = true;
      }
      return;
    }
    el.todayMissingStatus.textContent =
      '今日' + dayLabel + '尚未登記：共 ' + missing.length + ' 班';
    el.todayMissingStatus.className = 'today-missing-status is-warn';
    if (el.todayMissingList) {
      el.todayMissingList.hidden = false;
      el.todayMissingList.innerHTML = missing
        .map(
          (c) =>
            '<span class="missing-chip">' + displayClassName(c) + '</span>'
        )
        .join('');
    }
  }

  function renderLastMonthStats(mostMissed, highestAvg, lastMonth) {
    if (el.lastMonthLabel) {
      el.lastMonthLabel.textContent = lastMonth || '—';
    }
    if (el.lastMostMissedValue) {
      if (!mostMissed || mostMissed.class == null || mostMissed.totalDays === 0) {
        el.lastMostMissedValue.textContent = '—';
        el.lastMostMissedDetail.textContent =
          '上月（' + (lastMonth || '') + '）無循環日或尚無足夠資料。';
      } else {
        el.lastMostMissedValue.textContent = formatClassList(mostMissed);
        el.lastMostMissedDetail.textContent =
          '漏登記 ' +
          mostMissed.missedDays +
          ' 天／上月循環日共 ' +
          mostMissed.totalDays +
          ' 天' +
          (Array.isArray(mostMissed.classes) && mostMissed.classes.length > 1
            ? '（並列）'
            : '');
      }
    }
    if (el.lastHighestAvgValue) {
      if (!highestAvg || highestAvg.class == null || highestAvg.avg == null) {
        el.lastHighestAvgValue.textContent = '—';
        el.lastHighestAvgDetail.textContent =
          '上月（' + (lastMonth || '') + '）尚無登記資料。';
      } else {
        el.lastHighestAvgValue.textContent = formatClassList(highestAvg);
        el.lastHighestAvgDetail.textContent =
          '上月平均 ' +
          Number(highestAvg.avg).toFixed(2) +
          ' kg' +
          (Array.isArray(highestAvg.classes) && highestAvg.classes.length > 1
            ? '（並列）'
            : '');
      }
    }
  }

  function renderTwoMonthChart(twoMonthAvgs) {
    if (!el.chartBody) return;
    if (
      !twoMonthAvgs ||
      !Array.isArray(twoMonthAvgs.months) ||
      twoMonthAvgs.months.length < 2 ||
      !twoMonthAvgs.byClass
    ) {
      if (el.chartEmpty) {
        el.chartEmpty.hidden = false;
        el.chartEmpty.textContent = '尚無近兩個月資料可繪製圖表。';
      }
      el.chartBody.innerHTML = '';
      if (el.chartLegend) el.chartLegend.innerHTML = '';
      return;
    }

    const months = twoMonthAvgs.months;
    const byClass = twoMonthAvgs.byClass;
    let maxVal = 0;
    let hasAny = false;
    CLASSES.forEach((cls) => {
      const pair = byClass[cls] || [null, null];
      pair.forEach((v) => {
        if (v != null && Number.isFinite(Number(v))) {
          hasAny = true;
          if (Number(v) > maxVal) maxVal = Number(v);
        }
      });
    });

    if (el.chartLegend) {
      el.chartLegend.innerHTML =
        '<span class="chart-legend-item"><span class="chart-swatch swatch-prev"></span>' +
        months[0] +
        '（上月）</span>' +
        '<span class="chart-legend-item"><span class="chart-swatch swatch-curr"></span>' +
        months[1] +
        '（本月）</span>';
    }

    if (!hasAny) {
      if (el.chartEmpty) {
        el.chartEmpty.hidden = false;
        el.chartEmpty.textContent =
          '近兩個月（' + months[0] + '、' + months[1] + '）尚無登記資料。';
      }
      el.chartBody.innerHTML = '';
      return;
    }

    if (el.chartEmpty) el.chartEmpty.hidden = true;
    const scale = maxVal > 0 ? maxVal : 1;

    el.chartBody.innerHTML = CLASSES.map((cls) => {
      const pair = byClass[cls] || [null, null];
      const v0 = pair[0] == null ? null : Number(pair[0]);
      const v1 = pair[1] == null ? null : Number(pair[1]);
      const h0 = v0 == null ? 0 : Math.max(2, Math.round((v0 / scale) * 100));
      const h1 = v1 == null ? 0 : Math.max(2, Math.round((v1 / scale) * 100));
      const t0 =
        v0 == null
          ? '<span class="bar-val is-null">—</span>'
          : '<span class="bar-val">' + v0.toFixed(2) + '</span>';
      const t1 =
        v1 == null
          ? '<span class="bar-val is-null">—</span>'
          : '<span class="bar-val">' + v1.toFixed(2) + '</span>';
      return (
        '<div class="chart-group" title="' +
        displayClassName(cls) +
        '">' +
        '<div class="chart-bars">' +
        '<div class="bar-col">' +
        t0 +
        '<div class="bar bar-prev' +
        (v0 == null ? ' is-empty' : '') +
        '" style="height:' +
        (v0 == null ? 4 : h0) +
        '%"></div>' +
        '</div>' +
        '<div class="bar-col">' +
        t1 +
        '<div class="bar bar-curr' +
        (v1 == null ? ' is-empty' : '') +
        '" style="height:' +
        (v1 == null ? 4 : h1) +
        '%"></div>' +
        '</div>' +
        '</div>' +
        '<div class="chart-label">' +
        displayClassName(cls) +
        '</div>' +
        '</div>'
      );
    }).join('');
  }

  function renderAllExtra(data) {
    renderExtraStats(data && data.mostMissed, data && data.highestAvg, data && data.month);
    renderTodayMissing(data && data.todayMissing);
    renderLastMonthStats(
      data && data.lastMonthMostMissed,
      data && data.lastMonthHighestAvg,
      data && data.lastMonth
    );
    renderTwoMonthChart(data && data.twoMonthAvgs);
  }

  // ——— Leaderboard render ———
  function renderLeaderboard(gradeMins, month) {
    if (!gradeMins) {
      el.lbEmpty.hidden = false;
      el.lbEmpty.textContent = '尚無本月資料，快來成為第一個登記的班級吧！';
      el.lbTable.hidden = true;
      return;
    }

    const rows = GRADES.map((g) => {
      const info = gradeMins[g] || {};
      const lt = info.lowestTotal;
      const la = info.lowestAvg;
      return {
        grade: g,
        totalClass: lt ? displayClassName(lt.class) : '—',
        totalVal: lt ? lt.total.toFixed(2) : '—',
        avgClass: la ? displayClassName(la.class) : '—',
        avgVal: la ? la.avg.toFixed(2) : '—',
      };
    });

    const hasAny = rows.some((r) => r.totalClass !== '—');
    if (!hasAny) {
      el.lbEmpty.hidden = false;
      el.lbEmpty.textContent =
        '本月（' + (month || '') + '）尚無登記資料。';
      el.lbTable.hidden = true;
      return;
    }

    el.lbEmpty.hidden = true;
    el.lbTable.hidden = false;
    el.lbBody.innerHTML = rows
      .map(
        (r) =>
          '<tr>' +
          '<td><strong>' +
          r.grade +
          '</strong></td>' +
          '<td>' +
          (r.totalClass !== '—' ? '<span class="medal">🥇</span> ' + r.totalClass : '—') +
          '</td>' +
          '<td>' +
          r.totalVal +
          '</td>' +
          '<td>' +
          (r.avgClass !== '—' ? '<span class="medal">⭐</span> ' + r.avgClass : '—') +
          '</td>' +
          '<td>' +
          r.avgVal +
          '</td>' +
          '</tr>'
      )
      .join('');
  }

  async function loadStats() {
    el.lbEmpty.hidden = false;
    el.lbEmpty.textContent = '載入中…';
    el.lbTable.hidden = true;
    if (el.mostMissedValue) {
      el.mostMissedValue.textContent = '…';
      el.mostMissedDetail.textContent = '載入中…';
    }
    if (el.highestAvgValue) {
      el.highestAvgValue.textContent = '…';
      el.highestAvgDetail.textContent = '載入中…';
    }
    if (el.todayMissingStatus) {
      el.todayMissingStatus.textContent = '載入中…';
      el.todayMissingStatus.className = 'today-missing-status';
    }
    if (el.chartEmpty) {
      el.chartEmpty.hidden = false;
      el.chartEmpty.textContent = '載入中…';
    }
    try {
      const data = await apiCall({ action: 'stats', date: hkToday() });
      if (!data.ok) {
        el.lbEmpty.textContent = data.message || '無法載入榜單';
        renderAllExtra(null);
        return;
      }
      renderLeaderboard(data.gradeMins, data.month);
      renderAllExtra(data);
    } catch (err) {
      el.lbEmpty.textContent = '載入失敗：' + (err.message || String(err));
      renderAllExtra(null);
    }
  }

  // ——— Form submit ———
  async function onSubmit(e) {
    e.preventDefault();
    hideFeedback();

    const className = el.classSelect.value;
    const weightRaw = el.weightInput.value;
    const weight = Number(weightRaw);
    const today = hkToday();

    if (!CLASSES.includes(className)) {
      showFeedback('error', '哎呀！', '請選擇有效的班級（3A–6D）。');
      return;
    }
    if (!Number.isFinite(weight) || weight <= 0) {
      showFeedback('error', '哎呀！', '請輸入大於 0 的剩食重量（公斤）。');
      return;
    }
    if (!isSchoolDay(today)) {
      showFeedback(
        'error',
        '今天不用登記',
        '今天不是校曆上的循環日（D1–D6），不用登記午餐剩食喔！請在有 D 日的上學日再來登記。📅'
      );
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiCall({
        action: 'submit',
        class: className,
        weight_kg: weight,
        date: today,
      });

      if (!data.ok) {
        const title =
          data.error === 'duplicate'
            ? '已經登記過啦！'
            : data.error === 'not_school_day'
              ? '今天不用登記'
              : '無法送出';
        showFeedback('error', title, data.message || '請稍後再試。');
        return;
      }

      const avgText =
        data.monthlyAvg === null || data.monthlyAvg === undefined
          ? '尚無足夠資料'
          : data.monthlyAvg.toFixed(2) + ' kg';
      const cmp =
        data.comparison === 'above'
          ? '高於'
          : data.comparison === 'below'
            ? '低於'
            : '等於';
      const kind = data.comparison === 'above' ? 'encourage' : 'success';
      const title =
        data.comparison === 'above' ? '加油，明天會更好！' : '做得好！';

      showFeedback(
        kind,
        title,
        data.message,
        '<strong>' +
          displayClassName(className) +
          '</strong> 今日：<strong>' +
          Number(data.todayWeight).toFixed(2) +
          ' kg</strong><br>' +
          '本月平均（' +
          (data.sampleCount || '—') +
          ' 筆）：<strong>' +
          avgText +
          '</strong><br>' +
          '今日相對平均：<strong>' +
          cmp +
          '</strong>'
      );

      el.weightInput.value = '';
      if (data.gradeMins) {
        renderLeaderboard(data.gradeMins, data.month);
        renderAllExtra(data);
      } else {
        await loadStats();
      }
    } catch (err) {
      showFeedback('error', '連線失敗', err.message || String(err));
    } finally {
      setSubmitting(false);
    }
  }

  // ——— Init ———
  function init() {
    fillClassOptions();
    const today = hkToday();
    showCycleDay(today);

    if (USE_MOCK) {
      el.mockBanner.classList.add('visible');
    }

    el.form.addEventListener('submit', onSubmit);
    el.refreshBtn.addEventListener('click', () => {
      loadStats();
    });

    loadStats();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
