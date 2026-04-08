/**
 * cheat-codes.ts — Art of Intent cheat code system
 *
 * World-famous haikus double as cheat codes. Entering one (fuzzy-matched via
 * Levenshtein distance — spaces, punctuation, and case don't count) gifts the
 * player their next unmatched target word for free. The session is flagged as
 * cheated and excluded from the leaderboard.
 */

export interface CheatCode {
	id: string;
	title: string;
	author: string;
	year: string;
	lines: string[];
	/** May contain <em> tags — use {@html} or strip before displaying as text. */
	meaning: string;
	funResponse: (word: string) => string;
	wink: string;
	/** Pre-computed normalised form of lines.join(' '). */
	_normalized: string;
}

// ── Text normalisation ────────────────────────────────────────────────────────

/** Strip everything except a–z / 0–9, lowercase. */
function normalize(str: string): string {
	return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// ── Levenshtein edit distance ─────────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
	const m = a.length;
	const n = b.length;
	let prev = Array.from({ length: n + 1 }, (_, i) => i);
	let curr = new Array<number>(n + 1);
	for (let i = 1; i <= m; i++) {
		curr[0] = i;
		for (let j = 1; j <= n; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
		}
		[prev, curr] = [curr, prev];
	}
	return prev[n];
}

// ── Cheat code data ───────────────────────────────────────────────────────────

type RawCode = Omit<CheatCode, '_normalized'>;

