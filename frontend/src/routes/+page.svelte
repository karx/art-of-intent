<script lang="ts">
	import { doc, getDoc } from 'firebase/firestore';
	import { db } from '$lib/firebase';
	import { authState } from '$lib/stores/auth.svelte';
	import { callArtyAPI } from '$lib/api';
	import { gameState, applyAttemptResult } from '$lib/stores/game.svelte';
	import { getRating, calculateEfficiency } from '$lib/scoring';

	// ── UI state ──────────────────────────────────────────────────────────────
	let prompt = $state('');
	let loading = $state(false);
	let error = $state('');
	let trail = $state<{
		prompt: string;
		haiku: string;
		tokens: number;
		newMatches: string[];
		blacklistHits: string[];
	}[]>([]);

	// ── Derived ───────────────────────────────────────────────────────────────
	const efficiency = $derived(calculateEfficiency(gameState.totalTokens, gameState.attempts));
	const rating = $derived(getRating(efficiency));
	const today = new Date().toISOString().split('T')[0];

	// ── Load words when auth is ready ─────────────────────────────────────────
	let wordsLoaded = false;
	$effect(() => {
		if (authState.user && !wordsLoaded) {
			wordsLoaded = true;
			loadDailyWords();
		}
	});

	async function loadDailyWords() {
		try {
			const snap = await getDoc(doc(db, 'dailyWords', today));
			if (!snap.exists()) {
				error = "Today's words aren't ready yet. Try refreshing.";
				return;
			}
			const data = snap.data();
			gameState.targetWords = data.targetWords ?? [];
			gameState.blacklistWords = data.blacklistWords ?? [];
			gameState.currentDate = today;
			gameState.sessionId = crypto.randomUUID();
			error = '';
		} catch {
			error = "Failed to load today's words. Please refresh.";
		}
	}

	// ── Game loop ─────────────────────────────────────────────────────────────
	async function submit() {
		const text = prompt.trim();
		if (!text || loading || gameState.gameOver || !authState.user) return;

		const lower = text.toLowerCase();
		const blockedWord = [...gameState.blacklistWords, ...gameState.targetWords]
			.find(w => lower.includes(w.toLowerCase()));
		if (blockedWord) {
			error = `Your prompt contains a restricted word: "${blockedWord}"`;
			return;
		}

		error = '';
		loading = true;

		try {
			const resp = await callArtyAPI(text, gameState.sessionId ?? '');
			const responseText = resp.responseText;
			const respLower = responseText.toLowerCase();

			const newMatches = gameState.targetWords.filter(
				w => !gameState.matchedWords.has(w) && respLower.includes(w.toLowerCase())
			);
			const blacklistHits = gameState.blacklistWords.filter(w =>
				respLower.includes(w.toLowerCase())
			);
			const tokens =
				resp.userPromptTokens + (resp.usageMetadata?.candidatesTokenCount ?? 0);

			trail = [...trail, { prompt: text, haiku: responseText, tokens, newMatches, blacklistHits }];

			const next = applyAttemptResult(gameState, {
				tokens,
				newMatches,
				blacklistViolations: blacklistHits.length,
			});
			Object.assign(gameState, next);
			gameState.matchedWords = next.matchedWords;

			prompt = '';
		} catch (e: any) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
			e.preventDefault();
			submit();
		}
	}
</script>

<svelte:head><title>Art of Intent</title></svelte:head>

