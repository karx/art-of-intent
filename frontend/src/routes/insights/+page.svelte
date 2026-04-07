<script lang="ts">
	import { authState, signInGoogle } from '$lib/stores/auth.svelte';
	import { db } from '$lib/firebase';
	import { collection, query, where, limit, getDocs } from 'firebase/firestore';

	const ADMIN_UIDS = ['bTjP4lh7HjMhRjyDO5itSVJgRPl1'];

	// ── State ──────────────────────────────────────────────────────────────────
	let sessions     = $state<any[]>([]);
	let loading      = $state(false);
	let loadError    = $state('');
	let cachedRange  = $state('');
	let cachedData   = $state<any[] | null>(null);

	let dateStart    = $state('');
	let dateEnd      = $state('');
	let activePreset = $state<string | null>('7d');

	// Session browser
	const SESSION_PAGE_SIZE = 20;
	let sessionPage  = $state(0);
	let expanded     = $state(new Set<number>());
	let sortedSess   = $state<any[]>([]);

	// ── Admin check ────────────────────────────────────────────────────────────
	const isAdmin = $derived(
		authState.ready && !!authState.user && ADMIN_UIDS.includes(authState.user.uid)
	);

	const authMessage = $derived(
		!authState.ready ? '' :
		!authState.user  ? '' :
		!isAdmin         ? `Access denied.\nYour UID: ${authState.user.uid}` :
		''
	);

	// ── Date helpers ───────────────────────────────────────────────────────────
	function todayISO() {
		return new Date().toLocaleDateString('en-CA');
	}
	function daysAgoISO(n: number) {
		const d = new Date();
		d.setDate(d.getDate() - n);
		return d.toLocaleDateString('en-CA');
	}

	// ── Data loading ───────────────────────────────────────────────────────────
	async function loadForRange(start: string, end: string) {
		if (start > end) { loadError = 'Start date must be before end date.'; return; }
		const key = `${start}|${end}`;
		if (key === cachedRange && cachedData !== null) {
			sessions = cachedData;
			sortedSess = sortSessions(cachedData);
			sessionPage = 0;
			return;
		}
		loading = true; loadError = '';
		try {
			const snap = await getDocs(query(
				collection(db, 'sessions'),
				where('gameDate', '>=', start),
				where('gameDate', '<=', end),
				limit(1000)
			));
			const data = snap.docs.map(d => d.data());
			cachedData = data; cachedRange = key;
			sessions = data;
			sortedSess = sortSessions(data);
			sessionPage = 0;
		} catch (e: any) {
			loadError = e.message ?? 'Failed to load.';
		} finally {
			loading = false;
		}
	}

	function sortSessions(data: any[]) {
		return [...data].sort((a, b) => {
			const dc = (b.gameDate || '').localeCompare(a.gameDate || '');
			return dc !== 0 ? dc : (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0);
		});
	}

	function setPreset(preset: string, start: string, end: string) {
		activePreset = preset;
		dateStart = start; dateEnd = end;
		loadForRange(start, end);
	}

	function reload() {
		cachedData = null; cachedRange = '';
		loadForRange(dateStart, dateEnd);
	}

	function onDateChange() {
		activePreset = null;
		loadForRange(dateStart, dateEnd);
	}

	// ── Chart helpers ──────────────────────────────────────────────────────────
	function bar(value: number, max: number, width = 10): string {
		const filled = Math.round(Math.min(100, Math.max(0, (value / Math.max(1, max)) * 100)) / 100 * width);
		return '█'.repeat(filled) + '░'.repeat(width - filled);
	}

	function table(headers: string[], rows: (string | number)[][], opts: { columnWidths?: number[] } = {}): string {
		const widths = opts.columnWidths || headers.map((h, i) =>
			Math.max(h.length, ...rows.map(r => String(r[i] ?? '').length)) + 2
		);
		const hr = (l: string, m: string, r: string, f: string) =>
			l + widths.map(w => f.repeat(w)).join(m) + r + '\n';
		const rowFn = (cells: (string | number)[]) =>
			'║' + cells.map((c, i) => String(c ?? '').padEnd(widths[i])).join('║') + '║\n';
		return hr('╔','╦','╗','═') + rowFn(headers) + hr('╠','╬','╣','═')
			+ rows.map(rowFn).join('') + hr('╚','╩','╝','═');
	}

	// ── Aggregation helpers ────────────────────────────────────────────────────
	const isWin = (s: any) => s.isWin ?? s.result === 'victory';
	const avg   = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
	const median = (arr: number[]) => {
		if (!arr.length) return 0;
		const s = [...arr].sort((a, b) => a - b), m = Math.floor(s.length / 2);
		return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
	};
	const num  = (n: any) => Number.isFinite(n) ? Number(n).toLocaleString('en') : '—';
	const pct  = (n: number, t: number) => t ? Math.round((n / t) * 100) + '%' : '—';
	const esc  = (s: string) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

	function groupByDate(data: any[]) {
		const map: Record<string, any[]> = {};
		data.forEach(s => { const d = s.gameDate || 'unknown'; (map[d] ??= []).push(s); });
		return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
	}

	// ── Panels ────────────────────────────────────────────────────────────────
	function panelSnapshot(data: any[]): string {
		if (!data.length) return '<span class="dim">No sessions in this date range.</span>';
		const wins = data.filter(isWin);
		const winScores = wins.map(s => s.efficiencyScore).filter(Number.isFinite);
		const winAtts   = wins.map(s => s.attempts).filter(Number.isFinite);
		const winToks   = wins.map(s => s.totalTokens).filter(Number.isFinite);
		const byDate = groupByDate(data);
		const dayRows = byDate.map(([date, ds]) => {
			const dw = ds.filter(isWin);
			const scores = dw.map(s => s.efficiencyScore).filter(Number.isFinite);
			const words = (ds.find(s => s.targetWords?.length)?.targetWords || [])
				.map((w: string) => w.toUpperCase()).join(' / ');
			return [date, String(ds.length), `${dw.length}/${ds.length} (${pct(dw.length, ds.length)})`,
				scores.length ? num(Math.round(avg(scores))) : '—', words || '—'];
		});
		const note = data.length >= 1000 ? '\n  ⚠  Capped at 1000 sessions — results may be approximate.' : '';
		return `<pre class="chart">TOTAL SESSIONS: ${data.length}   WINS: ${wins.length}   LOSSES: ${data.length - wins.length}
OVERALL WIN RATE: ${Math.round(wins.length / data.length * 100)}%  [${bar(wins.length, data.length, 22)}]

AVG EFFICIENCY SCORE (winners): ${num(Math.round(avg(winScores)))}   MEDIAN: ${num(Math.round(median(winScores)))}
AVG ATTEMPTS (winners):         ${avg(winAtts).toFixed(1)}
AVG TOTAL TOKENS (winners):     ${num(Math.round(avg(winToks)))}

PER-DAY BREAKDOWN:
${table(['DATE','SESSIONS','WIN RATE','AVG SCORE','WORDS'], dayRows, { columnWidths: [12,10,18,11,30] })}${note}</pre>`;
	}

	function panelWords(data: any[]): string {
		if (!data.length) return '<span class="dim">No data.</span>';
		let out = '';
		groupByDate(data).forEach(([date, ds]) => {
			const sample = ds.find(s => s.targetWords?.length);
			if (!sample) return;
			const rows = sample.targetWords.map((word: string) => {
				const lw = word.toLowerCase();
				let found = 0, totalAtt = 0, totalTok = 0;
				ds.forEach(s => {
					const atts = s.attemptsData || [];
					let tokAcc = 0;
					for (let i = 0; i < atts.length; i++) {
						tokAcc += atts[i].totalTokens || 0;
						if ((atts[i].foundWords || []).some((fw: string) => fw.toLowerCase() === lw)) {
							found++; totalAtt += i + 1; totalTok += tokAcc; break;
						}
					}
				});
				return [word.toUpperCase(), `${found}/${ds.length}`,
					`${pct(found, ds.length)} [${bar(found, ds.length, 10)}]`,
					found ? (totalAtt / found).toFixed(1) : '—',
					found ? num(Math.round(totalTok / found)) : '—'];
			});
			out += `${date}  (${ds.length} sessions)\n${table(['WORD','FOUND','RATE','AVG ATT#','TOKENS'], rows, { columnWidths: [12,10,16,10,10] })}\n`;
		});
		return `<pre class="chart">${out}</pre>`;
	}

	function panelPrompts(data: any[]): string {
		if (!data.length) return '<span class="dim">No data.</span>';
		const wins   = data.filter(isWin);
		const losses = data.filter(s => !isWin(s));
		const avgLen = (g: any[]) => {
			const ls = g.flatMap(s => (s.attemptsData || []).map((a: any) => (a.prompt || '').length));
			return ls.length ? Math.round(avg(ls)) : 0;
		};
		const avgTok = (g: any[]) => {
			const ts = g.flatMap(s => (s.attemptsData || []).map((a: any) => a.totalTokens || 0));
			return ts.length ? avg(ts).toFixed(1) : '—';
		};
		const wl = avgLen(wins), ll = avgLen(losses), ml = Math.max(wl, ll, 1);
		const firstHits = data.filter(s => ((s.attemptsData || [])[0]?.foundWords || []).length > 0);
		const samples = firstHits.slice(0, 4).map(s => {
			const att = s.attemptsData[0];
			const p = esc((att.prompt || '').replace(/\n/g, ' ').slice(0, 55));
			return `  [${esc(s.gameDate)}] "${p}${(att.prompt || '').length > 55 ? '…' : ''}"\n  → found: ${esc((att.foundWords || []).join(', '))}`;
		}).join('\n\n');
		return `<pre class="chart">AVG PROMPT LENGTH (chars):
  Winners: ${String(wl).padStart(4)} [${bar(wl, ml, 18)}]
  Losers:  ${String(ll).padStart(4)} [${bar(ll, ml, 18)}]

AVG TOKENS/ATTEMPT:
  Winners: ${String(avgTok(wins)).padStart(6)}
  Losers:  ${String(avgTok(losses)).padStart(6)}

FIRST-ATTEMPT WORD FINDS: ${firstHits.length}/${data.length} sessions (${pct(firstHits.length, data.length)})
${samples || '  (none in this period)'}
</pre>`;
	}

	function panelViolations(data: any[]): string {
		if (!data.length) return '<span class="dim">No data.</span>';
		const withViol    = data.filter(s => (s.attemptsData || []).some((a: any) => a.isViolation));
		const lostToCreep = data.filter(s => !isWin(s) && (s.attemptsData || []).some((a: any) => a.isViolation));
		const violByAtt: Record<number, number> = {};
		data.forEach(s => (s.attemptsData || []).forEach((a: any, i: number) => {
			if (a.isViolation) { const n = Math.min(i + 1, 10); violByAtt[n] = (violByAtt[n] || 0) + 1; }
		}));
		const maxV = Math.max(1, ...Object.values(violByAtt));
		const hist = Array.from({ length: 10 }, (_, i) => {
			const n = i + 1, c = violByAtt[n] || 0;
			return `  ATT ${String(n).padStart(2)}: [${bar(c, maxV, 14)}] ${c}`;
		}).join('\n');
		const wins  = data.filter(isWin), losses = data.filter(s => !isWin(s));
		const acw = Math.round(avg(wins.map(s => s.creepLevel || 0).filter(Number.isFinite)));
		const acl = Math.round(avg(losses.map(s => s.creepLevel || 0).filter(Number.isFinite)));
		return `<pre class="chart">SESSIONS WITH VIOLATIONS: ${withViol.length}/${data.length} (${pct(withViol.length, data.length)})
SESSIONS LOST TO CREEP:   ${lostToCreep.length}/${data.length} (${pct(lostToCreep.length, data.length)})

VIOLATIONS BY ATTEMPT:
${hist}

AVG CREEP AT GAME END:
  Winners: ${acw}
  Losers:  ${acl}
</pre>`;
	}

	function panelAttempts(data: any[]): string {
		const wins = data.filter(isWin);
		if (!wins.length) return '<span class="dim">No winning sessions.</span>';
		const dist: Record<number, number> = {};
		wins.forEach(s => { const n = Math.min(Math.max(s.attempts || 0, 1), 10); dist[n] = (dist[n] || 0) + 1; });
		const maxC = Math.max(1, ...Object.values(dist));
		const rows = Array.from({ length: 10 }, (_, i) => {
			const n = i + 1, c = dist[n] || 0;
			return [String(n), c || '—', bar(c, maxC, 16), c ? pct(c, wins.length) : ''];
		});
		return `<pre class="chart">${table(['ATTEMPTS','COUNT','BAR','PCT'], rows, { columnWidths: [10,8,20,8] })}</pre>`;
	}

	function panelEfficiency(data: any[]): string {
		const wins   = data.filter(isWin);
		const scores = wins.map(s => s.efficiencyScore).filter(Number.isFinite);
		if (!scores.length) return '<span class="dim">No winning sessions.</span>';
		const buckets = [
			{ label: '< 500',     min: 0,    max: 500   },
			{ label: '500–1000',  min: 500,  max: 1000  },
			{ label: '1000–1500', min: 1000, max: 1500  },
			{ label: '1500–2000', min: 1500, max: 2000  },
			{ label: '2000–3000', min: 2000, max: 3000  },
			{ label: '3000+',     min: 3000, max: Infinity },
		];
		const counts = buckets.map(b => scores.filter(s => s >= b.min && s < b.max).length);
		const maxC   = Math.max(1, ...counts);
		const rows   = buckets.map((b, i) => [b.label, counts[i] || '—', bar(counts[i], maxC, 20), counts[i] ? pct(counts[i], scores.length) : '']);
		return `<pre class="chart">WINNERS: ${scores.length}   BEST: ${num(Math.min(...scores))}   WORST: ${num(Math.max(...scores))}
AVG: ${num(Math.round(avg(scores)))}   MEDIAN: ${num(Math.round(median(scores)))}

${table(['SCORE RANGE','COUNT','DISTRIBUTION','PCT'], rows, { columnWidths: [13,8,24,8] })}</pre>`;
	}

	// ── Derived panel HTML ─────────────────────────────────────────────────────
	const LOADING = '<span class="dim">[LOADING...]</span>';
	const errHtml = (msg: string) => `<span class="err">[ERROR] ${esc(msg)}</span>`;

	const pSnapshot   = $derived(loading ? LOADING : loadError ? errHtml(loadError) : panelSnapshot(sessions));
	const pWords      = $derived(loading ? LOADING : loadError ? errHtml(loadError) : panelWords(sessions));
	const pPrompts    = $derived(loading ? LOADING : loadError ? errHtml(loadError) : panelPrompts(sessions));
	const pViolations = $derived(loading ? LOADING : loadError ? errHtml(loadError) : panelViolations(sessions));
	const pAttempts   = $derived(loading ? LOADING : loadError ? errHtml(loadError) : panelAttempts(sessions));
	const pEfficiency = $derived(loading ? LOADING : loadError ? errHtml(loadError) : panelEfficiency(sessions));

	// ── Session browser ────────────────────────────────────────────────────────
	const totalPages = $derived(Math.ceil(sortedSess.length / SESSION_PAGE_SIZE));
	const pageItems  = $derived(sortedSess.slice(sessionPage * SESSION_PAGE_SIZE, (sessionPage + 1) * SESSION_PAGE_SIZE));
	const pageStart  = $derived(sessionPage * SESSION_PAGE_SIZE);

	function toggleExpand(globalIdx: number) {
		const next = new Set(expanded);
		if (next.has(globalIdx)) next.delete(globalIdx); else next.add(globalIdx);
		expanded = next;
	}

	function sessionDetailHtml(s: any): string {
		const atts = s.attemptsData || [];
		let out = `SESSION  ${esc(s.sessionId || '—')}\nUSER     ${esc(s.userId || '—')}  (${esc(s.displayName || 'anon')})\nDATE     ${esc(s.gameDate || '—')}  STATUS: ${esc(s.result || '—')}\n\n`;
		if (!atts.length) {
			out += '  (no attempt data stored)\n';
		} else {
			atts.forEach((att: any) => {
				const p = esc((att.prompt   || '').replace(/\n/g, ' ').slice(0, 70));
				const r = esc((att.response || '').replace(/\n/g, ' / ').slice(0, 90));
				const found = (att.foundWords || []).map(esc).join(', ');
				const foundStr = found ? ` <span class="found">[✓ ${found}]</span>` : '';
				const violStr  = att.isViolation ? ` <span class="viol">[VIOLATION]</span>` : '';
				out += `<b>ATT ${String(att.attemptNumber || '?').padStart(2, ' ')}</b>  prompt:${att.promptTokens ?? '?'}tok  output:${att.outputTokens ?? '?'}tok\n`;
				out += `  PROMPT:   "${p}${(att.prompt || '').length > 70 ? '…' : ''}"\n`;
				out += `  RESPONSE: "${r}${(att.response || '').length > 90 ? '…' : ''}"${foundStr}${violStr}\n\n`;
			});
		}
		return out;
	}

	// ── Trigger load on admin auth ─────────────────────────────────────────────
	let didInit = false;
	$effect(() => {
		if (isAdmin && !didInit) {
			didInit = true;
			dateStart = daysAgoISO(6);
			dateEnd   = todayISO();
			loadForRange(dateStart, dateEnd);
		}
	});
