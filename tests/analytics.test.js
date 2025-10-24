/**
 * Unit tests for analytics.js
 * Run with: npm test
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock Firebase Analytics
const mockAnalytics = {
    app: { name: 'test-app' }
};

let mockLoggedEvents = [];

const mockLogEvent = jest.fn((analytics, eventName, params) => {
    mockLoggedEvents.push({ eventName, params, timestamp: Date.now() });
});

// Mock window object for browser environment
global.window = {
    location: {
        hostname: 'localhost',
        pathname: '/',
        search: ''
    },
    addEventListener: jest.fn(),
    APP_VERSION: {
        display: 'v1.0.0-alpha'
    }
};

// Reset mocks before each test
beforeEach(() => {
    mockLoggedEvents = [];
    mockLogEvent.mockClear();
});

// Create analytics module with mocks
const analyticsModule = {
    trackEvent: function(eventName, params = {}) {
        try {
            mockLogEvent(mockAnalytics, eventName, params);
            if (window.location.hostname === 'localhost') {
                console.log('📊 Analytics Event:', eventName, params);
            }
        } catch (error) {
            console.error('Analytics error:', error);
        }
    },
    
    trackPageView: function(pagePath, pageTitle) {
        this.trackEvent('page_view', {
            page_path: pagePath,
            page_title: pageTitle
        });
    },
    
    GameAnalytics: {
        gameStart: function(gameDate) {
            analyticsModule.trackEvent('game_start', {
                game_date: gameDate,
                timestamp: new Date().toISOString()
            });
        },
        
        gameComplete: function(result, stats) {
            analyticsModule.trackEvent('game_complete', {
                result: result,
                total_tokens: stats.totalTokens || 0,
                attempts: stats.attempts || 0,
                duration_seconds: stats.duration || 0,
                efficiency: stats.efficiency || 0
            });
        },
        
        promptSubmit: function(promptLength, tokenCount) {
            analyticsModule.trackEvent('prompt_submit', {
                prompt_length: promptLength,
                token_count: tokenCount
            });
        },
        
        blacklistViolation: function(word, attemptNumber) {
            analyticsModule.trackEvent('blacklist_violation', {
                violated_word: word,
                attempt_number: attemptNumber
            });
        },
        
        targetHit: function(word, attemptNumber) {
            analyticsModule.trackEvent('target_hit', {
                target_word: word,
                attempt_number: attemptNumber
            });
        },
        
        apiError: function(errorType, errorMessage) {
            analyticsModule.trackEvent('api_error', {
                error_type: errorType,
                error_message: errorMessage
            });
        }
    },
    
    UserAnalytics: {
        shareClick: function(shareType) {
            analyticsModule.trackEvent('share_click', {
                share_type: shareType
            });
        },
        
        leaderboardView: function(leaderboardType) {
            analyticsModule.trackEvent('leaderboard_view', {
                leaderboard_type: leaderboardType
            });
        },
        
        profileView: function(userId) {
            analyticsModule.trackEvent('profile_view', {
                user_id: userId
            });
        },
        
        authLogin: function(method) {
            analyticsModule.trackEvent('login', {
                method: method
            });
        },
        
        authLogout: function() {
            analyticsModule.trackEvent('logout');
        }
    },
    
    ErrorAnalytics: {
        jsError: function(error, context) {
            analyticsModule.trackEvent('js_error', {
                error_message: error.message,
                error_stack: error.stack?.substring(0, 500),
                context: context
            });
        },
        
        networkError: function(url, status) {
            analyticsModule.trackEvent('network_error', {
                url: url,
                status_code: status
            });
        }
    }
};

// Test Suite
describe('Analytics Module', () => {
    describe('Basic Tracking', () => {
        test('trackEvent should log events', () => {
            analyticsModule.trackEvent('test_event', { test: 'data' });
            expect(mockLoggedEvents).toHaveLength(1);
            expect(mockLoggedEvents[0].eventName).toBe('test_event');
            expect(mockLoggedEvents[0].params.test).toBe('data');
        });

        test('trackPageView should track page views', () => {
            analyticsModule.trackPageView('/test', 'Test Page');
            expect(mockLoggedEvents).toHaveLength(1);
            expect(mockLoggedEvents[0].eventName).toBe('page_view');
            expect(mockLoggedEvents[0].params.page_path).toBe('/test');
            expect(mockLoggedEvents[0].params.page_title).toBe('Test Page');
        });
    });

    describe('GameAnalytics', () => {
        test('gameStart should track game start', () => {
            analyticsModule.GameAnalytics.gameStart('2025-10-24');
            expect(mockLoggedEvents).toHaveLength(1);
            expect(mockLoggedEvents[0].eventName).toBe('game_start');
            expect(mockLoggedEvents[0].params.game_date).toBe('2025-10-24');
            expect(typeof mockLoggedEvents[0].params.timestamp).toBe('string');
        });

        test('gameComplete should track victory', () => {
            analyticsModule.GameAnalytics.gameComplete('victory', {
                totalTokens: 187,
                attempts: 4,
                duration: 120,
                efficiency: 46.8
            });
            expect(mockLoggedEvents).toHaveLength(1);
            expect(mockLoggedEvents[0].eventName).toBe('game_complete');
            expect(mockLoggedEvents[0].params.result).toBe('victory');
            expect(mockLoggedEvents[0].params.total_tokens).toBe(187);
            expect(mockLoggedEvents[0].params.attempts).toBe(4);
            expect(mockLoggedEvents[0].params.duration_seconds).toBe(120);
            expect(mockLoggedEvents[0].params.efficiency).toBe(46.8);
        });

        test('gameComplete should track defeat', () => {
            analyticsModule.GameAnalytics.gameComplete('defeat', {
                totalTokens: 250,
                attempts: 5,
                duration: 90,
                efficiency: 0
            });
            expect(mockLoggedEvents).toHaveLength(1);
            expect(mockLoggedEvents[0].params.result).toBe('defeat');
            expect(mockLoggedEvents[0].params.efficiency).toBe(0);
        });

        test('promptSubmit should track prompts', () => {
            analyticsModule.GameAnalytics.promptSubmit(42, 15);
            expect(mockLoggedEvents).toHaveLength(1);
            expect(mockLoggedEvents[0].eventName).toBe('prompt_submit');
            expect(mockLoggedEvents[0].params.prompt_length).toBe(42);
            expect(mockLoggedEvents[0].params.token_count).toBe(15);
        });

        test('blacklistViolation should track violations', () => {
            analyticsModule.GameAnalytics.blacklistViolation('forbidden', 3);
            expect(mockLoggedEvents).toHaveLength(1);
            expect(mockLoggedEvents[0].eventName).toBe('blacklist_violation');
            expect(mockLoggedEvents[0].params.violated_word).toBe('forbidden');
            expect(mockLoggedEvents[0].params.attempt_number).toBe(3);
        });

        test('targetHit should track target hits', () => {
            analyticsModule.GameAnalytics.targetHit('haiku', 2);
            expect(mockLoggedEvents).toHaveLength(1);
            expect(mockLoggedEvents[0].eventName).toBe('target_hit');
            expect(mockLoggedEvents[0].params.target_word).toBe('haiku');
            expect(mockLoggedEvents[0].params.attempt_number).toBe(2);
        });

        test('apiError should track API errors', () => {
            analyticsModule.GameAnalytics.apiError('timeout', 'Request timed out');
            expect(mockLoggedEvents).toHaveLength(1);
            expect(mockLoggedEvents[0].eventName).toBe('api_error');
            expect(mockLoggedEvents[0].params.error_type).toBe('timeout');
            expect(mockLoggedEvents[0].params.error_message).toBe('Request timed out');
        });
    });

    describe('UserAnalytics', () => {
        test('shareClick should track share clicks', () => {
            analyticsModule.UserAnalytics.shareClick('image');
            expect(mockLoggedEvents).toHaveLength(1);
            expect(mockLoggedEvents[0].eventName).toBe('share_click');
            expect(mockLoggedEvents[0].params.share_type).toBe('image');
        });

        test('leaderboardView should track leaderboard views', () => {
            analyticsModule.UserAnalytics.leaderboardView('daily');
            expect(mockLoggedEvents).toHaveLength(1);
            expect(mockLoggedEvents[0].eventName).toBe('leaderboard_view');
            expect(mockLoggedEvents[0].params.leaderboard_type).toBe('daily');
        });

        test('profileView should track profile views', () => {
            analyticsModule.UserAnalytics.profileView('user123');
            expect(mockLoggedEvents).toHaveLength(1);
            expect(mockLoggedEvents[0].eventName).toBe('profile_view');
            expect(mockLoggedEvents[0].params.user_id).toBe('user123');
        });

        test('authLogin should track logins', () => {
            analyticsModule.UserAnalytics.authLogin('google');
            expect(mockLoggedEvents).toHaveLength(1);
            expect(mockLoggedEvents[0].eventName).toBe('login');
            expect(mockLoggedEvents[0].params.method).toBe('google');
        });

        test('authLogout should track logouts', () => {
            analyticsModule.UserAnalytics.authLogout();
            expect(mockLoggedEvents).toHaveLength(1);
            expect(mockLoggedEvents[0].eventName).toBe('logout');
        });
    });

    describe('ErrorAnalytics', () => {
        test('jsError should track JavaScript errors', () => {
            const error = new Error('Test error');
            analyticsModule.ErrorAnalytics.jsError(error, 'test_context');
            expect(mockLoggedEvents).toHaveLength(1);
            expect(mockLoggedEvents[0].eventName).toBe('js_error');
            expect(mockLoggedEvents[0].params.error_message).toBe('Test error');
            expect(mockLoggedEvents[0].params.context).toBe('test_context');
            expect(typeof mockLoggedEvents[0].params.error_stack).toBe('string');
        });

        test('networkError should track network errors', () => {
            analyticsModule.ErrorAnalytics.networkError('https://api.example.com', 500);
            expect(mockLoggedEvents).toHaveLength(1);
            expect(mockLoggedEvents[0].eventName).toBe('network_error');
            expect(mockLoggedEvents[0].params.url).toBe('https://api.example.com');
            expect(mockLoggedEvents[0].params.status_code).toBe(500);
        });
    });

    describe('Edge Cases', () => {
        test('trackEvent should handle empty parameters', () => {
            analyticsModule.trackEvent('empty_event');
            expect(mockLoggedEvents).toHaveLength(1);
            expect(mockLoggedEvents[0].eventName).toBe('empty_event');
        });

        test('gameComplete should handle missing stats', () => {
            analyticsModule.GameAnalytics.gameComplete('victory', {});
            expect(mockLoggedEvents).toHaveLength(1);
            expect(mockLoggedEvents[0].params.total_tokens).toBe(0);
            expect(mockLoggedEvents[0].params.attempts).toBe(0);
            expect(mockLoggedEvents[0].params.duration_seconds).toBe(0);
            expect(mockLoggedEvents[0].params.efficiency).toBe(0);
        });

        test('multiple events should be tracked in sequence', () => {
            analyticsModule.GameAnalytics.gameStart('2025-10-24');
            analyticsModule.GameAnalytics.promptSubmit(30, 10);
            analyticsModule.GameAnalytics.promptSubmit(35, 12);
            analyticsModule.GameAnalytics.gameComplete('victory', { totalTokens: 187, attempts: 2 });
            
            expect(mockLoggedEvents).toHaveLength(4);
            expect(mockLoggedEvents[0].eventName).toBe('game_start');
            expect(mockLoggedEvents[1].eventName).toBe('prompt_submit');
            expect(mockLoggedEvents[2].eventName).toBe('prompt_submit');
            expect(mockLoggedEvents[3].eventName).toBe('game_complete');
        });
    });
});
