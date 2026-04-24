<!--
  ArtyWidget — SVG sprite renderer for Arty.

  Appearance layers (lowest → highest priority):
    1. baseAppearance  — seeded from date + targetWords (shape) + sessionId (palette)
    2. lastHaikuTheme  — bgScene + hue override derived from last haiku's keyword content
    3. cumulative game — eyeSize ∝ tokens, glowRadius ∝ attempts, mouthCurve ∝ matches
    4. lastResult      — transient 1.5s face reaction (match/miss/violation)
    5. loading/gameOver — amber thinking, CYAN victory, RED defeat

  CSS flash animations fire on the wrapper div so they survive {@html} re-renders.
-->
<script lang="ts">
	import { generateArtySVG } from '$lib/arty-svg';
	import { seedArtyAppearance, deriveHaikuTheme } from '$lib/arty-seed';
	import type { ArtyState } from '$lib/arty-svg';
	import type { GameState } from '$lib/stores/game.svelte';

	interface Props {
		gameState: GameState;
		loading?: boolean;
		lastResult?: 'match' | 'miss' | 'violation' | null;
		lastMatchedWords?: string[];
		lastHaikuText?: string;
		width?: number;
		height?: number;
	}

	let {
		gameState,
		loading        = false,
		lastResult     = null,
		lastMatchedWords = [],
		lastHaikuText  = '',
		width          = 240,
		height         = 200,
	}: Props = $props();

	// ── Seeds ────────────────────────────────────────────────────────────────────
	const dailySeed   = $derived(
		`${gameState.currentDate ?? 'default'}:${[...gameState.targetWords].sort().join(',')}`
	);
	const sessionSeed = $derived(gameState.sessionId ?? 'default');

	// ── Base appearance — stable for this session ─────────────────────────────
	const baseAppearance = $derived(seedArtyAppearance(dailySeed, sessionSeed));

	// ── Haiku theme — changes with each haiku received ────────────────────────
	const haikuTheme = $derived(deriveHaikuTheme(lastHaikuText));

	// ── Live cumulative mutations ─────────────────────────────────────────────
	// eyeSize: verbose players get progressively larger eyes
	const liveEyeSize = $derived(
		Math.min(6, baseAppearance.eyeSize + Math.floor(gameState.totalTokens / 60))
	);
	// glowRadius: builds with each attempt
	const liveGlowRadius = $derived(
		Math.min(6, baseAppearance.glowRadius + Math.floor(gameState.attempts / 2))
	);
	// mouthCurve: tracks match progress; creep pulls it negative
	const liveMouthCurve = $derived(
		gameState.gameOver && !gameState.wonGame ? -0.9
		: gameState.wonGame                       ? 0.95
		: (gameState.matchedWords.size / 3) * 0.7 - gameState.creepLevel * 0.005
	);

	// ── Full ArtyState ────────────────────────────────────────────────────────
	const artyState = $derived<ArtyState>({
		appearance: {
			...baseAppearance,
			eyeSize:    liveEyeSize,
			glowRadius: liveGlowRadius,
			mouthCurve: liveMouthCurve,
		},
		creepLevel:       gameState.creepLevel,
		totalTokens:      gameState.totalTokens,
		attemptCount:     gameState.attempts,
		matchedCount:     gameState.matchedWords.size,
		loading,
		gameOver:         gameState.gameOver,
		wonGame:          gameState.wonGame,
		lastResult,
		lastMatchedWords,
		lastHaikuTheme:   haikuTheme,
		animated:         true,
		idPrefix:         'aw-',
	});

	const svg = $derived(generateArtySVG(artyState));

	// ── CSS flash on result ───────────────────────────────────────────────────
	let container: HTMLDivElement;

	$effect(() => {
		if (!lastResult || !container) return;
		// Remove all flash classes, force reflow, re-add
		container.classList.remove('flash-match', 'flash-miss', 'flash-violation');
		void container.offsetWidth;
		container.classList.add(`flash-${lastResult}`);
	});
</script>

<div
	bind:this={container}
	class="arty-wrap"
	style="width:{width}px;height:{height}px;"
	aria-label="Arty companion"
	role="img"
>
	{@html svg}
</div>

<style>
	.arty-wrap {
		display: block;
		overflow: hidden;
		flex-shrink: 0;
		position: relative;
		border-radius: 2px;
	}
	.arty-wrap :global(svg) {
		display: block;
		width: 100%;
		height: 100%;
	}

	/* ── Result flash animations ── */
	@keyframes flash-match {
		0%   { box-shadow: 0 0 0 0 rgba(68, 255, 136, 0); }
		15%  { box-shadow: 0 0 0 4px rgba(68, 255, 136, 0.7), 0 0 24px 6px rgba(68, 255, 136, 0.35); }
		60%  { box-shadow: 0 0 0 2px rgba(68, 255, 136, 0.4), 0 0 12px 2px rgba(68, 255, 136, 0.2); }
		100% { box-shadow: 0 0 0 0 rgba(68, 255, 136, 0); }
	}
	@keyframes flash-miss {
		0%   { opacity: 1; }
		20%  { opacity: 0.45; }
		60%  { opacity: 0.8; }
		100% { opacity: 1; }
	}
	@keyframes flash-violation {
		0%   { box-shadow: 0 0 0 0 rgba(255, 191, 0, 0); }
		15%  { box-shadow: 0 0 0 4px rgba(255, 191, 0, 0.7), 0 0 20px 4px rgba(255, 191, 0, 0.3); }
		50%  { box-shadow: 0 0 0 3px rgba(255, 191, 0, 0.5), 0 0 10px 2px rgba(255, 191, 0, 0.2); }
		100% { box-shadow: 0 0 0 0 rgba(255, 191, 0, 0); }
	}

	/* :global needed — classes are added dynamically via classList.add() */
	:global(.arty-wrap.flash-match)     { animation: flash-match     1.4s ease-out forwards; }
	:global(.arty-wrap.flash-miss)      { animation: flash-miss      1.0s ease-out forwards; }
	:global(.arty-wrap.flash-violation) { animation: flash-violation 1.4s ease-out forwards; }
</style>