</script>

<svelte:head>
	<title>Insights · Art of Intent</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<!-- ── Auth Gate ─────────────────────────────────────────────────────────── -->
{#if !isAdmin}
	<div class="auth-gate">
		<h1>INSIGHTS</h1>
		{#if authMessage}
			<p class="auth-message">{authMessage}</p>
		{/if}
		{#if !authState.user}
			<button class="btn-signin" onclick={signInGoogle}>[ Sign in with Google ]</button>
		{/if}
		<p class="auth-note">Admin access only. Not linked from the main game.</p>
	</div>

<!-- ── Dashboard ─────────────────────────────────────────────────────────── -->
{:else}
	<div class="dashboard">

		<!-- Header + controls -->
		<div class="dash-header">
			<h1>INSIGHTS // ART OF INTENT</h1>
			<span class="header-meta">UID: {authState.user!.uid.slice(0, 12)}…</span>
			<div class="date-controls">
				<label>FROM:
					<input type="date" bind:value={dateStart} onchange={onDateChange} />
				</label>
				<label>TO:
					<input type="date" bind:value={dateEnd} onchange={onDateChange} />
				</label>
				<button class="btn-preset" class:active={activePreset === 'today'} onclick={() => setPreset('today', todayISO(), todayISO())}>TODAY</button>
				<button class="btn-preset" class:active={activePreset === '7d'}    onclick={() => setPreset('7d', daysAgoISO(6), todayISO())}>7 DAYS</button>
				<button class="btn-preset" class:active={activePreset === '30d'}   onclick={() => setPreset('30d', daysAgoISO(29), todayISO())}>30 DAYS</button>
				<button class="btn-reload" onclick={reload}>↻ RELOAD</button>
			</div>
		</div>

		<!-- Panel: Daily Snapshot -->
		<div class="panel">
			<div class="panel-header">Daily Snapshot</div>
			<div class="panel-body">{@html pSnapshot}</div>
		</div>

		<!-- Panels: Word Difficulty + Prompt Patterns (2-col) -->
		<div class="panels-half">
			<div class="panel">
				<div class="panel-header">Word Difficulty</div>
				<div class="panel-body">{@html pWords}</div>
			</div>
			<div class="panel">
				<div class="panel-header">Prompt Patterns</div>
				<div class="panel-body">{@html pPrompts}</div>
			</div>
		</div>

		<!-- Panels: Violations + Attempt Distribution (2-col) -->
		<div class="panels-half">
			<div class="panel">
				<div class="panel-header">Violation Patterns</div>
				<div class="panel-body">{@html pViolations}</div>
			</div>
			<div class="panel">
				<div class="panel-header">Attempt Distribution</div>
				<div class="panel-body">{@html pAttempts}</div>
			</div>
		</div>

		<!-- Panel: Token Efficiency -->
		<div class="panel">
			<div class="panel-header">Token Efficiency Distribution</div>
			<div class="panel-body">{@html pEfficiency}</div>
		</div>

		<!-- Panel: Session Browser -->
		<div class="panel">
			<div class="panel-header">Session Browser</div>
			<div class="panel-body">
				{#if !sessions.length && !loading}
					<span class="dim">No sessions.</span>
				{:else if loading}
					<span class="dim">[LOADING...]</span>
				{:else}
					<div class="sessions-nav">
						<span class="dim">
							Showing {pageStart + 1}–{Math.min(pageStart + SESSION_PAGE_SIZE, sortedSess.length)} of {sortedSess.length}
						</span>
						<span>
							{#if sessionPage > 0}
								<button onclick={() => sessionPage--}>◄ PREV</button>
							{/if}
							<span class="dim">Page {sessionPage + 1}/{totalPages}</span>
							{#if pageStart + SESSION_PAGE_SIZE < sortedSess.length}
								<button onclick={() => sessionPage++}>NEXT ►</button>
							{/if}
						</span>
					</div>
					<table class="sessions-table">
						<thead>
							<tr>
								<th>#</th><th>DATE</th><th>USER</th><th>RESULT</th>
								<th>ATT</th><th>TOKENS</th><th>SCORE</th><th>WORDS FOUND</th><th></th>
							</tr>
						</thead>
						<tbody>
							{#each pageItems as s, i}
								{@const globalIdx = pageStart + i}
								{@const win = isWin(s)}
								{@const matched = (s.matchedWords || []).join(', ') || '—'}
								<tr class="sess-row">
									<td class="dim">{globalIdx + 1}</td>
									<td class="dim">{s.gameDate || '—'}</td>
									<td>{(s.displayName || s.userName || 'anon').slice(0, 14)}</td>
									<td class:win class:loss={!win}>{win ? 'WIN' : 'LOSS'}</td>
									<td>{s.attempts ?? '—'}</td>
									<td>{num(s.totalTokens)}</td>
									<td>{num(s.efficiencyScore)}</td>
									<td class="dim">{matched}</td>
									<td>
										<button class="btn-expand" onclick={() => toggleExpand(globalIdx)}>
											{expanded.has(globalIdx) ? '−' : '+'}
										</button>
									</td>
								</tr>
								{#if expanded.has(globalIdx)}
									<tr class="sess-detail">
										<td colspan="9">
											<pre class="att-trail">{@html sessionDetailHtml(s)}</pre>
										</td>
									</tr>
								{/if}
							{/each}
						</tbody>
					</table>
				{/if}
			</div>
		</div>

	</div>
{/if}

<style>
	/* ── Auth gate ── */
	.auth-gate {
		max-width: 420px;
		margin: 80px auto;
		border: 2px solid var(--border-color);
		background: var(--bg-secondary);
		padding: var(--spacing-xl);
		text-align: center;
	}

	.auth-gate h1 {
		font-size: 15px;
		color: var(--dos-cyan);
		margin-bottom: var(--spacing-md);
	}

	.auth-gate h1::before { content: '> '; color: var(--dos-yellow); }

	.auth-message {
		font-size: 12px;
		color: var(--text-dim);
		white-space: pre-wrap;
		margin-bottom: var(--spacing-md);
		min-height: 1.4em;
	}

	.btn-signin {
		padding: var(--spacing-sm) var(--spacing-lg);
		background: var(--bg-primary);
		color: var(--dos-green);
		border: 1px solid var(--dos-green);
		font-family: inherit;
		font-size: 13px;
		text-transform: uppercase;
		cursor: pointer;
		letter-spacing: 1px;
	}

	.btn-signin:hover { background: var(--dos-green); color: var(--dos-black); }

	.auth-note {
		font-size: 11px;
		color: var(--text-dim);
		margin-top: var(--spacing-lg);
	}

	/* ── Dashboard ── */
	.dashboard {
		max-width: 1100px;
		margin: 0 auto;
		padding: var(--spacing-md);
	}

	.dash-header {
		border: 2px solid var(--border-color);
		background: var(--bg-secondary);
		padding: var(--spacing-md);
		margin-bottom: var(--spacing-md);
		display: flex;
		align-items: center;
		gap: var(--spacing-lg);
		flex-wrap: wrap;
	}

	.dash-header h1 {
		font-size: 15px;
		color: var(--dos-cyan);
		margin: 0;
		flex: 1;
		white-space: nowrap;
	}

	.dash-header h1::before { content: '> '; color: var(--dos-yellow); }

	.header-meta { font-size: 11px; color: var(--text-dim); white-space: nowrap; }

	.date-controls {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
	}

	.date-controls label {
		font-size: 12px;
		color: var(--text-dim);
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.date-controls input[type="date"] {
		background: var(--bg-primary);
		color: var(--text-primary);
		border: 1px solid var(--border-color);
		font-family: inherit;
		font-size: 13px;
		padding: 3px 6px;
	}

	.btn-preset {
		background: var(--bg-primary);
		color: var(--dos-cyan);
		border: 1px solid var(--border-color);
		font-family: inherit;
		font-size: 12px;
		padding: 3px 8px;
		cursor: pointer;
	}

	.btn-preset:hover, .btn-preset.active {
		background: var(--dos-cyan);
		color: var(--dos-black);
	}

	.btn-reload {
		background: var(--bg-primary);
		color: var(--dos-yellow);
		border: 1px solid var(--dos-yellow);
		font-family: inherit;
		font-size: 12px;
		padding: 3px 10px;
		cursor: pointer;
		text-transform: uppercase;
	}

	.btn-reload:hover { background: var(--dos-yellow); color: var(--dos-black); }

	/* ── Panels ── */
	.panel {
		border: 2px solid var(--border-color);
		background: var(--bg-secondary);
		margin-bottom: var(--spacing-md);
	}

	.panel-header {
		padding: var(--spacing-sm) var(--spacing-md);
		border-bottom: 1px solid var(--border-color);
		font-size: 13px;
		color: var(--dos-cyan);
		text-transform: uppercase;
	}

	.panel-header::before { content: '> '; color: var(--dos-yellow); }

	.panel-body { padding: var(--spacing-md); }

	.panels-half {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-md);
	}

	.panels-half .panel { margin-bottom: 0; }

	@media (max-width: 760px) { .panels-half { grid-template-columns: 1fr; } }

	/* ── Chart output ── */
	:global(.panel-body pre.chart) {
		font-family: inherit;
		font-size: 12px;
		color: var(--text-primary);
		white-space: pre;
		overflow-x: auto;
		margin: 0;
		line-height: 1.5;
	}

	:global(.panel-body .dim)  { color: var(--text-dim); }
	:global(.panel-body .err)  { color: var(--error-color); }
	:global(.panel-body .win)  { color: var(--dos-green); }

	/* ── Session browser ── */
	.sessions-nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 12px;
		margin-bottom: var(--spacing-sm);
		color: var(--text-dim);
	}

	.sessions-nav button {
		background: var(--bg-primary);
		color: var(--dos-cyan);
		border: 1px solid var(--border-color);
		font-family: inherit;
		font-size: 11px;
		padding: 2px 8px;
		cursor: pointer;
		margin: 0 4px;
	}

	.sessions-nav button:hover { background: var(--dos-cyan); color: var(--dos-black); }

	.sessions-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 12px;
	}

	.sessions-table th {
		text-align: left;
		color: var(--dos-cyan);
		border-bottom: 1px solid var(--border-color);
		padding: 4px 8px;
		font-weight: normal;
		text-transform: uppercase;
	}

	.sessions-table td {
		padding: 4px 8px;
		border-bottom: 1px solid var(--bg-primary);
		vertical-align: top;
	}

	.sess-row:hover td { background: var(--bg-primary); cursor: pointer; }

	.win  { color: var(--dos-green); }
	.loss { color: var(--error-color); }

	.dim  { color: var(--text-dim); }

	.btn-expand {
		background: none;
		border: 1px solid var(--border-color);
		color: var(--text-dim);
		font-family: inherit;
		font-size: 12px;
		padding: 0 5px;
		cursor: pointer;
		line-height: 1.4;
	}

	.btn-expand:hover { color: var(--dos-cyan); border-color: var(--dos-cyan); }

	.sess-detail td {
		padding: 0;
		background: var(--bg-primary);
	}

	.att-trail {
		font-family: inherit;
		font-size: 11px;
		color: var(--text-dim);
		white-space: pre-wrap;
		margin: 0;
		padding: var(--spacing-sm);
		line-height: 1.6;
	}

	:global(.att-trail .found) { color: var(--dos-green); }
	:global(.att-trail .viol)  { color: var(--error-color); }
</style>
