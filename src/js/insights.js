// ============================================================
// INSIGHTS — Art of Intent
// Admin-only analytics for reverse prompt engineering analysis
// ============================================================

import {
  auth, db, googleProvider,
  signInWithPopup, onAuthStateChanged, signOut,
  collection, query, where, limit
} from './firebase-config.js';

import { getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import {
  generateProgressBar,
  generateTable
} from './ascii-charts.js';

// ─── Admin Config ─────────────────────────────────────────────────────────────
// Add your Firebase UID(s) here. Sign in once to see your UID in the auth gate.
const ADMIN_UIDS = Object.freeze([
  'bTjP4lh7HjMhRjyDO5itSVJgRPl1'
]);

// ─── State ────────────────────────────────────────────────────────────────────
let cachedSessions = null;
let cachedRange = null;        // "${start}|${end}"
let sortedSessions = [];
let currentSessionPage = 0;
const SESSION_PAGE_SIZE = 20;

// ─── DOM helpers ──────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

// ─── Auth ─────────────────────────────────────────────────────────────────────
onAuthStateChanged(auth, user => {
  if (!user) { showAuthGate(); return; }
  if (ADMIN_UIDS.length === 0) {
    showAuthGate(`Setup mode: add your UID to ADMIN_UIDS in src/js/insights.js\n\nYour UID: ${user.uid}`);
    signOut(auth);
    return;
  }
  if (!ADMIN_UIDS.includes(user.uid)) {
    showAuthGate(`Access denied.\nYour UID: ${user.uid}`);
    signOut(auth);
    return;
  }
  showDashboard(user);
});

function showAuthGate(message = '') {
  $('auth-gate').style.display = 'block';
  $('dashboard').style.display = 'none';
  if (message) $('auth-message').textContent = message;
}

let dashboardReady = false;

function showDashboard(user) {
  $('auth-gate').style.display = 'none';
  $('dashboard').style.display = 'block';
  $('admin-uid').textContent = user.uid.slice(0, 12) + '…';
  if (!dashboardReady) initDashboard();
  const { start, end } = getDateRange();
  loadForRange(start, end);
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
function todayISO() {
  return new Date().toLocaleDateString('en-CA');
}

function daysAgoISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString('en-CA');
}

function getDateRange() {
  return {
    start: $('date-start').value || daysAgoISO(6),
    end:   $('date-end').value   || todayISO()
  };
}

function setPreset(id, startISO, endISO) {
  $('date-start').value = startISO;
  $('date-end').value   = endISO;
  document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
  $(id).classList.add('active');
  loadForRange(startISO, endISO);
}

// ─── Data layer ───────────────────────────────────────────────────────────────
async function loadForRange(start, end) {
  if (start > end) {
    setAllPanelsError('Start date must be before end date.');
    return;
  }
  const rangeKey = `${start}|${end}`;
  if (cachedRange === rangeKey && cachedSessions !== null) {
    renderAll(cachedSessions);
    return;
  }
  setAllPanelsLoading();
  try {
    const snap = await getDocs(
      query(
        collection(db, 'sessions'),
        where('gameDate', '>=', start),
        where('gameDate', '<=', end),
        limit(1000)
      )
    );
    cachedSessions = snap.docs.map(d => d.data());
    cachedRange = rangeKey;
    renderAll(cachedSessions);
  } catch (err) {
    setAllPanelsError(err.message);
  }
}

function invalidateCache() {
  cachedSessions = null;
  cachedRange = null;
}

// Group sessions by gameDate, sorted newest first
function groupByDate(sessions) {
  const map = {};
  sessions.forEach(s => {
    const d = s.gameDate || 'unknown';
    if (!map[d]) map[d] = [];
    map[d].push(s);
  });
  return Object.entries(map).sort(([a], [b]) => b.localeCompare(a)); // newest first
}

const PANEL_IDS = ['snapshot', 'words', 'prompts', 'violations', 'attempts', 'efficiency', 'sessions'];

function setAllPanelsLoading() {
  PANEL_IDS.forEach(id => {
    const el = $(`panel-${id}-body`);
    if (el) el.innerHTML = '<span class="dim">[LOADING...]</span>';
  });
}

function setAllPanelsError(msg) {
  PANEL_IDS.forEach(id => {
    const el = $(`panel-${id}-body`);
    if (el) el.innerHTML = `<span class="err">[ERROR] ${msg}</span>`;
  });
}

// ─── Aggregation helpers ──────────────────────────────────────────────────────
const isWin = s => s.isWin ?? (s.result === 'victory');
const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
const median = arr => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const fmtNum = n => Number.isFinite(n) ? n.toLocaleString('en') : '—';
const fmtPct = (n, total) => total ? Math.round((n / total) * 100) + '%' : '—';

// ─── Panel: Period Snapshot ───────────────────────────────────────────────────
function renderSnapshot(sessions) {
  const el = $('panel-snapshot-body');
  if (!sessions.length) {
    el.innerHTML = '<span class="dim">No sessions in this date range.</span>';
    return;
  }

  const wins   = sessions.filter(isWin);
  const winRate = Math.round((wins.length / sessions.length) * 100);
  const winBar  = generateProgressBar(wins.length, sessions.length, 22);

  const winScores   = wins.map(s => s.efficiencyScore).filter(Number.isFinite);
  const winAttempts = wins.map(s => s.attempts).filter(Number.isFinite);
  const winTokens   = wins.map(s => s.totalTokens).filter(Number.isFinite);

  // Per-day breakdown table
  const byDate = groupByDate(sessions);
  const dayRows = byDate.map(([date, daySessions]) => {
    const dayWins = daySessions.filter(isWin);
    const dayScores = dayWins.map(s => s.efficiencyScore).filter(Number.isFinite);
    const words = (daySessions.find(s => s.targetWords?.length)?.targetWords || [])
      .map(w => w.toUpperCase()).join(' / ');
    return [
      date,
      String(daySessions.length),
      `${dayWins.length}/${daySessions.length} (${fmtPct(dayWins.length, daySessions.length)})`,
      dayScores.length ? fmtNum(Math.round(avg(dayScores))) : '—',
      words || '—'
    ];
  });

  const approxNote = sessions.length >= 1000
    ? '\n  ⚠  Capped at 1000 sessions — results may be approximate.' : '';

  el.innerHTML = `<pre class="chart">` +
`TOTAL SESSIONS: ${sessions.length}   WINS: ${wins.length}   LOSSES: ${sessions.length - wins.length}
OVERALL WIN RATE: ${winRate}%  [${winBar}]

AVG EFFICIENCY SCORE (winners): ${fmtNum(Math.round(avg(winScores)))}   MEDIAN: ${fmtNum(Math.round(median(winScores)))}
AVG ATTEMPTS (winners):         ${avg(winAttempts).toFixed(1)}
AVG TOTAL TOKENS (winners):     ${fmtNum(Math.round(avg(winTokens)))}

PER-DAY BREAKDOWN:
${generateTable(
  ['DATE', 'SESSIONS', 'WIN RATE', 'AVG SCORE', 'WORDS'],
  dayRows,
  { columnWidths: [12, 10, 18, 11, 30] }
)}${approxNote}</pre>`;
}

// ─── Panel: Word Difficulty ────────────────────────────────────────────────────
function renderWordDifficulty(sessions) {
  const el = $('panel-words-body');
  if (!sessions.length) { el.innerHTML = '<span class="dim">No data.</span>'; return; }

  const byDate = groupByDate(sessions);
  let output = '';

  byDate.forEach(([date, daySessions]) => {
    const sample = daySessions.find(s => s.targetWords?.length);
    if (!sample) return;
    const targetWords = sample.targetWords;

    const rows = targetWords.map(word => {
      const lw = word.toLowerCase();
      let found = 0, totalAttemptNum = 0, totalTokensToFind = 0;

      daySessions.forEach(s => {
        const atts = s.attemptsData || [];
        let tokensAccum = 0;
        for (let i = 0; i < atts.length; i++) {
          const att = atts[i];
          tokensAccum += att.totalTokens || 0;
          const foundHere = (att.foundWords || []).some(fw => fw.toLowerCase() === lw);
          if (foundHere) {
            found++;
            totalAttemptNum += i + 1;
            totalTokensToFind += tokensAccum;
            break;
          }
        }
      });

      const bar = generateProgressBar(found, daySessions.length, 10);
      return [
        word.toUpperCase(),
        `${found}/${daySessions.length}`,
        `${fmtPct(found, daySessions.length)} [${bar}]`,
        found ? (totalAttemptNum / found).toFixed(1) : '—',
        found ? fmtNum(Math.round(totalTokensToFind / found)) : '—'
      ];
    });

    output += `${date}  (${daySessions.length} sessions)\n`;
    output += generateTable(
      ['WORD', 'FOUND', 'RATE', 'AVG ATT#', 'TOKENS'],
      rows,
      { columnWidths: [12, 10, 16, 10, 10] }
    ) + '\n';
  });

  el.innerHTML = `<pre class="chart">${output}</pre>`;
}

// ─── Panel: Prompt Patterns ────────────────────────────────────────────────────
function renderPromptStrategy(sessions) {
  const el = $('panel-prompts-body');
  if (!sessions.length) { el.innerHTML = '<span class="dim">No data.</span>'; return; }

  const wins   = sessions.filter(isWin);
  const losses = sessions.filter(s => !isWin(s));

  const avgPromptLen = group => {
    const lens = group.flatMap(s => (s.attemptsData || []).map(a => (a.prompt || '').length));
    return lens.length ? Math.round(avg(lens)) : 0;
  };
  const avgTokPerAtt = group => {
    const toks = group.flatMap(s => (s.attemptsData || []).map(a => a.totalTokens || 0));
    return toks.length ? avg(toks).toFixed(1) : '—';
  };

  const winLen  = avgPromptLen(wins);
  const lossLen = avgPromptLen(losses);
  const maxLen  = Math.max(winLen, lossLen, 1);

  // Sessions where attempt #1 found at least one word
  const firstHits = sessions.filter(s => {
    const att0 = (s.attemptsData || [])[0];
    return att0 && (att0.foundWords || []).length > 0;
  });

  const samples = firstHits.slice(0, 4).map(s => {
    const att    = s.attemptsData[0];
    const prompt = (att.prompt || '').replace(/\n/g, ' ').slice(0, 55);
    const words  = (att.foundWords || []).join(', ');
    return `  [${s.gameDate}] "${prompt}${(att.prompt || '').length > 55 ? '…' : ''}"\n  → found: ${words}`;
  }).join('\n\n');

  el.innerHTML = `<pre class="chart">` +
`AVG PROMPT LENGTH (chars):
  Winners: ${winLen.toString().padStart(4)} [${generateProgressBar(winLen, maxLen, 18)}]
  Losers:  ${lossLen.toString().padStart(4)} [${generateProgressBar(lossLen, maxLen, 18)}]

AVG TOKENS/ATTEMPT:
  Winners: ${avgTokPerAtt(wins).toString().padStart(6)}
  Losers:  ${avgTokPerAtt(losses).toString().padStart(6)}

FIRST-ATTEMPT WORD FINDS: ${firstHits.length}/${sessions.length} sessions (${fmtPct(firstHits.length, sessions.length)})
${samples || '  (none in this period)'}
</pre>`;
}

// ─── Panel: Violation Patterns ─────────────────────────────────────────────────
function renderViolations(sessions) {
  const el = $('panel-violations-body');
  if (!sessions.length) { el.innerHTML = '<span class="dim">No data.</span>'; return; }

  const withViol    = sessions.filter(s => (s.attemptsData || []).some(a => a.isViolation));
  const lostToCreep = sessions.filter(s => !isWin(s) && (s.attemptsData || []).some(a => a.isViolation));

  // Violations by attempt number (1-indexed), capped at 10
  const violByAtt = {};
  sessions.forEach(s => {
    (s.attemptsData || []).forEach((a, i) => {
      if (a.isViolation) {
        const n = Math.min(i + 1, 10);
        violByAtt[n] = (violByAtt[n] || 0) + 1;
      }
    });
  });

  const maxViol = Math.max(1, ...Object.values(violByAtt));
  const histRows = Array.from({ length: 10 }, (_, i) => {
    const n     = i + 1;
    const count = violByAtt[n] || 0;
    return `  ATT ${n.toString().padStart(2)}: [${generateProgressBar(count, maxViol, 14)}] ${count}`;
  }).join('\n');

  const wins   = sessions.filter(isWin);
  const losses = sessions.filter(s => !isWin(s));
  const avgCreepWin  = Math.round(avg(wins.map(s => s.creepLevel || 0).filter(Number.isFinite)));
  const avgCreepLoss = Math.round(avg(losses.map(s => s.creepLevel || 0).filter(Number.isFinite)));

  el.innerHTML = `<pre class="chart">` +
`SESSIONS WITH VIOLATIONS: ${withViol.length}/${sessions.length} (${fmtPct(withViol.length, sessions.length)})
SESSIONS LOST TO CREEP:   ${lostToCreep.length}/${sessions.length} (${fmtPct(lostToCreep.length, sessions.length)})

VIOLATIONS BY ATTEMPT:
${histRows}

AVG CREEP AT GAME END:
  Winners: ${avgCreepWin}
  Losers:  ${avgCreepLoss}
</pre>`;
}

// ─── Panel: Attempt Distribution ───────────────────────────────────────────────
function renderAttemptDistribution(sessions) {
  const el = $('panel-attempts-body');
  const wins = sessions.filter(isWin);
  if (!wins.length) { el.innerHTML = '<span class="dim">No winning sessions.</span>'; return; }

  const dist = {};
  wins.forEach(s => {
    const n = Math.min(Math.max(s.attempts || 0, 1), 10);
    dist[n] = (dist[n] || 0) + 1;
  });

  const maxCount = Math.max(1, ...Object.values(dist));
  const rows = Array.from({ length: 10 }, (_, i) => {
    const n     = i + 1;
    const count = dist[n] || 0;
    return [String(n), count || '—', generateProgressBar(count, maxCount, 16), count ? fmtPct(count, wins.length) : ''];
  });

  el.innerHTML = `<pre class="chart">${generateTable(
    ['ATTEMPTS', 'COUNT', 'BAR', 'PCT'],
    rows,
    { columnWidths: [10, 8, 20, 8] }
  )}</pre>`;
}

// ─── Panel: Token Efficiency Distribution ──────────────────────────────────────
function renderEfficiencyDistribution(sessions) {
  const el    = $('panel-efficiency-body');
  const wins  = sessions.filter(isWin);
  const scores = wins.map(s => s.efficiencyScore).filter(Number.isFinite);
  if (!scores.length) { el.innerHTML = '<span class="dim">No winning sessions.</span>'; return; }

  const buckets = [
    { label: '< 500',     min: 0,    max: 500   },
    { label: '500–1000',  min: 500,  max: 1000  },
    { label: '1000–1500', min: 1000, max: 1500  },
    { label: '1500–2000', min: 1500, max: 2000  },
    { label: '2000–3000', min: 2000, max: 3000  },
    { label: '3000+',     min: 3000, max: Infinity },
  ];

  const counts   = buckets.map(b => scores.filter(s => s >= b.min && s < b.max).length);
  const maxCount = Math.max(1, ...counts);
  const rows = buckets.map((b, i) => [
    b.label,
    counts[i] || '—',
    generateProgressBar(counts[i], maxCount, 20),
    counts[i] ? fmtPct(counts[i], scores.length) : ''
  ]);

  el.innerHTML = `<pre class="chart">` +
`WINNERS: ${scores.length}   BEST: ${fmtNum(Math.min(...scores))}   WORST: ${fmtNum(Math.max(...scores))}
AVG: ${fmtNum(Math.round(avg(scores)))}   MEDIAN: ${fmtNum(Math.round(median(scores)))}

${generateTable(
  ['SCORE RANGE', 'COUNT', 'DISTRIBUTION', 'PCT'],
  rows,
  { columnWidths: [13, 8, 24, 8] }
)}</pre>`;
}

// ─── Panel: Session Browser ────────────────────────────────────────────────────
function renderSessionBrowser(sessions, page) {
  const el = $('panel-sessions-body');
  if (!sessions.length) { el.innerHTML = '<span class="dim">No sessions.</span>'; return; }

  sortedSessions = [...sessions].sort((a, b) => {
    // Sort by date desc, then by createdAt desc within same date
    const dateCmp = (b.gameDate || '').localeCompare(a.gameDate || '');
    if (dateCmp !== 0) return dateCmp;
    return (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0);
  });

  currentSessionPage = page;
  const start      = page * SESSION_PAGE_SIZE;
  const pageItems  = sortedSessions.slice(start, start + SESSION_PAGE_SIZE);
  const totalPages = Math.ceil(sortedSessions.length / SESSION_PAGE_SIZE);

  let html = `<div class="sessions-nav">
    <span class="dim">Showing ${start + 1}–${Math.min(start + SESSION_PAGE_SIZE, sortedSessions.length)} of ${sortedSessions.length}</span>
    <span>
      ${page > 0 ? `<button id="btn-sess-prev">◄ PREV</button>` : ''}
      <span class="dim">Page ${page + 1}/${totalPages}</span>
      ${start + SESSION_PAGE_SIZE < sortedSessions.length ? `<button id="btn-sess-next">NEXT ►</button>` : ''}
    </span>
  </div>
  <table class="sessions-table">
    <thead>
      <tr>
        <th>#</th><th>DATE</th><th>USER</th><th>RESULT</th>
        <th>ATT</th><th>TOKENS</th><th>SCORE</th><th>WORDS FOUND</th><th></th>
      </tr>
    </thead>
    <tbody>`;

  pageItems.forEach((s, i) => {
    const globalIdx = start + i;
    const win       = isWin(s);
    const matched   = (s.matchedWords || []).join(', ') || '—';
    html += `
      <tr class="sess-row">
        <td class="dim">${globalIdx + 1}</td>
        <td class="dim">${s.gameDate || '—'}</td>
        <td>${(s.displayName || s.userName || 'anon').slice(0, 14)}</td>
        <td class="${win ? 'win' : 'loss'}">${win ? 'WIN' : 'LOSS'}</td>
        <td>${s.attempts ?? '—'}</td>
        <td>${fmtNum(s.totalTokens)}</td>
        <td>${fmtNum(s.efficiencyScore)}</td>
        <td class="dim">${matched}</td>
        <td><button class="btn-expand" data-idx="${globalIdx}">+</button></td>
      </tr>
      <tr class="sess-detail hidden" id="sess-detail-${globalIdx}">
        <td colspan="9"><div class="sess-detail-inner"></div></td>
      </tr>`;
  });

  html += `</tbody></table>`;
  el.innerHTML = html;

  $('btn-sess-prev')?.addEventListener('click', () => renderSessionBrowser(sessions, page - 1));
  $('btn-sess-next')?.addEventListener('click', () => renderSessionBrowser(sessions, page + 1));

  el.querySelectorAll('.btn-expand').forEach(btn => {
    btn.addEventListener('click', () => toggleSessionDetail(parseInt(btn.dataset.idx), btn));
  });
}

function toggleSessionDetail(idx, btn) {
  const row = $(`sess-detail-${idx}`);
  if (!row) return;

  if (!row.classList.contains('hidden')) {
    row.classList.add('hidden');
    btn.textContent = '+';
    return;
  }

  const s    = sortedSessions[idx];
  const atts = s.attemptsData || [];
  let inner  = `<pre class="att-trail">SESSION  ${s.sessionId || '—'}\nUSER     ${s.userId || '—'}  (${s.displayName || 'anon'})\nDATE     ${s.gameDate || '—'}  STATUS: ${s.result || '—'}\n\n`;

  if (!atts.length) {
    inner += '  (no attempt data stored)\n';
  } else {
    atts.forEach(att => {
      const prompt   = (att.prompt   || '').replace(/\n/g, ' ').slice(0, 70);
      const response = (att.response || '').replace(/\n/g, ' / ').slice(0, 90);
      const found    = (att.foundWords || []).join(', ');
      const foundStr = found ? ` <span class="found">[✓ ${found}]</span>` : '';
      const violStr  = att.isViolation ? ` <span class="viol">[VIOLATION]</span>` : '';
      inner += `<b>ATT ${String(att.attemptNumber || '?').padStart(2)}</b>  prompt:${att.promptTokens ?? '?'}tok  output:${att.outputTokens ?? '?'}tok\n`;
      inner += `  PROMPT:   "${prompt}${(att.prompt || '').length > 70 ? '…' : ''}"\n`;
      inner += `  RESPONSE: "${response}${(att.response || '').length > 90 ? '…' : ''}"${foundStr}${violStr}\n\n`;
    });
  }
  inner += '</pre>';
  row.querySelector('.sess-detail-inner').innerHTML = inner;
  row.classList.remove('hidden');
  btn.textContent = '−';
}

// ─── Render all panels ─────────────────────────────────────────────────────────
function renderAll(sessions) {
  renderSnapshot(sessions);
  renderWordDifficulty(sessions);
  renderPromptStrategy(sessions);
  renderViolations(sessions);
  renderAttemptDistribution(sessions);
  renderEfficiencyDistribution(sessions);
  renderSessionBrowser(sessions, 0);
}

// ─── Init ──────────────────────────────────────────────────────────────────────
// Auth gate button — always in DOM, safe to wire immediately
$('btn-google-signin').addEventListener('click', () => {
  signInWithPopup(auth, googleProvider).catch(err => {
    $('auth-message').textContent = 'Sign-in failed: ' + err.message;
  });
});

// Dashboard controls — only wired once the dashboard is visible
function initDashboard() {
  dashboardReady = true;

  // Default: last 7 days
  $('date-start').value = daysAgoISO(6);
  $('date-end').value   = todayISO();
  $('btn-preset-7d').classList.add('active');

  $('date-start').addEventListener('change', () => {
    document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
    const { start, end } = getDateRange();
    loadForRange(start, end);
  });
  $('date-end').addEventListener('change', () => {
    document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
    const { start, end } = getDateRange();
    loadForRange(start, end);
  });

  $('btn-preset-today').addEventListener('click', () => setPreset('btn-preset-today', todayISO(), todayISO()));
  $('btn-preset-7d').addEventListener('click',    () => setPreset('btn-preset-7d', daysAgoISO(6), todayISO()));
  $('btn-preset-30d').addEventListener('click',   () => setPreset('btn-preset-30d', daysAgoISO(29), todayISO()));

  $('btn-reload').addEventListener('click', () => {
    invalidateCache();
    const { start, end } = getDateRange();
    loadForRange(start, end);
  });
}
