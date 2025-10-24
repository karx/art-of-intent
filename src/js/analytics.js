// ============================================
// Analytics Module
// Firebase Analytics (GA4) + Web Vitals
// ============================================

import { logEvent } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';
import { analytics } from './firebase-config.js';

/**
 * Track custom event to Firebase Analytics
 * @param {string} eventName - Event name (use snake_case)
 * @param {object} params - Event parameters
 */
export function trackEvent(eventName, params = {}) {
    try {
        // Log to Firebase Analytics
        logEvent(analytics, eventName, params);
        
        // Debug log in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('📊 Analytics Event:', eventName, params);
        }
    } catch (error) {
        console.error('Analytics error:', error);
    }
}

/**
 * Track page view
 * @param {string} pagePath - Page path
 * @param {string} pageTitle - Page title
 */
export function trackPageView(pagePath, pageTitle) {
    trackEvent('page_view', {
        page_path: pagePath,
        page_title: pageTitle
    });
}

/**
 * Track game events
 */
export const GameAnalytics = {
    gameStart: (gameDate) => {
        trackEvent('game_start', {
            game_date: gameDate,
            timestamp: new Date().toISOString()
        });
    },
    
    gameComplete: (result, stats) => {
        trackEvent('game_complete', {
            result: result, // 'victory' or 'defeat'
            total_tokens: stats.totalTokens || 0,
            attempts: stats.attempts || 0,
            duration_seconds: stats.duration || 0,
            efficiency: stats.efficiency || 0
        });
    },
    
    promptSubmit: (promptLength, tokenCount) => {
        trackEvent('prompt_submit', {
            prompt_length: promptLength,
            token_count: tokenCount
        });
    },
    
    blacklistViolation: (word, attemptNumber) => {
        trackEvent('blacklist_violation', {
            violated_word: word,
            attempt_number: attemptNumber
        });
    },
    
    targetHit: (word, attemptNumber) => {
        trackEvent('target_hit', {
            target_word: word,
            attempt_number: attemptNumber
        });
    },
    
    apiError: (errorType, errorMessage) => {
        trackEvent('api_error', {
            error_type: errorType,
            error_message: errorMessage
        });
    }
};

/**
 * Track user interactions
 */
export const UserAnalytics = {
    shareClick: (shareType) => {
        trackEvent('share_click', {
            share_type: shareType // 'native', 'copy', 'download'
        });
    },
    
    leaderboardView: (leaderboardType) => {
        trackEvent('leaderboard_view', {
            leaderboard_type: leaderboardType // 'daily', 'weekly', 'all-time'
        });
    },
    
    profileView: (userId) => {
        trackEvent('profile_view', {
            user_id: userId
        });
    },
    
    authLogin: (method) => {
        trackEvent('login', {
            method: method // 'google', 'anonymous'
        });
    },
    
    authLogout: () => {
        trackEvent('logout');
    }
};

/**
 * Track errors
 */
export const ErrorAnalytics = {
    jsError: (error, context) => {
        trackEvent('js_error', {
            error_message: error.message,
            error_stack: error.stack?.substring(0, 500),
            context: context
        });
    },
    
    networkError: (url, status) => {
        trackEvent('network_error', {
            url: url,
            status_code: status
        });
    }
};

/**
 * Initialize Web Vitals tracking
 */
export async function initWebVitals() {
    try {
        // Import web-vitals from CDN
        const { onCLS, onFID, onLCP, onTTFB, onINP } = await import(
            'https://unpkg.com/web-vitals@3/dist/web-vitals.js?module'
        );
        
        function sendToAnalytics({ name, value, id, rating }) {
            trackEvent('web_vitals', {
                metric_name: name,
                metric_value: Math.round(value),
                metric_id: id,
                metric_rating: rating // 'good', 'needs-improvement', 'poor'
            });
        }
        
        // Track all Core Web Vitals
        onCLS(sendToAnalytics);
        onFID(sendToAnalytics);
        onLCP(sendToAnalytics);
        onTTFB(sendToAnalytics);
        onINP(sendToAnalytics);
        
        console.log('✅ Web Vitals tracking initialized');
    } catch (error) {
        console.warn('⚠️ Web Vitals tracking failed:', error);
    }
}

/**
 * Track UTM parameters from URL
 */
export function trackCampaignParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const utmParams = {
        utm_source: urlParams.get('utm_source'),
        utm_medium: urlParams.get('utm_medium'),
        utm_campaign: urlParams.get('utm_campaign'),
        utm_term: urlParams.get('utm_term'),
        utm_content: urlParams.get('utm_content')
    };
    
    // Only track if at least one UTM parameter exists
    if (Object.values(utmParams).some(val => val !== null)) {
        trackEvent('campaign_visit', utmParams);
    }
}

/**
 * Initialize analytics on page load
 */
export function initAnalytics() {
    // Track page view
    trackPageView(window.location.pathname, document.title);
    
    // Track campaign parameters
    trackCampaignParams();
    
    // Initialize Web Vitals
    initWebVitals();
    
    // Track global errors
    window.addEventListener('error', (event) => {
        ErrorAnalytics.jsError(event.error, 'global_error_handler');
    });
    
    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        ErrorAnalytics.jsError(
            new Error(event.reason),
            'unhandled_promise_rejection'
        );
    });
    
    console.log('📊 Analytics initialized');
}

// Auto-initialize if not in test environment
if (typeof window !== 'undefined' && !window.location.pathname.includes('test')) {
    initAnalytics();
}
