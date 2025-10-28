# Changelog

All notable changes to Art of Intent will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - Share Card Creep Display
- **Creep Visualization**: Share cards now display creep level with darkness bar
- **Visual Indicator**: 10-block bar (▓ filled, ░ empty) showing creep progression
- **Color Coding**: Green (0-24), Yellow (25-74), Red (75-100)
- **Numeric Display**: Shows "35/100" format alongside visual bar
- **Theme Integration**: Colors adapt to active theme automatically
- **Card Layout**: Expanded user info card to accommodate creep display

### Changed - Mechanics Cleanup & UX Refinement

#### 🎯 User Input Validation
- **Direct word usage prevention**: Users can no longer use target or blacklist words directly in their prompts
- **Simple rejection message**: "Don't use these words directly—it's no fun then! The game is about clever prompting, not direct usage."
- **Minor creep penalty**: +10 creep for direct word usage (instead of instant game over)
- **Maintains game flow**: Encourages creative prompting without harsh punishment

#### 🤖 Arty Response Handling
- **Target word matching**: Unchanged - score increases when Arty says target words ✅
- **Blacklist word detection**: Arty's responses now checked for blacklist words
- **Creep increase**: +25 creep per blacklist word in Arty's response
- **Game over condition**: Game ends when creep reaches 100 from Arty's violations

#### 🎮 Improved Game Balance
- **User mistakes**: Gentle correction with minor penalty (10 creep)
- **Arty violations**: Significant penalty (25 creep per word)
- **Strategic depth**: Players must craft prompts that avoid triggering blacklist words in Arty's responses
- **Fair gameplay**: Prevents cheating while maintaining challenge

#### 🎨 Feedback System Redesign - Brand-Aligned
- **Contemplative, Not Punitive**: Blacklist hits treated as game progression, not errors
- **Inline Feedback**: Replaced large warning boxes with subtle inline indicators
- **Space Efficient**: 67% reduction in vertical space (60px → 20px)
- **Poetic Language**: "darkness creeps" instead of "violation detected"
- **Token Clarity**: Explicit distinction between token-free rejections and AI responses
  - Input rejected: Dimmed response + "no tokens consumed" hint
  - Darkness creeps: Normal response + subtle darkness indicator (▓)
  - Critical: Multiple darkness icons (▓▓▓) for severity
- **Subtle Presence**: 0.6-0.8 opacity, 0.65rem font, lowercase labels
- **Brand Consistency**: Aligned with Arty's contemplative, poetic nature
- **Creep Persistence**: Creep level now saves/loads correctly across page refreshes

#### 🔧 Technical Improvements
- **Theme System Integration**: Moved feedback styling to `themes.css` for theme consistency
- **Theme Variables**: All colors use CSS variables (`--warning-color`, `--error-color`, etc.)
- **Maintainer Documentation**: Comprehensive guide for future team members
  - `FEEDBACK_SYSTEM_MAINTAINER_GUIDE.md` - Complete technical reference
  - Inline comments in `themes.css` explaining design decisions
  - Architecture documentation and troubleshooting guide

#### 🐛 Bug Fixes
- **Game Over Detection**: Fixed bug where game didn't end when creep reached 100 via user input
- **Threshold Checking**: All three creep paths now properly check threshold
  - User input rejection path
  - Arty response violation path
  - Legacy blacklist violation path

## [1.2.0-alpha] - 2025-10-28

### Added - The Black Update

#### 🌑 Creep/Darkness System
- **Progressive penalty system** for blacklist violations
- **Creep level tracking** (0-100 scale)
- **4 violations allowed** before game over (25 creep per violation)
- **Visual feedback** with color-coded creep indicator
- **Dynamic haiku responses** based on creep level
- **Tension curve** - mounting pressure as darkness grows

#### 🎮 Gameplay Changes
- **Blacklist violations no longer instant game over**
- **Creep accumulation** - darkness slowly consumes the game
- **Strategic depth** - players must manage remaining "lives"
- **Forgiveness** - room for mistakes while learning

#### 🎨 UI Enhancements
- **Creep indicator** in score bar (CREEP: X/100)
- **Color-coded warnings**:
  - Green (0-24): Safe
  - Amber (25-49): Caution
  - Red (50-74): Warning
  - Red pulsing (75-99): Critical
  - Red pulsing (100): Game Over
- **Violation warning box** with creep change display
- **Progressive messages** based on danger level

#### 📊 Trail Item Updates
- **Creep level changes** shown in violation items
- **Warning messages** adapt to creep level
- **Game over haiku** for creep threshold reached
- **Visual distinction** between warning and game over

### Changed

#### 🔄 Game Mechanics
- Blacklist violations increment creep instead of ending game
- Game ends only when creep reaches 100
- Different sound effects for warning vs game over
- Analytics track creep progression

#### 🎭 Haiku Responses
- **Creep increasing**: "Shadows grow deeper now, / Darkness creeps (X → Y), / Tread carefully forth."
- **Creep maxed**: "Darkness now consumes all, / The creep has claimed its victory, / Silence falls complete."

### Technical Details

#### Game State
- Added `creepLevel` (0-100)
- Added `creepThreshold` (100)
- Added `creepPerViolation` (25)

#### Trail Items
- Added `creepIncrease` field
- Added `creepLevel` field
- Added `creepMaxed` boolean

#### CSS Classes
- `.creep-indicator` with 4 state variants
- `.violation-warning` container
- `.creep-change` display
- Pulsing animation for critical states

#### Analytics Events
- `blacklist_violation_creep` - Non-fatal violation
- `creep_threshold_reached` - Game over event

### Documentation
- **docs/CREEP_SYSTEM.md** - Complete system documentation

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
