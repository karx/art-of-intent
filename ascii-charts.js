// ============================================
// ASCII Charts & Visual Elements
// DOS-Style Data Visualization
// ============================================

/**
 * Generate ASCII progress bar
 * @param {number} value - Current value
 * @param {number} max - Maximum value
 * @param {number} width - Bar width in characters
 * @returns {string} ASCII progress bar
 */
export function generateProgressBar(value, max, width = 10) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    
    return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Generate compact trail stats display
 * @param {object} stats - Stats object with promptTokens, outputTokens, totalTokens
 * @returns {string} HTML string for trail stats
 */
export function generateTrailStats(stats) {
    const { promptTokens = 0, outputTokens = 0, totalTokens = 0 } = stats;
    const maxTokens = 100; // Reference max for progress bar
    
    const promptBar = generateProgressBar(promptTokens, maxTokens, 5);
    const outputBar = generateProgressBar(outputTokens, maxTokens, 5);
    const totalBar = generateProgressBar(totalTokens, maxTokens, 10);
    
    return `
        <span>P:${promptTokens} [${promptBar}]</span>
        <span>O:${outputTokens} [${outputBar}]</span>
        <span>T:${totalTokens} [${totalBar}]</span>
    `;
}

/**
 * Generate session stats header
 * @param {object} session - Session state object
 * @returns {string} HTML string for session stats
 */
export function generateSessionStats(session) {
    const {
        attempts = 0,
        maxAttempts = 10,
        totalTokens = 0,
        matches = 0,
        targetWords = 3,
        duration = 0
    } = session;
    
    const attemptsBar = generateProgressBar(attempts, maxAttempts, 10);
    const tokensBar = generateProgressBar(totalTokens, 500, 10); // 500 as reference max
    const matchesBar = generateProgressBar(matches, targetWords, 3);
    const efficiency = attempts > 0 ? Math.round(totalTokens / attempts) : 0;
    
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    return `
        <div class="session-stats-compact">
            <span>ATT: ${attempts.toString().padStart(2, '0')}/${maxAttempts} [${attemptsBar}]</span>
            <span>TOK: ${totalTokens} [${tokensBar}]</span>
            <span>MAT: ${matches}/${targetWords} [${matchesBar}]</span>
            <span>TIME: ${timeStr}</span>
            <span>EFF: ${efficiency} tok/att</span>
        </div>
    `;
}

/**
 * Generate ASCII bar chart
 * @param {array} data - Array of {label, value} objects
 * @param {object} options - Chart options
 * @returns {string} ASCII bar chart
 */
export function generateBarChart(data, options = {}) {
    const {
        width = 40,
        height = 10,
        showValues = true,
        showLabels = true
    } = options;
    
    if (!data || data.length === 0) return '';
    
    const maxValue = Math.max(...data.map(d => d.value));
    const scale = height / maxValue;
    
    let chart = '';
    
    // Y-axis and bars
    for (let row = height; row >= 0; row--) {
        const yValue = Math.round((row / height) * maxValue);
        chart += yValue.toString().padStart(4, ' ') + ' │ ';
        
        for (const item of data) {
            const barHeight = Math.round(item.value * scale);
            if (barHeight >= row) {
                chart += '▓ ';
            } else {
                chart += '  ';
            }
        }
        chart += '\n';
    }
    
    // X-axis
    chart += '   0 └' + '─'.repeat(data.length * 2) + '\n';
    
    // Labels
    if (showLabels) {
        chart += '     ';
        for (const item of data) {
            chart += item.label.charAt(0) + ' ';
        }
        chart += '\n';
    }
    
    return chart;
}

/**
 * Generate ASCII line chart (sparkline)
 * @param {array} values - Array of numbers
 * @param {number} width - Chart width
 * @returns {string} ASCII sparkline
 */
export function generateSparkline(values, width = 20) {
    if (!values || values.length === 0) return '─'.repeat(width);
    
    const chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    if (range === 0) return chars[4].repeat(values.length);
    
    return values.map(v => {
        const normalized = (v - min) / range;
        const index = Math.floor(normalized * (chars.length - 1));
        return chars[index];
    }).join('');
}

/**
 * Generate ASCII table
 * @param {array} headers - Array of header strings
 * @param {array} rows - Array of row arrays
 * @param {object} options - Table options
 * @returns {string} ASCII table
 */
