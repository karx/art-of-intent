<script lang="ts">
	import { onMount } from 'svelte';
	import {
		collection, query, where, orderBy, limit,
		getDocs, doc, setDoc, updateDoc, serverTimestamp,
	} from 'firebase/firestore';
	import { db, increment } from '$lib/firebase';
	import { authState } from '$lib/stores/auth.svelte';
	import { getRating, calculateEfficiency } from '$lib/scoring';
	import { buildReciteId, reciteCacheKey } from '$lib/community';

	interface Post {
		sessionId:    string;
		userId:       string;
		displayName:  string;
		date:         string;
		featuredHaiku: string;
		caption:      string;
		score:        number | null;
		attempts:     number;
		reciteCount:  number;
	}

	interface ReciteNote {
		userId:      string;
		displayName: string;
		note:        string;
		recitedAt:   any;
	}

	const today = new Date().toISOString().split('T')[0];

	let posts       = $state<Post[]>([]);
	let loading     = $state(true);
	let error       = $state('');

	// Per-card UI state
	let reciteNotes     = $state<Record<string, ReciteNote[]>>({});
	let reciteOpen      = $state<Record<string, boolean>>({});
	let reciteNote      = $state<Record<string, string>>({});
	let reciting        = $state<Record<string, boolean>>({});

	function isRecited(sessionId: string): boolean {
		return !!localStorage.getItem(reciteCacheKey(sessionId));
	}

	onMount(async () => {
		try {
			const snap = await getDocs(query(
				collection(db, 'communityPosts'),
				where('date', '==', today),
				orderBy('reciteCount', 'desc'),
				orderBy('score',       'asc'),
				limit(50),
			));
			posts = snap.docs.map(d => {
				const s = d.data();
				return {
					sessionId:    d.id,
					userId:       s.userId ?? '',
					displayName:  s.displayName ?? 'Anonymous',
					date:         s.date ?? today,
					featuredHaiku: s.featuredHaiku ?? '',
					caption:      s.caption ?? '',
					score:        s.score ?? null,
					attempts:     s.attempts ?? 0,
					reciteCount:  s.reciteCount ?? 0,
				};
			});
		} catch (e) {
			error = 'Could not load the gallery. Please refresh.';
		} finally {
			loading = false;
		}

		// Load recite notes for visible posts
		loadReciteNotes();
	});

	async function loadReciteNotes() {
		if (!posts.length) return;
		const postIds = posts.map(p => p.sessionId);
		// Query recites for today's posts in batches (Firestore 'in' limit = 30)
		const batches: string[][] = [];
		for (let i = 0; i < postIds.length; i += 10) batches.push(postIds.slice(i, i + 10));

		const allNotes: Record<string, ReciteNote[]> = {};
		await Promise.all(batches.map(async batch => {
			try {
				const snap = await getDocs(query(
					collection(db, 'recites'),
					where('postId', 'in', batch),
					orderBy('recitedAt', 'desc'),
					limit(50),
				));
				snap.docs.forEach(d => {
					const s = d.data();
					if (!s.note) return; // skip note-less recites
					if (!allNotes[s.postId]) allNotes[s.postId] = [];
					if (allNotes[s.postId].length < 5) {
						allNotes[s.postId].push({
							userId:      s.userId,
							displayName: s.displayName ?? 'Anonymous',
							note:        s.note,
							recitedAt:   s.recitedAt,
						});
					}
				});
			} catch { /* non-fatal */ }
		}));
		reciteNotes = allNotes;
	}

	function toggleRecite(sessionId: string) {
		if (isRecited(sessionId)) return;
		reciteOpen = { ...reciteOpen, [sessionId]: !reciteOpen[sessionId] };
	}

	async function confirmRecite(post: Post) {
		const user = authState.user;
		if (!user) return;
		const sessionId = post.sessionId;
		const note      = (reciteNote[sessionId] ?? '').slice(0, 140);

		reciting = { ...reciting, [sessionId]: true };
		try {
			const reciteId = buildReciteId(sessionId, user.uid);
			await setDoc(doc(db, 'recites', reciteId), {
				postId:      sessionId,
				userId:      user.uid,
				displayName: user.displayName ?? user.email ?? 'Anonymous',
				note,
				recitedAt:   serverTimestamp(),
			});
			await updateDoc(doc(db, 'communityPosts', sessionId), {
				reciteCount: increment(1),
			});

			// Optimistic updates
			posts = posts.map(p =>
				p.sessionId === sessionId ? { ...p, reciteCount: p.reciteCount + 1 } : p
			);
			if (note) {
				reciteNotes = {
					...reciteNotes,
					[sessionId]: [
						{ userId: user.uid, displayName: user.displayName ?? 'Anonymous', note, recitedAt: null },
						...(reciteNotes[sessionId] ?? []),
					].slice(0, 5),
				};
			}
			localStorage.setItem(reciteCacheKey(sessionId), '1');
			reciteOpen = { ...reciteOpen, [sessionId]: false };
			reciteNote = { ...reciteNote, [sessionId]: '' };
		} catch { /* non-fatal */ }
		reciting = { ...reciting, [sessionId]: false };
	}

	function effLabel(post: Post): string {
		if (post.score === null) return `${post.attempts} att`;
		const eff = calculateEfficiency(post.score - post.attempts * 10, post.attempts);
		const r   = getRating(eff);
		return `${post.attempts} att · ${r.stars}`;
	}
