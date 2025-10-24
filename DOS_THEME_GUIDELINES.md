# MS-DOS Console Theme Guidelines
## Art of Intent - Early 1990s Aesthetic

---

## Design Philosophy

Transform the modern GitHub dark theme into an authentic MS-DOS console experience reminiscent of early 1990s computing. The goal is nostalgic authenticity while maintaining modern usability and accessibility.

---

## Color Palette

### IBM VGA Text Mode Colors (16-color palette)

**Primary Colors:**
- Background: `#000000` (Black - DOS screen background)
- Primary Text: `#AAAAAA` (Light Gray - default DOS text)
- Bright Text: `#FFFFFF` (White - highlighted text)
- Dim Text: `#555555` (Dark Gray - secondary info)

**Accent Colors:**
- Success/Target: `#55FF55` (Bright Green - classic DOS success)
- Warning/Blacklist: `#FF5555` (Bright Red - DOS error/warning)
- Info/Highlight: `#55FFFF` (Bright Cyan - DOS info messages)
- Special: `#FFFF55` (Bright Yellow - DOS prompts)
- Secondary: `#5555FF` (Bright Blue - DOS headers)
- Magenta: `#FF55FF` (Bright Magenta - special elements)

**Border/UI Elements:**
- Border: `#AAAAAA` (Light Gray)
- Border Accent: `#55FFFF` (Cyan for active elements)
- Shadow: `#000000` (Black - for depth)

---

## Typography

### Font Stack (Priority Order)

**Primary Font:**
```
'Perfect DOS VGA 437', 'IBM VGA', 'Px437 IBM VGA8', monospace
```

**Fallback Stack:**
```
'Courier New', 'Courier', 'Lucida Console', 'Monaco', 'Consolas', monospace
```

**Font Characteristics:**
- Fixed-width (monospace) only
- Bitmap-style appearance
- 8x16 pixel character cells (classic VGA)
- No anti-aliasing (crisp, pixelated edges)
- Line height: 1.2 (tight, DOS-like spacing)

**Font Sizes:**
- Headers: 16px (2x character height)
- Body: 14px (standard DOS text)
- Small: 12px (status bar, metadata)

---

## Visual Elements

### ASCII Art & Borders

**Box Drawing Characters:**
```
┌─────────────────┐
│  Single Line    │
└─────────────────┘

╔═════════════════╗
║  Double Line    ║
╚═════════════════╝

╭─────────────────╮
│  Rounded        │
╰─────────────────╯
```

**Usage:**
- Single line: Standard containers, game info cards
- Double line: Headers, important sections
- Rounded: Buttons, interactive elements

**Decorative Elements:**
- `>` Prompt indicators
- `█` Progress bars (solid blocks)
- `▓▒░` Gradient effects (block shading)
- `•` Bullet points
- `─` Horizontal dividers
- `│` Vertical dividers

### CRT Monitor Effects

**Visual Characteristics:**
- Subtle scanline overlay (horizontal lines)
- Slight phosphor glow on bright text
- Minimal screen curvature (optional)
- Flicker effect on text cursor
- Slight chromatic aberration on edges

**Text Effects:**
- Blinking cursor: `█` or `_`
- Text shadow: 1px offset in black
- Glow: 2px blur on bright colors

---

## Layout Structure

### Screen Organization

**DOS-Style Layout:**
```
╔═══════════════════════════════════════════════════════════╗
║ ART OF INTENT v0.2.0                    [USER: GUEST]    ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  > DAILY CHALLENGE: 2025-01-24                           ║
║                                                           ║
║  TARGET WORDS:  [WORD1] [WORD2] [WORD3]                  ║
║  BLACKLIST:     [BAD1] [BAD2] [BAD3] [BAD4] [BAD5]      ║
║                                                           ║
║  ┌─────────────────────────────────────────────────────┐ ║
║  │ STATISTICS                                          │ ║
║  │ Attempts: 3/10    Tokens: 245    Matches: 1/3      │ ║
║  └─────────────────────────────────────────────────────┘ ║
║                                                           ║
║  ┌─────────────────────────────────────────────────────┐ ║
║  │ CONVERSATION LOG                                    │ ║
║  │                                                     │ ║
║  │ > USER: [prompt text]                              │ ║
║  │ < ARTY: [haiku response]                           │ ║
║  │                                                     │ ║
║  └─────────────────────────────────────────────────────┘ ║
║                                                           ║
║  > ENTER PROMPT: _                                       ║
║                                                           ║
╠═══════════════════════════════════════════════════════════╣
║ [SUBMIT] [VOICE] [EXPORT] [LEADERBOARD] [PROFILE]       ║
╚═══════════════════════════════════════════════════════════╝
```

