# Analytics Enhancements Plan
## Art of Intent - DOS-Style Data Visualization

---

## Overview

Enhance the existing analytics system with DOS-style ASCII charts and visualizations while maintaining the early 1990s aesthetic. Focus on actionable insights and historical data tracking.

---

## Current Analytics State

### Existing Features
- ✅ Session tracking with JSON-LD export
- ✅ Real-time token counting
- ✅ Attempt tracking
- ✅ Match detection
- ✅ Firebase session persistence
- ✅ Event logging (sessionEvents collection)

### Data Available
- Session metadata (date, duration, success)
- Attempt details (prompts, responses, tokens)
- User statistics (games played, win rate, streaks)
- Token usage (prompt, output, total per attempt)
- Match progression (target words found)
- Timing data (session duration, attempt timestamps)

---

## Planned Enhancements

### 1. Enhanced Trail Stats (Visual-Only)

**Current State:**
- Text-based stats display
- Verbose labels
- No visual indicators

**Enhancement:**
```
┌─ SESSION STATS ──────────────────────────────────────────┐
│ ATT: 03/10 [███░░░░░░░] TOK: 245 [████████░░] MAT: 1/3  │
│ TIME: 04:32 [████████████░░░░░░] EFFICIENCY: 82 tok/att │
└──────────────────────────────────────────────────────────┘
```

**Features:**
- ASCII progress bars for visual feedback
- Compact single-line display
- Real-time updates
- Color-coded indicators (green=good, red=warning, cyan=info)
- Efficiency metric (tokens per attempt)

---

### 2. Session History Dashboard

**New Component:** Session history view with filtering and sorting

**Layout:**
```
╔═══════════════════════════════════════════════════════════╗
║ SESSION HISTORY                                          ║
╠═══════════════════════════════════════════════════════════╣
║ Filter: [ALL] [WINS] [LOSSES] [THIS WEEK] [THIS MONTH]  ║
╠═══════════════════════════════════════════════════════════╣
║ DATE       RESULT  TOKENS  TIME   ATT  EFFICIENCY        ║
╠═══════════════════════════════════════════════════════════╣
║ 2025-01-24  WIN     187    02:34   4    46.8 tok/att    ║
║ 2025-01-23  WIN     203    03:12   5    40.6 tok/att    ║
║ 2025-01-22  LOSS    312    06:45  10    31.2 tok/att    ║
║ 2025-01-21  WIN     156    02:01   3    52.0 tok/att    ║
║ 2025-01-20  LOSS    289    05:23   8    36.1 tok/att    ║
╠═══════════════════════════════════════════════════════════╣
║ [PREV] Page 1 of 5 [NEXT]                    [EXPORT]   ║
╚═══════════════════════════════════════════════════════════╝
```

**Features:**
- Sortable columns
- Filter by result, date range
- Pagination (10 per page)
- Export filtered data
- Click row for detailed view

---

### 3. Token Usage Visualization

**ASCII Bar Chart:**
```
╔═══════════════════════════════════════════════════════════╗
║ TOKEN USAGE OVER TIME (Last 7 Days)                     ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║ 400 │                                                     ║
║ 350 │                                                     ║
║ 300 │     ▓                                               ║
║ 250 │   ▓ ▓ ▓                                             ║
║ 200 │ ▓ ▓ ▓ ▓ ▓                                           ║
║ 150 │ ▓ ▓ ▓ ▓ ▓ ▓                                         ║
║ 100 │ ▓ ▓ ▓ ▓ ▓ ▓ ▓                                       ║
║  50 │ ▓ ▓ ▓ ▓ ▓ ▓ ▓                                       ║
║   0 └─────────────────                                   ║
║     M T W T F S S                                        ║
║                                                           ║
║ Avg: 234 tokens │ Best: 156 │ Worst: 312                ║
╚═══════════════════════════════════════════════════════════╝
```

**Features:**
- Daily, weekly, monthly views
- Average line indicator
- Best/worst markers
- Trend analysis (improving/declining)

---

### 4. Performance Metrics Dashboard

