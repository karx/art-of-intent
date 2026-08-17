/**
 * Creep meter feedback — severity bands and the animation cue for an
 * increase. Bands mirror the color thresholds used across the UI.
 */

export type CreepSeverity = 'low' | 'medium' | 'high' | 'critical';

export const SHAKE_THRESHOLD = 75;

export function creepSeverity(level: number): CreepSeverity {
	if (level >= 75) return 'critical';
	if (level >= 50) return 'high';
	if (level >= 25) return 'medium';
	return 'low';
}

/** Animation cue when creep moves from prev → next; null when it didn't rise. */
export function creepFeedback(prev: number, next: number): 'flash' | 'shake' | null {
	if (next <= prev) return null;
	return next >= SHAKE_THRESHOLD ? 'shake' : 'flash';
}
