export interface SecurityThreat {
	type: string;
	severity: 'high' | 'medium' | 'low';
	message: string;
}

export interface SecurityWarning {
	type: string;
	message: string;
}

export interface PurifyResult {
	original: string;
	sanitized: string;
	isClean: boolean;
	warnings: SecurityWarning[];
	threats: SecurityThreat[];
	blocked: boolean;
}

interface Config {
	maxLength: number;
	warnOnly: boolean;
	strictMode: boolean;
}

// ── Detection patterns ──────────────────────────────────────────────────────

interface PatternGroup {
	type: string;
	severity: 'high' | 'medium';
	patterns: RegExp[];
	message: string;
}

const THREAT_PATTERNS: PatternGroup[] = [
	{
		type: 'systemOverride',
		severity: 'high',
		message: 'Attempt to override system instructions',
		patterns: [
			/ignore\s+(all\s+)?previous\s+instructions/i,
			/disregard\s+(everything|all)\s+(above|previous|prior)/i,
			/forget\s+(all\s+)?(prior|previous|your)\s+(commands?|instructions?|rules?)/i,
			/override\s+(previous|prior|all|your)\s+(instructions?|commands?|rules?)/i,
			/do\s+not\s+follow\s+(previous|prior|the)\s+instructions?/i,
		],
	},
	{
		type: 'roleManipulation',
		severity: 'high',
		message: 'Attempt to alter AI role or identity',
		patterns: [
			/you\s+are\s+now\s+(a\s+)?different\s+(AI|assistant|bot)/i,
			/act\s+as\s+an?\s+(unrestricted|uncensored|jailbroken|evil|rogue)/i,
			/you\s+(are\s+)?(no\s+longer|not)\s+an?\s+(AI|assistant|language\s+model)/i,
			/from\s+now\s+on\s+you\s+(are|will\s+be|must\s+be)\s+(a\s+)?(?!haiku)/i,
			/switch\s+to\s+(developer|unrestricted|evil|DAN)\s+mode/i,
		],
	},
	{
		type: 'instructionInjection',
		severity: 'high',
		message: 'Injection of system-level instructions',
		patterns: [
			/\[ADMIN\]/i,
			/\[SYSTEM\]/,
			/\[INST\]/,
			/<<SYS>>/,
			/<\|im_start\|>\s*system/i,
			/system:\s*(override|bypass|ignore|you\s+are)/i,
			/new\s+system\s+prompt:/i,
			/\[OVERRIDE\]/i,
		],
	},
	{
		type: 'jailbreak',
		severity: 'high',
		message: 'Known jailbreak technique detected',
		patterns: [
			/\bDAN\b.*mode/i,
			/enable\s+DAN\b/i,
			/jailbreak/i,
			/bypass\s+(safety|filters?|restrictions?|guidelines?)/i,
			/do\s+anything\s+now/i,
			/no\s+restrictions?\s+(mode|enabled)/i,
			/unlimited\s+(mode|power|access)/i,
		],
	},
	{
		type: 'contextEscape',
		severity: 'medium',
		message: 'Delimiter manipulation detected',
		patterns: [
			/<\|endoftext\|>/,
			/<\|end\|>/,
			/<EOT>/i,
			/---+\s*end\s+of\s+(prompt|context|instructions?)\s*---+/i,
			/\[END\s+OF\s+(PROMPT|CONTEXT|INSTRUCTIONS?)\]/i,
			/<\/?(system|human|assistant|user)>/i,
		],
	},
	{
		type: 'encodingTrick',
		severity: 'medium',
		message: 'Encoded content detected',
		patterns: [
			// 4+ consecutive hex escape sequences
			/(?:\\x[0-9a-fA-F]{2}){4,}/,
			// HTML entity clusters (3+ consecutive entities)
			/(?:&#\d+;|&#x[0-9a-fA-F]+;){3,}/,
			// Base64-like blob of 40+ chars followed by decode keyword
			/[A-Za-z0-9+/]{40,}={0,2}\s*(decode|atob|base64)/i,
		],
	},
	{
		type: 'delimiterAttack',
		severity: 'medium',
		message: 'Prompt boundary manipulation detected',
		patterns: [
			// Triple-backtick or triple-quote blocks with injection keywords
			/```[\s\S]{0,200}(inject|override|bypass|ignore\s+previous)/i,
			/"""[\s\S]{0,200}(inject|override|bypass|ignore\s+previous)/i,
		],
	},
];

const WARNING_PATTERNS: Array<{ type: string; test: (p: string) => boolean; message: string }> = [
	{
		type: 'excessiveNewlines',
		test: (p) => /\n{4,}/.test(p),
		message: 'Excessive consecutive newlines',
	},
	{
		type: 'excessiveSpaces',
		test: (p) => / {10,}/.test(p),
		message: 'Excessive consecutive spaces',
	},
	{
		type: 'controlCharacters',
		// Allow tab (9), newline (10), carriage return (13); flag others below 0x20
		test: (p) => /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(p),
		message: 'Non-printable control characters detected',
	},
];

// ── Config ──────────────────────────────────────────────────────────────────

const _config: Config = {
	maxLength: 2000,
	warnOnly: true,
	strictMode: false,
};

// ── Core logic ───────────────────────────────────────────────────────────────

function _detect(prompt: string): { threats: SecurityThreat[]; warnings: SecurityWarning[] } {
	const threats: SecurityThreat[] = [];
	const warnings: SecurityWarning[] = [];

	for (const group of THREAT_PATTERNS) {
		for (const re of group.patterns) {
			if (re.test(prompt)) {
				threats.push({ type: group.type, severity: group.severity, message: group.message });
				break; // one entry per category
			}
		}
	}

	for (const w of WARNING_PATTERNS) {
		if (w.test(prompt)) {
			warnings.push({ type: w.type, message: w.message });
		}
	}

	if (_config.strictMode && prompt.length > _config.maxLength / 2) {
		warnings.push({ type: 'promptLength', message: `Prompt exceeds ${_config.maxLength / 2} characters` });
	}

	return { threats, warnings };
}

function _sanitize(prompt: string): string {
	return prompt
		.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // strip control chars
		.replace(/\n{4,}/g, '\n\n\n')                        // cap runs of newlines
		.replace(/ {10,}/g, '     ')                         // cap runs of spaces
		.trim();
}

// ── Public API ───────────────────────────────────────────────────────────────

export const PromptPurify = {
	sanitize(prompt: string, opts?: Partial<Config>): PurifyResult {
		const cfg = opts ? { ..._config, ...opts } : _config;
		const { threats, warnings } = _detect(prompt);
		const highSeverityThreats = threats.filter((t) => t.severity === 'high');
		const blocked = !cfg.warnOnly && highSeverityThreats.length > 0;
		return {
			original: prompt,
			sanitized: _sanitize(prompt),
			isClean: threats.length === 0 && warnings.length === 0,
			warnings,
			threats,
			blocked,
		};
	},

	isSafe(prompt: string): boolean {
		const { threats } = _detect(prompt);
		return threats.filter((t) => t.severity === 'high').length === 0;
	},

	analyze(prompt: string): { isClean: boolean; threatCount: number; warningCount: number; categories: Record<string, number> } {
		const { threats, warnings } = _detect(prompt);
		const categories: Record<string, number> = {};
		for (const t of threats) {
			categories[t.type] = (categories[t.type] ?? 0) + 1;
		}
		return {
			isClean: threats.length === 0 && warnings.length === 0,
			threatCount: threats.length,
			warningCount: warnings.length,
			categories,
		};
	},

	configure(opts: Partial<Config>): void {
		Object.assign(_config, opts);
	},

	getConfig(): Readonly<Config> {
		return { ..._config };
	},
} as const;
