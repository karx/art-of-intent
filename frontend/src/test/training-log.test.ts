import { describe, it, expect } from 'vitest';
import {
	buildTrainingLog,
	buildYouVsArtyLine,
	formatDifficultyLabel,
	formatLearningSignal,
	formatHardestWordNote,
	type AIEvaluation,
} from '$lib/training-log';

const evalFixture = (over: Partial<AIEvaluation> = {}): AIEvaluation => ({
	model: 'gemini-3.1-flash-lite-preview',
	wordDifficulty: {
		mountain: { difficulty: 'low', matchedZeroShot: true, matchedOneShot: true, embeddabilityScore: 1 },
		sorrow: { difficulty: 'medium', matchedZeroShot: false, matchedOneShot: true, embeddabilityScore: 0.7 },
		copper: { difficulty: 'high', matchedZeroShot: false, matchedOneShot: false, embeddabilityScore: 0.8 },
	},
	zeroShot: {
		prompt: 'Describe a high place above a cold metal stream.',
		response: 'Silent mountain peak,\nCopper light on river stone,\nWind forgets its name.',
		wordsMatched: ['mountain'],
		blacklistHit: false,
		tokensUsed: 124,
	},
	oneShot: {
		prompt: 'A ridge of grief above ore-bright water.',
		response: 'Sorrow on the ridge,\nCopper vein under cold rain,\nMountain holds its breath.',
		wordsMatched: ['mountain', 'sorrow'],
		blacklistHit: false,
		tokensUsed: 138,
		deltaWordsMatched: 1,
		allMatched: ['mountain', 'sorrow'],
	},
	summary: {
		zeroShotScore: 1,
		oneShotScore: 2,
		improvementDelta: 1,
		totalTokens: 262,
		converged: false,
		hardestWord: 'copper',
	},
	...over,
});

describe('formatDifficultyLabel', () => {
	it('maps low/medium/high to bracket badges', () => {
		expect(formatDifficultyLabel('low')).toBe('[LOW]');
		expect(formatDifficultyLabel('medium')).toBe('[MEDIUM]');
		expect(formatDifficultyLabel('high')).toBe('[HIGH]');
	});

	it('defaults unknown values to HIGH', () => {
		expect(formatDifficultyLabel(undefined)).toBe('[HIGH]');
		expect(formatDifficultyLabel('weird')).toBe('[HIGH]');
	});
});

describe('formatLearningSignal', () => {
	it('reports positive delta after feedback', () => {
		expect(formatLearningSignal(1, 1, 3)).toBe('+1 word after feedback');
		expect(formatLearningSignal(2, 0, 3)).toBe('+2 words after feedback');
	});

	it('reports no improvement when delta is zero', () => {
		expect(formatLearningSignal(0, 1, 3)).toBe('no improvement after feedback');
	});

	it('celebrates a perfect zero-shot', () => {
		expect(formatLearningSignal(0, 3, 3)).toBe('already perfect on first try');
	});
});

describe('formatHardestWordNote', () => {
	it('names the hard word and neither-attempt when unmatched', () => {
		const note = formatHardestWordNote('copper', {
			copper: { difficulty: 'high', matchedZeroShot: false, matchedOneShot: false },
		});
		expect(note).toBe('copper — neither attempt');
	});

	it('handles no hardest word', () => {
		expect(formatHardestWordNote(null)).toContain('none');
	});
});

