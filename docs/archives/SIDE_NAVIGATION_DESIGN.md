# Side Navigation Design System
**Art of Intent - Cognitive Design Documentation**

## Overview
Side navigation pattern optimized for game-focused interaction with minimal cognitive load and maximum accessibility.

## Design Principles

### 1. Fitts's Law - Target Acquisition
- **Icon Size**: 48x48px touch targets
- **Position**: Fixed left edge (infinite width advantage)
- **Spacing**: 8px between icons for clear separation
- **Rationale**: Larger targets at screen edge = faster, more accurate clicks

### 2. Miller's Law - Cognitive Load
- **Max Items**: 5-7 primary actions
- **Grouping**: Logical clusters (play, monitor, configure)
- **No Nesting**: Flat hierarchy initially
- **Rationale**: Reduces working memory load, faster decision making

### 3. Jakob's Law - Familiar Patterns
- **Left Sidebar**: Industry standard (VSCode, Figma, Notion)
- **Top Bar**: Auth/identity (universal expectation)
- **Vertical Flow**: Natural reading pattern
- **Rationale**: Leverages existing mental models, reduces learning curve

### 4. Progressive Disclosure
- **Default**: Collapsed (icons only)
- **On Hover**: Expand with labels
- **On Click**: Persist expanded state
- **Rationale**: Information available when needed, hidden when not

## Layout Structure

```
┌────────┬────────────────────────────────────────────────┐
│   ≡    │ Art of Intent v1.0          [User] [Sign In]  │
├────────┼────────────────────────────────────────────────┤
│        │                                                 │
│   ?    │  [Game Content Area]                           │
│        │                                                 │
│   ▤    │  - Target words                                │
│        │  - Blacklist words                             │
│   👤   │  - Prompt input                                │
│        │  - Response display                            │
│   ♪    │  - Game stats                                  │
│        │                                                 │
│   ⚙    │                                                 │
│        │                                                 │
│   i    │                                                 │
│        │                                                 │
└────────┴────────────────────────────────────────────────┘
```

## Icon Hierarchy

### Top Section (Primary Actions)
| Icon | Label | Function | Keyboard | Priority |
|------|-------|----------|----------|----------|
| ≡ | Menu | Toggle sidebar | Ctrl+B | High |
| ? | Help | Show game rules | F1 | High |

### Middle Section (Game Monitoring)
| Icon | Label | Function | Keyboard | Priority |
|------|-------|----------|----------|----------|
| ▤ | Leaderboard | View rankings | Ctrl+L | Medium |
| 👤 | Profile | User stats | Ctrl+P | Medium |

### Bottom Section (Settings)
| Icon | Label | Function | Keyboard | Priority |
|------|-------|----------|----------|----------|
| ♪ | Sound | Toggle audio | Ctrl+M | Low |
| ⚙ | Settings | Preferences | Ctrl+, | Low |
| i | About | App info | - | Low |

## Dimensions

### Sidebar
- **Collapsed Width**: 56px
- **Expanded Width**: 200px
- **Icon Size**: 20x20px (within 48x48px target)
- **Transition**: 200ms ease-in-out

### Top Bar
- **Height**: 48px
- **Padding**: 12px 16px
- **Z-Index**: 100

### Content Area
- **Left Margin**: 56px (collapsed) / 200px (expanded)
- **Transition**: 200ms ease-in-out

## Color System

### States
```css
--nav-bg: #161b22
--nav-border: #30363d
--nav-icon-default: #8b949e
--nav-icon-hover: #58a6ff
--nav-icon-active: #58a6ff
--nav-bg-hover: #21262d
--nav-bg-active: #0d1117
```

### Semantic Colors
- **Help**: Blue (#58a6ff) - Informational
- **Sound Muted**: Yellow (#d29922) - Warning
- **Leaderboard**: Green (#3fb950) - Achievement
- **Profile**: Blue (#58a6ff) - Personal
- **Settings**: Gray (#8b949e) - Neutral

## Interaction States

### Collapsed (Default)
```
Width: 56px
Icons: Visible
Labels: Hidden
Tooltip: On hover (300ms delay)
```

### Expanded (Hover/Click)
```
Width: 200px
Icons: Visible
Labels: Visible
Tooltip: Disabled
Auto-collapse: On outside click (unless pinned)
```

### Mobile (<768px)
```
Position: Bottom fixed
Layout: Horizontal
Icons: 5 primary actions
Overflow: Swipe/scroll
```

## Accessibility

### Keyboard Navigation
- **Tab**: Move through nav items
- **Enter/Space**: Activate item
- **Escape**: Close expanded sidebar
- **Ctrl+B**: Toggle sidebar
- **F1**: Help
- **Ctrl+L**: Leaderboard
- **Ctrl+P**: Profile
- **Ctrl+M**: Mute/Unmute

### Screen Readers
```html
<nav aria-label="Main navigation">
  <button aria-label="Toggle navigation menu" aria-expanded="false">
  <a href="#help" aria-label="Help and game rules">
```

### Focus Management
- Clear focus indicators (2px blue outline)
- Focus trap in modals
- Skip to content link
- Logical tab order

### Motion
```css
@media (prefers-reduced-motion: reduce) {
  .sidebar { transition: none; }
}
```

## Performance

### Optimization
- CSS transforms (not width) for animations
- Will-change: transform on sidebar
- Debounced hover events (100ms)
- Lazy load modal content

### Metrics
- **First Paint**: <100ms
- **Interaction Ready**: <200ms
- **Animation FPS**: 60fps
- **Bundle Size**: <5KB (CSS + JS)

## Implementation Phases

### Phase 1: Core Structure ✓
- [x] HTML structure
- [x] Basic CSS layout
- [x] Fixed positioning
- [x] Icon placement

### Phase 2: Interactions
- [ ] Hover expand/collapse
- [ ] Click to pin
- [ ] Smooth transitions
- [ ] Tooltip system

### Phase 3: Accessibility
- [ ] Keyboard navigation
- [ ] ARIA labels
- [ ] Focus management
- [ ] Screen reader testing

### Phase 4: Mobile
- [ ] Bottom navigation
- [ ] Touch gestures
- [ ] Responsive breakpoints
- [ ] Performance optimization

## Testing Checklist

### Visual
- [ ] Icons aligned and sized correctly
- [ ] Smooth animations (60fps)
- [ ] Hover states work
- [ ] Active states persist
- [ ] Tooltips appear correctly

### Functional
- [ ] All actions trigger correctly
- [ ] Sidebar expands/collapses
- [ ] Keyboard shortcuts work
- [ ] Mobile navigation works
- [ ] State persists (localStorage)

### Accessibility
- [ ] Keyboard navigation complete
- [ ] Screen reader announces correctly
- [ ] Focus indicators visible
- [ ] Color contrast passes WCAG AA
- [ ] Reduced motion respected

### Performance
- [ ] No layout shifts
- [ ] Smooth 60fps animations
- [ ] Fast interaction response
- [ ] Small bundle size
- [ ] No memory leaks

## Future Enhancements

### v1.1
- Customizable icon order (drag & drop)
- Collapsible sections
- Quick actions menu (right-click)
- Themes (light/dark/custom)

### v1.2
- Command palette (Ctrl+K)
- Recent actions history
- Pinned items
- Notification badges

### v1.3
- Multi-workspace support
- Sync preferences across devices
- Plugin system for extensions
- Advanced keyboard shortcuts

---

**Last Updated**: 2025-10-25
**Version**: 1.0.0
**Author**: Product Design Team
