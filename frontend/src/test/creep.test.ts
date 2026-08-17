import { describe, it, expect } from 'vitest';
import { creepSeverity, creepFeedback, SHAKE_THRESHOLD } from '$lib/creep';

describe('creepSeverity', () => {
	it('bands match the UI thresholds', () => {
		expect(creepSeverity(0)).toBe('low');
		expect(creepSeverity(24)).toBe('low');
		expect(creepSeverity(25)).toBe('medium');
		expect(creepSeverity(49)).toBe('medium');
		expect(creepSeverity(50)).toBe('high');
		expect(creepSeverity(74)).toBe('high');
		expect(creepSeverity(75)).toBe('critical');
		expect(creepSeverity(100)).toBe('critical');
	});
});

describe('creepFeedback', () => {
	it('no feedback when creep is unchanged or falls', () => {
		expect(creepFeedback(50, 50)).toBeNull();
		expect(creepFeedback(50, 25)).toBeNull();
	});

	it('flashes on any increase below the shake threshold', () => {
		expect(creepFeedback(0, 25)).toBe('flash');
		expect(creepFeedback(25, 50)).toBe('flash');
	});

	it('shakes when an increase lands at or above the critical threshold', () => {
		expect(creepFeedback(50, SHAKE_THRESHOLD)).toBe('shake');
		expect(creepFeedback(60, 85)).toBe('shake');
		expect(creepFeedback(75, 100)).toBe('shake');
	});
});
