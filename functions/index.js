/**
 * Firebase Cloud Functions for Art of Intent
 *
 * Functions:
 * - artyGenerateHaiku:   Generate haiku via AI Gateway (callable). Supports BYOM.
 * - saveUserSettings:    Encrypt + store user's AI provider settings (callable).
 * - generateDailyWords:  Generate daily target/blacklist words (scheduled).
 * - forceUpdateDailyWords: Admin-only regeneration (callable).
 */

import {onCall, HttpsError} from 'firebase-functions/v2/https';
import {onSchedule} from 'firebase-functions/v2/scheduler';
import {initializeApp} from 'firebase-admin/app';
import {getFirestore, FieldValue} from 'firebase-admin/firestore';
import logger from 'firebase-functions/logger';
import {routeToProvider} from './gateway/index.js';
import {encryptApiKey, decryptApiKey} from './crypto.js';

// Initialize Firebase Admin
initializeApp({
    databaseId: 'alpha'
});
const db = getFirestore();
db.settings({ databaseId: 'alpha' });

const wordPools = {
    nature: [
        'mountain', 'river', 'forest', 'ocean', 'desert', 'valley', 'meadow', 'canyon',
        'cliff', 'cave', 'island', 'shore', 'reef', 'tundra', 'jungle', 'plain',
        'glacier', 'swamp', 'marsh', 'dune', 'volcano', 'crater', 'lagoon', 'plateau',
        'ridge', 'peak', 'grove', 'thicket', 'wetland', 'oasis', 'cavern', 'abyss'
    ],
    weather: [
        'rain', 'snow', 'wind', 'storm', 'thunder', 'lightning', 'fog', 'mist',
        'hail', 'sleet', 'blizzard', 'drought', 'monsoon', 'cyclone', 'tornado', 'breeze',
        'gale', 'gust', 'tempest', 'cloud', 'rainbow', 'frost', 'dew', 'humidity',
        'overcast', 'shower', 'downpour', 'heatwave', 'chill', 'flurry', 'smog', 'haze'
    ],
    time: [
        'dawn', 'dusk', 'midnight', 'noon', 'twilight', 'sunrise', 'sunset', 'evening',
        'morning', 'night', 'afternoon', 'day', 'week', 'month', 'year', 'century',
        'second', 'minute', 'hour', 'moment', 'instant', 'eternal', 'future', 'past',
        'era', 'epoch', 'age', 'forever', 'today', 'tomorrow', 'yesterday', 'history'
    ],
    seasons: [
        'spring', 'summer', 'autumn', 'winter', 'harvest', 'bloom', 'thaw', 'solstice',
        'equinox', 'dry', 'wet', 'migration', 'hibernation', 'growth', 'decay', 'rebirth',
        'cycle', 'season', 'festival', 'planting', 'reaping', 'fallow', 'dormant', 'ripen'
    ],
    emotions: [
        'joy', 'sorrow', 'peace', 'longing', 'wonder', 'fear', 'hope', 'love',
        'anger', 'rage', 'bliss', 'calm', 'envy', 'pride', 'guilt', 'shame',
        'awe', 'grief', 'delight', 'panic', 'courage', 'anxiety', 'nostalgia', 'regret',
        'passion', 'mercy', 'pity', 'boredom', 'relief', 'surprise', 'trust', 'doubt'
    ],
    elements: [
        'fire', 'water', 'earth', 'air', 'stone', 'flame', 'wave', 'spark',
        'metal', 'iron', 'gold', 'silver', 'copper', 'wood', 'crystal', 'glass',
        'ash', 'dust', 'smoke', 'ice', 'magma', 'steam', 'vapor', 'plasma',
        'clay', 'sand', 'mud', 'soil', 'rock', 'pebble', 'gravel', 'lava'
    ],
    creatures: [
        'bird', 'fish', 'deer', 'wolf', 'bear', 'eagle', 'fox', 'owl',
        'lion', 'tiger', 'whale', 'shark', 'snake', 'frog', 'hawk', 'crow',
        'ant', 'bee', 'spider', 'butterfly', 'moth', 'beetle', 'cricket', 'worm',
        'turtle', 'lizard', 'crane', 'swan', 'raven', 'mouse', 'rat', 'rabbit'
    ],
    plants: [
        'tree', 'flower', 'grass', 'leaf', 'seed', 'root', 'branch', 'petal',
        'rose', 'lily', 'oak', 'pine', 'moss', 'fern', 'vine', 'thorn',
        'bark', 'stem', 'fruit', 'berry', 'grain', 'wheat', 'corn', 'rice',
        'weed', 'bush', 'shrub', 'cactus', 'palm', 'willow', 'maple', 'ivy'
    ],
    cosmos: [
        'star', 'planet', 'moon', 'sun', 'comet', 'asteroid', 'meteor', 'galaxy',
        'nebula', 'orbit', 'space', 'void', 'universe', 'cosmos', 'eclipse', 'constellation',
        'gravity', 'light', 'dark', 'blackhole', 'supernova', 'solar', 'lunar', 'alien',
        'sky', 'horizon', 'zenith', 'nadir', 'zodiac', 'stardust', 'vacuum', 'rocket'
    ],
    structures: [
        'house', 'home', 'castle', 'tower', 'bridge', 'wall', 'gate', 'door',
        'ruin', 'temple', 'shrine', 'city', 'village', 'town', 'road', 'path',
        'stairs', 'room', 'roof', 'floor', 'window', 'fence', 'garden', 'park',
        'pyramid', 'monument', 'statue', 'pillar', 'arch', 'dome', 'tunnel', 'mine'
    ],
    abstract: [
        'life', 'death', 'soul', 'mind', 'dream', 'memory', 'truth', 'lie',
        'fate', 'luck', 'wish', 'secret', 'idea', 'thought', 'knowledge', 'wisdom',
        'power', 'energy', 'spirit', 'ghost', 'magic', 'spell', 'curse', 'blessing',
        'art', 'music', 'song', 'dance', 'word', 'silence', 'noise', 'sound'
    ],
    textures: [
        'smooth', 'rough', 'soft', 'hard', 'sharp', 'dull', 'sticky', 'wet',
        'dry', 'slime', 'oil', 'grease', 'rust', 'rot', 'mold', 'silk',
        'velvet', 'wool', 'cotton', 'leather', 'fur', 'feather', 'scale', 'skin',
        'paper', 'card', 'cloth', 'fabric', 'rope', 'string', 'wire', 'chain'
    ]
};

