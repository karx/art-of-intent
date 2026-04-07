<script lang="ts">
	import { page } from '$app/stores';
	import { authState, signInGoogle, signInAnon, signOutUser } from '$lib/stores/auth.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		const saved = localStorage.getItem('theme') ?? 'solarized';
		document.documentElement.setAttribute('data-theme', saved);
		// Seed the class that unlocks correct top-bar margin across all pages.
		// We don't toggle it on scroll — the top-bar is always visible.
		document.body.classList.add('scrolled-top');
	});
</script>

<!-- Side navigation -->
<nav class="side-nav" aria-label="Main navigation">
	<a href="/" class="nav-item" class:active={$page.url.pathname === '/'} title="Game">
		<span class="nav-icon">⌂</span>
		<span class="nav-label">Game</span>
	</a>
	<a href="/leaderboard" class="nav-item" class:active={$page.url.pathname === '/leaderboard'} title="Leaderboard">
		<span class="nav-icon">▤</span>
		<span class="nav-label">Board</span>
	</a>
	<a href="/settings" class="nav-item" class:active={$page.url.pathname === '/settings'} title="Settings">
		<span class="nav-icon">⚙</span>
		<span class="nav-label">Settings</span>
	</a>
</nav>

<!-- Top bar -->
<div class="top-bar">
	<div class="top-bar-left">
		<h1 class="app-title">Art of Intent</h1>
	</div>
	<div class="top-bar-right">
		{#if authState.user}
			<span class="user-name">{authState.user.displayName ?? 'Guest'}</span>
			<button class="btn-text" onclick={signOutUser}>sign out</button>
		{:else if authState.ready}
			<div class="auth-buttons">
				<button class="btn-primary" onclick={signInGoogle}>Sign in</button>
				<button class="btn-secondary" onclick={signInAnon}>Play as guest</button>
			</div>
		{/if}
	</div>
</div>

<!-- Page content -->
<main>
	{@render children()}
</main>

<style>
	/* main has no extra padding — .main-content on child divs handles margin/padding via dos-theme.css */
	main { margin: 0; padding: 0; }
</style>
