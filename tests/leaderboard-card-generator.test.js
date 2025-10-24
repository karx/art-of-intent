/**
 * Unit tests for leaderboard-card-generator.js
 * Run with: node tests/leaderboard-card-generator.test.js
 */

// Simple test framework
class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }
    
    test(name, fn) {
        this.tests.push({ name, fn });
    }
    
    async run() {
        console.log('\n🧪 Running Leaderboard Card Generator Tests\n');
        console.log('='.repeat(60));
        
        for (const { name, fn } of this.tests) {
            try {
                await fn();
                this.passed++;
                console.log(`✅ ${name}`);
            } catch (error) {
                this.failed++;
                console.log(`❌ ${name}`);
                console.log(`   Error: ${error.message}`);
            }
        }
        
        console.log('='.repeat(60));
        console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed\n`);
        
        return this.failed === 0;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
}

function assertContains(str, substring, message) {
    if (!str.includes(substring)) {
        throw new Error(message || `Expected string to contain "${substring}"`);
    }
}

// Mock DOM
global.document = {
    createElement: () => ({
        getContext: () => ({
            drawImage: () => {}
        }),
        toBlob: (callback) => callback(new Blob(['mock'], { type: 'image/png' }))
    }),
    body: {
        appendChild: () => {},
        removeChild: () => {}
    }
};

global.Image = class {
    set src(value) {
        setTimeout(() => this.onload && this.onload(), 0);
    }
};

global.URL = {
    createObjectURL: () => 'mock-url',
    revokeObjectURL: () => {}
};

global.Blob = class {
    constructor(parts, options) {
        this.parts = parts;
        this.type = options?.type || '';
    }
};

// Load the module
const LeaderboardCardGenerator = require('../src/js/leaderboard-card-generator.js');
const generator = new LeaderboardCardGenerator();

// Create test runner
const runner = new TestRunner();

// ============================================
// generateASCIIBar Tests
// ============================================

runner.test('generateASCIIBar: normal case (50%)', () => {
    const result = generator.generateASCIIBar(50, 100, 10);
    assertEqual(result.length, 10, 'Bar length should be 10');
    assertEqual(result, '█████░░░░░', 'Should be 50% filled');
});

runner.test('generateASCIIBar: 0% filled', () => {
    const result = generator.generateASCIIBar(0, 100, 10);
    assertEqual(result, '░░░░░░░░░░', 'Should be empty');
});

runner.test('generateASCIIBar: 100% filled', () => {
    const result = generator.generateASCIIBar(100, 100, 10);
    assertEqual(result, '██████████', 'Should be full');
});

runner.test('generateASCIIBar: handles edge cases', () => {
    const result = generator.generateASCIIBar(NaN, 100, 10);
    assertEqual(result, '░░░░░░░░░░', 'Should handle NaN');
});

// ============================================
// formatNumber Tests
// ============================================

runner.test('formatNumber: formats with commas', () => {
    const result = generator.formatNumber(1247);
    assertEqual(result, '1,247', 'Should format with comma');
});

runner.test('formatNumber: handles large numbers', () => {
    const result = generator.formatNumber(1234567);
    assertEqual(result, '1,234,567', 'Should format large numbers');
});

runner.test('formatNumber: handles zero', () => {
    const result = generator.formatNumber(0);
    assertEqual(result, '0', 'Should handle zero');
});

// ============================================
// generatePlayerRows Tests
// ============================================

runner.test('generatePlayerRows: empty array', () => {
    const result = generator.generatePlayerRows([]);
    assertContains(result, 'No players yet', 'Should show empty message');
});

runner.test('generatePlayerRows: single player', () => {
    const players = [{
        rank: 1,
        name: 'TEST_USER',
        tokens: 200,
        attempts: 5,
        efficiency: 40.0,
        time: '03:00'
    }];
    
    const result = generator.generatePlayerRows(players);
    assertContains(result, '#1', 'Should contain rank');
    assertContains(result, 'TEST_USER', 'Should contain name');
    assertContains(result, '200', 'Should contain tokens');
});

runner.test('generatePlayerRows: multiple players', () => {
    const players = [
        { rank: 1, name: 'PLAYER1', tokens: 187, attempts: 4, efficiency: 46.8, time: '02:34' },
        { rank: 2, name: 'PLAYER2', tokens: 203, attempts: 5, efficiency: 40.6, time: '03:12' },
        { rank: 3, name: 'PLAYER3', tokens: 245, attempts: 7, efficiency: 35.0, time: '04:56' }
    ];
    
    const result = generator.generatePlayerRows(players);
    assertContains(result, '#1', 'Should contain first rank');
    assertContains(result, '#2', 'Should contain second rank');
    assertContains(result, '#3', 'Should contain third rank');
    assertContains(result, 'PLAYER1', 'Should contain first player');
    assertContains(result, 'PLAYER2', 'Should contain second player');
});

runner.test('generatePlayerRows: limits to 5 players', () => {
    const players = Array.from({ length: 10 }, (_, i) => ({
        rank: i + 1,
        name: `PLAYER${i + 1}`,
        tokens: 200 + i * 10,
        attempts: 5,
        efficiency: 40.0,
        time: '03:00'
    }));
    
    const result = generator.generatePlayerRows(players);
    assertContains(result, '#5', 'Should contain 5th rank');
    assert(!result.includes('#6'), 'Should not contain 6th rank');
});

// ============================================
// generateSVG Tests
// ============================================

runner.test('generateSVG: basic data', () => {
    const data = {
        date: '2025-01-24',
        topPlayers: [
            { rank: 1, name: 'TEST', tokens: 200, attempts: 5, efficiency: 40.0, time: '03:00' }
        ],
        stats: {
            totalPlayers: 1000,
            gamesToday: 100,
            activeNow: 10,
            winRate: 70,
            avgTokens: 250,
            avgAttempts: 6.0
        }
    };
    
    const svg = generator.generateSVG(data);
    
    assert(svg.includes('<svg'), 'Should contain SVG tag');
    assertContains(svg, 'ART OF INTENT', 'Should contain title');
    assertContains(svg, '2025-01-24', 'Should contain date');
    assertContains(svg, 'TEST', 'Should contain player name');
    assertContains(svg, '1,000', 'Should format total players');
});

runner.test('generateSVG: empty data', () => {
    const svg = generator.generateSVG({});
    
    assert(svg.includes('<svg'), 'Should generate valid SVG');
    assertContains(svg, 'No players yet', 'Should show empty message');
});

runner.test('generateSVG: with stats', () => {
    const data = {
        stats: {
            totalPlayers: 5000,
            gamesToday: 500,
            activeNow: 50,
            winRate: 65,
            avgTokens: 220,
            avgAttempts: 5.5
        }
    };
    
    const svg = generator.generateSVG(data);
    
    assertContains(svg, '5,000', 'Should show total players');
    assertContains(svg, '500', 'Should show games today');
    assertContains(svg, '50', 'Should show active now');
    assertContains(svg, '65%', 'Should show win rate');
    assertContains(svg, '220', 'Should show avg tokens');
    assertContains(svg, '5.5', 'Should show avg attempts');
});

runner.test('generateSVG: valid SVG structure', () => {
    const svg = generator.generateSVG({});
    
    assert(svg.startsWith('<svg'), 'Should start with svg tag');
    assert(svg.endsWith('</svg>'), 'Should end with closing svg tag');
    assert(svg.includes('<defs>'), 'Should have defs section');
    assert(svg.includes('<style>'), 'Should have style section');
});

runner.test('generateSVG: correct dimensions', () => {
    const svg = generator.generateSVG({});
    
    assert(svg.includes('width="1200"'), 'Should have correct width');
    assert(svg.includes('height="630"'), 'Should have correct height');
});

runner.test('generateSVG: contains required sections', () => {
    const svg = generator.generateSVG({});
    
    assertContains(svg, 'TOP PLAYERS TODAY', 'Should have players section');
    assertContains(svg, 'GAME STATISTICS', 'Should have stats section');
    assertContains(svg, 'PLAY NOW', 'Should have CTA');
    assertContains(svg, 'art-of-intent.netlify.app', 'Should have URL');
});

runner.test('generateSVG: includes progress bars', () => {
    const data = {
        stats: {
            winRate: 50,
            avgTokens: 250,
            avgAttempts: 5.0
        }
    };
    
    const svg = generator.generateSVG(data);
    
    assert(svg.includes('█'), 'Should contain filled blocks');
    assert(svg.includes('░'), 'Should contain empty blocks');
});

// ============================================
// svgToDataURL Tests
// ============================================

runner.test('svgToDataURL: basic conversion', () => {
    const svg = '<svg></svg>';
    const dataURL = generator.svgToDataURL(svg);
    
    assert(dataURL.startsWith('data:image/svg+xml,'), 'Should start with data URL prefix');
    assert(dataURL.includes('svg'), 'Should contain svg in URL');
});

// ============================================
// svgToPNG Tests
// ============================================

runner.test('svgToPNG: returns blob', async () => {
    const svg = generator.generateSVG({});
    const blob = await generator.svgToPNG(svg);
    
    assert(blob instanceof Blob, 'Should return a Blob');
    assertEqual(blob.type, 'image/png', 'Should be PNG type');
});

// ============================================
// Run all tests
// ============================================

runner.run().then(success => {
    process.exit(success ? 0 : 1);
});
