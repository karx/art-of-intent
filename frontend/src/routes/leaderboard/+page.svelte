<script lang="ts">
	import { onMount } from 'svelte';
	import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
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

	const today = new Date().toISOString().split('T')[0];

	let entries  = $state<Entry[]>([]);
	let showDate = $state(today);
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

	onMount(async () => {
		try {
			entries = await fetchForDate(today);

			if (entries.length === 0) {
				// No winners yet today — find the most recent date that has victories.
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
		} catch (e: any) {
			error = e.message ?? 'Failed to load leaderboard.';
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head><title>Leaderboard · Art of Intent</title></svelte:head>

<div class="container main-content">
	<p class="page-date">
		{showDate}{#if showDate !== today}&nbsp;· most recent&nbsp;{/if}
	</p>

	{#if loading}
		<p>Loading…</p>
	{:else if error}
		<p class="text-error">{error}</p>
	{:else if entries.length === 0}
		<p class="empty-state">No scores yet today. Be the first to complete the puzzle!</p>
	{:else}
		<table class="leaderboard-table">
			<thead>
				<tr>
					<th>#</th>
					<th>Player</th>
					<th>Tokens</th>
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
						<td>{entry.totalTokens}</td>
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

	.page-date  { font-size: 11px; color: var(--text-dim, #586e75); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1rem; }
	.muted      { opacity: 0.6; }
	.text-success { color: var(--color-success, #0f0); }
	.text-info    { color: var(--color-info,    #0af); }
	.text-warning { color: var(--color-warning, #fa0); }
	.text-error   { color: var(--color-error,   #f55); }
</style>