**Comprehensive Stats View:**
```
╔═══════════════════════════════════════════════════════════╗
║ PERFORMANCE METRICS                                      ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║ ┌─ WIN RATE ─────────────────────────────────────────┐   ║
║ │ 67% [████████████░░░░░░] 42 games                  │   ║
║ │ Wins: 28 │ Losses: 14 │ Trend: ↑ +5% this week    │   ║
║ └────────────────────────────────────────────────────┘   ║
║                                                           ║
║ ┌─ TOKEN EFFICIENCY ─────────────────────────────────┐   ║
║ │ Avg: 234 [████████████░░] vs 250 global avg       │   ║
║ │ Best: 156 │ Worst: 312 │ Improvement: -12 tokens  │   ║
║ └────────────────────────────────────────────────────┘   ║
║                                                           ║
║ ┌─ SPEED METRICS ────────────────────────────────────┐   ║
║ │ Avg Time: 03:45 [██████████░░░░] vs 04:30 avg     │   ║
║ │ Fastest: 02:01 │ Slowest: 06:45                    │   ║
║ └────────────────────────────────────────────────────┘   ║
║                                                           ║
║ ┌─ STREAK TRACKING ──────────────────────────────────┐   ║
║ │ Current: 5 days [█████░░░░░░░░░] Best: 12 days    │   ║
║ │ Last played: Today │ Next reset: 18:32:15          │   ║
║ └────────────────────────────────────────────────────┘   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

**Features:**
- Multiple metric categories
- Progress bars with comparisons
- Trend indicators (↑↓→)
- Global average comparisons
- Real-time countdown to next reset

---

### 5. Attempt Analysis

**Per-Attempt Breakdown:**
```
╔═══════════════════════════════════════════════════════════╗
║ ATTEMPT ANALYSIS - Session 2025-01-24                   ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║ #1 │ Tokens: 45 [████░░░░░░] │ Matches: 0 │ Time: 0:32  ║
║    │ Prompt: "Write about nature"                        ║
║    │ Strategy: Generic prompt, no target words           ║
║                                                           ║
║ #2 │ Tokens: 52 [█████░░░░░] │ Matches: 1 │ Time: 0:45  ║
║    │ Prompt: "Haiku about cherry blossoms"               ║
║    │ Strategy: Specific imagery, found 'blossom'         ║
║                                                           ║
║ #3 │ Tokens: 48 [████░░░░░░] │ Matches: 2 │ Time: 0:38  ║
║    │ Prompt: "Spring morning with birds"                 ║
║    │ Strategy: Seasonal context, found 'spring'          ║
║                                                           ║
║ #4 │ Tokens: 42 [███░░░░░░░] │ Matches: 3 │ Time: 0:29  ║
║    │ Prompt: "Dawn breaks, petals fall"                  ║
║    │ Strategy: Poetic language, found 'dawn' - WIN!      ║
║                                                           ║
║ Total: 187 tokens │ 4 attempts │ 02:34 duration          ║
║ Efficiency: 46.8 tok/att │ Success rate: 100%            ║
╚═══════════════════════════════════════════════════════════╝
```

**Features:**
- Chronological attempt list
- Token usage per attempt
- Match progression tracking
- Strategy notes/insights
- Success indicators

---

### 6. Word Frequency Analysis

**Most/Least Effective Words:**
```
╔═══════════════════════════════════════════════════════════╗
║ WORD FREQUENCY ANALYSIS                                  ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║ ┌─ MOST SUCCESSFUL PROMPTS ──────────────────────────┐   ║
║ │ "nature"    [████████████] 12 uses, 83% success    │   ║
║ │ "spring"    [██████████░░] 10 uses, 70% success    │   ║
║ │ "morning"   [█████████░░░]  9 uses, 67% success    │   ║
║ │ "blossom"   [████████░░░░]  8 uses, 62% success    │   ║
║ └─────────────────────────────────────────────────────┘   ║
║                                                           ║
║ ┌─ LEAST SUCCESSFUL PROMPTS ─────────────────────────┐   ║
║ │ "write"     [███░░░░░░░░░]  7 uses, 28% success    │   ║
║ │ "haiku"     [██░░░░░░░░░░]  5 uses, 20% success    │   ║
║ │ "poem"      [██░░░░░░░░░░]  4 uses, 25% success    │   ║
║ └─────────────────────────────────────────────────────┘   ║
║                                                           ║
║ ┌─ BLACKLIST TRIGGERS ───────────────────────────────┐   ║
║ │ "never"     [████████████] 12 times (avoid!)        │   ║
║ │ "always"    [██████░░░░░░]  6 times                 │   ║
║ │ "very"      [████░░░░░░░░]  4 times                 │   ║
║ └─────────────────────────────────────────────────────┘   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

**Features:**
- Success rate by word
- Usage frequency
- Blacklist trigger tracking
- Recommendations based on data

---

### 7. Comparison View

