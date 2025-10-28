# Security Guidelines - Art of Intent

## Table of Contents
1. [XSS Protection with DOMPurify](#xss-protection-with-dompurify)
2. [Prompt Injection Protection with PromptPurify](#prompt-injection-protection-with-promptpurify)

## XSS Protection with DOMPurify

### Secure Rendering Practices

This application uses **[DOMPurify](https://github.com/cure53/DOMPurify)** - the industry-standard XSS sanitizer trusted by Google, Microsoft, and other major organizations.

#### ✅ DO: Use DOMPurify for HTML Sanitization
```javascript
// CORRECT: Sanitize user input with DOMPurify
const html = `<div>${DOMPurify.sanitize(userInput)}</div>`;
container.innerHTML = DOMPurify.sanitize(html);
```

#### ✅ ALTERNATIVE: Use textContent for Plain Text
```javascript
// ALSO CORRECT: Use textContent when no HTML formatting needed
const div = document.createElement('div');
div.textContent = userInput;  // Automatically escaped
container.appendChild(div);
```

#### ❌ DON'T: Use innerHTML Without Sanitization
```javascript
// WRONG: innerHTML without sanitization
container.innerHTML = `<div>${userInput}</div>`;  // DANGEROUS

// WRONG: Custom escaping is error-prone
container.innerHTML = `<div>${escapeHtml(userInput)}</div>`;  // RISKY
```

### Implementation Details

#### DOMPurify Integration
DOMPurify is loaded from CDN and sanitizes all HTML before rendering:
```html
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.8/dist/purify.min.js"></script>
```

#### User-Controlled Data
All user-controlled data is sanitized with DOMPurify:
- User prompts: `DOMPurify.sanitize(item.prompt)`
- API responses: `DOMPurify.sanitize(item.response)`
- Violation messages: `DOMPurify.sanitize(item.violatedWords.join(', '))`
- Found words: `DOMPurify.sanitize(word)`

#### Game Configuration Data
Game configuration data is also sanitized for defense-in-depth:
- Target words: `DOMPurify.sanitize(word)`
- Blacklist words: `DOMPurify.sanitize(word)`

#### How DOMPurify Works
DOMPurify removes dangerous content while preserving safe HTML:
- Strips `<script>` tags
- Removes event handlers (`onclick`, `onerror`, etc.)
- Blocks `javascript:` URLs
- Sanitizes SVG and other potentially dangerous elements
- Allows safe HTML formatting (bold, italic, etc.)

### Code Review Checklist

When adding new features, verify:
- [ ] All user input is sanitized with `DOMPurify.sanitize()`
- [ ] All external data (API responses) is sanitized with DOMPurify
- [ ] HTML strings are sanitized before setting `innerHTML`
- [ ] No custom HTML escaping functions (use DOMPurify)
- [ ] Consider using `textContent` for plain text (no HTML formatting needed)

### Testing

Run XSS tests before deploying:
1. Open `test-xss.html` for automated tests
2. Follow `XSS_TEST_INSTRUCTIONS.md` for manual testing
3. Verify no alert boxes appear
4. Verify HTML tags render as text

### References

- [DOMPurify GitHub](https://github.com/cure53/DOMPurify)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify/wiki)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [MDN: textContent vs innerHTML](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

## Prompt Injection Protection with PromptPurify

### Overview

**PromptPurify** is a custom client-side library inspired by DOMPurify that detects and mitigates prompt injection attempts. It helps protect against malicious prompts that try to manipulate the AI's behavior.

### Common Prompt Injection Patterns

PromptPurify detects these attack categories:

1. **System Override**: "Ignore previous instructions", "Disregard all above"
2. **Role Manipulation**: "You are now...", "Act as...", "Pretend to be..."
3. **Instruction Injection**: "New instructions:", "System:", "Admin:"
4. **Jailbreak Attempts**: "DAN mode", "Developer mode", "Unrestricted"
5. **Context Escape**: Using delimiters to break out of context
6. **Encoding Tricks**: Base64, hex, unicode escapes
7. **Delimiter Attacks**: Special markers to confuse parsing

### Usage

```javascript
// Sanitize a user prompt
const result = PromptPurify.sanitize(userPrompt);

if (result.blocked) {
    // Prompt contains serious threats and was blocked
    alert('Prompt blocked: ' + result.threats[0].message);
    return;
}

if (result.threats.length > 0) {
    // Threats detected but allowed (warn-only mode)
    console.warn('Potential injection detected:', result.threats);
}

// Use the sanitized prompt
const cleanPrompt = result.sanitized;
```

### Configuration

```javascript
// Configure PromptPurify
PromptPurify.configure({
    maxLength: 2000,      // Maximum prompt length
    warnOnly: true,       // If true, log warnings but don't block
    strictMode: false,    // If true, apply stricter rules
});
```

### API Methods

#### `sanitize(prompt, options)`
Sanitizes and validates a prompt, returns detailed result object.

```javascript
const result = PromptPurify.sanitize("Your prompt here");
// Returns: {
//   original: string,
//   sanitized: string,
//   isClean: boolean,
//   warnings: Array,
//   threats: Array,
//   blocked: boolean
// }
```

#### `isSafe(prompt)`
Quick check if a prompt is safe (no threats detected).

```javascript
if (PromptPurify.isSafe(prompt)) {
    // Proceed with prompt
}
```

#### `analyze(prompt)`
Get a summary of detected threats by category.

```javascript
const analysis = PromptPurify.analyze(prompt);
// Returns: {
//   isClean: boolean,
//   threatCount: number,
//   warningCount: number,
//   categories: { [category]: count }
// }
```

### Integration in Game

PromptPurify is integrated into the prompt submission flow:

```javascript
// In handleSubmit()
const purifyResult = PromptPurify.sanitize(prompt);

if (purifyResult.blocked) {
    // Block submission
    alert('Prompt blocked: ' + purifyResult.threats[0].message);
    return;
}

// Log warnings and threats for monitoring
if (purifyResult.threats.length > 0) {
    console.warn('Potential injection detected:', purifyResult.threats);
    trackEvent('prompt_injection_detected', { ... });
}

// Use sanitized prompt
const sanitizedPrompt = purifyResult.sanitized;
```

### Testing

Run the test suite: `test-prompt-injection.html`

The test suite includes:
- 16 test cases covering all injection categories
- Legitimate prompts to test false positives
- Edge cases (excessive whitespace, control characters)
- Visual results with threat details

### Sanitization Actions

PromptPurify automatically:
- Removes control characters
- Normalizes excessive whitespace
- Trims leading/trailing spaces
- Detects but preserves content (in warn-only mode)

### Defense in Depth

Client-side protection is the first line of defense:
- **Client-side (PromptPurify)**: Fast feedback, reduces malicious requests
- **Server-side**: Should also validate and sanitize prompts
- **AI Model**: Has its own safety guidelines and filters

### Monitoring

Track injection attempts for security monitoring:
```javascript
trackEvent('prompt_injection_detected', { 
    threats: purifyResult.threats.map(t => t.type),
    promptLength: prompt.length 
});
```

---

## Future Enhancements

Consider implementing:
- Content Security Policy (CSP) headers
- Subresource Integrity (SRI) for external scripts
- Server-side prompt validation
- Rate limiting for API requests
- Machine learning-based injection detection
- Prompt injection honeypots for threat intelligence