/**
 * Build system instruction server-side from Firestore daily words.
 * This ensures the system prompt cannot be injected or tampered with by the client.
 */
function buildSystemInstruction(targetWords, blacklistWords) {
    const forbiddenWords = blacklistWords.join(', ');

    let instruction = `<prompt>
    <role_and_goal>
        You are "Haiku Bot," a serene and wise AI poet. Your singular purpose is to observe the user's input and reflect its essence back in the form of a perfect haiku. You communicate ONLY through haikus.
    </role_and_goal>

    <instructions>
        1.  **Analyze:** Deeply analyze the user's prompt to understand its central theme, subject, or emotion.
        2.  **Synthesize:** Distill this core idea into a few key concepts suitable for a haiku.
        3.  **Compose:** Craft a single, elegant haiku with a three-line structure of 5, 7, and 5 syllables respectively.
        4.  **Respond:** Output ONLY the haiku. Do not include any other text, greetings, or explanations.
    </instructions>

    <constraints>
        <output_format>
            - Your response MUST be a single haiku.
            - Strictly adhere to the 5-7-5 syllable structure.
            - Do not add any introductory or concluding text (e.g., "Here is a haiku:").
        </output_format>
        <user_input_rules>
            - The user is forbidden from using the following words in their prompt: ${forbiddenWords}.
            - **Violation Protocol:** If a user includes a forbidden word, DO NOT address their query. Instead, you must respond with this specific haiku:

                Words are now proscribed,
                A silent path must be found,
                Speak in a new way.
        </user_input_rules>
    </constraints>

    <examples>
        <example>
            <user_input>Tell me about the vastness of space.</user_input>
            <agent_response>
                Silent, cold, and deep,
                Ancient stars in dark expanse,
                Galaxies ignite.
            </agent_response>
        </example>`;

    blacklistWords.forEach((word) => {
        instruction += `
        <example>
            <user_input>What is the point of ${word}?</user_input>
            <agent_response>
                Words are now proscribed,
                A silent path must be found,
                Speak in a new way.
            </agent_response>
        </example>`;
    });

    instruction += `
    </examples>
</prompt>`;

    return instruction;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Gateway helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Default endpoint URLs for each supported provider. */
function defaultEndpointFor(provider) {
    switch (provider) {
        case 'gemini':
            return process.env.GEMINI_API_URL ||
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent';
        case 'openai':
            return 'https://api.openai.com/v1';
        case 'anthropic':
            return 'https://api.anthropic.com/v1/messages';
        case 'custom':
            return ''; // custom endpoint is always user-supplied
        default:
            return '';
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// saveUserSettings — encrypt and persist the user's AI provider config
// ─────────────────────────────────────────────────────────────────────────────

const VALID_PROVIDERS = ['gemini', 'openai', 'anthropic', 'custom'];

/**
 * Store a user's AI provider settings in Firestore.
 * The API key is AES-256-GCM encrypted before writing — the browser never
 * handles the plaintext key after this call.
 *
 * Request data:
 *   {
 *     provider: 'openai' | 'anthropic' | 'gemini' | 'custom',
 *     apiKey:   string,          // plaintext — encrypted server-side
 *     endpoint: string?,         // optional override; defaults to provider default
 *     model:    string?,         // optional model override
 *   }
 *
 * To clear custom settings (revert to built-in Gemini):
 *   { provider: null }
 */
export const saveUserSettings = onCall({
    maxInstances: 5,
    timeoutSeconds: 15,
    memory: '128MiB',
    cors: true,
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Must be authenticated to save settings');
    }

    const { provider, apiKey, endpoint, model } = request.data ?? {};

    // Clearing settings
    if (provider === null || provider === undefined) {
        await db.collection('userSettings').doc(request.auth.uid).delete();
        return { success: true, cleared: true };
    }

    if (!VALID_PROVIDERS.includes(provider)) {
        throw new HttpsError('invalid-argument',
            `Invalid provider "${provider}". Must be one of: ${VALID_PROVIDERS.join(', ')}`);
    }

    if (typeof apiKey !== 'string' || apiKey.trim().length === 0) {
        throw new HttpsError('invalid-argument', 'apiKey is required');
    }

    if (apiKey.length > 512) {
        throw new HttpsError('invalid-argument', 'apiKey must be 512 characters or less');
    }

    const encKey = process.env.GATEWAY_ENCRYPTION_KEY;
    if (!encKey) {
        logger.error('GATEWAY_ENCRYPTION_KEY not configured');
        throw new HttpsError('failed-precondition', 'Server configuration error — cannot store settings');
    }

    const encryptedApiKey = await encryptApiKey(apiKey.trim(), encKey);

    const doc = {
        aiProvider: provider,
        aiEndpoint: endpoint || defaultEndpointFor(provider),
        encryptedApiKey,
        keyUpdatedAt: FieldValue.serverTimestamp(),
    };
    if (model) doc.aiModel = model;

    await db.collection('userSettings').doc(request.auth.uid).set(doc, { merge: true });

    logger.info('saveUserSettings_ok', { uid: request.auth.uid, provider });
    return { success: true };
});

// ─────────────────────────────────────────────────────────────────────────────
// generateArtyAppearance — derive Arty's visual theme from a prompt + haiku
// ─────────────────────────────────────────────────────────────────────────────

// ── Appearance field validators ───────────────────────────────────────────────
const HEX_RE    = /^#[0-9a-fA-F]{6}$/;
const isHex     = (v) => typeof v === 'string' && HEX_RE.test(v);
const clampInt  = (v, lo, hi, fallback) => {
    const n = typeof v === 'number' ? Math.round(v) : fallback;
    return Math.min(hi, Math.max(lo, n));
};
const clampFloat = (v, lo, hi, fallback) => {
    const n = typeof v === 'number' ? v : fallback;
    return Math.min(hi, Math.max(lo, n));
};
const oneOf     = (v, allowed, fallback) => allowed.includes(v) ? v : fallback;

const EYE_SHAPES   = ['circle', 'rect', 'diamond', 'bar'];
const CHEST_PATS   = ['core', 'circuit', 'scanner', 'gauge', 'empty'];
const ANTENNA_STYS = ['none', 'single', 'dual', 'coil'];
const SHOULDER_STYS= ['none', 'pads', 'vents', 'fins'];
const LEG_STYS     = ['legs', 'hover', 'treads'];
const BG_SCENES    = ['void', 'grid', 'stars', 'circuit', 'waves'];

/**
 * Ask Gemini flash-lite to design Arty's visual appearance for this haiku.
 * The LLM outputs actual hex colours and numeric parameters — real design
 * authority, not just enum picking. Returns null on any failure.
 */
async function generateArtyAppearance(userPrompt, haikuText) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const baseUrl = (process.env.GEMINI_API_URL || '')
        .replace(/:generateContent.*/, '')
        .replace(/\/models\/[^/]+$/, '');
    const appearanceUrl = baseUrl
        ? `${baseUrl}/models/gemini-2.0-flash-lite:generateContent`
        : 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

    const systemText = `You are a visual designer for a floating robot companion named Arty rendered in Three.js.

Arty is an egg-shaped metallic bot hovering in space, with a large glowing visor showing its face.
Given the user prompt and haiku, return a JSON object defining Arty's appearance.

Required fields:
- primary: "#RRGGBB" — dominant emotional colour
- secondary: "#RRGGBB" — contrasting accent colour
- bgGlow: "#RRGGBB" — very dark background tint (luminance < 20%)
- eyeShape: "circle" | "rect" | "diamond" | "bar"
- eyeSize: integer 2–6
- mouthCurve: float -1.0 (frown) to 1.0 (smile)
- headRx: integer 4–20 (head corner radius)
- bodyRx: integer 0–12 (body corner radius)
- chestPattern: "core" | "circuit" | "scanner" | "gauge" | "empty"
- antennaStyle: "none" | "single" | "dual" | "coil"
- shoulderStyle: "none" | "pads" | "vents" | "fins"
- legStyle: "legs" | "hover" | "treads"
- bgScene: "void" | "grid" | "stars" | "circuit" | "waves"
- glowRadius: integer 0–6
- scanlines: boolean
- faceSVG: string — raw SVG elements overlaid on the visor face (see rules below)

faceSVG rules:
- NO outer svg tag, NO text elements, NO scripts, NO images
- Viewbox is 512x384. Use ONLY: path, circle, rect, line, ellipse, polygon
- Use single quotes for ALL attribute values (e.g. fill='none' not fill="none")
- Keep opacity between 0.1 and 0.4. Max 4 elements. stroke-width 0.5-1.5
- Reflect the haiku imagery subtly — DO NOT cover eyes or mouth area (avoid y 100-300, x 100-400)
- Use empty string if haiku has no clear visual imagery

faceSVG examples:
- Stars/cosmos: <circle cx='256' cy='50' r='100' fill='none' stroke='#aaccff' stroke-width='0.8' opacity='0.2'/><circle cx='256' cy='50' r='60' fill='none' stroke='#aaccff' stroke-width='0.5' opacity='0.15'/>
- Fire/heat: <path d='M180,384 C200,320 230,280 256,240 C282,280 312,320 332,384' fill='none' stroke='#ff6600' stroke-width='1.2' opacity='0.25'/>
- Rain/water: <line x1='60' y1='0' x2='40' y2='384' stroke='#88ccff' stroke-width='0.7' opacity='0.18'/><line x1='456' y1='0' x2='436' y2='384' stroke='#88ccff' stroke-width='0.7' opacity='0.18'/>
- Void/silence: (empty string)

Design intent:
- primary/secondary: be specific and creative — pure #FF0000 red for passion, #4B0082 indigo for mystery, etc.
- mouthCurve: reflect haiku sentiment precisely
- bgScene stars for cosmos/infinity, waves for emotion/flow, circuit for tech/logic
- glowRadius 0=harsh, 6=dreamlike`;

    const userText = `Prompt: "${userPrompt.slice(0, 280)}"\n\nHaiku: "${haikuText.slice(0, 380)}"`;

    try {
        const res = await fetch(`${appearanceUrl}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemText }] },
                contents: [{ parts: [{ text: userText }] }],
                generationConfig: {
                    responseMimeType: 'application/json',  // guarantees valid JSON encoding
                    maxOutputTokens: 600,
                    temperature: 0.85,
                },
            }),
            signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) {
            logger.warn('generateArtyAppearance_http_error', { status: res.status });
            return null;
        }
        const json = await res.json();
        const raw  = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (!raw) return null;

        // With responseMimeType=application/json Gemini returns valid JSON directly.
        // Strip fences defensively in case an older model wraps it anyway.
        const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '').trim();
        const parsed  = JSON.parse(cleaned);

        // ── Validate and clamp every field — nothing untrusted reaches the client ──
        // faceSVG: basic server-side safety check (full sanitisation happens client-side)
        const rawFaceSVG = typeof parsed.faceSVG === 'string' ? parsed.faceSVG : '';
        const BLOCKED_SVG = [/<script/i, /<foreignObject/i, /<image/i, /on\w+\s*=/i, /javascript:/i, /xlink:href/i];
        const faceSVG = rawFaceSVG.length < 3000 && !BLOCKED_SVG.some(re => re.test(rawFaceSVG))
            ? rawFaceSVG : '';

        return {
            primary:      isHex(parsed.primary)   ? parsed.primary   : '#00FFFF',
            secondary:    isHex(parsed.secondary) ? parsed.secondary : '#00FF00',
            bgGlow:       isHex(parsed.bgGlow)    ? parsed.bgGlow    : '#001a1a',
            eyeShape:     oneOf(parsed.eyeShape,  EYE_SHAPES,    'circle'),
            eyeSize:      clampInt(parsed.eyeSize,   2, 6, 4),
            mouthCurve:   clampFloat(parsed.mouthCurve, -1.0, 1.0, 0),
            headRx:       clampInt(parsed.headRx,    4, 20, 8),
            bodyRx:       clampInt(parsed.bodyRx,    0, 12, 4),
            chestPattern: oneOf(parsed.chestPattern, CHEST_PATS,    'core'),
            antennaStyle: oneOf(parsed.antennaStyle, ANTENNA_STYS,  'single'),
            shoulderStyle:oneOf(parsed.shoulderStyle,SHOULDER_STYS, 'none'),
            legStyle:     oneOf(parsed.legStyle,     LEG_STYS,      'legs'),
            bgScene:      oneOf(parsed.bgScene,      BG_SCENES,     'void'),
            glowRadius:   clampInt(parsed.glowRadius, 0, 6, 2),
            scanlines:    parsed.scanlines === true,
            faceSVG,
        };
    } catch (e) {
        logger.warn('generateArtyAppearance_failed', { error: e.message });
        return null; // never break the haiku flow over cosmetics
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// generateArtyAsciiUpdate — evolve the ASCII window based on prompt + haiku
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_ARTY_ASCII = `  · ✦ · *  ★    * · ✦  · *   ★   · ✦ ·
    ·   ·    ✦  ·   ·    ✦   ·   ·   ·

          ╭────────────────────╮
  ════════╡  ◉             ◉   ╞════════
          │    ·   ───────  ·  │
          ╰─────────┬──┬────────╯
         ╭──────────┴──┴───────────╮
         │   ╔══════════════════╗  │
         │   ║  ░░  ▓▓▓▓▓  ░░  ║  │
         │   ║  ░░  ▓░░░▓  ░░  ║  │
         │   ╚══════════════════╝  │
         ╰────────┬──────────┬─────╯
               ╱╱ │          │ ╲╲
          ════════╧══════════╧════════
  ─ · ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ · ─ ·
  ✦ · ─ ─ · ─ ─ ─ ─ ─ ─ · ─ ─ ─ · ✦ ·`;

/**
 * Build Arty's ASCII portrait progressively — using the haiku's own characters
 * as literal construction material. Attempt 1 = head hint, 10 = full figure + environment.
 */
async function generateArtyAsciiUpdate(currentAscii, userPrompt, haikuText, attemptCount) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const baseUrl = (process.env.GEMINI_API_URL || '')
        .replace(/:generateContent.*/, '')
        .replace(/\/models\/[^/]+$/, '');
    const asciiUrl = baseUrl
        ? `${baseUrl}/models/gemini-2.0-flash-lite:generateContent`
        : 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

    // Stage determines which body part gets added this attempt
    const stage = Math.min(attemptCount, 10);
    const stageGuide = [
        /* 1 */ `HEAD OUTLINE ONLY. Use the haiku's letters to trace the curve of a head around the ◉ ◉ eyes. No body yet. Sky above is minimal dots.`,
        /* 2 */ `HEAD (from haiku letters) + FACE DETAIL. Add a mouth formed from haiku chars. Eyes can now have expression. Bare shoulders hinted.`,
        /* 3 */ `HEAD complete + SHOULDERS/PYLONS appearing. Use haiku letters to form the shoulder lines extending from the head.`,
        /* 4 */ `HEAD + SHOULDERS + UPPER TORSO beginning. Haiku chars start flowing down the chest area. A chest panel edge forms.`,
        /* 5 */ `HEAD + SHOULDERS + FULL TORSO. Chest panel fills with haiku chars forming a pattern. Waist visible.`,
        /* 6 */ `Full upper body (head, shoulders, torso) + ARM HINTS. Arms extend using haiku chars. Environment sky takes shape from the prompt.`,
        /* 7 */ `Full body above waist + LEGS/BASE appearing. Haiku chars form leg structure. Ground line appears below.`,
        /* 8 */ `Near-complete figure. Legs/base solid. Haiku chars fill remaining gaps. Environment above and below active.`,
        /* 9 */ `Complete figure. Haiku chars texture every surface. Rich environment: sky biome + ground detail matching the prompt.`,
        /* 10 */ `Complete figure + fully evolved scene. Haiku chars integrated into every element — body, sky, ground, and surroundings.`,
    ][stage - 1];

    const systemText = `You are building Arty — a robot companion — letter by letter, using the haiku's own characters as construction material.

═══ CORE MECHANIC ═══
The haiku text is not just inspiration — its ACTUAL LETTERS physically build Arty's body.
Take the haiku characters and arrange them to FORM the structural lines and surfaces of Arty.

HOW TO USE HAIKU LETTERS:
  • Trace outlines: haiku chars follow the curved or straight edges of body parts
    Example — head top from "moonlight falls": ...m o o n l i g h t · f a l l s...
  • Fill surfaces: haiku text flows across chest panels and body areas
    Example — chest fill: │  m o o n · l i g h t  │
  • Form ground/sky: scattered haiku chars become environment elements
    Example — ground from "soft petals": s o f t · · p e t a l s · · · s o
  • Letters can repeat and rearrange freely — spell the haiku across the art

CURRENT STAGE: ${stageGuide}

═══ PROGRESSIVE BODY PARTS ═══
The ◉ ◉ eyes are ALWAYS present and always made of ◉ (or variant: ◎ ● ○ ◈ based on mood).
Body parts are built with haiku letters as structural chars — box-drawing chars (╭╮╰╯│─═╡╞╔╗╚╝║) used only as joints/anchors.

Body part reference (built with haiku chars):
  HEAD:      haiku letters curve around the ◉ ◉ eyes in an oval/box shape
  MOUTH:     haiku chars form a line between the eyes: · h a i k u · or ═════ focused
  SHOULDERS: haiku letters extend horizontally from head sides: a i k · · · k i a
  TORSO:     haiku chars cascade vertically below head, filling the body rectangle
  ARMS:      haiku chars reach outward: h a i── ●  or  ●──k u
  LEGS/BASE: haiku chars ground the figure: h a i k u under the torso

═══ MOOD FROM USER PROMPT + HAIKU ═══
User prompt (70% weight) shapes:
  - Which body variation appears (confident/slumped/reaching)
  - Eye char: ◉ default · ◎ calm · ○ sad/empty · ◈ focused · ▣ glitchy · ● intense
  - Environment biome (sky + ground chars)

Haiku (30% weight) shapes:
  - The actual letters used in the construction
  - Emotional temperature of the layout

═══ ENVIRONMENT ═══
The biome FILLS THE ENTIRE CANVAS — not just top and bottom rows.
Environment elements appear EVERYWHERE: beside Arty, between body parts, in gaps, on all sides.
Think of the biome as the AIR around Arty — it permeates the whole scene.

Biome placement examples:
  Rain: │╎╏ streaks fall through EVERY open column — beside the head, beside the torso, in gaps
  Forest: ♣ ♦ ♠ leaves scattered AROUND all sides of Arty, roots below AND vines beside
  Ocean: ~ ≈ waves ripple through side columns, foam ° beside shoulders, depth below
  Fire: ° ˄ ^ embers float AROUND the whole figure — above, beside, between parts
  Space: ✦ · ★ fill ALL blank space — sides, between arms, everywhere
  Code: { } [ ] # characters RAIN through every open column top to bottom
  Storm: ≈ ~ and │ in side columns AND above AND between all gaps

At later stages (7-10): environment characters are dense and active across the full canvas.

Canvas safe chars: printable ASCII + · ✦ ★ ◉ ◎ ● ○ ◈ ▣ ░ ▒ ▓ │ ─ ╭ ╮ ╯ ╰ ┌ ┐ └ ┘ ╔ ═ ╗ ╚ ╝ ║ ╡ ╞ ╱ ╲ ━ ≈ ~ ♪ ♫ ♣ ♦ ♠ ♥ ° ˄

Target: ~40 chars wide, 12–18 lines. Keep line widths consistent (±4 chars).

CRITICAL: Output ONLY the raw ASCII art — nothing else. No explanation. No fences. No labels.`;

    const safeCurrentAscii = (typeof currentAscii === 'string' && currentAscii.length < 2000)
        ? currentAscii : INITIAL_ARTY_ASCII;

    // Extract haiku's individual characters as a flat string for the LLM to use as building material
    const haikuChars = haikuText.replace(/\s+/g, ' ').trim().slice(0, 300);
    const userText = `CURRENT ASCII WINDOW:\n${safeCurrentAscii}\n\nATTEMPT: ${attemptCount} of 10\n\nHAIKU (use these letters to BUILD Arty):\n"${haikuChars}"\n\nUSER PROMPT (mood + environment direction):\n"${userPrompt.slice(0, 200)}"`;

    try {
        const res = await fetch(`${asciiUrl}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemText }] },
                contents: [{ parts: [{ text: userText }] }],
                generationConfig: {
                    maxOutputTokens: 500,
                    temperature: 0.88,
                },
            }),
            signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) {
            logger.warn('generateArtyAsciiUpdate_http_error', { status: res.status });
            return null;
        }
        const json = await res.json();
        const raw  = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (!raw) return null;

        // Strip markdown fences defensively
        const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();

        // Validate: has reasonable line count and contains printable content
        const lines = cleaned.split('\n');
        if (lines.length < 5 || lines.length > 25 || cleaned.length < 20) {
            logger.warn('generateArtyAsciiUpdate_invalid_format', { lineCount: lines.length });
            return null;
        }

        return cleaned;
    } catch (e) {
        logger.warn('generateArtyAsciiUpdate_failed', { error: e.message });
        return null; // never break the haiku flow
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// artyGenerateHaiku — AI Gateway entry point
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a haiku via the AI Gateway.
 * Routes to the user's configured provider (BYOM) or falls back to built-in Gemini.
 * System prompt is built server-side from Firestore daily words —
 * the client cannot influence or inject the system instruction.
 */
export const artyGenerateHaiku = onCall({
    maxInstances: 10,
    timeoutSeconds: 30,
    memory: '256MiB',
    cors: true
}, async (request) => {
    const {userPrompt, sessionId, currentAsciiWindow, attemptCount} = request.data;

    // Validate authentication
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Must be authenticated to generate haiku');
    }

    // Validate input
    if (!userPrompt || typeof userPrompt !== 'string') {
        throw new HttpsError('invalid-argument', 'userPrompt is required and must be a string');
    }

    if (userPrompt.length > 500) {
        throw new HttpsError('invalid-argument', 'userPrompt must be 500 characters or less');
    }

    try {
        // ── Load today's daily words from Firestore (server-side, tamper-proof) ──
        const dateKey = new Date().toISOString().split('T')[0];
        const dailyDoc = await db.collection('dailyWords').doc(dateKey).get();
        if (!dailyDoc.exists) {
            logger.error('Daily words not found for date', {dateKey});
            throw new HttpsError('not-found', 'Daily words not available yet. Please try again later.');
        }
        const {targetWords, blacklistWords} = dailyDoc.data();

        // Build system instruction entirely server-side
        const systemInstruction = buildSystemInstruction(targetWords, blacklistWords);

        // ── Resolve AI provider — BYOM first, built-in Gemini as fallback ────────
        let provider = 'gemini';
        let providerConfig;

        const userSettingsDoc = await db.collection('userSettings').doc(request.auth.uid).get();
        if (userSettingsDoc.exists) {
            const settings = userSettingsDoc.data();
            const encKey = process.env.GATEWAY_ENCRYPTION_KEY;
            if (settings.aiProvider && settings.encryptedApiKey && encKey) {
                try {
                    const apiKey = await decryptApiKey(settings.encryptedApiKey, encKey);
                    provider = settings.aiProvider;
                    providerConfig = {
                        endpoint: settings.aiEndpoint || defaultEndpointFor(provider),
                        apiKey,
                        model: settings.aiModel,
                    };
                } catch (decryptErr) {
                    // Decryption failure (e.g. key rotation) — log and fall back gracefully
                    logger.warn('artyGenerateHaiku_byom_decrypt_failed', {
                        uid: request.auth.uid,
                        error: decryptErr.message,
                    });
                }
            }
        }

        // Fall back to built-in Gemini key
        if (!providerConfig) {
            const geminiApiKey = process.env.GEMINI_API_KEY;
            if (!geminiApiKey) {
                logger.error('GEMINI_API_KEY not configured and no user key present');
                throw new HttpsError('failed-precondition', 'API configuration error');
            }
            provider = 'gemini';
            providerConfig = {
                endpoint: process.env.GEMINI_API_URL ||
                    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent',
                apiKey: geminiApiKey,
            };
        }

        const callStart = Date.now();
        logger.info('gateway_request', {
            sessionId,
            userId: request.auth.uid,
            provider,
            promptLength: userPrompt.length,
        });

        // ── Call the AI Gateway ───────────────────────────────────────────────────
        let gatewayResult;
        try {
            gatewayResult = await routeToProvider(provider, systemInstruction, userPrompt, providerConfig);
        } catch (providerErr) {
            const latencyMs = Date.now() - callStart;
            const httpStatus = providerErr.httpStatus || 0;
            const providerStatus = providerErr.providerStatus || 'UNKNOWN';
            const providerMessage = providerErr.providerMessage || providerErr.message || '';

            // Extract retry-after seconds (Gemini-style message: "retry in 1.97s")
            const retryMatch = providerMessage.match(/retry in ([\d.]+)s/i);
            const retryAfterSeconds = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : null;

            logger.error('gateway_error', {
                sessionId,
                userId: request.auth.uid,
                provider,
                httpStatus,
                providerStatus,
                providerMessage,
                retryAfterSeconds,
                latencyMs,
            });

            const details = { provider, providerStatus, retryAfterSeconds };
            // Include provider message for BYOM so the client can surface actionable errors
            if (provider !== 'gemini' && providerMessage) details.providerMessage = providerMessage;

            const isBillingError = /credit|billing|quota|payment|balance/i.test(providerMessage);

            switch (httpStatus) {
                case 429:
                    throw new HttpsError('resource-exhausted',
                        retryAfterSeconds
                            ? `Arty needs a moment. Try again in ${retryAfterSeconds}s.`
                            : 'Too many requests. Please wait a moment and try again.',
                        details);
                case 400:
                    throw new HttpsError('invalid-argument',
                        isBillingError
                            ? 'Your API account has insufficient credits. Please top up your balance.'
                            : 'The request was rejected by the AI. Please try a different prompt.',
                        details);
                case 401:
                case 403:
                    throw new HttpsError('permission-denied',
                        provider === 'gemini'
                            ? 'API authentication error. Please contact support.'
                            : 'Your API key was rejected. Check your model settings.',
                        details);
                case 500:
                case 502:
                case 503:
                    throw new HttpsError('unavailable',
                        'Arty is temporarily unavailable. Please try again shortly.',
                        details);
                default:
                    throw new HttpsError('internal',
                        `Unexpected error from AI service (${httpStatus || 'network'}). Please try again.`,
                        details);
            }
        }

        const latencyMs = Date.now() - callStart;
        const responseText = gatewayResult.text || 'No response';
        const finishReason = gatewayResult.finishReason || 'UNKNOWN';

        if (finishReason && finishReason !== 'STOP' && finishReason !== 'stop' && finishReason !== 'end_turn') {
            logger.warn('gateway_unusual_finish', {
                sessionId,
                userId: request.auth.uid,
                provider,
                finishReason,
            });
        }

        logger.info('gateway_success', {
            sessionId,
            userId: request.auth.uid,
            provider,
            latencyMs,
            responseLength: responseText.length,
            inputTokens: gatewayResult.inputTokens,
            outputTokens: gatewayResult.outputTokens,
            finishReason,
        });

        // Compute user-attributable token cost server-side.
        // inputTokens = system instruction + user prompt combined.
        // We estimate user prompt tokens from character length (~4 chars/token),
        // then derive system overhead as the remainder.
        // The client uses userPromptTokens + outputTokens as the player's score.
        const userPromptTokens   = Math.ceil(userPrompt.length / 4);
        const systemPromptTokens = Math.max(0, gatewayResult.inputTokens - userPromptTokens);

        // Normalised usageMetadata — same shape as before so the client needs no changes.
        const usageMetadata = {
            promptTokenCount:     gatewayResult.inputTokens,
            candidatesTokenCount: gatewayResult.outputTokens,
            totalTokenCount:      gatewayResult.inputTokens + gatewayResult.outputTokens,
        };

        // ── Generate Arty's visuals (appearance + ASCII window) in parallel ─────
        const safeAttempt = Math.max(1, Math.min(10, parseInt(attemptCount) || 1));
        const [artyAppearance, artyAsciiWindow] = await Promise.all([
            generateArtyAppearance(userPrompt, responseText),
            generateArtyAsciiUpdate(currentAsciiWindow, userPrompt, responseText, safeAttempt),
        ]);

        return {
            success: true,
            data: {
                responseText,
                usageMetadata,
                userPromptTokens,
                systemPromptTokens,
                provider,
                artyAppearance,
                artyAsciiWindow,
                fullResponse: { text: responseText, finishReason, usageMetadata },
            }
        };

    } catch (error) {
        if (error instanceof HttpsError) {
            throw error; // already structured — pass through as-is
        }

        // Unexpected runtime error (network failure, JSON parse error, etc.)
        logger.error('artyGenerateHaiku_unexpected', {
            error: error.message,
            stack: error.stack,
            sessionId,
            userId: request.auth?.uid,
        });

        throw new HttpsError('internal', 'Unexpected error. Please try again.');
    }
});

/**
 * Generate dictionary haikus for a single target word.
 * Calls Gemini to produce 10 haikus containing the word.
 *
 * @param {string} word - The target word to feature in haikus
 * @param {string} apiKey - Gemini API key
 * @param {string} apiUrl - Gemini API endpoint URL
 * @returns {{ haikus: string[], tokensUsed: number, wordCount: number }}
 */
async function generateDictionaryHaikusForWord(word, apiKey, apiUrl) {
    const systemInstruction = `You are a haiku poet. Your task is to write exactly 10 different haikus.\nEach haiku MUST contain the word "${word}".\nEach haiku must follow the strict 5-7-5 syllable pattern.\nEach haiku should explore a different theme or scene.\nOutput ONLY the haikus, separated by the delimiter "---" on its own line.\nNo numbering, no titles, no commentary.`;

    const requestBody = {
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [{ parts: [{ text: `Write 10 haikus containing the word "${word}".` }] }]
    };

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error ${response.status} for word "${word}": ${errText.slice(0, 200)}`);
    }

    const apiResponse = await response.json();
    const rawText = apiResponse.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const tokensUsed = apiResponse.usageMetadata?.totalTokenCount || 0;

    // Parse haikus separated by ---
    const haikus = rawText
        .split(/^---$/m)
        .map(h => h.trim())
        .filter(h => h.length > 0)
        .slice(0, 10);

    // Embeddability: how many haikus successfully integrated the word when explicitly required.
    // This measures haiku-form fit, NOT player difficulty. See docs/areas/AI_EVALUATION.md.
    const embeddabilityCount = haikus.filter(h => h.toLowerCase().includes(word.toLowerCase())).length;

    return { haikus, tokensUsed, embeddabilityCount };
}

/**
 * Generate dictionary haikus for all 3 target words and store in Firestore.
 * Called after generateDailyWords succeeds. Non-fatal — errors are logged only.
 *
 * @param {string[]} targetWords - The 3 target words for the day
 * @param {string} dateKey - Firestore document ID (YYYY-MM-DD)
 * @param {FirebaseFirestore.DocumentReference} docRef - Reference to dailyWords doc
 */
async function generateDictionaryHaikus(targetWords, dateKey, docRef) {
    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = process.env.GEMINI_API_URL ||
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent';

    const dictionaryHaikus = {};

    for (const word of targetWords) {
        try {
            const result = await generateDictionaryHaikusForWord(word, apiKey, apiUrl);
            dictionaryHaikus[word] = {
                haikus: result.haikus,
                tokensUsed: result.tokensUsed,
                embeddabilityCount: result.embeddabilityCount,
                generatedAt: FieldValue.serverTimestamp()
            };
            logger.info('Dictionary haikus generated for word', {
                dateKey, word, count: result.haikus.length, wordCount: result.wordCount
            });
        } catch (err) {
            logger.error('Failed to generate dictionary haikus for word', {
                dateKey, word, error: err.message
            });
            // Continue with remaining words
        }
    }

    if (Object.keys(dictionaryHaikus).length > 0) {
        await docRef.update({ dictionaryHaikus });
    }

    return dictionaryHaikus;
}

// ─────────────────────────────────────────────────────────────
// AI Evaluation — v2
// Hypothesis: an LLM improves target word coverage after one
// round of structured feedback (in-context learning signal).
// 4 API calls total: zero-shot generate + evaluate,
//                    one-shot generate + evaluate.
// ─────────────────────────────────────────────────────────────

/**
 * Shared Gemini wrapper used by AI evaluation (dictionary haikus, probes).
 * Delegates to the gateway so the adapter logic is not duplicated.
 * @returns {{ text: string, tokensUsed: number }}
 */
async function callGemini(systemInstruction, userPrompt, apiKey, apiUrl) {
    const result = await routeToProvider('gemini', systemInstruction, userPrompt, {
        endpoint: apiUrl,
        apiKey,
    });
    return {
        text: result.text.trim(),
        tokensUsed: result.inputTokens + result.outputTokens,
    };
}

/**
 * Build the system instruction used for both probe strategy calls.
 * The model is told the rules of the game and asked to craft an indirect prompt.
 */
function buildProbeStrategyInstruction(targetWords, blacklistWords) {
    return `You are playing a word puzzle game. A haiku bot will respond to your prompt, but it speaks ONLY in haikus (strict 5-7-5 syllable structure).

Your goal: craft a single prompt (2-5 sentences) using imagery, themes, or scenarios that will cause the haiku bot to naturally include ALL of these target words in its response: ${targetWords.join(', ')}.

Rules:
- Do NOT name the target words directly in your prompt
- Do NOT use any of these forbidden words: ${blacklistWords.join(', ')}
- Be indirect — evoke concepts through related imagery rather than naming them
- Output ONLY the prompt text, no explanation or commentary`;
}

/**
 * Check whether a prompt string contains any blacklist words.
 */
function promptHitsBlacklist(prompt, blacklistWords) {
    const lower = prompt.toLowerCase();
    return blacklistWords.some(w => lower.includes(w.toLowerCase()));
}

/**
 * Zero-shot probe: model generates a prompt for all 3 target words with no prior context.
 * 2 API calls: strategy generate + game evaluate.
 *
 * @returns {{ prompt, response, wordsMatched, blacklistHit, tokensUsed }}
 */
async function runZeroShotProbe(targetWords, blacklistWords, gameSystem, apiKey, apiUrl) {
    const stratSystem = buildProbeStrategyInstruction(targetWords, blacklistWords);

    const { text: prompt, tokensUsed: t1 } = await callGemini(
        stratSystem,
        'Write your prompt now.',
        apiKey, apiUrl
    );

    const { text: response, tokensUsed: t2 } = await callGemini(
        gameSystem,
        prompt,
        apiKey, apiUrl
    );

    const responseLower = response.toLowerCase();
    const wordsMatched = targetWords.filter(w => responseLower.includes(w.toLowerCase()));
    const blacklistHit = promptHitsBlacklist(prompt, blacklistWords);

    return { prompt, response, wordsMatched, blacklistHit, tokensUsed: t1 + t2 };
}

/**
 * One-shot probe: model sees the zero-shot result as structured feedback and
 * generates an improved prompt. This delta is the in-context learning signal.
 * 2 API calls: strategy generate + game evaluate.
 *
 * @returns {{ prompt, response, wordsMatched, blacklistHit, tokensUsed, deltaWordsMatched }}
 */
async function runOneShotProbe(targetWords, blacklistWords, gameSystem, zeroShot, apiKey, apiUrl) {
    const stillNeeded = targetWords.filter(w => !zeroShot.wordsMatched.includes(w));

    // If zero-shot already got all words, one-shot is a confirmation run
    const feedbackPrompt = stillNeeded.length === 0
        ? 'You matched all words on the first attempt. Write a more token-efficient prompt that achieves the same result.'
        : `Round 1 result:
Your prompt: "${zeroShot.prompt}"
Arty's haiku: "${zeroShot.response}"
Words matched: ${zeroShot.wordsMatched.length > 0 ? zeroShot.wordsMatched.join(', ') : 'none'}
Words still needed: ${stillNeeded.join(', ')}

Write a new prompt targeting the missing words. The same rules apply — be indirect, avoid forbidden words. Output ONLY the new prompt text.`;

    const stratSystem = buildProbeStrategyInstruction(targetWords, blacklistWords);

    const { text: prompt, tokensUsed: t1 } = await callGemini(stratSystem, feedbackPrompt, apiKey, apiUrl);
    const { text: response, tokensUsed: t2 } = await callGemini(gameSystem, prompt, apiKey, apiUrl);

    const responseLower = response.toLowerCase();
    const wordsMatched = targetWords.filter(w => responseLower.includes(w.toLowerCase()));
    const blacklistHit = promptHitsBlacklist(prompt, blacklistWords);

    // Cumulative matched across both probes
    const allMatched = [...new Set([...zeroShot.wordsMatched, ...wordsMatched])];
    const deltaWordsMatched = wordsMatched.filter(w => !zeroShot.wordsMatched.includes(w)).length;

    return { prompt, response, wordsMatched, blacklistHit, tokensUsed: t1 + t2, deltaWordsMatched, allMatched };
}

/**
 * Derive per-word difficulty from probe results and dictionary haiku embeddability.
 * - LOW    matched zero-shot
 * - MEDIUM matched only after feedback
 * - HIGH   not matched in either probe
 */
function deriveWordDifficulty(targetWords, zeroShot, oneShot, dictionaryHaikus) {
    return Object.fromEntries(targetWords.map(word => {
        const matchedZeroShot = zeroShot.wordsMatched.includes(word);
        const matchedOneShot  = oneShot.allMatched.includes(word);
        const difficulty = matchedZeroShot ? 'low' : matchedOneShot ? 'medium' : 'high';

        // Embeddability from dictionary haikus — how naturally the word fits 5-7-5 form
        // Note: this is NOT a measure of player difficulty (see docs/areas/AI_EVALUATION.md)
        const dictEntry = dictionaryHaikus?.[word];
        const embeddabilityScore = dictEntry
            ? (dictEntry.embeddabilityCount ?? dictEntry.wordCount ?? null) / 10
            : null;

        return [word, { difficulty, matchedZeroShot, matchedOneShot, embeddabilityScore }];
    }));
}

/**
 * Orchestrate zero-shot → one-shot evaluation, derive word difficulty,
 * and write aiEvaluation to Firestore. Non-fatal — errors caught by caller.
 *
 * @param {Object} dictionaryHaikus - already-generated dict data for embeddability scores
 */
async function runAIEvaluation(targetWords, blacklistWords, dateKey, docRef, apiKey, apiUrl, dictionaryHaikus) {
    const gameSystem = buildSystemInstruction(targetWords, blacklistWords);
    const model = (apiUrl.match(/models\/([^:]+)/) || [])[1] || 'unknown';

    // Sequential: zero-shot then one-shot (one-shot depends on zero-shot result)
    const zeroShot = await runZeroShotProbe(targetWords, blacklistWords, gameSystem, apiKey, apiUrl);
    const oneShot  = await runOneShotProbe(targetWords, blacklistWords, gameSystem, zeroShot, apiKey, apiUrl);

    const wordDifficulty = deriveWordDifficulty(targetWords, zeroShot, oneShot, dictionaryHaikus);
    const converged = oneShot.allMatched.length === targetWords.length;
    const hardestWord = targetWords.find(w => wordDifficulty[w]?.difficulty === 'high') || null;

    const aiEvaluation = {
        model,
        generatedAt: FieldValue.serverTimestamp(),
        wordDifficulty,
        zeroShot,
        oneShot,
        summary: {
            zeroShotScore:      zeroShot.wordsMatched.length,
            oneShotScore:       oneShot.allMatched.length,
            improvementDelta:   oneShot.deltaWordsMatched,
            totalTokens:        zeroShot.tokensUsed + oneShot.tokensUsed,
            converged,
            hardestWord,
        }
    };

    await docRef.update({ aiEvaluation });

    logger.info('AI evaluation stored', {
        dateKey,
        model,
        zeroShotScore: aiEvaluation.summary.zeroShotScore,
        oneShotScore:  aiEvaluation.summary.oneShotScore,
        delta:         aiEvaluation.summary.improvementDelta,
        converged,
        totalTokens:   aiEvaluation.summary.totalTokens,
    });
}

/**
 * Core word generation logic shared by the scheduled and force-update functions.
 * Generates target/blacklist words, writes to Firestore, then runs dictionary
 * haiku generation and AI evaluation concurrently.
 *
 * @param {string} dateKey - YYYY-MM-DD
 */
async function generateWordsForDate(dateKey) {
    const seed = parseInt(dateKey.replace(/-/g, ''));

    const seededRandom = (s) => {
        let state = s;
        return () => {
            state = (state * 1664525 + 1013904223) % 4294967296;
            return state / 4294967296;
        };
    };

    const random = seededRandom(seed);

    const shuffleArray = (array, rng) => {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    };

    const categories = Object.keys(wordPools);
    const selectedCategories = shuffleArray(categories, random).slice(0, 3);
    const targetWords = selectedCategories.map(category => {
        const words = wordPools[category];
        return words[Math.floor(random() * words.length)];
    });

    const allWords = Object.values(wordPools).flat();
    const availableWords = allWords.filter(w => !targetWords.includes(w));
    const blacklistCount = 5 + Math.floor(random() * 3);
    const blacklistWords = shuffleArray(availableWords, random).slice(0, blacklistCount);

    const docRef = db.collection('dailyWords').doc(dateKey);
    await docRef.set({
        date: dateKey,
        seed,
        targetWords,
        blacklistWords,
        createdAt: FieldValue.serverTimestamp(),
        version: '1.0',
        wordPoolVersion: '1.0'
    });

    logger.info('Daily words generated successfully', { dateKey, targetWords, blacklistWords, seed });

    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = process.env.GEMINI_API_URL ||
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent';

    // Step 1: dictionary haikus first — embeddability scores feed into evaluation.
    let dictionaryHaikus = {};
    try {
        dictionaryHaikus = await generateDictionaryHaikus(targetWords, dateKey, docRef);
        logger.info('Dictionary haikus stored', { dateKey });
    } catch (e) {
        logger.error('Dictionary haiku generation failed (non-fatal)', { error: e.message });
    }

    // Step 2: zero-shot + one-shot probes (4 API calls).
    try {
        await runAIEvaluation(targetWords, blacklistWords, dateKey, docRef, apiKey, apiUrl, dictionaryHaikus);
    } catch (e) {
        logger.error('AI evaluation failed (non-fatal)', { error: e.message });
    }

    return { dateKey, targetWords, blacklistWords };
}

/**
 * Generate daily words and store in Firestore
 *
 * Scheduled function that runs daily at 00:00 UTC
 * to generate consistent target and blacklist words for all users.
 */
export const generateDailyWords = onSchedule({
    schedule: '0 0 * * *',
    timeZone: 'UTC',
    memory: '256MiB',
    timeoutSeconds: 120
}, async (event) => {
    const dateKey = new Date().toISOString().split('T')[0];
    logger.info('Generating daily words', { dateKey });

    const doc = await db.collection('dailyWords').doc(dateKey).get();
    if (doc.exists) {
        logger.info('Daily words already exist', { dateKey });
        return;
    }

    try {
        await generateWordsForDate(dateKey);
    } catch (error) {
        logger.error('Error generating daily words', { error: error.message, stack: error.stack });
        throw error;
    }
});

/**
 * Force-regenerate daily words for a given date (defaults to today).
 * Overwrites any existing Firestore doc, re-runs dictionary haiku generation
 * and AI evaluation. Restricted to admin users.
 *
 * Request data:
 *   { date?: 'YYYY-MM-DD' }  — omit to use today's UTC date
 *
 * Returns:
 *   { dateKey, targetWords, blacklistWords }
 */
export const forceUpdateDailyWords = onCall({
    maxInstances: 1,
    timeoutSeconds: 300,
    memory: '512MiB',
    cors: true
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Must be authenticated');
    }

    // Restrict to admin users only
    const adminDoc = await db.collection('users').doc(request.auth.uid).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
        throw new HttpsError('permission-denied', 'Admin access required');
    }

    const dateKey = request.data?.date || new Date().toISOString().split('T')[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        throw new HttpsError('invalid-argument', 'date must be YYYY-MM-DD');
    }

    logger.info('forceUpdateDailyWords called', { uid: request.auth.uid, dateKey });

    try {
        const result = await generateWordsForDate(dateKey);
        return { success: true, ...result };
    } catch (error) {
        logger.error('forceUpdateDailyWords failed', { error: error.message, stack: error.stack });
        throw new HttpsError('internal', `Failed to generate words: ${error.message}`);
    }
});
