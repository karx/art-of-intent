/**
 * cheat-codes.js — Art of Intent cheat code system (browser entry point)
 *
 * Imports the pure matching algorithm from cheat-matcher.js, defines the
 * canonical list of world-famous haiku cheat codes, and exposes everything
 * as window.CheatCodes for game.js to consume.
 *
 * Loaded as type="module" in index.html (appears before game.js, so
 * window.CheatCodes is set before game.js runs).
 */

import {
    detectCheatCode as _detect,
    prepareCode,
} from './cheat-matcher.js';

// ─── Cheat code data ──────────────────────────────────────────────────────────

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
        wink: 'The bells have died out. Your secret is safe with the blossoms.',
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
        id: 'morning-glory',
        title: 'Morning Glory',
        author: 'Fukuda Chiyo-ni',
        year: '1754',
        lines: [
            'Morning glory—',
            'the well bucket entangled,',
            'I ask for water',
        ],
        funResponse: (word) =>
            `Morning glory blooms\n${word} tangled in the bucket\nChiyo-ni approves`,
        wink: 'She walked to the next house rather than disturb one flower. You just typed a poem.',
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
        id: 'ill-on-a-journey',
        title: "Ill on a Journey (Bashō's Death Poem)",
        author: 'Matsuo Bashō',
        year: '1694',
        lines: [
            'Ill on a journey',
            'My dreams wander over',
            'A withered field',
        ],
        funResponse: (word) =>
            `Dreams wander on still\n${word} blooms on withered ground\nBashō keeps walking`,
        wink: "Even on his deathbed, Bashō was still exploring. You're in good company.",
    },
];

// Pre-compute _normalized and _tokens on every code object.
CHEAT_CODES.forEach(prepareCode);

// ─── Public wrapper ───────────────────────────────────────────────────────────

/**
 * Detect whether `input` matches any cheat code.
 * Thin wrapper around the pure algorithm so game.js API stays unchanged.
 *
 * @param {string} input
 * @returns {{ code: object, coverage: number, charSim: number, combined: number } | null}
 */
function detectCheatCode(input) {
    return _detect(input, CHEAT_CODES);
}

// Expose globally so game.js (also a module) can reach it via window.
window.CheatCodes = {
    CHEAT_CODES,
    detectCheatCode,
};
