# Authentication Flow Design

## Current Problem

**Auto-Login Behavior:**
- After 2 seconds, users are automatically signed in as anonymous guests
- No explicit choice given to users
- Google sign-in is presented as optional
- Users may not realize they're in guest mode

**Issues:**
- Reduces Google sign-in adoption
- Users lose progress when clearing cookies
- No clear value proposition for signing in
- Implicit guest mode is confusing

## Proposed Solution: Welcome Modal with Explicit Choice

### Design Principles

1. **Informed Consent** - Users explicitly choose their authentication method
2. **Value Proposition** - Clear benefits of signing in with Google
3. **Progressive Disclosure** - Show welcome modal only on first visit
4. **Friction Reduction** - One-click sign-in, minimal steps
5. **Guest Option Available** - But as secondary choice

### User Flow

#### First Visit (No Auth State)

```
┌─────────────────────────────────────────┐
│                                         │
│         Welcome to Art of Intent!      │
│                                         │
│   Guide Arty the Haiku Bot to speak    │
│   your target words through clever     │
│   prompt engineering.                   │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Sign in to:                       │ │
│  │ ✓ Save your progress              │ │
│  │ ✓ Compete on leaderboard          │ │
│  │ ✓ Track your statistics           │ │
│  │ ✓ Earn achievements                │ │
│  │ ✓ Sync across devices             │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [🔵 Sign in with Google] (Primary)    │
│                                         │
│  [Continue as Guest] (Secondary/Link)  │
│                                         │
└─────────────────────────────────────────┘
```

#### Returning User (Has Auth State)

- No modal shown
- Automatically loads previous session
- User can sign in/out from profile

#### Guest User Prompts

Show subtle prompts to encourage sign-in:
- After first win: "Sign in to save your score!"
- After 3 games: "You've played 3 games! Sign in to track your progress"
- When viewing leaderboard: "Sign in to compete on the leaderboard"

### Implementation Details

#### Welcome Modal

**Trigger:**
- First visit (no localStorage flag)
- No existing auth state
- Show immediately on page load

**Content:**
- Game title and tagline
- Brief description (1-2 sentences)
- Benefits list with checkmarks
- Primary CTA: "Sign in with Google" (large button)
- Secondary CTA: "Continue as Guest" (text link)

**Behavior:**
- Modal backdrop (semi-transparent)
- Cannot be dismissed without choosing
- Keyboard accessible (Tab, Enter, Escape)
- Mobile responsive

**After Choice:**
- Set localStorage flag: `artOfIntent_hasSeenWelcome = true`
- Execute chosen auth method
- Close modal
- Start game

#### Guest Mode Changes

**Remove:**
- Auto-login after 2 seconds
- Implicit guest authentication

**Add:**
- Explicit "Continue as Guest" button
- Guest mode only when user chooses it
- Periodic prompts to sign in (non-intrusive)

**Guest Experience:**
- Can play immediately
- Progress saved in localStorage only
- Clear indication of guest status
- Easy upgrade to Google account

#### Sign-In Prompts (For Guests)

**Timing:**
- After first win
- After 3 games played
- When viewing leaderboard
- When viewing profile

**Design:**
- Small banner at top of screen
- Dismissible (X button)
- Non-blocking
- Shows once per session

**Example:**
```
┌─────────────────────────────────────────┐
│ 🎉 Great win! Sign in to save your     │
│ score and compete on the leaderboard.  │
│ [Sign In] [Maybe Later]            [×] │
└─────────────────────────────────────────┘
```

### Technical Implementation

#### localStorage Flags

```javascript
// Welcome modal
artOfIntent_hasSeenWelcome: 'true' | null

// Guest prompts
artOfIntent_guestPromptDismissed: 'true' | null
artOfIntent_guestGamesPlayed: number
```

#### Auth Flow Logic

```javascript
// On page load
if (!hasSeenWelcome && !hasAuthState) {
  showWelcomeModal();
} else if (hasAuthState) {
  // User has previous session
  restoreSession();
} else {
  // Returning visitor who chose guest
  // Don't auto-login, let them play
  initializeGuestMode();
}
```

#### Welcome Modal Component

```javascript
class WelcomeModal {
  constructor() {
    this.modal = null;
    this.hasSeenWelcome = localStorage.getItem('artOfIntent_hasSeenWelcome');
  }
  
  shouldShow() {
    return !this.hasSeenWelcome && !window.firebaseAuth.getCurrentUser();
  }
  
  show() {
    // Create and display modal
    // Set up event listeners
    // Block game interaction
  }
  
  handleSignIn() {
    // Trigger Google sign-in
    // Set hasSeenWelcome flag
    // Close modal
  }
  
  handleGuest() {
    // Sign in anonymously
    // Set hasSeenWelcome flag
    // Close modal
  }
}
```

