<svelte:head>
	<title>About · Art of Intent</title>
	<meta name="description" content="Learn about Art of Intent, the rules, gameplay, and creator information." />
</svelte:head>

<div class="about-wrap">

	<section class="about-section">
		<h2>About Art of Intent</h2>
		<p>
			Art of Intent is a daily word puzzle game that challenges your prompt engineering skills.
			Guide Arty, an AI haiku bot, to speak three target words without using any blacklisted words.
			Your score is based on token efficiency — the fewer tokens you use, the better your score.
		</p>
		<p>
			This game combines creative writing, strategic thinking, and AI interaction in a unique
			DOS-themed interface reminiscent of early 1990s computing.
		</p>
		<div class="callout">
			<span class="callout-badge">v2.0.0-alpha</span>
			Your feedback shapes the game!
			<br /><br />
			<strong>Join the Community:</strong><br />
			💬 <a href="https://discord.gg/9XV4HYKZqG" target="_blank" rel="noopener">discord.gg/9XV4HYKZqG</a>
			— Discuss strategies, share feedback, get updates<br />
			🐙 <a href="https://github.com/karx/art-of-intent" target="_blank" rel="noopener">github.com/karx/art-of-intent</a>
			— Report bugs, suggest features, contribute
		</div>
	</section>

	<section class="about-section">
		<h2>Game Rules</h2>

		<h3>Objective</h3>
		<p>Guide Arty the Haiku Bot to respond with all three target words before running out of attempts.</p>

		<h3>How to Play</h3>
		<ul>
			<li>Each day presents 3 new target words and 5–7 blacklist words</li>
			<li>You have 10 attempts to make Arty say all target words</li>
			<li>Type prompts to guide Arty's haiku responses</li>
			<li><strong>Creep System:</strong> If Arty uses a blacklist word, creep increases by 25</li>
			<li>Game ends when creep reaches 100 (allows 4 violations)</li>
			<li>Match all 3 target words before creep maxes out to win</li>
		</ul>

		<h3>Scoring</h3>
		<ul>
			<li>Your score is the total number of tokens used — lower is better</li>
			<li>Tokens include both your prompts and Arty's responses</li>
			<li>Efficient prompts lead to better scores</li>
			<li>Compare your score on the daily leaderboard</li>
		</ul>

		<h3>Daily Challenge</h3>
		<ul>
			<li>New words are generated at midnight UTC</li>
			<li>Everyone gets the same words each day</li>
			<li>One attempt per day to compete on the leaderboard</li>
			<li>Your progress is saved throughout the day</li>
		</ul>

		<h3>Tips &amp; Strategy</h3>
		<ul>
			<li>Be specific — vague requests use more tokens</li>
			<li>Think about haiku themes: nature, seasons, emotions, time</li>
			<li>Avoid directly asking for target words — be subtle</li>
			<li>Watch your token usage — aim for under 40 tokens per attempt</li>
			<li>Learn from the response trail to refine your approach</li>
			<li><strong>Manage creep:</strong> You can afford 3–4 blacklist violations, use them strategically</li>
		</ul>
	</section>

	<section class="about-section">
		<h2>Features</h2>

		<h3>Core Gameplay</h3>
		<ul>
			<li>Daily word challenges with consistent seeding</li>
			<li>AI-powered haiku generation using Gemini</li>
			<li>Real-time token tracking and efficiency metrics</li>
			<li>Visual progress indicators with ASCII art</li>
			<li>Voice input support for hands-free play</li>
		</ul>

		<h3>User Features</h3>
		<ul>
			<li>Anonymous play or sign in with Google</li>
			<li><strong>Share cards:</strong> Share a visual card with friends to showcase your results and step-by-step progression</li>
			<li>Session history and performance tracking</li>
			<li>Daily, weekly, and all-time leaderboards</li>
		</ul>

		<h3>DOS Aesthetic</h3>
		<ul>
			<li>Authentic MS-DOS console theme (early 1990s)</li>
			<li>IBM VGA 16-color palette</li>
			<li>ASCII borders and box-drawing characters</li>
			<li>Monospace typography throughout</li>
		</ul>
	</section>

	<section class="about-section">
		<h2>Technology</h2>
		<ul>
			<li><strong>Frontend:</strong> SvelteKit</li>
			<li><strong>AI:</strong> Google Gemini API</li>
			<li><strong>Backend:</strong> Firebase (Authentication, Firestore, Cloud Functions)</li>
			<li><strong>Hosting:</strong> Netlify</li>
		</ul>
	</section>

	<section class="about-section">
		<h2>Creator</h2>
		<p>
			Art of Intent was created by <strong>Kartik (karx)</strong>, a developer passionate about
			AI interaction design, retro computing aesthetics, and creative word games.
		</p>
		<p>
			The game was designed to explore the intersection of prompt engineering, creative writing,
			and game design, wrapped in a nostalgic DOS-era interface.
		</p>
		<p>
			<strong>Discord:</strong>
			<a href="https://discord.gg/9XV4HYKZqG" target="_blank" rel="noopener">discord.gg/9XV4HYKZqG</a><br />
			<strong>GitHub:</strong>
			<a href="https://github.com/karx/art-of-intent" target="_blank" rel="noopener">github.com/karx/art-of-intent</a>
		</p>
	</section>

	<section class="about-section">
		<h2>License &amp; Rights</h2>
		<p>Art of Intent is proprietary software created and owned by Kartik (karx).</p>
		<div class="license-box">
			<strong>© 2025 Kartik (karx). All Rights Reserved.</strong>
			<br /><br />
			<strong>Terms of Use:</strong>
			<ul>
				<li>Personal use and gameplay are permitted and encouraged</li>
				<li>Modification, duplication, or commercial use without written permission is prohibited</li>
				<li>Derivative works require explicit written consent from the creator</li>
				<li>Sharing links to the official game is encouraged</li>
			</ul>
			<br />
			<strong>Prohibited:</strong> clones, source redistribution, commercial exploitation, removing copyright notices.
			<br /><br />
			For licensing inquiries, contact the creator directly.
		</div>
		<p class="muted">
			This game uses Google Gemini API and Firebase services, subject to their respective terms of service.
		</p>
	</section>

	<section class="about-section">
		<h2>Version History</h2>

		<div class="version-entry">
			<strong>v2.0.0-alpha</strong> — The Intelligence Update <span class="muted">(2026-03-22)</span>
			<ul>
				<li>Haiku Dictionary: [?] button per target word shows sample haikus for inspiration</li>
				<li>AI Benchmark: Post-game comparison shows how the AI attempted the same puzzle</li>
				<li>Training Log: Tabbed view illustrating in-context learning with word difficulty scores</li>
			</ul>
		</div>

		<div class="version-entry">
			<strong>v1.2.0-alpha</strong> — The Black Update <span class="muted">(2025-10-28)</span>
			<ul>
				<li>Creep System: Progressive penalty for blacklist violations</li>
				<li>4 violations allowed before game over (25 creep each)</li>
				<li>Color-coded creep indicator (0–100 scale)</li>
			</ul>
		</div>

		<div class="version-entry">
			<strong>v1.1.0-alpha</strong> — Share Card Enhancement <span class="muted">(2025-01-28)</span>
			<ul>
				<li>Step-based creep visualization showing per-attempt progression</li>
				<li>Event indicators for blacklist/security events</li>
			</ul>
		</div>

		<div class="version-entry">
			<strong>v1.0.0-alpha</strong> — Side Navigation Update <span class="muted">(2025-10-25)</span>
			<ul>
				<li>Collapsible sidebar navigation</li>
				<li>Keyboard shortcuts (Ctrl+B, F1, etc.)</li>
				<li>Mobile-optimized top navigation</li>
			</ul>
		</div>

		<div class="version-entry">
			<strong>v0.2.0</strong> — Firebase Integration
			<ul>
				<li>MS-DOS console theme, Firebase Auth + Firestore</li>
				<li>Leaderboard, achievements, session persistence</li>
			</ul>
		</div>

		<div class="version-entry">
			<strong>v0.1.0</strong> — Initial Release
			<ul>
				<li>Core game mechanics, Gemini API integration, daily word generation</li>
			</ul>
		</div>
	</section>

	<section class="about-section">
		<h2>Acknowledgments</h2>
		<ul>
			<li><strong>Google Gemini:</strong> AI haiku generation</li>
			<li><strong>Firebase:</strong> Backend infrastructure</li>
			<li><strong>Netlify:</strong> Hosting and deployment</li>
			<li><strong>DOMPurify (Cure53):</strong> XSS protection</li>
			<li><strong>IBM VGA Font:</strong> Authentic DOS typography</li>
			<li><strong>Early Computing Era:</strong> Design inspiration</li>
		</ul>
	</section>

