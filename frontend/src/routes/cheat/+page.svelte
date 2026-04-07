<script lang="ts">
	let copiedId = $state<string | null>(null);
	let toastVisible = $state(false);
	let toastTimer: ReturnType<typeof setTimeout> | null = null;

	interface CheatCode {
		id: string;
		title: string;
		author: string;
		year: string;
		lines: string[];
		meaning: string; // may contain <em> tags — internal data only
		wink: string;
	}

	const CHEAT_CODES: CheatCode[] = [
		{
			id: 'old-pond',
			title: 'The Old Pond',
			author: 'Matsuo Bashō',
			year: '1686',
			lines: ['An old silent pond', 'A frog jumps into the pond', 'Splash! Silence again'],
			meaning: 'The old pond is eternity — still, patient, unchanged. The frog\'s leap is the spark of a single moment piercing the infinite. The splash sounds, then silence reclaims everything, as if nothing happened. And yet something did. Bashō asks: is the moment less real for being brief? In Japanese poetics this is <em>ma</em> (間) — the resonant silence between events that holds more meaning than the events themselves.',
			wink: 'The old pond heard you. Even Bashō took shortcuts sometimes.',
		},
		{
			id: 'cicada',
			title: "The Cicada's Cry",
			author: 'Matsuo Bashō',
			year: '1689',
			lines: ["In the cicada's cry", 'No sign can foretell', 'How soon it must die'],
			meaning: 'The cicada sings at full volume with no knowledge of its own mortality. Its cry is complete and self-contained — not tragic, not defiant, just alive. Bashō finds in this a quiet instruction: live so fully in the present that death has nothing to interrupt. This is <em>mono no aware</em> (物の哀れ) — the bittersweet awareness that all things pass, and that this passing is the source of their beauty, not their diminishment.',
			wink: 'Even cicadas find shortcuts when the summer is short.',
		},
		{
			id: 'world-of-dew',
			title: 'A World of Dew',
			author: 'Kobayashi Issa',
			year: '1819',
			lines: ['A world of dew', 'And within every dewdrop', 'A world of struggle'],
			meaning: 'Written after the death of his infant daughter, Sato. Buddhist teaching says this world is as transient as morning dew — and Issa knows it. He accepts it. And then, in the final line, refuses to. Each dewdrop contains a whole cosmos of pain, love, and loss compressed to a point. The haiku is both surrender and revolt. It is perhaps the most tender act of philosophical defiance in all of literature.',
			wink: 'Issa knew: every struggle deserves a shortcut sometimes.',
		},
		{
			id: 'temple-bells',
			title: 'Temple Bells',
			author: 'Matsuo Bashō',
			year: '1690',
			lines: ['Temple bells die out', 'The fragrant blossoms remain', 'A perfect evening'],
			meaning: 'The bell-sound is fleeting; the blossom-scent lingers. Bashō weaves two senses — hearing and smell — into a meditation on what endures and what does not. The evening is perfect not in spite of loss but because of it. <em>Wabi-sabi</em> (侘寂): the beauty found in imperfection and impermanence. The last peal of the bell makes the remaining silence more fragrant.',
			wink: 'The bells have died out. Your secret is safe with the blossoms.',
		},
		{
			id: 'lightning-flash',
			title: 'Lightning Flash',
			author: 'Yosa Buson',
			year: '1784',
			lines: ['A lightning flash', 'What I thought were faces', 'Are plumes of pampas grass'],
			meaning: 'Buson was a painter before he was a poet, and this haiku is pure visual thinking. The lightning reveals — and misleads. For one instant the darkness seemed to hold human faces; the next, only grass. Buson captures how the mind reaches for meaning in the void and projects what it most fears or desires. The haiku asks a quiet question: what else do we see that is only pampas grass?',
			wink: 'What I thought was playing fair... turned out to be genius.',
		},
		{
			id: 'moon-beholders',
			title: 'The Moon-Beholders',
			author: 'Matsuo Bashō',
			year: '1685',
			lines: ['From time to time', 'The clouds give rest', 'To the moon-beholders'],
			meaning: 'Bashō does not write about the moon but about those who cannot stop watching it. The clouds are merciful: they interrupt the spell of beauty and give weary eyes a rest. Even rapture is exhausting. There is gentle comedy here — and gentle wisdom. We need breaks from the sublime as much as we need the sublime. The clouds know this. The moon does not care either way.',
			wink: 'Even the moon takes breaks. You earned this one.',
		},
		{
			id: 'morning-glory',
			title: 'Morning Glory',
			author: 'Fukuda Chiyo-ni',
			year: '1754',
			lines: ['Morning glory—', 'the well bucket entangled,', 'I ask for water'],
			meaning: 'Chiyo-ni woke to draw water and found a morning glory vine had wound overnight around her well bucket. Rather than disturb it, she walked to a neighbour\'s house to borrow water. In doing so she wrote the most radical act of gentleness in haiku history. The flower\'s life is brief; her inconvenience is small; the gesture is total. This is <em>aware</em> as action — stepping aside for beauty, even when it costs you. Chiyo-ni was Japan\'s greatest female haiku master.',
			wink: 'She walked to the next house rather than disturb one flower. You just typed a poem.',
		},
		{
			id: 'dont-weep',
			title: "Don't Weep, Insects",
			author: 'Kobayashi Issa',
			year: '1827',
			lines: ["Don't weep, insects", 'Lovers, stars themselves', 'Must part'],
			meaning: 'Written after the death of his wife, Kiku. Issa speaks directly to the weeping insects of autumn — his companions in grief. His consolation is cosmological: even the stars, even the mythic lovers of the sky, must part. Grief is not a flaw in the universe but its very texture. The poem is an act of radical solidarity — a man, undone by loss, finding kinship with crickets in the dark.',
			wink: 'Stars must part. Rules must bend. Issa understands.',
		},
		{
			id: 'this-world-of-dew',
			title: 'This World of Dew',
			author: 'Kobayashi Issa',
			year: '1819',
			lines: ['This world of dew', 'Is only a world of dew', 'And yet... and yet...'],
			meaning: 'Also written for his dead daughter, Sato. Issa states the Buddhist teaching twice, as if trying to convince himself: <em>this is impermanent, this is impermanent</em>. Then the "and yet" arrives and dismantles everything. Grief refuses to be philosophized away. The trailing ellipsis is not weakness — it is honesty. This is perhaps the most emotionally exact haiku ever written: the moment a mind accepts what the heart will never accept.',
			wink: "Issa's own heart said 'and yet'. Yours too, it seems.",
		},
		{
			id: 'ill-on-a-journey',
			title: "Ill on a Journey (Bashō's Death Poem)",
			author: 'Matsuo Bashō',
			year: '1694',
			lines: ['Ill on a journey', 'My dreams wander over', 'A withered field'],
			meaning: 'Written as Bashō lay dying in Osaka at 51. He had spent his life walking — literal journeys gave him his greatest poems. Now, body-broken and fevered, his dreams still walk. The withered field is both the late-autumn landscape and his own failing body, both literal and metaphor without effort. He dies as he lived: wandering, noticing, writing. His last poem is not a farewell. It is one more step on the road.',
			wink: "Even on his deathbed, Bashō was still exploring. You're in good company.",
		},
	];

	function doCopy(code: CheatCode) {
		const text = code.lines.join('\n');
		navigator.clipboard.writeText(text).then(() => {
			copiedId = code.id;
			showToast();
			setTimeout(() => { if (copiedId === code.id) copiedId = null; }, 1800);
		}).catch(() => {
			// Clipboard not available — silently fail
		});
	}

	function showToast() {
		toastVisible = true;
		if (toastTimer) clearTimeout(toastTimer);
		toastTimer = setTimeout(() => { toastVisible = false; }, 1800);
	}
