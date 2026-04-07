<script lang="ts">
	import { page } from '$app/stores';
	import { authState, signInGoogle, signInAnon, signOutUser } from '$lib/stores/auth.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		const saved = localStorage.getItem('theme') ?? 'solarized';
		document.documentElement.setAttribute('data-theme', saved);
		document.body.classList.add('scrolled-top');
	});

	// Current section label for top-bar breadcrumb
	const section = $derived(
		$page.url.pathname === '/leaderboard' ? 'scores' :
		$page.url.pathname === '/settings'    ? 'settings' :
		null
	);
</script>

<!-- ── Side navigation ──────────────────────────────────────────────────── -->
<nav class="side-nav" aria-label="Main navigation">
	<a href="/"            class="nav-item" class:active={$page.url.pathname === '/'}            title="Game">
		<span class="nav-icon">◈</span>
		<span class="nav-label">Game</span>
	</a>
	<a href="/leaderboard" class="nav-item" class:active={$page.url.pathname === '/leaderboard'} title="Scores">
		<span class="nav-icon">≡</span>
		<span class="nav-label">Scores</span>
	</a>
	<a href="/settings"    class="nav-item" class:active={$page.url.pathname === '/settings'}    title="Settings">
		<span class="nav-icon">⚙</span>
		<span class="nav-label">Settings</span>
	</a>
</nav>

<!-- ── Top bar ───────────────────────────────────────────────────────────── -->
<div class="top-bar">
	<div class="top-bar-left">
		<a href="/" class="top-bar-title">
			<span class="top-bar-prompt">&gt;</span>
			<span class="top-bar-name">ART OF INTENT</span>
			{#if section}
				<span class="top-bar-section">/ {section}</span>
			{/if}
		</a>
	</div>

	<div class="top-bar-right">
		{#if authState.user}
			<span class="top-bar-user">{authState.user.displayName ?? 'guest'}</span>
			<button class="top-bar-signout" onclick={signOutUser} title="Sign out">[ sign out ]</button>
		{:else if authState.ready}
			<button class="top-bar-btn top-bar-btn--primary" onclick={signInGoogle}>[ sign in ]</button>
			<button class="top-bar-btn" onclick={signInAnon}>[ guest ]</button>
		{/if}
	</div>
</div>

<!-- ── Page content ──────────────────────────────────────────────────────── -->
<main>
	{@render children()}
</main>

<style>
	main { margin: 0; padding: 0; }

	/* ── Top bar title ────────────────────────────────────────────────── */
	.top-bar-title {
		display: flex;
		align-items: center;
		gap: 6px;
		text-decoration: none;
		font-family: inherit;
	}
	.top-bar-prompt {
		color: var(--sol-yellow);
		font-weight: bold;
	}
	.top-bar-name {
		color: var(--sol-cyan);
		font-weight: bold;
		font-size: 13px;
		letter-spacing: 2px;
		text-transform: uppercase;
	}
	.top-bar-section {
		color: var(--text-dim);
		font-size: 11px;
		letter-spacing: 1px;
		text-transform: uppercase;
	}

	/* ── Auth in top bar ──────────────────────────────────────────────── */
	.top-bar-user {
		color: var(--sol-cyan);
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 1px;
	}
	.top-bar-signout {
		background: none;
		border: none;
		color: var(--text-dim);
		font-family: inherit;
		font-size: 11px;
		cursor: pointer;
		padding: 2px 4px;
		text-transform: lowercase;
		letter-spacing: 0.5px;
	}
	.top-bar-signout:hover { color: var(--error-color); }

	.top-bar-btn {
		background: none;
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		font-family: inherit;
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 1px;
		padding: 3px 8px;
		cursor: pointer;
	}
	.top-bar-btn:hover {
		border-color: var(--sol-cyan);
		color: var(--sol-cyan);
	}
	.top-bar-btn--primary {
		border-color: var(--sol-cyan);
		color: var(--sol-cyan);
	}
	.top-bar-btn--primary:hover {
		background: var(--sol-cyan);
		color: var(--bg-primary);
	}
</style>
