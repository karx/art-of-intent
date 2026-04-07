<script lang="ts">
	import { authState } from '$lib/stores/auth.svelte';
	import { saveUserSettings } from '$lib/api';

	// ── BYOM ──────────────────────────────────────────────────────────────────
	type Provider = 'gemini' | 'openai' | 'anthropic' | 'custom';

	const PROVIDERS: { id: Provider; label: string; defaultEndpoint: string; needsEndpoint: boolean }[] = [
		{ id: 'gemini',    label: 'Gemini (built-in)',  defaultEndpoint: '',                           needsEndpoint: false },
		{ id: 'openai',    label: 'OpenAI',             defaultEndpoint: 'https://api.openai.com/v1',  needsEndpoint: false },
		{ id: 'anthropic', label: 'Anthropic',          defaultEndpoint: 'https://api.anthropic.com/v1/messages', needsEndpoint: false },
		{ id: 'custom',    label: 'Custom / Local',     defaultEndpoint: '',                           needsEndpoint: true  },
	];

	let provider = $state<Provider>('gemini');
	let apiKey    = $state('');
	let endpoint  = $state('');
	let model     = $state('');
	let status    = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
	let statusMsg = $state('');

	const selectedProvider = $derived(PROVIDERS.find(p => p.id === provider)!);

	async function save() {
		if (!authState.user) { statusMsg = 'Sign in first.'; status = 'error'; return; }
		if (provider !== 'gemini' && !apiKey.trim()) {
			statusMsg = 'API key is required.'; status = 'error'; return;
		}
		status = 'saving';
		try {
			await saveUserSettings({
				provider,
				apiKey: apiKey.trim() || undefined,
				endpoint: endpoint.trim() || undefined,
				model:    model.trim()    || undefined,
			});
			status = 'saved';
			statusMsg = 'Settings saved.';
			apiKey = ''; // clear after save — key is write-only
		} catch (e: any) {
			status = 'error';
			statusMsg = e.message ?? 'Failed to save.';
		}
	}

	async function clearSettings() {
		if (!authState.user) return;
		status = 'saving';
		try {
			await saveUserSettings({ provider: null });
			provider = 'gemini'; apiKey = ''; endpoint = ''; model = '';
			status = 'saved';
			statusMsg = 'Settings cleared — using built-in Gemini.';
		} catch (e: any) {
			status = 'error';
			statusMsg = e.message ?? 'Failed to clear.';
		}
	}
</script>

<svelte:head><title>Settings · Art of Intent</title></svelte:head>

<div class="container main-content">
	<!-- ── BYOM ──────────────────────────────────────────────────────── -->
	<section class="settings-section">
		<h2>Bring Your Own Model</h2>
		<p class="muted">
			Route Arty through your own AI provider. Your API key is encrypted server-side and
			never stored in the browser.
		</p>

		{#if !authState.user}
			<p class="text-warning">Sign in to save model settings.</p>
		{:else}
			<label>
				Provider
				<select bind:value={provider}>
					{#each PROVIDERS as p}
						<option value={p.id}>{p.label}</option>
					{/each}
				</select>
			</label>

			{#if provider !== 'gemini'}
				<label>
					API Key
					<input
						type="password"
						placeholder="Leave blank to keep existing key"
						autocomplete="off"
						bind:value={apiKey}
					/>
					<span class="field-hint">Write-only — stored encrypted on the server.</span>
				</label>

				{#if selectedProvider.needsEndpoint}
					<label>
						Endpoint URL
						<input
							type="url"
							placeholder="https://localhost:11434/v1/chat/completions"
							bind:value={endpoint}
						/>
					</label>
				{:else if endpoint !== ''}
					<label>
						Endpoint Override <span class="muted">(optional)</span>
						<input type="url" placeholder={selectedProvider.defaultEndpoint} bind:value={endpoint} />
					</label>
				{:else}
					<button class="btn-text" onclick={() => (endpoint = selectedProvider.defaultEndpoint)}>
						+ Override endpoint
					</button>
				{/if}

				<label>
					Model <span class="muted">(optional)</span>
					<input type="text" placeholder="e.g. gpt-4o-mini" bind:value={model} />
				</label>
			{/if}

			<div class="action-row">
				<button class="btn-primary" disabled={status === 'saving'} onclick={save}>
					{status === 'saving' ? 'Saving…' : 'Save'}
				</button>
				{#if provider !== 'gemini'}
					<button class="btn-secondary" onclick={clearSettings}>Use built-in Gemini</button>
				{/if}
			</div>

			{#if statusMsg}
				<p class="status-msg text-{status === 'error' ? 'error' : 'success'}">{statusMsg}</p>
			{/if}
		{/if}
	</section>
</div>

<style>
	.settings-section { margin-bottom: 2.5rem; }
	.settings-section h2 { margin-bottom: 0.75rem; }

	label {
		display: block;
		margin-bottom: 1rem;
	}
	label input, label select {
		display: block;
		width: 100%;
		max-width: 28rem;
		margin-top: 0.25rem;
		padding: 0.4rem 0.6rem;
		background: var(--input-bg, #111);
		color: inherit;
		border: 1px solid var(--color-border, #555);
		font: inherit;
	}

	.field-hint { display: block; font-size: 0.8em; opacity: 0.6; margin-top: 0.2rem; }
	.action-row { display: flex; gap: 0.75rem; margin-top: 0.5rem; }
	.status-msg { margin-top: 0.75rem; }

	.muted      { opacity: 0.6; }
	.text-success { color: var(--color-success, #0f0); }
	.text-error   { color: var(--color-error,   #f55); }
	.text-warning { color: var(--color-warning, #fa0); }
</style>