**Compare Sessions:**
```
╔═══════════════════════════════════════════════════════════╗
║ SESSION COMPARISON                                       ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║ Metric          │ Today      │ Best       │ Difference   ║
║ ────────────────┼────────────┼────────────┼──────────────║
║ Tokens          │ 187        │ 156        │ +31 (↓)      ║
║ Attempts        │ 4          │ 3          │ +1 (↓)       ║
║ Time            │ 02:34      │ 02:01      │ +0:33 (↓)    ║
║ Efficiency      │ 46.8       │ 52.0       │ -5.2 (↓)     ║
║ First Match     │ Attempt 2  │ Attempt 1  │ +1 (↓)       ║
║                                                           ║
║ ┌─ INSIGHTS ─────────────────────────────────────────┐   ║
║ │ • You're 16% slower than your best session         │   ║
║ │ • Consider more specific prompts earlier           │   ║
║ │ • Token usage is above your average                │   ║
║ │ • Time per attempt is consistent                   │   ║
║ └────────────────────────────────────────────────────┘   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

**Features:**
- Side-by-side comparison
- Difference indicators
- Trend arrows
- AI-generated insights
- Actionable recommendations

---

### 8. Real-Time Analytics Overlay

**During Gameplay:**
```
┌─ LIVE STATS ──────────────────────────────────────────────┐
│ Current Attempt: 3/10                                     │
│ Session Tokens: 145 [████████░░░░░░] (on pace for 242)   │
│ Avg per Attempt: 48.3 (target: <40 for best score)       │
│ Time Elapsed: 02:15 [████████░░░░░░] (pace: 03:45 total) │
│ Matches Found: 1/3 [█░░] (33% complete)                   │
│                                                            │
│ Tip: Try more specific imagery to find remaining words    │
└────────────────────────────────────────────────────────────┘
```

**Features:**
- Real-time projections
- Pace indicators
- Dynamic tips based on performance
- Progress tracking
- Efficiency warnings

---

## Implementation Priority

### Phase 1: Essential (Immediate)
1. ✅ Enhanced trail stats (visual-only)
2. Session history dashboard
3. Real-time analytics overlay

### Phase 2: Insights (Next)
4. Token usage visualization
5. Performance metrics dashboard
6. Attempt analysis

### Phase 3: Advanced (Future)
7. Word frequency analysis
8. Comparison view
9. Predictive analytics
10. AI-powered recommendations

---

## Technical Implementation

### Data Sources
- **Firebase Firestore:**
  - `sessions` collection (historical data)
  - `sessionEvents` collection (detailed events)
  - `users` collection (aggregate stats)

- **LocalStorage:**
  - Current session state
  - Real-time calculations
  - Temporary analytics cache

### Rendering Approach
- Pure JavaScript (no charting libraries)
- ASCII art generation functions
- CSS for layout and colors
- Real-time DOM updates

### Performance Considerations
- Lazy load historical data
- Cache calculations
- Debounce real-time updates
- Paginate large datasets
- Index Firebase queries

---

## ASCII Chart Library

### Functions to Implement

```javascript
// Bar chart generator
function generateBarChart(data, options) {
    // Returns ASCII bar chart string
}

// Progress bar generator
function generateProgressBar(value, max, width) {
    // Returns ASCII progress bar
}

// Line chart generator
function generateLineChart(data, options) {
    // Returns ASCII line chart string
}

// Table generator
function generateTable(headers, rows, options) {
    // Returns ASCII table string
}

// Sparkline generator
function generateSparkline(data) {
    // Returns inline ASCII sparkline
}
```

### Character Sets
- Blocks: `█▓▒░`
- Borders: `┌┐└┘├┤┬┴┼─│`
- Arrows: `↑↓←→↗↘↖↙`
- Indicators: `•◦▪▫`

---

## Accessibility

### Screen Reader Support
- ARIA labels for all charts
- Text alternatives for visual data
- Semantic HTML structure
- Keyboard navigation

### Color Blindness
- Use patterns in addition to colors
- High contrast mode support
- Text indicators alongside colors

### Mobile Optimization
- Responsive ASCII layouts
- Touch-friendly controls
- Simplified charts on small screens

---

## Export Formats

### Enhanced JSON-LD Export
- Include all analytics data
- Chart data in structured format
- Comparison metrics
- Insights and recommendations

### CSV Export
- Session history
- Attempt details
- Performance metrics
- Word frequency data

### Text Report
- ASCII charts included
- Summary statistics
- Insights section
- Shareable format

---

## Future Enhancements

### Machine Learning Integration
- Predict optimal prompts
- Identify patterns in successful attempts
- Personalized strategy recommendations
- Difficulty adjustment suggestions

### Social Features
- Compare with friends
- Global statistics
- Achievement tracking
- Challenge modes

### Advanced Visualizations
- Heatmaps (word usage by time)
- Network graphs (word relationships)
- Timeline views (session progression)
- Animated charts (session replay)

---

## Success Metrics

### User Engagement
- Time spent viewing analytics
- Export frequency
- Return rate after viewing insights

### Performance Impact
- Improvement in token efficiency
- Win rate increase
- Faster completion times

### Technical Metrics
- Page load time
- Chart render time
- Data query performance
- Cache hit rate

---

*"C:\> ANALYZE.EXE --mode=comprehensive"*
