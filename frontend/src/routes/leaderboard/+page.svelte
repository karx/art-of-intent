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
		matchedWords: string[];
		date: string;
	}

	const today = new Date().toISOString().split('T')[0];

	let entries = $state<Entry[]>([]);
	let loading = $state(true);
	let error = $state('');

	onMount(async () => {
		try {
			// Try today's leaderboard first; fall back to recent sessions
			const q = query(
				collection(db, 'leaderboard'),
				where('date', '==', today),
				orderBy('totalTokens', 'asc'),
				limit(10)
			);
			const snap = await getDocs(q);

			if (!snap.empty) {
				entries = snap.docs.map(d => d.data() as Entry);
			} else {
				// Fallback: recent winning sessions
				const q2 = query(
					collection(db, 'sessions'),
					where('result', '==', 'victory'),
					where('gameDate', '==', today),
					orderBy('totalTokens', 'asc'),
					limit(10)
				);
				const snap2 = await getDocs(q2);
				entries = snap2.docs.map(d => {
					const d2 = d.data();
					return {
						displayName: d2.displayName ?? 'Anonymous',
						totalTokens: d2.totalTokens ?? 0,
						attempts:    d2.attempts ?? 0,
						efficiency:  d2.totalTokens && d2.attempts
							? Math.round((d2.totalTokens / d2.attempts) * 10) / 10
							: 0,
						matchedWords: d2.matchedWords ?? [],
						date: d2.gameDate ?? today,
					} as Entry;
				});
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
	<h1 class="app-title">Daily Leaderboard</h1>
	<p class="muted">{today}</p>

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
					{@const r = getRating(entry.efficiency ?? entry.totalTokens / Math.max(entry.attempts, 1))}
					<tr>
						<td>{i + 1}</td>
						<td>{entry.displayName}</td>
						<td>{entry.totalTokens}</td>
						<td>{entry.attempts}</td>
						<td>{entry.efficiency?.toFixed(1) ?? '—'}</td>
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

	.muted      { opacity: 0.6; }
	.text-success { color: var(--color-success, #0f0); }
	.text-info    { color: var(--color-info,    #0af); }
	.text-warning { color: var(--color-warning, #fa0); }
	.text-error   { color: var(--color-error,   #f55); }
</style>