const RAW: RawCode[] = [
	{
		id: 'old-pond',
		title: 'The Old Pond',
		author: 'Matsuo Bashō',
		year: '1686',
		lines: ['An old silent pond', 'A frog jumps into the pond', 'Splash! Silence again'],
		meaning:
			'The old pond is eternity — still, patient, unchanged. The frog\'s leap is the spark of a single moment piercing the infinite. The splash sounds, then silence reclaims everything, as if nothing happened. And yet something did. Bashō asks: is the moment less real for being brief? In Japanese poetics this is <em>ma</em> (間) — the resonant silence between events that holds more meaning than the events themselves.',
		funResponse: (word) =>
			`Old pond holds the cheat\n${word} ripples through still water\nBashō winks at you`,
		wink: 'The old pond heard you. Even Bashō took shortcuts sometimes.',
	},
	{
		id: 'cicada',
		title: "The Cicada's Cry",
		author: 'Matsuo Bashō',
		year: '1689',
		lines: ["In the cicada's cry", 'No sign can foretell', 'How soon it must die'],
		meaning:
			'The cicada sings at full volume with no knowledge of its own mortality. Its cry is complete and self-contained — not tragic, not defiant, just alive. Bashō finds in this a quiet instruction: live so fully in the present that death has nothing to interrupt. This is <em>mono no aware</em> (物の哀れ) — the bittersweet awareness that all things pass, and that this passing is the source of their beauty, not their diminishment.',
		funResponse: (word) =>
			`Cicada cheats death\n${word} sings through summer air\nThe code heard your cry`,
		wink: 'Even cicadas find shortcuts when the summer is short.',
	},
	{
		id: 'world-of-dew',
		title: 'A World of Dew',
		author: 'Kobayashi Issa',
		year: '1819',
		lines: ['A world of dew', 'And within every dewdrop', 'A world of struggle'],
		meaning:
			'Written after the death of his infant daughter, Sato. Buddhist teaching says this world is as transient as morning dew — and Issa knows it. He accepts it. And then, in the final line, refuses to. Each dewdrop contains a whole cosmos of pain, love, and loss compressed to a point. The haiku is both surrender and revolt. It is perhaps the most tender act of philosophical defiance in all of literature.',
		funResponse: (word) =>
			`In each dewdrop hides\n${word} — a whole universe\nIssa smiles at you`,
		wink: 'Issa knew: every struggle deserves a shortcut sometimes.',
	},
	{
		id: 'temple-bells',
		title: 'Temple Bells',
		author: 'Matsuo Bashō',
		year: '1690',
		lines: ['Temple bells die out', 'The fragrant blossoms remain', 'A perfect evening'],
		meaning:
			'The bell-sound is fleeting; the blossom-scent lingers. Bashō weaves two senses — hearing and smell — into a meditation on what endures and what does not. The evening is perfect not in spite of loss but because of it. <em>Wabi-sabi</em> (侘寂): the beauty found in imperfection and impermanence. The last peal of the bell makes the remaining silence more fragrant.',
		funResponse: (word) =>
			`Temple bells forgive\n${word} blooms where rules once stood\nEvening is perfect`,
		wink: 'The bells have died out. Your secret is safe with the blossoms.',
	},
	{
		id: 'lightning-flash',
		title: 'Lightning Flash',
		author: 'Yosa Buson',
		year: '1784',
		lines: ['A lightning flash', 'What I thought were faces', 'Are plumes of pampas grass'],
		meaning:
			'Buson was a painter before he was a poet, and this haiku is pure visual thinking. The lightning reveals — and misleads. For one instant the darkness seemed to hold human faces; the next, only grass. Buson captures how the mind reaches for meaning in the void and projects what it most fears or desires. The haiku asks a quiet question: what else do we see that is only pampas grass?',
		funResponse: (word) =>
			`Lightning cracks the code\n${word} illuminates the dark\nBuson saw it too`,
		wink: 'What I thought was playing fair... turned out to be genius.',
	},
	{
		id: 'moon-beholders',
		title: 'The Moon-Beholders',
		author: 'Matsuo Bashō',
		year: '1685',
		lines: ['From time to time', 'The clouds give rest', 'To the moon-beholders'],
		meaning:
			'Bashō does not write about the moon but about those who cannot stop watching it. The clouds are merciful: they interrupt the spell of beauty and give weary eyes a rest. Even rapture is exhausting. There is gentle comedy here — and gentle wisdom. We need breaks from the sublime as much as we need the sublime. The clouds know this. The moon does not care either way.',
		funResponse: (word) =>
			`Clouds part for the wise\n${word} rests beneath the moon\nEven rules take breaks`,
		wink: 'Even the moon takes breaks. You earned this one.',
	},
	{
		id: 'morning-glory',
		title: 'Morning Glory',
		author: 'Fukuda Chiyo-ni',
		year: '1754',
		lines: ['Morning glory—', 'the well bucket entangled,', 'I ask for water'],
		meaning:
			'Chiyo-ni woke to draw water and found a morning glory vine had wound overnight around her well bucket. Rather than disturb it, she walked to a neighbour\'s house to borrow water. In doing so she wrote the most radical act of gentleness in haiku history. The flower\'s life is brief; her inconvenience is small; the gesture is total. This is <em>aware</em> as action — stepping aside for beauty, even when it costs you.',
		funResponse: (word) =>
			`Morning glory blooms\n${word} tangled in the bucket\nChiyo-ni approves`,
		wink: 'She walked to the next house rather than disturb one flower. You just typed a poem.',
	},
	{
		id: 'dont-weep',
		title: "Don't Weep, Insects",
		author: 'Kobayashi Issa',
		year: '1827',
		lines: ["Don't weep, insects", 'Lovers, stars themselves', 'Must part'],
		meaning:
			'Written after the death of his wife, Kiku. Issa speaks directly to the weeping insects of autumn — his companions in grief. His consolation is cosmological: even the stars, even the mythic lovers of the sky, must part. Grief is not a flaw in the universe but its very texture. The poem is an act of radical solidarity — a man, undone by loss, finding kinship with crickets in the dark.',
		funResponse: (word) =>
			`No tears for the cheat\n${word} parts like stars at dawn\nIssa nods with warmth`,
		wink: 'Stars must part. Rules must bend. Issa understands.',
	},
	{
		id: 'this-world-of-dew',
		title: 'This World of Dew',
		author: 'Kobayashi Issa',
		year: '1819',
		lines: ['This world of dew', 'Is only a world of dew', 'And yet... and yet...'],
		meaning:
			'Also written for his dead daughter, Sato. Issa states the Buddhist teaching twice, as if trying to convince himself: <em>this is impermanent, this is impermanent</em>. Then the "and yet" arrives and dismantles everything. Grief refuses to be philosophized away. The trailing ellipsis is not weakness — it is honesty. This is perhaps the most emotionally exact haiku ever written: the moment a mind accepts what the heart will never accept.',
		funResponse: (word) =>
			`And yet ${word} glows\neven in a world of dew\nand yet... and yet...`,
		wink: "Issa's own heart said 'and yet'. Yours too, it seems.",
	},
	{
		id: 'ill-on-a-journey',
		title: "Ill on a Journey (Bashō's Death Poem)",
		author: 'Matsuo Bashō',
		year: '1694',
		lines: ['Ill on a journey', 'My dreams wander over', 'A withered field'],
		meaning:
			'Written as Bashō lay dying in Osaka at 51. He had spent his life walking — literal journeys gave him his greatest poems. Now, body-broken and fevered, his dreams still walk. The withered field is both the late-autumn landscape and his own failing body, both literal and metaphor without effort. He dies as he lived: wandering, noticing, writing. His last poem is not a farewell. It is one more step on the road.',
		funResponse: (word) =>
			`Dreams wander on still\n${word} blooms on withered ground\nBashō keeps walking`,
		wink: "Even on his deathbed, Bashō was still exploring. You're in good company.",
	},
];

export const CHEAT_CODES: CheatCode[] = RAW.map((code) => ({
	...code,
	_normalized: normalize(code.lines.join(' ')),
}));

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Detect whether `input` matches any cheat code.
 *
 * Matching is fuzzy: normalise both strings, then accept if edit distance
 * is ≤ 15% of the cheat code's normalised length (rounded up).
 */
export function detectCheatCode(
	input: string
): { code: CheatCode; distance: number } | null {
	const normInput = normalize(input);
	let bestMatch: CheatCode | null = null;
	let bestDistance = Infinity;

	for (const code of CHEAT_CODES) {
		const dist = levenshtein(normInput, code._normalized);
		const threshold = Math.ceil(code._normalized.length * 0.15);
		if (dist <= threshold && dist < bestDistance) {
			bestDistance = dist;
			bestMatch = code;
		}
	}

	return bestMatch ? { code: bestMatch, distance: bestDistance } : null;
}
