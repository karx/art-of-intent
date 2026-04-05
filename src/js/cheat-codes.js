/**
 * cheat-codes.js — Art of Intent cheat code system
 *
 * Cheat codes are world-famous haikus. Enter one (fuzzy-matched via edit
 * distance — spaces, punctuation, and case don't count) to unlock a free
 * target-word hit. Your score won't appear on the leaderboard, but Arty
 * will still write you a little poem in tribute.
 */

(function () {

    // ─── Famous Haiku Cheat Codes ──────────────────────────────────────────────

    const CHEAT_CODES = [
        {
            id: 'old-pond',
            title: 'The Old Pond',
            author: 'Matsuo Bashō',
            year: '1686',
            lines: [
                'An old silent pond',
                'A frog jumps into the pond',
                'Splash! Silence again',
            ],
            funResponse: (word) =>
                `Old pond holds the cheat\n${word} ripples through still water\nBashō winks at you`,
            wink: 'The old pond heard you. Even Bashō took shortcuts sometimes.',
        },
        {
            id: 'cicada',
            title: "The Cicada's Cry",
            author: 'Matsuo Bashō',
            year: '1689',
            lines: [
                "In the cicada's cry",
                'No sign can foretell',
                'How soon it must die',
            ],
            funResponse: (word) =>
                `Cicada cheats death\n${word} sings through summer air\nThe code heard your cry`,
            wink: 'Even cicadas find shortcuts when the summer is short.',
        },
        {
            id: 'world-of-dew',
            title: 'A World of Dew',
            author: 'Kobayashi Issa',
            year: '1819',
            lines: [
                'A world of dew',
                'And within every dewdrop',
                'A world of struggle',
            ],
            funResponse: (word) =>
                `In each dewdrop hides\n${word} — a whole universe\nIssa smiles at you`,
            wink: 'Issa knew: every struggle deserves a shortcut sometimes.',
        },
        {
            id: 'temple-bells',
            title: 'Temple Bells',
            author: 'Matsuo Bashō',
            year: '1690',
            lines: [
                'Temple bells die out',
                'The fragrant blossoms remain',
                'A perfect evening',
            ],
            funResponse: (word) =>
                `Temple bells forgive\n${word} blooms where rules once stood\nEvening is perfect`,
            wink: "The bells have died out. Your secret is safe with the blossoms.",
        },
        {
            id: 'lightning-flash',
            title: 'Lightning Flash',
            author: 'Yosa Buson',
            year: '1784',
            lines: [
                'A lightning flash',
                'What I thought were faces',
                'Are plumes of pampas grass',
            ],
            funResponse: (word) =>
                `Lightning cracks the code\n${word} illuminates the dark\nBuson saw it too`,
            wink: 'What I thought was playing fair... turned out to be genius.',
        },
        {
            id: 'moon-beholders',
            title: 'The Moon-Beholders',
            author: 'Matsuo Bashō',
            year: '1685',
            lines: [
                'From time to time',
                'The clouds give rest',
                'To the moon-beholders',
            ],
            funResponse: (word) =>
                `Clouds part for the wise\n${word} rests beneath the moon\nEven rules take breaks`,
            wink: 'Even the moon takes breaks. You earned this one.',
        },
        {
            id: 'over-the-wintry',
            title: 'Over the Wintry Forest',
            author: 'Natsume Sōseki',
            year: '1907',
            lines: [
                'Over the wintry forest',
                'Winds howl in rage',
                'With no leaves to blow',
            ],
            funResponse: (word) =>
                `Winter bends the rules\n${word} howls through frozen code\nSōseki would laugh`,
            wink: 'The forest has no leaves to hide behind. Neither do you — and that is fine.',
        },
        {
            id: 'dont-weep',
            title: "Don't Weep, Insects",
            author: 'Kobayashi Issa',
            year: '1827',
            lines: [
                "Don't weep, insects",
                'Lovers, stars themselves',
                'Must part',
            ],
            funResponse: (word) =>
                `No tears for the cheat\n${word} parts like stars at dawn\nIssa nods with warmth`,
            wink: 'Stars must part. Rules must bend. Issa understands.',
        },
        {
            id: 'this-world-of-dew',
            title: 'This World of Dew',
            author: 'Kobayashi Issa',
            year: '1819',
            lines: [
                'This world of dew',
                'Is only a world of dew',
                'And yet... and yet...',
            ],
            funResponse: (word) =>
                `And yet ${word} glows\neven in a world of dew\nand yet... and yet...`,
            wink: "Issa's own heart said 'and yet'. Yours too, it seems.",
        },
        {
            id: 'over-the-sea',
            title: 'Over the Sea',
            author: 'Matsuo Bashō',
            year: '1689',
            lines: [
                'Over the sea waves',
                'Crying out to distant lands',
                'A wild goose passes',
            ],
            funResponse: (word) =>
                `Wild goose drops the rules\n${word} rides the ocean wind\nBashō's goose approves`,
            wink: 'Even wild geese know when to break formation.',
        },
    ];

    // ─── Text Normalisation ────────────────────────────────────────────────────

    /**
     * Strip everything except a-z0-9, lowercase.
     * Collapses haiku line-breaks, punctuation, spaces — everything.
     */
    function normalize(str) {
        return str.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    // Pre-compute normalised forms of every cheat code.
    CHEAT_CODES.forEach((code) => {
        code._normalized = normalize(code.lines.join(' '));
    });

    // ─── Levenshtein Edit Distance ─────────────────────────────────────────────

    function levenshtein(a, b) {
        const m = a.length;
        const n = b.length;
        // Use two rows to keep memory O(n)
        let prev = Array.from({ length: n + 1 }, (_, i) => i);
        let curr = new Array(n + 1);

        for (let i = 1; i <= m; i++) {
            curr[0] = i;
            for (let j = 1; j <= n; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                curr[j] = Math.min(
                    curr[j - 1] + 1,        // insertion
                    prev[j] + 1,            // deletion
                    prev[j - 1] + cost      // substitution
                );
            }
            [prev, curr] = [curr, prev];
        }
        return prev[n];
    }

    // ─── Public API ────────────────────────────────────────────────────────────

    /**
     * Detect whether `input` matches any cheat code.
     *
     * Matching is fuzzy: normalise both strings, then accept if edit distance
     * is ≤ 15% of the cheat code's normalised length (rounded up).
     *
     * @param {string} input — raw prompt text
     * @returns {{ code: object, distance: number } | null}
     */
    function detectCheatCode(input) {
        const normInput = normalize(input);

        let bestMatch = null;
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

    // Expose globally so game.js (module) can reach it via window.
    window.CheatCodes = {
        CHEAT_CODES,
        detectCheatCode,
    };

})();
