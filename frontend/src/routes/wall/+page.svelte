<script lang="ts">
	import { onMount } from 'svelte';
	import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
	import { db } from '$lib/firebase';
	import { buildWallEntries, type WallEntry } from '$lib/wall';

	const today = new Date().toISOString().split('T')[0];

	let entries = $state<WallEntry[]>([]);
	let loading = $state(true);
	let error   = $state('');

	onMount(async () => {
		try {
			const [honest, cheats] = await Promise.all([
				getDocs(query(
					collection(db, 'sessions'),
					where('result',  '==', 'victory'),
					where('cheated', '==', false),
					where('gameDate','==', today),
					orderBy('efficiencyScore', 'asc'),
					limit(20),
				)),
				getDocs(query(
					collection(db, 'sessions'),
					where('result',  '==', 'victory'),
					where('cheated', '==', true),
					where('gameDate','==', today),
				)),
			]);
			entries = buildWallEntries([...honest.docs, ...cheats.docs].map((d) => d.data()));
		} catch {
			error = 'Could not load the wall. Please try again.';
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Haiku Wall — Art of Intent</title>
	<meta name="description" content="Today's winning haikus, coaxed out of Arty by players around the world. New wall every day." />
	<link rel="canonical" href="https://art-of-intent.netlify.app/wall" />
</svelte:head>

<div class="container main-content">
	<section class="wall" aria-label="Today's haiku wall">
		<div class="wall-header">
			<h2>HAIKU WALL</h2>
			<span class="wall-date">{today} · today's winning haikus</span>
		</div>

		{#if loading}
			<div class="wall-empty">Loading the day's poetry…</div>
		{:else if error}
			<div class="wall-empty" role="alert">{error}</div>
		{:else if entries.length === 0}
			<div class="wall-empty">
				No winning haikus yet today. The wall is blank — be the first.
				<div class="wall-cta"><a href="/">&gt; Play today's puzzle</a></div>
			</div>
		{:else}
			<div class="wall-grid">
				{#each entries as e, i}
					<article class="wall-card" class:wall-card--cheat={e.cheated}>
						<div class="wall-rank">{e.cheated ? '✦' : `#${i + 1}`}</div>
						<blockquote class="wall-haiku">{e.haiku}</blockquote>
						<div class="wall-words">✓ {e.foundWords.join(', ')}</div>
						<div class="wall-meta">
							<span class="wall-name">{e.displayName}</span>
							<span class="wall-stats">
								{e.attempts} att{#if e.score !== null}&nbsp;· score {e.score}{/if}{#if e.cheated}&nbsp;· cheat run{/if}
							</span>
						</div>
					</article>
				{/each}
			</div>
			<div class="wall-cta"><a href="/">&gt; Can you do better? Play today's puzzle</a></div>
		{/if}
	</section>
</div>

<style>
	.wall-header {
		display: flex;
		align-items: baseline;
		gap: 12px;
		margin-bottom: var(--spacing-lg, 24px);
	}
	.wall-header h2 {
		font-size: 15px;
		letter-spacing: 0.12em;
		color: var(--text-bright);
	}
	.wall-date {
		font-size: 11px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-dim);
	}

	.wall-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: var(--spacing-md, 16px);
	}

	.wall-card {
		border: 1px solid var(--border-color);
		background: var(--bg-secondary);
		padding: var(--spacing-md, 16px);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm, 8px);
	}
	.wall-card--cheat {
		border-color: var(--warning-color);
	}

	.wall-rank {
		font-size: 10px;
		letter-spacing: 0.1em;
		color: var(--text-dim);
	}
	.wall-card--cheat .wall-rank { color: var(--warning-color); }

	.wall-haiku {
		white-space: pre-line;
		color: var(--text-bright);
		font-size: 15px;
		line-height: 1.5;
		border-left: 2px solid var(--info-color);
		padding-left: var(--spacing-sm, 8px);
		margin: 0;
	}
	.wall-card--cheat .wall-haiku { border-left-color: var(--warning-color); }

	.wall-words {
		font-size: 11px;
		color: var(--success-color);
	}

	.wall-meta {
		display: flex;
		justify-content: space-between;
		gap: 8px;
		font-size: 11px;
	}
	.wall-name { color: var(--highlight); }
	.wall-stats { color: var(--text-dim); }

	.wall-empty {
		color: var(--text-dim);
		padding: var(--spacing-xl, 32px) 0;
	}

	.wall-cta {
		margin-top: var(--spacing-lg, 24px);
	}
	.wall-cta a {
		color: var(--info-color);
		text-decoration: none;
		letter-spacing: 0.05em;
	}
	.wall-cta a:hover { text-decoration: underline; }
</style>
