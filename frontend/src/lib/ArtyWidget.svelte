<script lang="ts">
	import { generateArtySVG } from '$lib/arty-svg';
	import { gameState } from '$lib/stores/game.svelte';

	interface Props {
		loading?: boolean;
		lastPromptPersonal?: boolean;
		size?: number;
	}

	let { loading = false, lastPromptPersonal = false, size = 200 }: Props = $props();

	const svg = $derived(generateArtySVG({
		creepLevel:         gameState.creepLevel,
		totalTokens:        gameState.totalTokens,
		attemptCount:       gameState.attempts,
		matchedCount:       gameState.matchedWords.size,
		loading,
		gameOver:           gameState.gameOver,
		wonGame:            gameState.wonGame,
		lastPromptPersonal,
		animated:           true,
	}, size));
</script>

<div
	class="arty-widget"
	style="width:{size}px;height:{size}px;flex-shrink:0;"
	aria-label="Arty companion"
	aria-live="polite"
>
	{@html svg}
</div>

<style>
	.arty-widget {
		display: block;
		line-height: 0;
	}
	.arty-widget :global(svg) {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