</script>

<svelte:head>
	<title>Community Gallery — Art of Intent</title>
</svelte:head>

<div class="container community-page">

	<div class="community-header">
		<div class="community-title">◎ GALLERY</div>
		<div class="community-date">{today}</div>
	</div>

	{#if loading}
		<div class="community-empty">Loading today's gallery…</div>

	{:else if error}
		<div class="community-error">⚠ {error}</div>

	{:else if posts.length === 0}
		<div class="community-empty">
			<p>No posts yet today.</p>
			<p>Play the puzzle and hit <strong>Publish ↗</strong> to be the first.</p>
		</div>

	{:else}
		<div class="posts-grid">
			{#each posts as post (post.sessionId)}
				{@const recited = isRecited(post.sessionId)}
				{@const notes   = reciteNotes[post.sessionId] ?? []}

				<div class="post-card">
					<div class="post-header">
						<span class="post-author">{post.displayName}</span>
						<span class="post-meta">{effLabel(post)}</span>
					</div>

					<pre class="post-haiku">{post.featuredHaiku}</pre>

					{#if post.caption}
						<div class="post-caption">"{post.caption}"</div>
					{/if}

					<div class="post-footer">
						<button
							class="recite-btn"
							class:recite-btn--done={recited}
							disabled={recited || !authState.user}
							onclick={() => toggleRecite(post.sessionId)}
							title={!authState.user ? 'Sign in to recite' : recited ? 'Already recited' : 'Recite this'}
						>
							{#if recited}✦ Recited{:else}Recite{/if}
							<span class="recite-count">{post.reciteCount}</span>
						</button>
					</div>

					<!-- Inline recite note field -->
					{#if reciteOpen[post.sessionId] && !recited}
						<div class="recite-panel">
							<textarea
								class="recite-note-input"
								placeholder="Add a note (optional)"
								maxlength="140"
								rows="2"
								bind:value={reciteNote[post.sessionId]}
							></textarea>
							<div class="recite-panel-actions">
								<button
									class="btn-primary"
									disabled={reciting[post.sessionId]}
									onclick={() => confirmRecite(post)}
								>
									{reciting[post.sessionId] ? '…' : 'Recite'}
								</button>
								<button
									class="btn-ghost"
									onclick={() => { reciteOpen = { ...reciteOpen, [post.sessionId]: false }; }}
								>Cancel</button>
							</div>
						</div>
					{/if}

					<!-- Recite notes thread -->
					{#if notes.length}
						<div class="notes-thread">
							{#each notes as n}
								<div class="note-item">
									<span class="note-author">@{n.displayName}</span>
									<span class="note-text">{n.note}</span>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

</div>

<style>
	.community-page {
		padding-top: var(--spacing-lg);
	}

	.community-header {
		display: flex;
		align-items: baseline;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-lg);
		border-bottom: 1px solid var(--border-color);
		padding-bottom: var(--spacing-sm);
	}
	.community-title {
		font-size: 14px;
		font-weight: bold;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--info-color);
	}
	.community-date {
		font-size: 11px;
		color: var(--text-dim);
		letter-spacing: 1px;
	}

	.community-empty,
	.community-error {
		text-align: center;
		color: var(--text-dim);
		font-size: 13px;
		padding: var(--spacing-lg) 0;
		letter-spacing: 0.5px;
	}
	.community-error { color: var(--error-color); }
	.community-empty strong { color: var(--text-primary); }

	/* ── Post cards ──────────────────────────────────────────────────────── */
	.posts-grid {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.post-card {
		border: 1px solid var(--border-color);
		background: var(--bg-secondary);
		padding: var(--spacing-md);
	}

	.post-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: var(--spacing-sm);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 1px;
	}
	.post-author { color: var(--info-color); font-weight: bold; }
	.post-meta   { color: var(--text-dim); }

	.post-haiku {
		font-family: inherit;
		font-size: 13px;
		white-space: pre-wrap;
		color: var(--text-primary);
		margin: 0 0 var(--spacing-sm) 0;
		border-left: 2px solid var(--border-color);
		padding-left: var(--spacing-sm);
		line-height: 1.6;
	}

	.post-caption {
		font-size: 12px;
		color: var(--text-dim);
		font-style: italic;
		margin-bottom: var(--spacing-sm);
	}

	.post-footer {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	/* ── Recite button ───────────────────────────────────────────────────── */
	.recite-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: none;
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		font-family: inherit;
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 1px;
		padding: 3px 10px;
		cursor: pointer;
		transition: border-color 0.15s, color 0.15s;
	}
	.recite-btn:hover:not(:disabled) {
		border-color: var(--info-color);
		color: var(--info-color);
	}
	.recite-btn--done {
		border-color: var(--success-color);
		color: var(--success-color);
		cursor: default;
	}
	.recite-btn:disabled:not(.recite-btn--done) {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.recite-count {
		font-size: 10px;
		opacity: 0.7;
	}

	/* ── Recite inline panel ─────────────────────────────────────────────── */
	.recite-panel {
		margin-top: var(--spacing-sm);
		padding: var(--spacing-sm);
		border: 1px solid var(--border-color);
		background: var(--bg-primary);
	}
	.recite-note-input {
		width: 100%;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		font-family: inherit;
		font-size: 16px; /* prevent iOS zoom */
		padding: var(--spacing-sm);
		resize: none;
		box-sizing: border-box;
	}
	.recite-note-input:focus { outline: 1px solid var(--info-color); }
	.recite-panel-actions {
		display: flex;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-sm);
	}

	/* ── Notes thread ────────────────────────────────────────────────────── */
	.notes-thread {
		margin-top: var(--spacing-sm);
		border-top: 1px solid var(--border-color);
		padding-top: var(--spacing-sm);
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.note-item {
		font-size: 12px;
		display: flex;
		gap: 8px;
		align-items: baseline;
	}
	.note-author {
		color: var(--info-color);
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		flex-shrink: 0;
	}
	.note-text { color: var(--text-primary); }

	/* ── Shared button helpers ───────────────────────────────────────────── */
	.btn-primary {
		background: var(--info-color);
		color: var(--bg-primary);
		border: 1px solid var(--info-color);
		font-family: inherit;
		font-size: 12px;
		padding: 4px 12px;
		cursor: pointer;
		text-transform: uppercase;
		letter-spacing: 1px;
	}
	.btn-primary:hover:not(:disabled) {
		background: var(--bg-primary);
		color: var(--info-color);
	}
	.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
	.btn-ghost {
		background: none;
		border: none;
		color: var(--text-dim);
		font-family: inherit;
		font-size: 12px;
		cursor: pointer;
		padding: 4px 8px;
		text-transform: lowercase;
	}
	.btn-ghost:hover { color: var(--text-primary); }
</style>
