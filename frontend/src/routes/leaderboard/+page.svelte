<script lang="ts">
	import { onMount } from 'svelte';
	import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
	import { db } from '$lib/firebase';
	import { getRating } from '$lib/scoring';

	interface Entry {
		displayName: string;
		totalTokens: number;
		attempts: number;
		efficiency: number;
		efficiencyScore: number;
		matchedWords: string[];
		date: string;
	}

	interface Stats {
		winners: number;
		avgAttempts: number;
		bestAttempts: number;
		bestScore: number;
		targetWords: string[];
	}

	const today = new Date().toISOString().split('T')[0];

	let entries  = $state<Entry[]>([]);
	let showDate = $state(today);
	let stats    = $state<Stats | null>(null);
	let loading  = $state(true);
	let error    = $state('');

	function mapSession(d: any): Entry {
		const s = d.data();
		const totalTokens = s.totalTokens ?? 0;
		const attempts    = s.attempts ?? 0;
		return {
			displayName:     s.displayName ?? s.userName ?? 'Anonymous',
			totalTokens,
			attempts,
			efficiency:      attempts > 0 ? Math.round((totalTokens / attempts) * 10) / 10 : 0,
			efficiencyScore: s.efficiencyScore ?? (attempts * 10 + Math.floor(totalTokens / 10)),
			matchedWords:    s.matchedWords ?? [],
			date:            s.gameDate ?? today,
		};
	}

	async function fetchForDate(date: string): Promise<Entry[]> {
		const q = query(
			collection(db, 'sessions'),
			where('result', '==', 'victory'),
			where('gameDate', '==', date),
			orderBy('efficiencyScore', 'asc'),
			limit(10)
		);
		const snap = await getDocs(q);
		return snap.docs.map(mapSession);
	}

	function deriveStats(rows: Entry[], targetWords: string[]): Stats {
		const avgAttempts = rows.length
			? Math.round((rows.reduce((s, e) => s + e.attempts, 0) / rows.length) * 10) / 10
			: 0;
		return {
			winners:      rows.length,
			avgAttempts,
			bestAttempts: rows[0]?.attempts ?? 0,
			bestScore:    rows[0]?.efficiencyScore ?? 0,
			targetWords,
		};
	}

	async function fetchTargetWords(date: string): Promise<string[]> {
		try {
			const snap = await getDoc(doc(db, 'dailyWords', date));
			return snap.exists() ? (snap.data().targetWords ?? []) : [];
		} catch {
			return [];
		}
	}

	onMount(async () => {
		try {
			entries = await fetchForDate(today);

			if (entries.length === 0) {
				// No winners yet today — fall back to most recent date with victories.
				// Requires index: result (asc) + gameDate (desc).
				const recentQ = query(
					collection(db, 'sessions'),
					where('result', '==', 'victory'),
					orderBy('gameDate', 'desc'),
					limit(1)
				);
				const recentSnap = await getDocs(recentQ);
				if (!recentSnap.empty) {
					showDate = recentSnap.docs[0].data().gameDate;
					entries  = await fetchForDate(showDate);
				}
			}

			const targetWords = await fetchTargetWords(showDate);
			stats = deriveStats(entries, targetWords);
		} catch (e: any) {
			error = e.message ?? 'Failed to load leaderboard.';
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Leaderboard · Art of Intent</title>
	<meta name="description" content="Top scores and rankings for Art of Intent — the daily AI word puzzle." />
	<link rel="canonical" href="https://art-of-intent.netlify.app/leaderboard" />
	<meta property="og:url" content="https://art-of-intent.netlify.app/leaderboard" />
	<meta property="og:title" content="Leaderboard · Art of Intent" />
	<meta property="og:description" content="Top scores and rankings for Art of Intent — the daily AI word puzzle." />
</svelte:head>

<div class="container main-content">
	<p class="page-date">
		{showDate}{#if showDate !== today}&nbsp;· most recent{/if}
	</p>

	{#if loading}
		<p>Loading…</p>
	{:else if error}
		<p class="text-error">{error}</p>
	{:else if entries.length === 0}
		<p class="empty-state">No scores yet today. Be the first to complete the puzzle!</p>
	{:else}
		{#if stats?.targetWords.length}
			<p class="target-words">
				{#each stats.targetWords as word, i}
					<span class="word">{word}</span>{#if i < stats.targetWords.length - 1}<span class="sep">·</span>{/if}
				{/each}
			</p>
		{/if}

		<div class="leaderboard-stats">
			<div class="ls-stat">
				<span class="ls-value">{stats?.winners}</span>
				<span class="ls-label">solved</span>
			</div>
			<div class="ls-stat">
				<span class="ls-value">{stats?.avgAttempts}</span>
				<span class="ls-label">avg attempts</span>
			</div>
			<div class="ls-stat">
				<span class="ls-value">{stats?.bestAttempts}</span>
				<span class="ls-label">fewest att</span>
			</div>
			<div class="ls-stat">
				<span class="ls-value">{stats?.bestScore}</span>
				<span class="ls-label">best score</span>
			</div>
		</div>

		<table class="leaderboard-table">
			<thead>
				<tr>
					<th>#</th>
					<th>Player</th>
					<th>Score</th>
					<th>Attempts</th>
					<th>Tok/Att</th>
					<th>Rating</th>
				</tr>
			</thead>
			<tbody>
				{#each entries as entry, i}
					{@const r = getRating(entry.efficiency)}
					<tr>
						<td>{i + 1}</td>
						<td>{entry.displayName}</td>
						<td>{entry.efficiencyScore}</td>
						<td>{entry.attempts}</td>
						<td>{entry.efficiency.toFixed(1)}</td>
						<td class="text-{r.color}">{r.stars}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<style>
	.target-words {
		margin-bottom: 1.25rem;
		font-size: 1rem;
		letter-spacing: 0.04em;
	}
	.target-words .word {
		font-weight: bold;
		text-transform: uppercase;
		color: var(--color-success, #0f0);
	}
	.target-words .sep {
		margin: 0 0.4em;
		opacity: 0.4;
	}

	.leaderboard-stats {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem 2rem;
		margin-bottom: 1.5rem;
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-border, #333);
	}
	.ls-stat {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
	.ls-value {
		font-size: 1.4rem;
		font-weight: bold;
		line-height: 1;
	}
	.ls-label {
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		opacity: 0.5;
	}

	.leaderboard-table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 1rem;
	}
	.leaderboard-table th,
	.leaderboard-table td {
		text-align: left;
		padding: 0.4rem 0.75rem;
		border-bottom: 1px solid var(--color-border, #333);
	}
	.leaderboard-table th { opacity: 0.7; font-weight: normal; }

	.page-date    { font-size: 11px; color: var(--text-dim, #586e75); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1rem; }
	.empty-state  { opacity: 0.6; }
	.text-success { color: var(--color-success, #0f0); }
	.text-info    { color: var(--color-info,    #0af); }
	.text-warning { color: var(--color-warning, #fa0); }
	.text-error   { color: var(--color-error,   #f55); }
</style>
