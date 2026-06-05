import { functions, httpsCallable } from '$lib/firebase';

export interface HaikuResponse {
	responseText: string;
	userPromptTokens: number;
	systemPromptTokens: number;
	provider: string;
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
 * Map a Firebase HttpsError (or plain Error) to a user-facing Error.
 * Pure — no Firebase dependency, independently testable.
 */
export function mapCallableError(err: any): Error {
	const retryAfter = err.details?.retryAfterSeconds;
	switch (err.code) {
		case 'unauthenticated':
			return new Error('Please sign in to play.');
		case 'invalid-argument':
			return new Error('Your prompt was rejected. Please try a different approach.');
		case 'resource-exhausted':
			return new Error(
				retryAfter
					? `Arty is resting. Try again in ${retryAfter}s.`
					: 'Too many requests. Please wait a moment and try again.'
			);
		case 'unavailable':
			return new Error('Arty is temporarily unavailable. Please try again shortly.');
		case 'deadline-exceeded':
			return new Error('Arty took too long to respond. Please try again.');
		case 'not-found':
			return new Error("Today's words aren't loaded yet. Try refreshing.");
		case 'permission-denied':
			return new Error(
				err.details?.provider && err.details.provider !== 'gemini'
					? 'Your API key was rejected. Check your model settings.'
					: 'Service configuration error. Please contact support.'
			);
		default:
			return new Error(err.message || 'Could not reach Arty. Please try again.');
	}
}

export async function callArtyAPI(userPrompt: string, sessionId: string): Promise<HaikuResponse> {
	const artyGenerateHaiku = httpsCallable<
		{ userPrompt: string; sessionId: string },
		{ success: boolean; data: HaikuResponse }
	>(functions, 'artyGenerateHaiku');

	try {
		const result = await artyGenerateHaiku({ userPrompt, sessionId });
		if (!result.data.success) throw new Error('Failed to generate haiku');
		return result.data.data;
	} catch (err: any) {
		throw mapCallableError(err);
	}
}

/** Store the user's AI provider settings. Pass provider: null to clear. */
export async function saveUserSettings(req: SaveSettingsRequest): Promise<void> {
	const fn = httpsCallable(functions, 'saveUserSettings');
	await fn(req);
}
