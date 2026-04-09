<script lang="ts">
	import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
	import { db } from '$lib/firebase';
	import { authState, signInGoogle, signInAnon } from '$lib/stores/auth.svelte';
	import { callArtyAPI } from '$lib/api';
	import { gameState, applyAttemptResult } from '$lib/stores/game.svelte';
	import { getRating, calculateEfficiency } from '$lib/scoring';
	import { generateShareCardSVG, shareCard, downloadCard, previewCard, type ShareCardData } from '$lib/share-card';
	import remarksData from '$lib/arty-remarks.json';
	import { sound } from '$lib/sound';
	import { detectCheatCode, type CheatCode } from '$lib/cheat-codes';

	// ── Types ─────────────────────────────────────────────────────────────────
	interface TrailEntry {
		number: number;
		prompt: string;
		haiku: string;
		timestamp: string;
		promptTokens: number;
		outputTokens: number;
		tokens: number;
		newMatches: string[];
		blacklistHits: string[];   // blacklist words in Arty's response
		creepIncrease: number;
		creepLevel: number;
		violation: boolean;        // user prompt contained a restricted word
		violatedWords: string[];
		type: 'normal' | 'success' | 'violation' | 'victory' | 'defeat' | 'cheat';
		cheatCode?: { id: string; title: string; author: string; year: string; wink: string };
	}

	// ── UI state ──────────────────────────────────────────────────────────────
	let prompt       = $state('');
	let loading      = $state(false);
	let error        = $state('');
	let trail        = $state<TrailEntry[]>([]);
	let thinking     = $state(false);
	let thinkingRemark = $state('contemplating...');
	let trailEnd: HTMLElement | undefined;  // scroll anchor

	// Voice / mic
	let micRecording = $state(false);
	function handleMic() {
		const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
		if (!SR) { showToast('Voice input not supported in this browser', 'error'); return; }
		const rec = new SR();
		rec.continuous = false;
		rec.interimResults = false;
		rec.onstart  = () => { micRecording = true; };
		rec.onend    = () => { micRecording = false; };
		rec.onerror  = () => { micRecording = false; };
		rec.onresult = (e: any) => {
			const transcript: string = e.results[0][0].transcript;
			prompt = transcript;
			// Auto-submit after a short delay so the textarea updates first
			setTimeout(() => { if (transcript.trim()) submit(); }, 300);
		};
		rec.start();
	}

	// Toast
	let toastMsg   = $state('');
	let toastType  = $state<'success' | 'error' | 'info'>('info');
	let toastTimer: ReturnType<typeof setTimeout> | null = null;
	function showToast(msg: string, type: typeof toastType = 'info') {
		toastMsg  = msg;
		toastType = type;
		if (toastTimer) clearTimeout(toastTimer);
		toastTimer = setTimeout(() => { toastMsg = ''; }, 3500);
	}

	// ── Arty remarks ─────────────────────────────────────────────────────────
	const remarks: string[] = (remarksData as { remarks: string[] }).remarks ?? ['contemplating...'];
	let lastRemark = '';
	function nextRemark(): string {
		const pool = remarks.filter(r => r !== lastRemark);
		const r = pool[Math.floor(Math.random() * pool.length)];
		lastRemark = r;
		return r;
	}
	let remarkInterval: ReturnType<typeof setInterval> | null = null;
	function startThinking() {
		thinking = true;
		thinkingRemark = nextRemark();
		remarkInterval = setInterval(() => { thinkingRemark = nextRemark(); }, 2500);
	}
	function stopThinking() {
		thinking = false;
		if (remarkInterval) { clearInterval(remarkInterval); remarkInterval = null; }
	}

	// ── Derived ───────────────────────────────────────────────────────────────
	const efficiency = $derived(calculateEfficiency(gameState.totalTokens, gameState.attempts));
	const rating     = $derived(getRating(efficiency));
	const today      = new Date().toISOString().split('T')[0];
	const creepClass = $derived(
		gameState.creepLevel >= 75 ? 'creep-critical' :
		gameState.creepLevel >= 50 ? 'creep-high'     :
		gameState.creepLevel >= 25 ? 'creep-medium'   : 'creep-low'
	);

	// ── localStorage persistence ───────────────────────────────────────────────
	const LS_KEY = `aoi_game_${today}`;

	function saveToStorage() {
		try {
			localStorage.setItem(LS_KEY, JSON.stringify({
				attempts:      gameState.attempts,
				totalTokens:   gameState.totalTokens,
				matchedWords:  [...gameState.matchedWords],
				creepLevel:    gameState.creepLevel,
				gameOver:      gameState.gameOver,
				wonGame:       gameState.wonGame,
				cheated:       gameState.cheated,
				sessionId:     gameState.sessionId,
				targetWords:   gameState.targetWords,
				blacklistWords:gameState.blacklistWords,
				currentDate:   gameState.currentDate,
				trail,
			}));
		} catch { /* storage full — non-fatal */ }
	}

	function loadFromStorage(): boolean {
		try {
			const raw = localStorage.getItem(LS_KEY);
			if (!raw) return false;
			const saved = JSON.parse(raw);
			if (saved.currentDate !== today) return false;
			gameState.attempts       = saved.attempts      ?? 0;
			gameState.totalTokens    = saved.totalTokens   ?? 0;
			gameState.matchedWords   = new Set(saved.matchedWords ?? []);
			gameState.creepLevel     = saved.creepLevel    ?? 0;
			gameState.gameOver       = saved.gameOver      ?? false;
			gameState.wonGame        = saved.wonGame       ?? false;
			gameState.cheated        = saved.cheated       ?? false;
			gameState.sessionId      = saved.sessionId     ?? null;
			gameState.targetWords    = saved.targetWords   ?? [];
			gameState.blacklistWords = saved.blacklistWords ?? [];
			gameState.currentDate    = saved.currentDate   ?? today;
			trail                    = saved.trail         ?? [];
			return true;
		} catch { return false; }
	}

	// ── Scroll new trail items into view ──────────────────────────────────────
	$effect(() => {
		// Re-run whenever trail length or thinking state changes
		void trail.length;
		void thinking;
		trailEnd?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
	});

	// ── Load on auth ready ────────────────────────────────────────────────────
	let wordsLoaded = false;
	$effect(() => {
		if (authState.user && !wordsLoaded) {
			wordsLoaded = true;
			initGame();
		}
	});

	async function initGame() {
		if (loadFromStorage() && gameState.targetWords.length > 0) { error = ''; return; }
		await loadDailyWords();
	}

	async function loadDailyWords() {
		try {
			const snap = await getDoc(doc(db, 'dailyWords', today));
			if (!snap.exists()) { error = "Today's words aren't ready yet. Try refreshing."; return; }
			const data = snap.data();
			gameState.targetWords    = data.targetWords    ?? [];
			gameState.blacklistWords = data.blacklistWords ?? [];
			gameState.currentDate    = today;
			gameState.sessionId      = crypto.randomUUID();
			error = '';
			saveToStorage();
		} catch { error = "Failed to load today's words. Please refresh."; }
	}

	// ── Cheat code handler ───────────────────────────────────────────────────
	function processCheat(code: CheatCode) {
		const unmatchedWords = gameState.targetWords.filter(w => !gameState.matchedWords.has(w));
		const giftedWord     = unmatchedWords[0] ?? gameState.targetWords[0] ?? '';

		gameState.cheated  = true;
		gameState.attempts += 1;

		const newMatched = new Set(gameState.matchedWords);
		if (giftedWord) newMatched.add(giftedWord);
		gameState.matchedWords = newMatched;

		const allMatched = gameState.targetWords.length > 0 && newMatched.size >= gameState.targetWords.length;
		if (allMatched) { gameState.gameOver = true; gameState.wonGame = true; }

		const entry: TrailEntry = {
			number:       gameState.attempts,
			prompt:       `✦ ${code.lines.join(' / ')}`,
			haiku:        giftedWord ? code.funResponse(giftedWord) : `✦ ${code.title} ✦`,
			timestamp:    new Date().toLocaleTimeString(),
			promptTokens: 0, outputTokens: 0, tokens: 0,
			newMatches:   giftedWord ? [giftedWord] : [],
			blacklistHits: [], creepIncrease: 0, creepLevel: gameState.creepLevel,
			violation: false, violatedWords: [],
			type: allMatched ? 'victory' : 'cheat',
			cheatCode: { id: code.id, title: code.title, author: code.author, year: code.year, wink: code.wink },
		};

		trail = [...trail, entry];
		sound.playCheatCode();
		if (allMatched) setTimeout(() => sound.playVictory(), 650);
		saveToStorage();
		if (allMatched) saveSessionToFirestore();
	}

	// ── Game loop ─────────────────────────────────────────────────────────────
	async function submit() {
		const text = prompt.trim();
		if (!text || loading || gameState.gameOver || !authState.user) return;

		// ── Cheat code detection ──────────────────────────────────────────────
		const cheatMatch = detectCheatCode(text);
		if (cheatMatch) { processCheat(cheatMatch.code); prompt = ''; return; }
		// ─────────────────────────────────────────────────────────────────────

		const lower         = text.toLowerCase();
		const violatedWords = [...gameState.blacklistWords, ...gameState.targetWords]
			.filter(w => lower.includes(w.toLowerCase()));

		if (violatedWords.length > 0) {
			const creepIncrease = violatedWords.length * gameState.creepPerViolation;
			const prevCreep     = gameState.creepLevel;
			const newCreep      = Math.min(prevCreep + creepIncrease, gameState.creepThreshold);
			const creepMaxed    = newCreep >= gameState.creepThreshold;

			const entry: TrailEntry = {
				number:       gameState.attempts + 1,
				prompt:       text,
				haiku:        creepMaxed
					? 'Darkness now consumes all,\nThe creep has claimed its victory,\nSilence falls complete.'
					: `Shadows grow deeper now,\nDarkness creeps (${prevCreep} → ${newCreep}),\nTread carefully forth.`,
				timestamp:    new Date().toLocaleTimeString(),
				promptTokens: 0, outputTokens: 0, tokens: 0,
				newMatches: [], blacklistHits: [],
				creepIncrease, creepLevel: newCreep,
				violation: true, violatedWords,
				type: creepMaxed ? 'defeat' : 'violation',
			};

			gameState.attempts++;
			gameState.creepLevel = newCreep;
			if (creepMaxed) { gameState.gameOver = true; gameState.wonGame = false; sound.playDefeat(); }
			trail  = [...trail, entry];
			prompt = '';
			error  = '';
			saveToStorage();
			if (creepMaxed) saveSessionToFirestore();
			return;
		}

		error   = '';
		loading = true;
		sound.playSubmit();
		startThinking();

		try {
			const resp         = await callArtyAPI(text, gameState.sessionId ?? '');
			stopThinking();
			const responseText = resp.responseText;
			const respLower    = responseText.toLowerCase();
			const promptTokens = resp.userPromptTokens;
			const outputTokens = resp.usageMetadata?.candidatesTokenCount ?? 0;
			const tokens       = promptTokens + outputTokens;

			const newMatches    = gameState.targetWords.filter(
				w => !gameState.matchedWords.has(w) && respLower.includes(w.toLowerCase())
			);
			const blacklistHits = gameState.blacklistWords.filter(w => respLower.includes(w.toLowerCase()));
			const creepIncrease = blacklistHits.length * gameState.creepPerViolation;
			const newCreep      = Math.min(gameState.creepLevel + creepIncrease, gameState.creepThreshold);

			const next = applyAttemptResult(gameState, { tokens, newMatches, blacklistViolations: blacklistHits.length });
			Object.assign(gameState, next);
			gameState.matchedWords = next.matchedWords;

			// Audio feedback
			if (next.wonGame)          sound.playVictory();
			else if (next.gameOver)    sound.playDefeat();
			else if (newMatches.length > 0) sound.playMatch();
			else                       sound.playMiss();

			const entry: TrailEntry = {
				number:       next.attempts,
				prompt:       text,
				haiku:        responseText,
				timestamp:    new Date().toLocaleTimeString(),
				promptTokens, outputTokens, tokens,
				newMatches, blacklistHits, creepIncrease, creepLevel: newCreep,
				violation: false, violatedWords: [],
				type: next.wonGame ? 'victory'
				    : next.gameOver ? 'defeat'
				    : newMatches.length > 0 ? 'success' : 'normal',
			};

			trail  = [...trail, entry];
			prompt = '';
			saveToStorage();
			if (next.gameOver) saveSessionToFirestore();
		} catch (e: any) {
			stopThinking();
			error = e.message;
		} finally {
			loading = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(); }
	}

	// ── Firestore session save ────────────────────────────────────────────────
	async function saveSessionToFirestore() {
		const user = authState.user;
		if (!user || !gameState.sessionId) return;

		const isVictory = gameState.wonGame;
		const efficiencyScore = gameState.cheated
			? null
			: (isVictory ? gameState.attempts * 10 + Math.floor(gameState.totalTokens / 10) : null);

		try {
			await setDoc(
				doc(db, 'sessions', gameState.sessionId),
				{
					sessionId:         gameState.sessionId,
					userId:            user.uid,
					displayName:       user.displayName ?? user.email ?? 'Anonymous',
					userName:          user.displayName ?? 'Anonymous',
					gameDate:          today,
					date:              today,
					targetWords:       gameState.targetWords,
					blacklistWords:    gameState.blacklistWords,
					status:            'completed',
					result:            isVictory ? 'victory' : 'defeat',
					isWin:             isVictory,
					cheated:           gameState.cheated,
					attempts:          gameState.attempts,
					totalTokens:       gameState.totalTokens,
					matchedWords:      [...gameState.matchedWords],
					matchedWordsCount: gameState.matchedWords.size,
					efficiencyScore,
					updatedAt:         serverTimestamp(),
					createdAt:         serverTimestamp(),
					isPublic:          true,
				},
				{ merge: true },
			);
		} catch (e) {
			console.error('saveSessionToFirestore failed', e);
		}
	}

	// ── Share ─────────────────────────────────────────────────────────────────
	function buildCardData(): ShareCardData {
		return {
			result:         gameState.wonGame ? 'WIN' : 'LOSS',
			attempts:       gameState.attempts,
			tokens:         gameState.totalTokens,
			matches:        `${gameState.matchedWords.size}/${gameState.targetWords.length}`,
			date:           today,
			userName:       authState.user?.displayName ?? 'Guest',
			targetWords:    gameState.targetWords,
			matchedWords:   [...gameState.matchedWords],
			creepLevel:     gameState.creepLevel,
			creepThreshold: gameState.creepThreshold,
			cheated:        gameState.cheated,
			efficiencyScore: gameState.cheated ? null : efficiency,
			responseTrail: trail
				.filter(e => !e.violation)
				.map(e => ({
					number:    e.number,
					prompt:    e.prompt,
					response:  e.haiku,
					foundWords: e.newMatches,
					isCheat:   e.type === 'cheat' || (e.type === 'victory' && !!e.cheatCode),
					cheatCode: e.cheatCode ? { title: e.cheatCode.title } : undefined,
				})),
		};
	}

	function buildShareText(): string {
		const best = trail
			.filter(e => !e.violation && e.newMatches.length > 0)
			.sort((a, b) => b.newMatches.length - a.newMatches.length)[0];
		const hint = best?.haiku?.trim().split('\n')[0];
		const haikuHint = hint ? `\n"${hint}…"` : '';
		if (gameState.wonGame)
			return `🎯 Art of Intent — ${gameState.matchedWords.size}/${gameState.targetWords.length} words in ${gameState.attempts} attempts${haikuHint}\n\nCan you beat it? → https://art-of-intent.netlify.app`;
		return `🎮 Art of Intent — ${gameState.matchedWords.size}/${gameState.targetWords.length} words. This haiku bot is tricky!${haikuHint}\n\nTry today's puzzle → https://art-of-intent.netlify.app`;
	}

	async function handlePreview() {
		try { previewCard(generateShareCardSVG(buildCardData())); }
		catch { showToast('Could not generate preview', 'error'); }
	}

	async function handleShare() {
		try {
			const outcome = await shareCard(generateShareCardSVG(buildCardData()), 'Art of Intent', buildShareText());
			if (outcome === 'downloaded') showToast('Card saved — share it anywhere!', 'success');
		} catch { await copyText(); }
	}

	async function copyText() {
		try {
			await navigator.clipboard.writeText(buildShareText());
			showToast('Score copied!', 'success');
		} catch { showToast('Could not copy', 'error'); }
	}
