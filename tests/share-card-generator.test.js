/**
 * Unit tests for share-card-generator.js
 * Run with: node share-card-generator.test.js
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
        console.log('\n🧪 Running Share Card Generator Tests\n');
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

// Mock DOM for Node.js environment
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
const ShareCardGenerator = require('../src/js/share-card-generator.js');
const generator = new ShareCardGenerator();

// Create test runner
const runner = new TestRunner();

// ============================================
// generateASCIIBar Tests
// ============================================

runner.test('generateASCIIBar: normal case (50%)', () => {
    const result = generator.generateASCIIBar(5, 10, 10);
    assertEqual(result.length, 10, 'Bar length should be 10');
    assertEqual(result, '█████░░░░░', 'Should be 50% filled');
});

runner.test('generateASCIIBar: 0% filled', () => {
    const result = generator.generateASCIIBar(0, 10, 10);
    assertEqual(result, '░░░░░░░░░░', 'Should be empty');
});

runner.test('generateASCIIBar: 100% filled', () => {
    const result = generator.generateASCIIBar(10, 10, 10);
    assertEqual(result, '██████████', 'Should be full');
});

runner.test('generateASCIIBar: over 100% (clamped)', () => {
    const result = generator.generateASCIIBar(20, 10, 10);
    assertEqual(result, '██████████', 'Should be clamped to 100%');
});

runner.test('generateASCIIBar: negative value', () => {
    const result = generator.generateASCIIBar(-5, 10, 10);
    assertEqual(result, '░░░░░░░░░░', 'Should handle negative as 0%');
});

runner.test('generateASCIIBar: zero max', () => {
    const result = generator.generateASCIIBar(5, 0, 10);
    assertEqual(result, '░░░░░░░░░░', 'Should handle zero max');
});

runner.test('generateASCIIBar: negative max', () => {
    const result = generator.generateASCIIBar(5, -10, 10);
    assertEqual(result, '░░░░░░░░░░', 'Should handle negative max');
});

runner.test('generateASCIIBar: NaN value', () => {
    const result = generator.generateASCIIBar(NaN, 10, 10);
    assertEqual(result, '░░░░░░░░░░', 'Should handle NaN value');
});

runner.test('generateASCIIBar: NaN max', () => {
    const result = generator.generateASCIIBar(5, NaN, 10);
    assertEqual(result, '░░░░░░░░░░', 'Should handle NaN max');
});

runner.test('generateASCIIBar: non-number inputs', () => {
    const result = generator.generateASCIIBar('5', '10', 10);
    assertEqual(result, '░░░░░░░░░░', 'Should handle string inputs');
});

runner.test('generateASCIIBar: fractional values', () => {
    const result = generator.generateASCIIBar(2.5, 10, 10);
    assertEqual(result.length, 10, 'Should handle fractional values');
    assert(result.includes('█'), 'Should have some filled blocks');
});

runner.test('generateASCIIBar: large numbers', () => {
    const result = generator.generateASCIIBar(500, 1000, 20);
    assertEqual(result.length, 20, 'Should handle large numbers');
    assertEqual(result, '██████████░░░░░░░░░░', 'Should be 50% filled');
});

// ============================================
// generateSVG Tests
// ============================================

runner.test('generateSVG: basic WIN result', () => {
    const data = {
        result: 'WIN',
        attempts: 5,
        tokens: 200,
        matches: '3/3',
        efficiency: '40.0',
        date: '2025-01-24',
        userName: 'TestUser'
    };
    
    const svg = generator.generateSVG(data);
    
    assert(svg.includes('<svg'), 'Should contain SVG tag');
    assert(svg.includes('WIN'), 'Should contain WIN text');
    assert(svg.includes('TestUser'), 'Should contain username');
    assert(svg.includes('200'), 'Should contain token count');
});

runner.test('generateSVG: LOSS result', () => {
    const data = {
        result: 'LOSS',
        attempts: 10,
        tokens: 500,
        matches: '1/3',
        efficiency: '50.0',
        date: '2025-01-24',
        userName: 'TestUser'
    };
    
    const svg = generator.generateSVG(data);
    
    assert(svg.includes('LOSS'), 'Should contain LOSS text');
    assert(svg.includes('10'), 'Should contain attempts');
});

runner.test('generateSVG: default values', () => {
    const svg = generator.generateSVG({});
    
    assert(svg.includes('WIN'), 'Should default to WIN');
    assert(svg.includes('Guest'), 'Should default to Guest');
    assert(svg.includes('0/3'), 'Should have default matches');
});

runner.test('generateSVG: with user photo (optional)', () => {
    const data = {
        result: 'WIN',
        attempts: 5,
        tokens: 200,
        matches: '3/3',
        efficiency: '40.0',
        userName: 'TestUser',
        userPhoto: 'https://example.com/photo.jpg'
    };
    
    const svg = generator.generateSVG(data);
    
    // User photo is optional in the new design, just verify it doesn't break
    assert(svg.includes('TestUser'), 'Should contain username');
    assert(svg.includes('<svg'), 'Should generate valid SVG');
});

runner.test('generateSVG: progress bars generated', () => {
    const data = {
        result: 'WIN',
        attempts: 5,
        tokens: 200,
        matches: '3/3',
        efficiency: '40.0'
    };
    
    const svg = generator.generateSVG(data);
    
    assert(svg.includes('█'), 'Should contain filled blocks');
    assert(svg.includes('░'), 'Should contain empty blocks');
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

runner.test('generateSVG: contains all required elements', () => {
    const svg = generator.generateSVG({});
    
    assertContains(svg, 'ART OF INTENT', 'Should have title');
    assertContains(svg, 'HAIKU CHALLENGE', 'Should have subtitle');
    assertContains(svg, 'ATTEMPTS:', 'Should have attempts label');
    assertContains(svg, 'TOKENS:', 'Should have tokens label');
    assertContains(svg, 'MATCHES:', 'Should have matches label');
    assertContains(svg, 'EFFICIENCY:', 'Should have efficiency label');
    assertContains(svg, 'art-of-intent.netlify.app', 'Should have URL');
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

runner.test('svgToDataURL: handles special characters', () => {
    const svg = '<svg><text>Test & "quotes"</text></svg>';
    const dataURL = generator.svgToDataURL(svg);
    
    assert(dataURL.includes('%22'), 'Should encode quotes');
    assert(!dataURL.includes('"'), 'Should not have raw quotes');
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