describe('buildTrainingLog', () => {
	const base = {
		date: '2026-03-22',
		humanAttempts: 3,
		humanTokens: 847,
		targetWords: ['mountain', 'sorrow', 'copper'],
	};

	it('returns null when evaluation is missing', () => {
		expect(buildTrainingLog({ ...base, aiEvaluation: null })).toBeNull();
		expect(buildTrainingLog({ ...base, aiEvaluation: undefined })).toBeNull();
		expect(buildTrainingLog({ ...base, aiEvaluation: {} })).toBeNull();
	});

	it('builds human/AI comparison strip', () => {
		const view = buildTrainingLog({ ...base, aiEvaluation: evalFixture() })!;
		expect(view.date).toBe('2026-03-22');
		expect(view.human).toEqual({ attempts: 3, tokens: 847 });
		expect(view.ai.probes).toBe(2);
		expect(view.ai.tokens).toBe(262);
		expect(view.ai.status).toBe('partial');
		expect(view.ai.statusLabel).toBe('partial');
	});

	it('maps zero-shot and one-shot steps', () => {
		const view = buildTrainingLog({ ...base, aiEvaluation: evalFixture() })!;
		expect(view.steps).toHaveLength(2);
		expect(view.steps[0].label).toContain('ZERO SHOT');
		expect(view.steps[0].wordsMatched).toEqual(['mountain']);
		expect(view.steps[0].scoreAfter).toBe(1);
		expect(view.steps[1].label).toContain('ONE SHOT');
		expect(view.steps[1].wordsMatched).toEqual(['sorrow']); // newly matched only
		expect(view.steps[1].scoreAfter).toBe(2);
	});

	it('formats learning signal and hardest word', () => {
		const view = buildTrainingLog({ ...base, aiEvaluation: evalFixture() })!;
		expect(view.learningSignal).toBe('+1 word after feedback');
		expect(view.hardestWord).toBe('copper');
		expect(view.hardestWordNote).toBe('copper — neither attempt');
		expect(view.explainer).toMatch(/in-context learning/i);
	});

	it('builds difficulty badges for each target word', () => {
		const view = buildTrainingLog({ ...base, aiEvaluation: evalFixture() })!;
		expect(view.difficultyBadges).toEqual([
			{ word: 'mountain', difficulty: 'low', label: '[LOW]' },
			{ word: 'sorrow', difficulty: 'medium', label: '[MEDIUM]' },
			{ word: 'copper', difficulty: 'high', label: '[HIGH]' },
		]);
	});

	it('marks converged when summary says so', () => {
		const view = buildTrainingLog({
			...base,
			aiEvaluation: evalFixture({
				summary: {
					zeroShotScore: 2,
					oneShotScore: 3,
					improvementDelta: 1,
					totalTokens: 200,
					converged: true,
					hardestWord: null,
				},
			}),
		})!;
		expect(view.ai.status).toBe('converged');
		expect(view.hardestWordNote).toContain('none');
	});

	it('handles perfect zero-shot learning signal', () => {
		const view = buildTrainingLog({
			...base,
			aiEvaluation: evalFixture({
				zeroShot: {
					prompt: 'x',
					response: 'y',
					wordsMatched: ['mountain', 'sorrow', 'copper'],
					tokensUsed: 100,
				},
				oneShot: {
					prompt: 'x2',
					response: 'y2',
					wordsMatched: ['mountain', 'sorrow', 'copper'],
					tokensUsed: 90,
					deltaWordsMatched: 0,
					allMatched: ['mountain', 'sorrow', 'copper'],
				},
				summary: {
					zeroShotScore: 3,
					oneShotScore: 3,
					improvementDelta: 0,
					totalTokens: 190,
					converged: true,
					hardestWord: null,
				},
			}),
		})!;
		expect(view.learningSignal).toBe('already perfect on first try');
	});
});

describe('buildYouVsArtyLine', () => {
	it('returns null when summary is absent', () => {
		expect(buildYouVsArtyLine({ humanAttempts: 3, humanTokens: 847 })).toBeNull();
		expect(buildYouVsArtyLine({ humanAttempts: 3, humanTokens: 847, summary: null })).toBeNull();
		expect(buildYouVsArtyLine({ humanAttempts: 3, humanTokens: 847, summary: {} })).toBeNull();
	});

	it('compares human attempts/tokens to Arty probes/tokens', () => {
		const line = buildYouVsArtyLine({
			humanAttempts: 3,
			humanTokens: 847,
			summary: {
				zeroShotScore: 1,
				oneShotScore: 2,
				improvementDelta: 1,
				totalTokens: 262,
				converged: false,
				hardestWord: 'copper',
			},
		});
		expect(line).toContain('You 3 att · 847 tok');
		expect(line).toContain('Arty 2 probes · 262 tok');
		expect(line).toContain('2/3 words');
		expect(line).toContain('hardest: copper');
	});

	it('uses converged label when Arty matched all words', () => {
		const line = buildYouVsArtyLine({
			humanAttempts: 1,
			humanTokens: 50,
			summary: {
				totalTokens: 100,
				converged: true,
				oneShotScore: 3,
				hardestWord: null,
			},
		});
		expect(line).toContain('(converged)');
		expect(line).not.toContain('hardest:');
	});
});
