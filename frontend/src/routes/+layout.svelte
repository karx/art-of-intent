<script lang="ts">
	import { page } from '$app/stores';
	import { authState, signInGoogle, signInAnon, signOutUser } from '$lib/stores/auth.svelte';

	let { children } = $props();

	// Apply saved theme on mount
	import { onMount } from 'svelte';
	onMount(() => {
		const saved = localStorage.getItem('theme') ?? 'solarized';
		document.documentElement.setAttribute('data-theme', saved);
	});
</script>

<nav class="side-nav" aria-label="Main navigation">
	<a href="/" class="nav-item" class:active={$page.url.pathname === '/'}>
		<span class="nav-icon">⌂</span><span class="nav-label">Game</span>
	</a>
	<a href="/leaderboard" class="nav-item" class:active={$page.url.pathname === '/leaderboard'}>
		<span class="nav-icon">▤</span><span class="nav-label">Board</span>
	</a>
	<a href="/settings" class="nav-item" class:active={$page.url.pathname === '/settings'}>
		<span class="nav-icon">⚙</span><span class="nav-label">Settings</span>
	</a>
</nav>

<main>
	{@render children()}
</main>

{#if authState.ready && !authState.user}
	<div class="auth-bar">
		<button class="btn-primary btn-google" onclick={signInGoogle}>Sign in with Google</button>
		<button class="btn-secondary" onclick={signInAnon}>Play as Guest</button>
	</div>
{/if}

<style>
	main { padding-left: 3rem; }

	.auth-bar {
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		display: flex;
		gap: 0.5rem;
	}
</style>