export function generateTable(headers, rows, options = {}) {
    const {
        columnWidths = null,
        align = 'left',
        borders = true
    } = options;
    
    // Calculate column widths if not provided
    const widths = columnWidths || headers.map((header, i) => {
        const headerLen = header.length;
        const maxRowLen = Math.max(...rows.map(row => String(row[i] || '').length));
        return Math.max(headerLen, maxRowLen) + 2;
    });
    
    let table = '';
    
    // Top border
    if (borders) {
        table += '╔' + widths.map(w => '═'.repeat(w)).join('╦') + '╗\n';
    }
    
    // Headers
    table += '║';
    headers.forEach((header, i) => {
        const padded = header.padEnd(widths[i], ' ');
        table += padded + '║';
    });
    table += '\n';
    
    // Header separator
    if (borders) {
        table += '╠' + widths.map(w => '═'.repeat(w)).join('╬') + '╣\n';
    }
    
    // Rows
    rows.forEach(row => {
        table += '║';
        row.forEach((cell, i) => {
            const cellStr = String(cell || '');
            const padded = cellStr.padEnd(widths[i], ' ');
            table += padded + '║';
        });
        table += '\n';
    });
    
    // Bottom border
    if (borders) {
        table += '╚' + widths.map(w => '═'.repeat(w)).join('╩') + '╝\n';
    }
    
    return table;
}

/**
 * Format duration as MM:SS
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted time string
 */
export function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Generate trend indicator
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {string} Trend arrow and percentage
 */
export function generateTrendIndicator(current, previous) {
    if (previous === 0) return '→ N/A';
    
    const change = ((current - previous) / previous) * 100;
    const arrow = change > 0 ? '↑' : change < 0 ? '↓' : '→';
    const percentage = Math.abs(change).toFixed(1);
    
    return `${arrow} ${percentage}%`;
}

/**
 * Generate efficiency rating
 * @param {number} tokensPerAttempt - Average tokens per attempt
 * @returns {object} Rating info with color and label
 */
export function generateEfficiencyRating(tokensPerAttempt) {
    if (tokensPerAttempt < 40) {
        return { rating: 'EXCELLENT', color: 'success', symbol: '★★★' };
    } else if (tokensPerAttempt < 50) {
        return { rating: 'GOOD', color: 'info', symbol: '★★☆' };
    } else if (tokensPerAttempt < 60) {
        return { rating: 'AVERAGE', color: 'warning', symbol: '★☆☆' };
    } else {
        return { rating: 'NEEDS WORK', color: 'error', symbol: '☆☆☆' };
    }
}

/**
 * Generate live stats overlay
 * @param {object} session - Current session state
 * @returns {string} HTML for live stats
 */
export function generateLiveStats(session) {
    const {
        attempts = 0,
        maxAttempts = 10,
        totalTokens = 0,
        matches = 0,
        targetWords = 3,
        duration = 0
    } = session;
    
    const avgPerAttempt = attempts > 0 ? (totalTokens / attempts).toFixed(1) : 0;
    const projectedTotal = attempts > 0 ? Math.round((totalTokens / attempts) * maxAttempts) : 0;
    const projectedTime = attempts > 0 ? Math.round((duration / attempts) * maxAttempts) : 0;
    const completionPct = Math.round((matches / targetWords) * 100);
    
    const efficiency = generateEfficiencyRating(avgPerAttempt);
    
    return `
        <div class="live-stats-overlay">
            <div class="live-stat">
                <span class="live-label">Current Attempt:</span>
                <span class="live-value">${attempts}/${maxAttempts}</span>
            </div>
            <div class="live-stat">
                <span class="live-label">Session Tokens:</span>
                <span class="live-value">${totalTokens} [${generateProgressBar(totalTokens, projectedTotal, 10)}] (pace: ${projectedTotal})</span>
            </div>
            <div class="live-stat">
                <span class="live-label">Avg per Attempt:</span>
                <span class="live-value text-${efficiency.color}">${avgPerAttempt} ${efficiency.symbol} (${efficiency.rating})</span>
            </div>
            <div class="live-stat">
                <span class="live-label">Time Elapsed:</span>
                <span class="live-value">${formatDuration(duration)} [${generateProgressBar(duration, projectedTime, 10)}] (pace: ${formatDuration(projectedTime)})</span>
            </div>
            <div class="live-stat">
                <span class="live-label">Matches Found:</span>
                <span class="live-value">${matches}/${targetWords} [${generateProgressBar(matches, targetWords, 3)}] (${completionPct}% complete)</span>
            </div>
        </div>
    `;
}