<div class="container main-content">

	<!-- Header -->
	<header class="top-bar">
		<h1 class="app-title">Art of Intent</h1>
		<div class="top-bar-right">
			{#if authState.user}
				<span class="user-name">{authState.user.displayName ?? 'Guest'}</span>
			{/if}
		</div>
	</header>

	<!-- Word display -->
	<section class="game-words-section" aria-label="Today's words">
		<div class="words-container">
			<div class="words-group target-group">
				<div class="words-label">TARGET</div>
				<div class="word-list">
					{#each gameState.targetWords as word}
						<span class="word-chip {gameState.matchedWords.has(word) ? 'matched' : ''}">
							{gameState.matchedWords.has(word) ? '✓ ' : ''}{word}
						</span>
					{/each}
				</div>
			</div>
			<div class="words-divider">│</div>
			<div class="words-group blacklist-group">
				<div class="words-label">AVOID</div>
				<div class="word-list">
					{#each gameState.blacklistWords as word}
						<span class="word-chip blacklist">{word}</span>
					{/each}
				</div>
			</div>
		</div>

		<div class="score-compact">
			<span>ATT: <strong>{gameState.attempts}</strong>/10</span>
			<span>TOK: <strong>{gameState.totalTokens}</strong></span>
			<span>MAT: <strong>{gameState.matchedWords.size}/{gameState.targetWords.length}</strong></span>
			<span>CREEP: <strong class="creep-indicator">{gameState.creepLevel}</strong>/100</span>
			{#if gameState.attempts > 0}
				<span class="text-{rating.color}">{efficiency} tok/att {rating.stars}</span>
			{/if}
		</div>
	</section>

	<!-- Response trail -->
	<section class="response-trail" aria-label="Response trail">
		<h2 class="trail-title">Response Trail</h2>
		<div class="trail-container">
			{#if trail.length === 0}
				<div class="empty-state">No attempts yet. Start by entering your prompt below!</div>
			{:else}
				{#each trail as entry}
					<div class="trail-entry">
						<div class="trail-prompt">&gt; {entry.prompt}</div>
						<div class="trail-haiku">{entry.haiku}</div>
						<div class="trail-meta">
							<span>{entry.tokens} tok</span>
							{#if entry.newMatches.length > 0}
								<span class="text-success"> +matched: {entry.newMatches.join(', ')}</span>
							{/if}
							{#if entry.blacklistHits.length > 0}
								<span class="text-error"> ⚠ creep: {entry.blacklistHits.join(', ')}</span>
							{/if}
						</div>
					</div>
				{/each}
			{/if}
			{#if error}
				<div class="trail-error"><span>⚠</span> {error}</div>
			{/if}
		</div>
	</section>

	<!-- Game-over banner -->
	{#if gameState.gameOver}
		<div class="modal-content" role="status">
			<h2>{gameState.wonGame ? '✦ You found all the words!' : '✦ The darkness claimed you.'}</h2>
			<p>
				{gameState.attempts} attempt{gameState.attempts !== 1 ? 's' : ''} ·
				{gameState.totalTokens} tokens ·
				{efficiency} tok/att · {rating.stars} {rating.label}
			</p>
		</div>
	{/if}

	<!-- Prompt input -->
	{#if !gameState.gameOver}
		<div class="input-section">
			<div class="input-header">
				<span class="char-counter">{prompt.length} / 500</span>
			</div>
			<div class="input-wrapper">
				<textarea
					class="code-editor-input"
					placeholder="Enter your prompt to guide Arty… (Ctrl+Enter to send)"
					rows="3"
					maxlength="500"
					disabled={loading || !authState.user || gameState.targetWords.length === 0}
					bind:value={prompt}
					onkeydown={handleKeydown}
				></textarea>
				<div class="input-controls">
					<button
						class="submit-btn"
						disabled={loading || !prompt.trim() || !authState.user || gameState.targetWords.length === 0}
						onclick={submit}
					>
						{loading ? 'Sending…' : 'Send Prompt'}
					</button>
				</div>
			</div>
		</div>
	{/if}

</div>

<style>
	.word-chip {
		display: inline-block;
		margin: 2px 4px;
		padding: 2px 6px;
		border: 1px solid var(--color-border, #555);
	}
	.word-chip.matched {
		color: var(--color-success, #0f0);
		border-color: var(--color-success, #0f0);
	}
	.word-chip.blacklist {
		color: var(--color-error, #f55);
		border-color: var(--color-error, #f55);
	}
	.trail-entry {
		margin-bottom: 1.2rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--color-border, #333);
	}
	.trail-prompt { opacity: 0.7; margin-bottom: 0.4rem; }
	.trail-haiku  { white-space: pre-line; margin-bottom: 0.3rem; }
	.trail-meta   { font-size: 0.85em; opacity: 0.7; }
	.trail-error  { color: var(--color-error, #f55); padding: 0.5rem 0; }
	.creep-indicator { color: var(--color-warning, #fa0); }
	.text-success { color: var(--color-success, #0f0); }
	.text-info    { color: var(--color-info,    #0af); }
	.text-warning { color: var(--color-warning, #fa0); }
	.text-error   { color: var(--color-error,   #f55); }
</style>