#### Guest Prompt Component

```javascript
class GuestPrompt {
  constructor() {
    this.dismissed = sessionStorage.getItem('artOfIntent_guestPromptDismissed');
    this.gamesPlayed = parseInt(localStorage.getItem('artOfIntent_guestGamesPlayed') || '0');
  }
  
  shouldShow(trigger) {
    if (this.dismissed) return false;
    if (!window.firebaseAuth.getCurrentUser()?.isAnonymous) return false;
    
    switch(trigger) {
      case 'firstWin':
        return this.gamesPlayed >= 1;
      case 'threeGames':
        return this.gamesPlayed >= 3;
      case 'leaderboard':
        return true;
      default:
        return false;
    }
  }
  
  show(message) {
    // Display banner
    // Set up dismiss handler
  }
  
  dismiss() {
    sessionStorage.setItem('artOfIntent_guestPromptDismissed', 'true');
    // Hide banner
  }
}
```

### UI/UX Specifications

#### Welcome Modal

**Desktop:**
- Width: 500px
- Centered on screen
- Backdrop: rgba(0, 0, 0, 0.7)
- Border radius: 8px
- Padding: 32px

**Mobile:**
- Full width with 16px margins
- Centered vertically
- Padding: 24px

**Colors:**
- Background: `--bg-secondary`
- Border: `--border-active`
- Text: `--text-primary`
- Primary button: Google blue (#4285F4)
- Secondary link: `--text-dim`

**Typography:**
- Title: 1.5rem, bold
- Description: 0.9rem, regular
- Benefits: 0.85rem, regular
- Buttons: 0.9rem, medium

**Spacing:**
- Title to description: 16px
- Description to benefits: 24px
- Benefits to buttons: 32px
- Between buttons: 16px

#### Guest Prompt Banner

**Position:**
- Top of game area
- Below navigation
- Above game content

**Size:**
- Height: 48px
- Full width
- Padding: 12px 16px

**Colors:**
- Background: `--accent-primary` with 0.1 opacity
- Border: `--accent-primary`
- Text: `--text-primary`

**Animation:**
- Slide down: 300ms ease-out
- Fade out on dismiss: 200ms

### Accessibility

**Welcome Modal:**
- Focus trap (Tab cycles within modal)
- Escape key closes (chooses guest)
- ARIA role="dialog"
- ARIA label="Welcome to Art of Intent"
- Focus on primary button on open

**Guest Prompt:**
- ARIA role="banner"
- Dismissible with keyboard (Escape)
- Screen reader announces message
- Focus returns to game after dismiss

### Analytics

Track user choices:
- `welcome_modal_shown` - Modal displayed
- `welcome_google_signin` - User chose Google
- `welcome_guest_mode` - User chose guest
- `guest_prompt_shown` - Prompt displayed
- `guest_prompt_dismissed` - User dismissed
- `guest_prompt_signin` - User signed in from prompt

### Testing Checklist

- [ ] Welcome modal shows on first visit
- [ ] Welcome modal doesn't show on return visit
- [ ] Google sign-in works from modal
- [ ] Guest mode works from modal
- [ ] Modal is keyboard accessible
- [ ] Modal is mobile responsive
- [ ] Guest prompts show at correct times
- [ ] Guest prompts are dismissible
- [ ] Guest prompts don't show after sign-in
- [ ] localStorage flags persist correctly
- [ ] No auto-login occurs
- [ ] Existing users aren't affected

### Migration Strategy

**For Existing Users:**
- Check for existing auth state on load
- If user has auth state, don't show welcome modal
- Set `hasSeenWelcome` flag automatically
- No disruption to existing users

**For New Users:**
- Show welcome modal immediately
- Require explicit choice
- Track choice in analytics

### Future Enhancements

1. **Social Proof**
   - "Join 10,000+ players"
   - Show recent leaderboard activity

2. **Personalization**
   - Remember user's preferred auth method
   - Pre-select on return visits

3. **Gamification**
   - "Sign in to unlock achievements"
   - Show achievement preview

4. **A/B Testing**
   - Test different value propositions
   - Optimize conversion rates

5. **Progressive Web App**
   - "Add to home screen" prompt
   - Native app-like experience