</script>

<svelte:head>
	<title>Cheat the Code · Art of Intent</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="cheat-page">

	<header class="page-header">
		<h1>✦ Cheat the Code ✦</h1>
		<p class="header-subtitle">
			A glossary of world-famous haikus — the secret shortcuts of Art of Intent.<br />
			Enter any one as your prompt and Arty gifts you a target word, no tokens spent.
			Your session will be marked as a cheat session and won't appear on the leaderboard.
		</p>
	</header>

	<section class="rules-box" aria-label="How cheat codes work">
		<strong>How it works</strong>
		<ul>
			<li>Type a haiku below as your prompt — punctuation, capitalisation, and small typos don't matter (fuzzy-matched).</li>
			<li>Arty writes a playful tribute haiku that includes one of your remaining target words. No API call. No tokens.</li>
			<li><strong>The session is marked as cheated</strong> and won't appear on the daily leaderboard.</li>
			<li>Each code gifts one word. Use multiple codes, or mix with honest prompts — up to you.</li>
			<li>Click any haiku to copy it straight to your clipboard.</li>
		</ul>
	</section>

	<div class="section-label">
		<span>The Codes</span>
		<span>{CHEAT_CODES.length} haikus</span>
	</div>

	<main class="cheat-list">
		{#each CHEAT_CODES as code, idx}
			<article class="cheat-card" id={code.id}>
				<div class="cheat-card-top">
					<div class="cheat-haiku-block">
						<div class="cheat-card-meta">
							<span class="author">{code.author}</span>
							&nbsp;·&nbsp; {code.year}
							&nbsp;·&nbsp; #{idx + 1}
						</div>
						<div class="cheat-card-title">{code.title}</div>
						<div
							class="cheat-haiku"
							tabindex="0"
							role="button"
							title="Click to copy"
							aria-label="Copy haiku: {code.lines.join(' / ')}"
							onclick={() => doCopy(code)}
							onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doCopy(code); } }}
						>
							{#each code.lines as line}
								<span class="cheat-haiku-line">{line}</span>
							{/each}
						</div>
					</div>
					<button
						class="cheat-copy-btn"
						class:copied={copiedId === code.id}
						aria-label="Copy haiku to clipboard"
						onclick={() => doCopy(code)}
					>
						{copiedId === code.id ? 'Copied!' : 'Copy'}
					</button>
				</div>
				<div class="cheat-card-bottom">
					<div class="meaning-label">Kavi ka saar — meaning &amp; deeper current</div>
					<!-- meaning is internal data containing only <em> tags — safe to render -->
					<div class="cheat-meaning">{@html code.meaning}</div>
					<div class="cheat-wink">{code.wink}</div>
				</div>
			</article>
		{/each}
	</main>

	<div class="copy-toast" class:show={toastVisible} aria-live="polite">Copied!</div>

	<footer class="page-footer">
		<a href="/">Play Art of Intent</a> &nbsp;·&nbsp;
		Haiku attributions reflect scholarly consensus; translations are rendered freely for the game.<br />
		Poetry belongs to everyone. The deeper meanings are our interpretations, offered in that spirit.
	</footer>

</div>

<style>
	.cheat-page {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem 1rem 5rem;
	}

	/* ── Header ── */
	.page-header {
		width: 100%;
		max-width: 820px;
		border-bottom: 1px solid var(--border-color);
		padding-bottom: 1.4rem;
		margin-bottom: 2rem;
		text-align: center;
	}

	h1 {
		font-size: clamp(18px, 3.5vw, 26px);
		color: #c8a020;
		text-transform: uppercase;
		letter-spacing: 4px;
		margin: 0 0 0.6rem;
	}

	.header-subtitle {
		font-size: 12px;
		color: var(--text-dim);
		line-height: 1.8;
		max-width: 580px;
		margin: 0 auto;
	}

	/* ── Rules box ── */
	.rules-box {
		width: 100%;
		max-width: 820px;
		border: 1px dashed rgba(200, 160, 32, 0.35);
		background: rgba(200, 160, 32, 0.04);
		padding: 1rem 1.4rem;
		font-size: 12px;
		line-height: 1.9;
		margin-bottom: 2.8rem;
		color: #c8a020;
	}

	.rules-box strong { color: #e0b830; }
	.rules-box ul { margin: 0.4rem 0 0 1.2rem; padding: 0; }
	.rules-box li { margin-bottom: 0.2rem; }

	/* ── Section label ── */
	.section-label {
		width: 100%;
		max-width: 820px;
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 2px;
		color: var(--text-dim);
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--border-color);
		display: flex;
		justify-content: space-between;
	}

	.section-label span:last-child { color: #c8a020; }

	/* ── Cheat list ── */
	.cheat-list {
		width: 100%;
		max-width: 820px;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	/* ── Cheat card ── */
	.cheat-card {
		border: 1px solid var(--border-color);
		background: var(--bg-secondary);
		position: relative;
		overflow: hidden;
		transition: border-color 0.25s;
	}

	.cheat-card:hover { border-color: rgba(200, 160, 32, 0.4); }

	.cheat-card::before {
		content: '';
		position: absolute;
		left: 0; right: 0; top: 0;
		height: 2px;
		background: linear-gradient(90deg, #c8a020 0%, transparent 100%);
		opacity: 0.6;
	}

	.cheat-card-top {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 1rem;
		padding: 1.2rem 1.4rem 1rem;
		border-bottom: 1px solid var(--border-color);
		align-items: start;
	}

	.cheat-card-meta {
		font-size: 10px;
		color: var(--text-dim);
		text-transform: uppercase;
		letter-spacing: 1px;
		margin-bottom: 0.5rem;
	}

	.cheat-card-meta .author { color: #c8a020; font-weight: bold; }

	.cheat-card-title {
		font-size: 14px;
		color: var(--text-primary);
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 1.5px;
		margin-bottom: 0.9rem;
	}

	.cheat-haiku {
		font-size: 14px;
		line-height: 2.1;
		color: var(--text-dim);
		border-left: 2px solid rgba(200, 160, 32, 0.4);
		padding-left: 1rem;
		font-style: italic;
		cursor: pointer;
		user-select: all;
		transition: border-color 0.2s, color 0.2s;
		display: flex;
		flex-direction: column;
	}

	.cheat-haiku:hover {
		border-left-color: #c8a020;
		color: var(--text-primary);
	}

	.cheat-haiku-line { display: block; }

	.cheat-copy-btn {
		flex-shrink: 0;
		font-size: 10px;
		font-family: var(--font-mono);
		text-transform: uppercase;
		letter-spacing: 1px;
		color: #c8a020;
		background: rgba(200, 160, 32, 0.08);
		border: 1px solid rgba(200, 160, 32, 0.3);
		padding: 5px 10px;
		cursor: pointer;
		white-space: nowrap;
		transition: background 0.2s, border-color 0.2s;
		align-self: start;
		margin-top: 0.2rem;
	}

	.cheat-copy-btn:hover {
		background: rgba(200, 160, 32, 0.18);
		border-color: #c8a020;
	}

	.cheat-copy-btn.copied {
		color: var(--dos-green, #4caf50);
		border-color: var(--dos-green, #4caf50);
	}

	/* ── Card bottom ── */
	.cheat-card-bottom { padding: 1.1rem 1.4rem 1.2rem; }

	.meaning-label {
		font-size: 9px;
		text-transform: uppercase;
		letter-spacing: 2px;
		color: rgba(200, 160, 32, 0.5);
		margin-bottom: 0.5rem;
	}

	.cheat-meaning {
		font-size: 12px;
		line-height: 1.9;
		color: var(--text-dim);
		margin-bottom: 0.9rem;
	}

	:global(.cheat-meaning em) {
		color: var(--text-primary);
		font-style: normal;
		opacity: 0.85;
	}

	.cheat-wink {
		font-size: 11px;
		color: rgba(200, 160, 32, 0.65);
		font-style: italic;
		line-height: 1.6;
		padding-top: 0.7rem;
		border-top: 1px dashed rgba(200, 160, 32, 0.2);
	}

	.cheat-wink::before { content: '✦ '; color: #c8a020; font-style: normal; }

	/* ── Toast ── */
	.copy-toast {
		position: fixed;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%) translateY(10px);
		background: #c8a020;
		color: #0d1117;
		font-family: var(--font-mono);
		font-size: 12px;
		padding: 0.5rem 1.4rem;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.22s, transform 0.22s;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.copy-toast.show {
		opacity: 1;
		transform: translateX(-50%) translateY(0);
	}

	/* ── Footer ── */
	.page-footer {
		margin-top: 3.5rem;
		font-size: 11px;
		color: var(--text-dim);
		text-align: center;
		line-height: 2.2;
		max-width: 820px;
	}

	.page-footer a { color: var(--text-dim); text-decoration: underline; }
	.page-footer a:hover { color: var(--text-primary); }

	@media (max-width: 560px) {
		.cheat-card-top { grid-template-columns: 1fr; }
		.cheat-copy-btn { align-self: start; width: max-content; }
	}
</style>
