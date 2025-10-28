# Changelog

All notable changes to Art of Intent will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0-alpha] - 2025-10-28

### Added

#### 🛡️ Security: XSS Protection with DOMPurify
- **Integrated DOMPurify v3.0.8** - Industry-standard XSS sanitizer
- **10 sanitization points** in game.js for all user/external data
- **Test suite** - `test-xss.html` with 8 common XSS payloads
- **Complete protection** for prompts, responses, violations, and found words

#### 🛡️ Security: Prompt Injection Detection with PromptPurify
- **Custom PromptPurify library** - Client-side injection detection
- **7 detection categories**:
  - System override attempts
  - Role manipulation
  - Instruction injection
  - Jailbreak attempts
  - Context escape
  - Encoding tricks
  - Delimiter attacks
- **Configurable modes** - Warn-only or blocking
- **Analytics integration** - Track injection attempts
- **Test suite** - `test-prompt-injection.html` with 16 test cases

#### 🎨 Security Signals UI
- **Minimalist visual indicators** in trail items
- **Theme-aware styling** - Adapts to all 5 themes
- **Progressive disclosure** - Only shown when threats/warnings detected
- **Clean prompts** - No signal shown (reduces clutter)
- **Color-coded states**:
  - Amber - Warning (suspicious patterns)
  - Red - Threat detected (injection attempt)
  - Dark Red - Blocked (strict mode)
- **Security details** - Expandable threat information
- **Synced with Trail Stats Design** - Proper placement and hierarchy

#### 🎨 Match Indicator Theming
- **Theme-aware colors** - Uses CSS variables
- **Consistent styling** - Matches security signal design
- **All 5 themes supported** - Solarized, Polarized, Light, Dark, Cartoon
- **Uppercase monospace** - Professional technical aesthetic

### Changed

#### 🎨 CSS Architecture
- **Moved styles to dos-theme.css** - Theme system integration
- **Security signals** - ~100 lines in dos-theme.css
- **Theme overrides** - ~50 lines in themes.css for light/dark variants
- **Match indicators** - ~40 lines in dos-theme.css

#### 🔒 Security Data Flow
- **Trail items store security analysis** - Threat/warning metadata
- **PromptPurify integration** - Runs on every prompt submission
- **Sanitized prompts** - Used for API calls
- **Analytics tracking** - All security events logged

### Documentation

#### 📚 Security Documentation
- **SECURITY.md** - Complete security guidelines
- **PROMPT_PURIFY_README.md** - API reference and usage guide
- **SECURITY_IMPLEMENTATION_SUMMARY.md** - Implementation overview
- **SECURITY_FLOW.md** - Visual flow diagrams
- **SECURITY_SIGNALS_GUIDE.md** - UI design guide
- **SECURITY_SIGNALS_INTEGRATION.md** - Integration with Trail Stats
- **SECURITY_SIGNALS_FINAL.md** - Theme system integration
- **SECURITY_SIGNALS_COMPLETE.md** - Final implementation guide
- **XSS_TEST_INSTRUCTIONS.md** - Testing procedures

### Technical Details

#### Files Created
- `src/js/prompt-purify.js` (7.6KB) - Detection library
- `test-xss.html` (14KB) - XSS test suite
- `test-prompt-injection.html` (14KB) - Injection test suite
- `test-security-signals.html` (9.3KB) - UI demo
- 9 documentation files (total ~60KB)

#### Files Modified
- `index.html` - Added DOMPurify and PromptPurify scripts
- `src/js/game.js` - Security integration, signal rendering
- `src/css/dos-theme.css` - Security signal and match indicator styles
- `src/css/themes.css` - Theme-specific overrides

### Added - 2025-10-25

#### 🎨 Side Navigation System with Cognitive Design
A complete navigation redesign applying cognitive psychology principles for optimal user experience.

**Desktop Experience:**
- **Collapsible sidebar** (56px → 200px) on the left edge
  - Hover to expand temporarily
  - Click menu to pin/unpin
  - Smooth 200ms transitions
- **Auto-hide top bar** - Slides up when scrolling, reappears at page top
- **Keyboard shortcuts** for power users:
  - `Ctrl+B` - Toggle sidebar
  - `F1` - Help
  - `Ctrl+L` - Leaderboard
  - `Ctrl+P` - Profile
  - `Ctrl+M` - Mute/Unmute sound

**Mobile Experience:**
- **Top navigation bar** with icon + label buttons
- **Auto-hide on scroll** - Maximizes vertical space during gameplay
- **6 primary actions**: Help (?) | Leaderboard (▤) | Profile (👤) | Sound (♪) | About (i)
- **Optimized touch targets** - 48px minimum for easy thumb reach

**User Identity:**
- **Input area indicator** - Shows current user (avatar + name) where you type
- **Real-time updates** - Changes when signing in/out
- **Terminal-style prompt** - `> Username` for familiar CLI aesthetic

**Design Documentation:**
- Comprehensive cognitive design rationale
- Fitts's Law, Miller's Law, Jakob's Law applications
- Progressive disclosure patterns
- Accessibility guidelines

#### 🔧 Firebase & Authentication Improvements
- **Fixed Firestore rules deployment** to alpha database
- **Improved guest user session saving** with better error handling
- **Enhanced error logging** for debugging permissions issues
- **Scope fixes** in error handlers

### Changed - 2025-10-25
- **Navigation structure** - Moved from fixed header to adaptive side/top navigation
- **Scroll behavior** - Navigation auto-hides to maximize content space
- **Mobile layout** - Top bar instead of bottom nav for better ergonomics
- **Sound icon** - Updated to text symbol (♪) instead of emoji
- **User context** - Identity shown in input area, not just header

### Technical Details
- **Files modified**: 7 files, 1,288 insertions, 92 deletions
- **New components**: 
  - `src/js/header-toggle.js` - Navigation and scroll logic
  - `docs/SIDE_NAVIGATION_DESIGN.md` - Design system documentation
- **CSS architecture**: Responsive breakpoint at 767px
- **Performance**: 60fps animations, throttled scroll handlers

### Design Principles Applied
1. **Fitts's Law** - Larger targets at screen edges for faster acquisition
2. **Miller's Law** - 5-7 navigation items to reduce cognitive load
3. **Jakob's Law** - Familiar patterns (VSCode-style sidebar)
4. **Progressive Disclosure** - Hide complexity until needed
5. **Hick's Law** - Fewer choices = faster decisions

---

## [1.0.0] - Previous Release

### Features
- Daily word puzzle game with AI haiku bot
- Target words and blacklist mechanics
- Token efficiency scoring
- Leaderboard system
- Firebase authentication and data persistence
- Share card generation (v3)
- Voice input support
- DOS-themed retro aesthetic

---

**Legend:**
- 🎨 Design & UX
- 🔧 Technical & Infrastructure
- 🐛 Bug Fixes
- 📚 Documentation
- ⚡ Performance
- ♿ Accessibility
