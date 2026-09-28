/**
 * 午餐剩食追蹤 — 前端邏輯
 * 支援 Google Apps Script API 與 localStorage 示範模式
 */
(function () {
  'use strict';

  const GRADES = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'];
  const SECTIONS = ['A', 'B', 'C', 'D'];
  const CLASSES = GRADES.flatMap((g) => SECTIONS.map((s) => g + s));
  const MOCK_KEY = 'lunch_waste_tracker_records_v1';

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
  function fillClassOptions() {
    CLASSES.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      el.classSelect.appendChild(opt);
    });
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

    return {
      monthlyAvg: monthlyAvg === null ? null : round2(monthlyAvg),
      sampleCount: weights.length,
      gradeMins,
      month: ym,
    };
  }

  function round2(n) {
    return Math.round(Number(n) * 100) / 100;
  }

  function mockSubmit(className, weight, today) {
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
    // Equal or below → praise; above → encourage
    // After submit, average includes today. Compare today's weight to the NEW average
    // which includes today. Spec: "whether today is above/below that average"
    // Use average of all month records INCLUDING today, or excluding?
    // Typically "monthly average" after submit includes today. Comparing today to
    // average that includes today: if only 1 record, equal. That's fine (praise).
    const message = above ? pick(ENCOURAGE) : pick(PRAISE);

    return {
      ok: true,
      todayWeight: weight,
      monthlyAvg: stats.monthlyAvg,
      sampleCount: stats.sampleCount,
      comparison: above ? 'above' : weight < (stats.monthlyAvg || weight) ? 'below' : 'equal',
      message,
      gradeMins: stats.gradeMins,
      month: stats.month,
    };
  }

  function mockStats(today) {
    const rows = mockLoad();
    const stats = computeStats(rows, null, today);
    return {
      ok: true,
      gradeMins: stats.gradeMins,
      month: stats.month,
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
        totalClass: lt ? lt.class : '—',
        totalVal: lt ? lt.total.toFixed(2) : '—',
        avgClass: la ? la.class : '—',
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
    try {
      const data = await apiCall({ action: 'stats', date: hkToday() });
      if (!data.ok) {
        el.lbEmpty.textContent = data.message || '無法載入榜單';
        return;
      }
      renderLeaderboard(data.gradeMins, data.month);
    } catch (err) {
      el.lbEmpty.textContent = '載入失敗：' + (err.message || String(err));
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
      showFeedback('error', '哎呀！', '請選擇有效的班級（P1A–P6D）。');
      return;
    }
    if (!Number.isFinite(weight) || weight <= 0) {
      showFeedback('error', '哎呀！', '請輸入大於 0 的剩食重量（公斤）。');
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
        showFeedback(
          'error',
          data.error === 'duplicate' ? '已經登記過啦！' : '無法送出',
          data.message || '請稍後再試。'
        );
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
          className +
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
    el.todayDate.textContent = today;
    el.headerDate.textContent = today + '（香港）';

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