</div>

<style>
	.about-wrap {
		max-width: 860px;
		margin: 0 auto;
		padding: var(--spacing-lg) var(--spacing-md);
	}

	.about-section {
		margin-bottom: var(--spacing-xl);
		padding: var(--spacing-lg);
		border: 2px solid var(--border-color);
		background: var(--bg-secondary);
	}

	.about-section h2 {
		font-size: 15px;
		color: var(--dos-cyan);
		text-transform: uppercase;
		margin: 0 0 var(--spacing-md);
		padding-bottom: var(--spacing-sm);
		border-bottom: 1px solid var(--border-color);
	}

	.about-section h2::before {
		content: '> ';
		color: var(--dos-yellow);
	}

	.about-section h3 {
		font-size: 13px;
		color: var(--dos-green);
		text-transform: uppercase;
		margin: var(--spacing-md) 0 var(--spacing-sm);
	}

	.about-section h3::before {
		content: '>> ';
		color: var(--text-dim);
	}

	.about-section p,
	.about-section li {
		font-size: 13px;
		line-height: 1.7;
		color: var(--text-primary);
	}

	.about-section p { margin-bottom: var(--spacing-sm); }

	.about-section ul {
		list-style: none;
		padding-left: var(--spacing-md);
		margin-bottom: var(--spacing-sm);
	}

	.about-section li {
		margin-bottom: 4px;
	}

	.about-section li::before {
		content: '• ';
		color: var(--dos-cyan);
	}

	.about-section a {
		color: var(--dos-cyan);
		text-decoration: underline;
	}

	.about-section a:hover { color: var(--text-primary); }

	.callout {
		margin-top: var(--spacing-md);
		padding: var(--spacing-md);
		border: 1px solid var(--dos-cyan);
		background: var(--bg-primary);
		font-size: 13px;
		line-height: 1.8;
		color: var(--text-primary);
	}

	.callout-badge {
		color: var(--dos-yellow);
		font-weight: bold;
		margin-right: 6px;
	}

	.license-box {
		background: var(--bg-primary);
		border: 1px solid var(--error-color);
		padding: var(--spacing-md);
		margin: var(--spacing-sm) 0;
		font-size: 12px;
		line-height: 1.7;
		color: var(--text-primary);
	}

	.license-box strong { color: var(--error-color); }

	.license-box ul {
		list-style: none;
		padding-left: 1rem;
		margin: 6px 0;
	}

	.license-box li::before {
		content: '• ';
		color: var(--error-color);
	}

	.version-entry {
		margin-bottom: var(--spacing-md);
		font-size: 13px;
		color: var(--text-primary);
		line-height: 1.6;
	}

	.version-entry ul {
		list-style: none;
		padding-left: var(--spacing-md);
		margin: 4px 0 0;
	}

	.version-entry li::before {
		content: '• ';
		color: var(--dos-cyan);
	}

	.muted { color: var(--text-dim); }
</style>
