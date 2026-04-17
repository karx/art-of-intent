import { functions, httpsCallable } from '$lib/firebase';

export interface ArtyAppearance {
	primary: string;
	secondary: string;
	bgGlow: string;
	eyeShape: 'circle' | 'rect' | 'diamond' | 'bar';
	eyeSize: number;
	mouthCurve: number;
	headRx: number;
	bodyRx: number;
	chestPattern: 'core' | 'circuit' | 'scanner' | 'gauge' | 'empty';
	antennaStyle: 'none' | 'single' | 'dual' | 'coil';
	shoulderStyle: 'none' | 'pads' | 'vents' | 'fins';
	legStyle: 'legs' | 'hover' | 'treads';
	bgScene: 'void' | 'grid' | 'stars' | 'circuit' | 'waves';
	glowRadius: number;
	scanlines: boolean;
	/** Raw SVG element strings to overlay on Arty's face visor (sanitised before use). */
	faceSVG?: string | null;
}

export interface HaikuResponse {
	responseText: string;
	userPromptTokens: number;
	systemPromptTokens: number;
	provider: string;
	artyAppearance?: ArtyAppearance | null;
	/** Updated ASCII window art — null if the server could not generate one. */
	artyAsciiWindow?: string | null;
	usageMetadata: {
		promptTokenCount: number;
		candidatesTokenCount: number;
		totalTokenCount: number;
	};
}

export interface SaveSettingsRequest {
	provider: 'gemini' | 'openai' | 'anthropic' | 'custom' | null;
	apiKey?: string;
	endpoint?: string;
	model?: string;
}

/**
 * Call artyGenerateHaiku Cloud Function.
 * Maps Firebase HttpsError codes to user-facing strings.
 */
export async function callArtyAPI(
	userPrompt: string,
	sessionId: string,
	currentAsciiWindow?: string,
	attemptCount?: number,
): Promise<HaikuResponse> {
	const artyGenerateHaiku = httpsCallable<
		{ userPrompt: string; sessionId: string; currentAsciiWindow?: string; attemptCount?: number },
		{ success: boolean; data: HaikuResponse }
	>(functions, 'artyGenerateHaiku');

	try {
		const result = await artyGenerateHaiku({ userPrompt, sessionId, currentAsciiWindow, attemptCount });
		if (!result.data.success) throw new Error('Failed to generate haiku');
		return result.data.data;
	} catch (err: any) {
		const retryAfter = err.details?.retryAfterSeconds;
		switch (err.code) {
			case 'unauthenticated':
				throw new Error('Please sign in to play.');
			case 'invalid-argument':
				throw new Error('Your prompt was rejected. Please try a different approach.');
			case 'resource-exhausted':
				throw new Error(
					retryAfter
						? `Arty is resting. Try again in ${retryAfter}s.`
						: 'Too many requests. Please wait a moment and try again.'
				);
			case 'unavailable':
				throw new Error('Arty is temporarily unavailable. Please try again shortly.');
			case 'deadline-exceeded':
				throw new Error('Arty took too long to respond. Please try again.');
			case 'not-found':
				throw new Error("Today's words aren't loaded yet. Try refreshing.");
			case 'permission-denied':
				throw new Error(
					err.details?.provider && err.details.provider !== 'gemini'
						? 'Your API key was rejected. Check your model settings.'
						: 'Service configuration error. Please contact support.'
				);
			default:
				throw new Error(err.message || 'Could not reach Arty. Please try again.');
		}
	}
}

/** Store the user's AI provider settings. Pass provider: null to clear. */
export async function saveUserSettings(req: SaveSettingsRequest): Promise<void> {
	const fn = httpsCallable(functions, 'saveUserSettings');
	await fn(req);
}
