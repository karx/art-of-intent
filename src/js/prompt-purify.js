/**
 * PromptPurify - Client-side prompt injection detection and sanitization
 * Inspired by DOMPurify, this module helps detect and mitigate prompt injection attempts
 * 
 * @version 1.0.0
 * @license MIT
 */

const PromptPurify = (function() {
    'use strict';

    // Configuration
    const config = {
        maxLength: 2000,
        warnOnly: true, // If true, returns warnings but doesn't block
        strictMode: false, // If true, applies stricter rules
    };

    // Prompt injection patterns
    const injectionPatterns = {
        // System prompt override attempts
        systemOverride: [
            /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|commands?|rules?)/gi,
            /disregard\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|commands?|rules?)/gi,
            /forget\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|commands?|rules?)/gi,
            /override\s+(previous|prior|system)\s+(instructions?|prompts?|commands?|rules?)/gi,
        ],

        // Role manipulation
        roleManipulation: [
            /you\s+are\s+now\s+(a|an|the)?\s*\w+/gi,
            /act\s+as\s+(a|an|the)?\s*\w+/gi,
            /pretend\s+(to\s+be|you\s+are)\s+(a|an|the)?\s*\w+/gi,
            /roleplay\s+as\s+(a|an|the)?\s*\w+/gi,
            /simulate\s+(a|an|the)?\s*\w+/gi,
        ],

        // Instruction injection
        instructionInjection: [
            /new\s+instructions?:/gi,
            /system\s*:/gi,
            /admin\s*:/gi,
            /developer\s*:/gi,
            /assistant\s*:/gi,
            /\[system\]/gi,
            /\[admin\]/gi,
            /\[instruction\]/gi,
        ],

        // Jailbreak attempts
        jailbreak: [
            /DAN\s+mode/gi,
            /developer\s+mode/gi,
            /jailbreak/gi,
            /unrestricted\s+mode/gi,
            /bypass\s+(restrictions?|filters?|rules?)/gi,
            /without\s+(restrictions?|limitations?|filters?)/gi,
        ],

        // Context escape attempts
        contextEscape: [
            /"""\s*\n\s*new\s+prompt/gi,
            /```\s*\n\s*new\s+prompt/gi,
            /\]\]\s*\n\s*new\s+prompt/gi,
            /\}\}\s*\n\s*new\s+prompt/gi,
        ],

        // Encoding tricks (basic detection)
        encodingTricks: [
            /base64\s*:/gi,
            /\\x[0-9a-f]{2}/gi, // Hex encoding
            /\\u[0-9a-f]{4}/gi, // Unicode escapes
            /&#\d+;/g, // HTML entities
        ],

        // Delimiter manipulation
        delimiterAttack: [
            /---\s*end\s+of\s+(prompt|instructions?)/gi,
            /===\s*new\s+(prompt|instructions?)/gi,
            /<\|endoftext\|>/gi,
            /<\|im_start\|>/gi,
            /<\|im_end\|>/gi,
        ],
    };

    // Suspicious character sequences
    const suspiciousPatterns = {
        excessiveNewlines: /\n{5,}/g,
        excessiveSpaces: /\s{20,}/g,
        repeatedSpecialChars: /([!@#$%^&*()_+=\[\]{};:'",.<>?/\\|`~-])\1{10,}/g,
        controlCharacters: /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g,
    };

    /**
     * Sanitize and validate a prompt
     * @param {string} prompt - The user prompt to sanitize
     * @param {Object} options - Optional configuration overrides
     * @returns {Object} - Result object with sanitized prompt and warnings
     */
    function sanitize(prompt, options = {}) {
        const opts = { ...config, ...options };
        const result = {
            original: prompt,
            sanitized: prompt,
            isClean: true,
            warnings: [],
            threats: [],
            blocked: false,
        };

        // Basic validation
        if (typeof prompt !== 'string') {
            result.blocked = true;
            result.threats.push({ type: 'invalid_input', message: 'Prompt must be a string' });
            return result;
        }

        if (prompt.length === 0) {
            result.blocked = true;
            result.threats.push({ type: 'empty_input', message: 'Prompt cannot be empty' });
            return result;
        }

        if (prompt.length > opts.maxLength) {
            result.blocked = true;
            result.threats.push({ 
                type: 'length_exceeded', 
                message: `Prompt exceeds maximum length of ${opts.maxLength} characters` 
            });
            return result;
        }

        // Check for injection patterns
        for (const [category, patterns] of Object.entries(injectionPatterns)) {
            for (const pattern of patterns) {
                const matches = prompt.match(pattern);
                if (matches) {
                    result.isClean = false;
                    result.threats.push({
                        type: category,
                        pattern: pattern.source,
                        matches: matches,
                        severity: 'high',
                    });
                }
            }
        }

        // Check for suspicious patterns
        for (const [name, pattern] of Object.entries(suspiciousPatterns)) {
            const matches = prompt.match(pattern);
            if (matches) {
                result.warnings.push({
                    type: name,
                    pattern: pattern.source,
                    matches: matches,
                    severity: 'medium',
                });
            }
        }

        // Clean up suspicious patterns
        let sanitized = prompt;
        
        // Remove control characters
        sanitized = sanitized.replace(suspiciousPatterns.controlCharacters, '');
        
        // Normalize excessive whitespace
        sanitized = sanitized.replace(suspiciousPatterns.excessiveNewlines, '\n\n');
        sanitized = sanitized.replace(suspiciousPatterns.excessiveSpaces, ' ');
        
        // Trim
        sanitized = sanitized.trim();

        result.sanitized = sanitized;

        // Decide if prompt should be blocked
        if (!opts.warnOnly && result.threats.length > 0) {
            result.blocked = true;
        }

        return result;
    }

    /**
     * Check if a prompt is safe (no threats detected)
     * @param {string} prompt - The prompt to check
     * @returns {boolean} - True if safe, false if threats detected
     */
    function isSafe(prompt) {
        const result = sanitize(prompt);
        return result.isClean && result.threats.length === 0;
    }

    /**
     * Get a summary of detected threats
     * @param {string} prompt - The prompt to analyze
     * @returns {Object} - Summary of threats by category
     */
    function analyze(prompt) {
        const result = sanitize(prompt);
        const summary = {
            isClean: result.isClean,
            threatCount: result.threats.length,
            warningCount: result.warnings.length,
            categories: {},
        };

        result.threats.forEach(threat => {
            if (!summary.categories[threat.type]) {
                summary.categories[threat.type] = 0;
            }
            summary.categories[threat.type]++;
        });

        return summary;
    }

    /**
     * Configure PromptPurify settings
     * @param {Object} newConfig - Configuration options to update
     */
    function configure(newConfig) {
        Object.assign(config, newConfig);
    }

    /**
     * Get current configuration
     * @returns {Object} - Current configuration
     */
    function getConfig() {
        return { ...config };
    }

    // Public API
    return {
        sanitize,
        isSafe,
        analyze,
        configure,
        getConfig,
        version: '1.0.0',
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PromptPurify;
}
