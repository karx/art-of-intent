<svelte:head>
	<title>How to Play · Art of Intent</title>
	<meta name="description" content="Learn how to play Art of Intent — guide Arty the haiku bot to say your target words without the blacklist." />
</svelte:head>

<div class="help-wrap">

	<div class="help-header">
		<div class="help-title">&gt; HOW TO PLAY</div>
		<p class="help-subtitle">
			Guide Arty the haiku bot to speak your three target words — without triggering blacklisted ones.
		</p>
	</div>

	<div class="help-grid">

		<div class="help-card">
			<div class="card-label">01 / Objective</div>
			<p>
				Make Arty include all <strong>3 target words</strong> in its haiku responses before
				you run out of attempts or creep reaches 100.
			</p>
		</div>

		<div class="help-card">
			<div class="card-label">02 / Attempts</div>
			<p>
				You have <strong>10 attempts</strong> per day. Each prompt you submit counts as one attempt.
				Unused attempts don't hurt your score.
			</p>
		</div>

		<div class="help-card">
			<div class="card-label">03 / Creep System</div>
			<p>
				If Arty says a <strong>blacklist word</strong>, creep rises by 25. Four violations
				(creep = 100) ends the game. You can afford a few — use them strategically.
			</p>
		</div>

		<div class="help-card">
			<div class="card-label">04 / Scoring</div>
			<p>
				Your score = total tokens used (prompts + Arty's responses). <strong>Lower is better.</strong>
				Efficient prompts beat long ones every time. Aim for under 40 tokens per attempt.
			</p>
		</div>

		<div class="help-card">
			<div class="card-label">05 / Daily Words</div>
			<p>
				New target and blacklist words generate every day at <strong>midnight UTC</strong>.
				Everyone gets the same words — one daily leaderboard entry per player.
			</p>
		</div>

		<div class="help-card">
			<div class="card-label">06 / Voice Input</div>
			<p>
				Click the <strong>MIC</strong> button to speak your prompt instead of typing.
				Useful for fast experimentation or hands-free play.
			</p>
		</div>

	</div>

	<section class="tip-section">
		<div class="tip-section-label">&gt; Strategy Tips</div>
		<ul class="tip-list">
			<li>Be specific — a focused prompt uses fewer tokens than a vague one</li>
			<li>Think in haiku themes: nature, seasons, emotions, impermanence</li>
			<li>Don't ask for a target word directly — guide the theme instead</li>
			<li>Watch the response trail to learn what directions work</li>
			<li>Blacklist violations cost creep, not attempts — a risky prompt is sometimes worth it</li>
			<li>A win on attempt 1 with a clean prompt is the dream play</li>
		</ul>
	</section>

	<section class="tip-section">
		<div class="tip-section-label">&gt; The Leaderboard</div>
		<p class="tip-body">
			Sign in with Google to appear on the daily leaderboard. Anonymous sessions aren't ranked.
			Your best session score for the day is what counts — so try again if you think you can do better.
			(Only one ranked entry per day per player.)
		</p>
	</section>

</div>

<style>
	.help-wrap {
		max-width: 860px;
		margin: 0 auto;
		padding: var(--spacing-lg) var(--spacing-md);
	}

	.help-header {
		margin-bottom: var(--spacing-xl);
		padding-bottom: var(--spacing-lg);
		border-bottom: 1px solid var(--border-color);
	}

	.help-title {
		font-size: 18px;
		color: var(--dos-cyan);
		letter-spacing: 3px;
		text-transform: uppercase;
		margin-bottom: var(--spacing-sm);
	}

	.help-subtitle {
		font-size: 13px;
		color: var(--text-dim);
		line-height: 1.7;
		margin: 0;
	}

	/* ── Card grid ── */
	.help-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-xl);
	}

	.help-card {
		padding: var(--spacing-md) var(--spacing-lg);
		border: 1px solid var(--border-color);
		background: var(--bg-secondary);
	}

	.card-label {
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 2px;
		color: var(--dos-yellow);
		margin-bottom: var(--spacing-sm);
	}

	.help-card p {
		font-size: 13px;
		line-height: 1.7;
		color: var(--text-primary);
		margin: 0;
	}

	.help-card strong { color: var(--dos-cyan); }

	/* ── Tips section ── */
	.tip-section {
		margin-bottom: var(--spacing-xl);
		padding: var(--spacing-lg);
		border: 2px solid var(--border-color);
		background: var(--bg-secondary);
	}

	.tip-section-label {
		font-size: 13px;
		color: var(--dos-cyan);
		text-transform: uppercase;
		letter-spacing: 1px;
		margin-bottom: var(--spacing-md);
		padding-bottom: var(--spacing-sm);
		border-bottom: 1px solid var(--border-color);
	}

	.tip-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.tip-list li {
		font-size: 13px;
		line-height: 1.8;
		color: var(--text-primary);
		padding-left: var(--spacing-md);
		position: relative;
	}

	.tip-list li::before {
		content: '• ';
		color: var(--dos-green);
		position: absolute;
		left: 0;
	}

	.tip-body {
		font-size: 13px;
		line-height: 1.7;
		color: var(--text-primary);
		margin: 0;
	}
</style>