**Key Principles:**
- Full-screen container with border
- Fixed-width layout (80-120 characters)
- Clear section separation with ASCII borders
- Status bar at top and bottom
- Centered content with padding

---

## Component Styling

### Trail Stats (Visual-Only Element)

**Transformation:**
- Remove verbose text descriptions
- Use ASCII progress bars and icons
- Compact, single-line display
- Real-time updating numbers

**Example:**
```
┌─ STATS ──────────────────────────────────────────┐
│ ATT: 03/10 [███░░░░░░░] TOK: 245 MAT: 1/3 [█░░] │
└──────────────────────────────────────────────────┘
```

### Leaderboard

**DOS-Style Table:**
```
╔═══════════════════════════════════════════════════╗
║           DAILY LEADERBOARD - 2025-01-24         ║
╠═══════════════════════════════════════════════════╣
║ RANK  PLAYER          TOKENS    TIME    ATTEMPTS ║
╠═══════════════════════════════════════════════════╣
║  1.   PLAYER_ONE       187     02:34      4      ║
║  2.   GUEST_42         203     03:12      5      ║
║  3.   YOU ────>        245     04:56      7      ║
║  4.   PLAYER_TWO       289     05:23      8      ║
║  5.   GUEST_17         312     06:45      9      ║
╠═══════════════════════════════════════════════════╣
║ [DAILY] [WEEKLY] [ALL-TIME] [CLOSE]              ║
╚═══════════════════════════════════════════════════╝
```

**Features:**
- Fixed-width columns
- ASCII table borders
- Highlight current user row
- Pagination with `[PREV] [NEXT]`
- Filter buttons at bottom

### User Profile

**DOS-Style Profile Screen:**
```
╔═══════════════════════════════════════════════════╗
║ USER PROFILE                                     ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  USERNAME: PLAYER_ONE                            ║
║  JOINED:   2025-01-15                            ║
║  STATUS:   AUTHENTICATED                         ║
║                                                   ║
║  ┌─ STATISTICS ─────────────────────────────────┐ ║
║  │ Total Games:      42                         │ ║
║  │ Win Rate:         67% [████████░░░░░░]       │ ║
║  │ Avg Tokens:       234                        │ ║
║  │ Best Score:       156 tokens                 │ ║
║  │ Current Streak:   5 days                     │ ║
║  │ Longest Streak:   12 days                    │ ║
║  └──────────────────────────────────────────────┘ ║
║                                                   ║
║  ┌─ ACHIEVEMENTS ───────────────────────────────┐ ║
║  │ [✓] First Win        [✓] Speed Demon         │ ║
║  │ [✓] Perfect Score    [ ] Wordsmith           │ ║
║  │ [✓] Week Warrior     [ ] Month Master        │ ║
║  └──────────────────────────────────────────────┘ ║
║                                                   ║
║  ┌─ RECENT SESSIONS ────────────────────────────┐ ║
║  │ 2025-01-24  WIN   187 tokens  4 attempts     │ ║
║  │ 2025-01-23  WIN   203 tokens  5 attempts     │ ║
║  │ 2025-01-22  LOSS  312 tokens  10 attempts    │ ║
║  └──────────────────────────────────────────────┘ ║
║                                                   ║
╠═══════════════════════════════════════════════════╣
║ [BACK] [EXPORT DATA] [SIGN OUT]                  ║
╚═══════════════════════════════════════════════════╝
```

---

## Interactive Elements

### Buttons

**DOS-Style Buttons:**
```
Normal:    [ SUBMIT ]
Hover:     [>SUBMIT<]
Active:    [▓SUBMIT▓]
Disabled:  [░SUBMIT░]
```

**Characteristics:**
- Square brackets as borders
- All caps text
- Hover adds arrows or highlights
- Active state uses block shading
- Disabled uses light shading

### Input Fields

**Text Input:**
```
> ENTER PROMPT: █
> ENTER PROMPT: Hello Arty_
```

**Features:**
- Prompt character `>`
- Blinking cursor `█` or `_`
- No rounded corners
- Single-line border
- Monospace text only

### Modals/Dialogs

**DOS-Style Dialog:**
```
        ╔═══════════════════════════════╗
        ║      GAME OVER - YOU WIN!     ║
        ╠═══════════════════════════════╣
        ║                               ║
        ║  Final Score: 187 tokens      ║
        ║  Attempts:    4/10            ║
        ║  Time:        02:34           ║
        ║                               ║
        ║  New Personal Best!           ║
        ║                               ║
        ╠═══════════════════════════════╣
        ║  [SHARE] [PLAY AGAIN] [EXIT]  ║
        ╚═══════════════════════════════╝
```