</script>

<svelte:head>
	<title>Art of Intent — Daily AI Word Puzzle</title>
	<meta name="description" content="Guide Arty the Haiku Bot with clever prompts. Hit 3 target words, avoid forbidden ones. Daily AI puzzle with global leaderboard." />
	<link rel="canonical" href="https://art-of-intent.netlify.app/" />
	<meta property="og:url" content="https://art-of-intent.netlify.app/" />
	<meta property="og:title" content="Art of Intent — Daily AI Word Puzzle" />
	<meta property="og:description" content="Guide Arty the Haiku Bot with clever prompts. Hit 3 target words, avoid forbidden ones. Daily AI puzzle with global leaderboard." />
	<meta name="twitter:title" content="Art of Intent — Daily AI Word Puzzle" />
	<meta name="twitter:description" content="Guide Arty the Haiku Bot with clever prompts. Hit 3 target words, avoid forbidden ones. Daily AI puzzle with global leaderboard." />
</svelte:head>

<div class="container main-content">

	<!-- ── Word display (sticky) ─────────────────────────────────────────── -->
	<section class="game-words-section" aria-label="Today's words">
		<div class="words-container">

			<div class="words-group target-group">
				<h3>TARGET</h3>
				<div class="word-list">
					{#each gameState.targetWords as word}
						<span class="word-badge {gameState.matchedWords.has(word) ? 'found' : ''}">
							{word}
						</span>
					{/each}
				</div>
			</div>

			<div class="words-divider">│</div>

			<div class="words-group blacklist-group">
				<h3>AVOID</h3>
				<div class="word-list">
					{#each gameState.blacklistWords as word}
						<span class="word-badge">{word}</span>
					{/each}
				</div>
			</div>

		</div>

		<div class="score-compact">
			<span>ATT <strong>{gameState.attempts}</strong>/10</span>
			<span>TOK <strong>{gameState.totalTokens}</strong></span>
			<span>MAT <strong>{gameState.matchedWords.size}/{gameState.targetWords.length}</strong></span>
			<span>CREEP <strong class="creep-indicator {creepClass}">{gameState.creepLevel}</strong>/100</span>
			{#if gameState.attempts > 0}
				<span class="text-{rating.color}">{efficiency} tok/att {rating.stars}</span>
			{/if}
		</div>
	</section>

	<!-- ── Response trail ────────────────────────────────────────────────── -->
	<section class="response-trail" aria-label="Response trail">
		<div class="trail-container">

			{#if trail.length === 0 && !thinking}
				{#if !authState.ready}
					<div class="empty-state">Loading…</div>
				{:else if !authState.user}
					<!-- ── Onboarding panel ─────────────────────────────────── -->
					<div class="onboarding-panel">
						<div class="onboarding-title">HOW TO PLAY</div>
						<ol class="onboarding-steps">
							<li>Three <span class="ob-target">TARGET</span> words are chosen daily.</li>
							<li>Write a prompt — Arty the haiku bot will respond.</li>
							<li>Get Arty to say all three targets without using any <span class="ob-avoid">AVOID</span> words.</li>
							<li>Score is based on tokens used — fewer is better.</li>
						</ol>
						<div class="onboarding-cta-label">Ready? Choose how to play:</div>
						<div class="onboarding-actions">
							<button class="btn-primary ob-btn" onclick={signInGoogle}>
								Sign in with Google
							</button>
							<button class="btn-secondary ob-btn" onclick={signInAnon}>
								Continue as Guest
							</button>
						</div>
						<div class="onboarding-note">
							Guest progress is saved in this browser only. Sign in to access the leaderboard.
						</div>
					</div>
				{:else}
					<div class="empty-state">No attempts yet — enter your prompt below.</div>
				{/if}
			{/if}

			{#each trail as entry}
				{@const isViol = entry.violation}
				{@const itemClass =
					entry.type === 'victory'   ? 'trail-item--victory'   :
					entry.type === 'defeat'    ? 'trail-item--violation' :
					entry.type === 'violation' ? 'trail-item--violation' :
					entry.type === 'success'   ? 'trail-item--success'   :
					entry.type === 'cheat'     ? 'trail-item--cheat'     : ''}

				<div class="trail-item {itemClass}">

					<!-- Header: attempt number + timestamp -->
					<div class="trail-header">
						<span>
							{#if entry.type === 'victory'}VICTORY
							{:else if entry.type === 'defeat'}GAME OVER
							{:else if entry.type === 'cheat'}✦ CHEAT CODE — {entry.cheatCode?.title}
							{:else if isViol}VIOLATION
							{:else}Attempt #{entry.number}
							{/if}
						</span>
						<span>{entry.timestamp}</span>
					</div>

					<!-- Prompt — theme adds "> USER: " prefix via ::before -->
					<div class="trail-prompt">{entry.prompt}</div>

					<!-- Response — theme adds "< ARTY: " prefix via ::before -->
					<div class="trail-response {isViol ? 'trail-response--dim' : ''}">{entry.haiku}</div>

					<!-- Token bar -->
					{#if !isViol && entry.tokens > 0}
						{@const max = 200}
						{@const pp = Math.min((entry.promptTokens / max) * 100, 100)}
						{@const op = Math.min((entry.outputTokens / max) * 100, 100)}
						<div class="trail-stats-compact">
							<div class="stats-bar">
								<div class="stats-bar-segment stats-bar-prompt" style="width:{pp}%"
									title="Prompt: {entry.promptTokens} tok"></div>
								<div class="stats-bar-segment stats-bar-output" style="width:{op}%"
									title="Output: {entry.outputTokens} tok"></div>
							</div>
							<div class="stats-info">
								<span class="stats-tokens">{entry.tokens} tok</span>
								{#if entry.newMatches.length > 0}
									<span class="stats-hits">
										{#each entry.newMatches as _w}<span class="hit-dot" title={_w}>●</span>{/each}
									</span>
								{/if}
							</div>
						</div>
					{/if}

					<!-- Matched words -->
					{#if entry.newMatches.length > 0}
						<div class="match-indicator">
							<strong>Found:</strong>
							{#each entry.newMatches as w}
								<span class="match-word found">{w}</span>
							{/each}
							{#if entry.type === 'victory'}
								<span class="all-matched">[ALL TARGETS MATCHED]</span>
							{/if}
						</div>
					{/if}

					<!-- Violation feedback -->
					{#if isViol && entry.violatedWords.length > 0}
						<div class="violation-warning">
							<div class="violation-header">
								{entry.type === 'defeat' ? '▓▓▓ threshold reached' : 'input rejected'}
							</div>
							<div class="violation-words">words: {entry.violatedWords.join(', ')}</div>
							<div class="creep-change">creep +{entry.creepIncrease} → {entry.creepLevel}/100</div>
							{#if entry.type !== 'defeat'}
								<div class="creep-warning">no tokens consumed</div>
							{/if}
						</div>
					{/if}

					<!-- Cheat code attribution -->
					{#if entry.cheatCode}
						<div class="cheat-badge">
							<span class="cheat-badge-icon">✦</span>
							<span class="cheat-badge-text">{entry.cheatCode.author}, {entry.cheatCode.year}</span>
							<span class="cheat-badge-sep">·</span>
							<span class="cheat-badge-wink">{entry.cheatCode.wink}</span>
							<span class="cheat-badge-sep">·</span>
							<a href="/cheat" class="cheat-badge-link">all cheat codes →</a>
						</div>
					{/if}

					<!-- Arty said blacklist word(s) -->
					{#if entry.blacklistHits.length > 0}
						<div class="violation-warning violation-warning--darkness">
							<div class="violation-header">▓ darkness creeps</div>
							<div class="violation-words">words: {entry.blacklistHits.join(', ')}</div>
							<div class="creep-change">+{entry.creepIncrease} → {entry.creepLevel}/100</div>
						</div>
					{/if}

				</div>
			{/each}

			<!-- Arty thinking -->
			{#if thinking}
				<div class="trail-item trail-item--thinking">
					<div class="thinking-header">
						<span class="thinking-label">ARTY</span>
						<span class="loading" aria-hidden="true"></span>
					</div>
					<div class="thinking-remark">{thinkingRemark}</div>
				</div>
			{/if}

			<!-- Error -->
			{#if error}
				<div class="trail-error-inline">
					<span>⚠</span> {error}
				</div>
			{/if}

			<!-- Scroll anchor -->
			<div bind:this={trailEnd}></div>

		</div>
	</section>

	<!-- ── Game-over panel ───────────────────────────────────────────────── -->
	{#if gameState.gameOver}
		<div class="game-over-panel {gameState.wonGame ? 'game-over-panel--win' : 'game-over-panel--loss'}">
			<div class="game-over-title">
				{gameState.wonGame ? '✦ VICTORY' : '✦ DARKNESS WINS'}
			</div>
			<div class="game-over-stats">
				<span>{gameState.attempts} att</span>
				<span>·</span>
				<span>{gameState.totalTokens} tok</span>
				<span>·</span>
				<span>{efficiency} tok/att</span>
				<span>·</span>
				<span class="text-{rating.color}">{rating.stars} {rating.label}</span>
			</div>
			<div class="game-over-actions">
				<button class="btn-secondary" onclick={handlePreview}>Preview Card</button>
				<button class="btn-primary" onclick={handleShare}>
					{'share' in navigator ? 'Share Card' : 'Save Card'}
				</button>
				<button class="btn-secondary" onclick={copyText}>Copy Text</button>
			</div>
			<div class="game-over-cta">Come back tomorrow for a new challenge.</div>
		</div>
	{/if}

	<!-- ── Prompt input ───────────────────────────────────────────────────── -->
	{#if !gameState.gameOver}
		<div class="input-section">
			<div class="input-header">
				<span class="text-dim" style="font-size:11px;text-transform:uppercase;letter-spacing:1px;">
					{#if !authState.user}↑ sign in or continue as guest above to play
					{:else if gameState.targetWords.length === 0}loading words…
					{:else}prompt arty — ctrl+enter to send
					{/if}
				</span>
				<span class="char-counter">{prompt.length} / 500</span>
			</div>
			<div class="input-wrapper">
				<textarea
					class="code-editor-input"
					placeholder="What do you want Arty to write about?"
					rows="3"
					maxlength="500"
					disabled={loading || !authState.user || gameState.targetWords.length === 0}
					bind:value={prompt}
					onkeydown={handleKeydown}
				></textarea>
				<div class="input-controls">
					<button
						class="voice-btn"
						class:recording={micRecording}
						disabled={loading || !authState.user || gameState.targetWords.length === 0 || micRecording}
						onclick={handleMic}
						title="Voice input"
					>MIC</button>
					<button
						class="submit-btn"
						disabled={loading || !prompt.trim() || !authState.user || gameState.targetWords.length === 0}
						onclick={submit}
					>
						{loading ? 'Thinking' : 'Send'}
					</button>
				</div>
			</div>
		</div>
	{/if}

</div>

<!-- Toast notification -->
{#if toastMsg}
	<div class="aoi-toast aoi-toast--{toastType}" role="status">{toastMsg}</div>
{/if}

<style>
	/* ── Bits not in the global theme ────────────────────────────────────── */

	/* ── Cheat code trail item ───────────────────────────────────────────── */
	:global(.trail-item--cheat) {
		border-left: 3px solid var(--accent-yellow, #f0c040);
		animation: cheatSparkle 3s ease-in-out;
	}
	@keyframes cheatSparkle {
		0%, 100% { border-left-color: var(--accent-yellow, #f0c040); }
		50%       { border-left-color: var(--info-color, #4fc3f7); }
	}
	:global(.cheat-badge) {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4em;
		margin-top: 0.5em;
		padding: 0.3em 0.6em;
		font-size: 11px;
		background: rgba(240, 192, 64, 0.08);
		border: 1px solid rgba(240, 192, 64, 0.25);
		color: var(--accent-yellow, #f0c040);
	}
	:global(.cheat-badge-icon)  { font-size: 13px; }
	:global(.cheat-badge-text)  { font-weight: bold; }
	:global(.cheat-badge-sep)   { opacity: 0.4; }
	:global(.cheat-badge-wink)  { font-style: italic; opacity: 0.9; }
	:global(.cheat-badge-link)  {
		color: inherit;
		opacity: 0.7;
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	:global(.cheat-badge-link:hover) { opacity: 1; }

	/* Dim haiku text for violation entries */
	:global(.trail-response--dim) {
		opacity: 0.45;
		font-style: italic;
	}

	/* Inline error in trail */
	.trail-error-inline {
		color: var(--error-color);
		padding: var(--spacing-sm) 0;
		font-size: 13px;
	}

	/* Game-over panel */
	.game-over-panel {
		margin: var(--spacing-md) 0;
		padding: var(--spacing-md) var(--spacing-lg);
		border: 2px double var(--border-color);
		background: var(--bg-secondary);
		position: relative;
	}
	.game-over-panel--win  { border-color: var(--success-color); }
	.game-over-panel--loss { border-color: var(--error-color);   }

	.game-over-panel--win::before  { content: '╔══ VICTORY ══╗'; }
	.game-over-panel--loss::before { content: '╔══ DEFEAT ══╗'; }
	.game-over-panel::before {
		display: block;
		font-size: 10px;
		letter-spacing: 1px;
		color: var(--text-dim);
		margin-bottom: var(--spacing-sm);
	}

	.game-over-title {
		font-size: 18px;
		font-weight: bold;
		letter-spacing: 2px;
		text-transform: uppercase;
		margin-bottom: var(--spacing-sm);
	}
	.game-over-panel--win  .game-over-title { color: var(--success-color); }
	.game-over-panel--loss .game-over-title { color: var(--error-color);   }

	.game-over-stats {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
		font-size: 13px;
		color: var(--text-primary);
		margin-bottom: var(--spacing-md);
	}

	.game-over-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-sm);
	}

	.game-over-cta {
		font-size: 11px;
		color: var(--text-dim);
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	/* Char counter in input header */
	.char-counter {
		font-size: 11px;
		color: var(--text-dim);
	}

	/* Toast */
	.aoi-toast {
		position: fixed;
		bottom: 5.5rem;
		left: 50%;
		transform: translateX(-50%);
		padding: 6px 18px;
		border: 1px solid;
		background: var(--bg-secondary);
		font-size: 13px;
		font-family: inherit;
		z-index: 9999;
		white-space: nowrap;
		animation: toastIn 0.2s ease;
	}
	.aoi-toast--success { border-color: var(--success-color); color: var(--success-color); }
	.aoi-toast--error   { border-color: var(--error-color);   color: var(--error-color);   }
	.aoi-toast--info    { border-color: var(--info-color);     color: var(--info-color);    }
	@keyframes toastIn {
		from { opacity: 0; transform: translateX(-50%) translateY(8px); }
		to   { opacity: 1; transform: translateX(-50%) translateY(0);   }
	}

	/* Utility colour classes (in case global ones don't reach scoped elements) */
	.text-success { color: var(--success-color); }
	.text-info    { color: var(--info-color);    }
	.text-warning { color: var(--warning-color); }
	.text-error   { color: var(--error-color);   }

	/* ── Onboarding panel ────────────────────────────────────────────────── */
	.onboarding-panel {
		border: 1px solid var(--border-color);
		background: var(--bg-secondary);
		padding: var(--spacing-lg);
		margin: var(--spacing-md) 0;
	}

	.onboarding-title {
		font-size: 11px;
		letter-spacing: 2px;
		color: var(--text-dim);
		margin-bottom: var(--spacing-md);
	}

	.onboarding-steps {
		margin: 0 0 var(--spacing-md) 0;
		padding-left: 1.4em;
		font-size: 13px;
		line-height: 1.8;
		color: var(--text-primary);
	}

	.onboarding-steps li { margin-bottom: 2px; }

	.ob-target { color: var(--success-color); font-weight: bold; }
	.ob-avoid  { color: var(--error-color);   font-weight: bold; }

	.onboarding-cta-label {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 1px;
		color: var(--text-dim);
		margin-bottom: var(--spacing-sm);
	}

	.onboarding-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-sm);
	}

	.ob-btn {
		font-size: 13px;
		padding: var(--spacing-sm) var(--spacing-lg);
		cursor: pointer;
		font-family: inherit;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	/* inherit btn-primary / btn-secondary from global theme */
	.btn-primary {
		background: var(--info-color);
		color: var(--bg-primary);
		border: 1px solid var(--info-color);
	}
	.btn-primary:hover {
		background: var(--bg-primary);
		color: var(--info-color);
	}
	.btn-secondary {
		background: var(--bg-primary);
		color: var(--text-primary);
		border: 1px solid var(--border-color);
	}
	.btn-secondary:hover {
		border-color: var(--info-color);
		color: var(--info-color);
	}

	.onboarding-note {
		font-size: 11px;
		color: var(--text-dim);
		letter-spacing: 0.3px;
	}
</style>