---

## Animation & Transitions

### DOS-Appropriate Animations

**Allowed:**
- Blinking cursor (500ms interval)
- Text typing effect (character-by-character)
- Scanline scrolling (subtle, continuous)
- Progress bar filling (block-by-block)
- Screen "boot" sequence on load

**Avoid:**
- Smooth fades
- Elastic/bounce effects
- Parallax scrolling
- Gradient animations
- Rotation/3D transforms

**Timing:**
- Instant state changes (no transitions)
- Text appears character-by-character (50ms per char)
- Screen refreshes feel immediate
- Loading states use ASCII spinners: `|/-\`

---

## Accessibility Considerations

### Maintaining Usability

**Color Contrast:**
- Ensure 4.5:1 contrast ratio minimum
- Bright colors on black background meet WCAG AA
- Test with colorblind simulators

**Readability:**
- Minimum 14px font size
- Line height 1.2-1.4 for readability
- Adequate spacing between elements
- Clear visual hierarchy

**Keyboard Navigation:**
- Tab order follows logical flow
- Focus states clearly visible (cyan border)
- All actions keyboard accessible
- Escape key closes modals

**Screen Readers:**
- Semantic HTML maintained
- ARIA labels for ASCII art
- Alt text for decorative elements
- Skip navigation links

---

## Responsive Behavior

### Mobile Adaptation

**Approach:**
- Maintain DOS aesthetic on all devices
- Reduce character width on mobile (40-60 chars)
- Stack sections vertically
- Larger touch targets (44x44px minimum)
- Simplified ASCII borders on small screens

**Breakpoints:**
- Desktop: 80-120 character width
- Tablet: 60-80 character width
- Mobile: 40-60 character width

---

## Analytics Dashboard

### DOS-Style Charts

**ASCII Bar Charts:**
```
TOKEN USAGE OVER TIME
300 │     ▓
250 │   ▓ ▓ ▓
200 │ ▓ ▓ ▓ ▓ ▓
150 │ ▓ ▓ ▓ ▓ ▓ ▓
100 │ ▓ ▓ ▓ ▓ ▓ ▓ ▓
 50 │ ▓ ▓ ▓ ▓ ▓ ▓ ▓
  0 └─────────────────
    M T W T F S S
```

**Progress Indicators:**
```
WIN RATE: 67% [████████░░░░░░] 42 games
AVG TOKENS: 234 [████████████░░] vs 250 avg
STREAK: 5 days [█████░░░░░░░░░] best: 12
```

**Data Tables:**
```
╔═══════════════════════════════════════════╗
║ DATE       RESULT  TOKENS  TIME  ATTEMPTS ║
╠═══════════════════════════════════════════╣
║ 2025-01-24  WIN     187    02:34    4     ║
║ 2025-01-23  WIN     203    03:12    5     ║
║ 2025-01-22  LOSS    312    06:45    10    ║
╚═══════════════════════════════════════════╝
```

---

## Implementation Notes

### Technical Approach

**CSS Strategy:**
- CSS custom properties for color palette
- Minimal use of modern CSS (flexbox/grid acceptable)
- No gradients, shadows (except text glow)
- Border-style: solid only
- Background patterns for scanlines

**Font Loading:**
- Web font for DOS VGA font
- Fallback to system monospace
- Font-display: swap for performance

**Performance:**
- Lightweight CSS (< 50KB)
- Minimal JavaScript for animations
- No external dependencies for styling
- Fast initial render

**Browser Support:**
- Modern browsers (last 2 versions)
- Graceful degradation for older browsers
- Progressive enhancement approach

---

## Reference Materials

### Inspiration Sources

**Classic DOS Programs:**
- Norton Commander (file manager UI)
- Turbo Pascal IDE (editor interface)
- DOS Shell (menu system)
- QBASIC (programming environment)
- Bulletin Board Systems (BBS interfaces)

**Color References:**
- IBM VGA 16-color palette
- CGA 4-color palette (for extreme retro)
- EGA 64-color palette (for variety)

**Typography:**
- IBM VGA font (8x16 pixels)
- Code Page 437 (extended ASCII)
- Raster fonts from DOS era

---

## Next Steps

1. **Font Integration**: Source and integrate DOS VGA web font
2. **Color System**: Implement 16-color palette as CSS variables
3. **ASCII Components**: Create reusable ASCII border components
4. **CRT Effects**: Add subtle scanline and glow effects
5. **Component Redesign**: Transform each UI component to DOS style
6. **Testing**: Verify accessibility and cross-browser compatibility
7. **Documentation**: Update style guide with examples

---

*"C:\> ARTOFINTENT.EXE"*
