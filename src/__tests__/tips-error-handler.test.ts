/**
 * @fileOverview Tests for the enhanced error handling system
 * 
 * This test suite validates the comprehensive error handling, retry mechanisms,
 * and graceful degradation features of the daily tips system.
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import {
  TipsErrorHandler,
  withErrorHandling,
  createSuccessResponse,
  createErrorResponse,
  ErrorCategory,
  ErrorSeverity,
  type TipGenerationContext,
  type TipsResponse
} from '@/lib/tips-error-handler';

describe('Enhanced Error Handling System', () => {
  let errorHandler: TipsErrorHandler;
  const mockContext: TipGenerationContext = {
    userId: 'test-user',
    sessionId: 'test-session-123',
    generationReason: 'manual',
    userTimezone: 'America/New_York',
    deviceContext: 'Mozilla/5.0 (Test Browser)'
  };

  beforeEach(() => {
    errorHandler = new TipsErrorHandler();
    jest.clearAllMocks();
    
    // Clear localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Error Classification', () => {
    it('should classify API key errors correctly', () => {
      const apiKeyError = new Error('Invalid API key provided');
      const result = errorHandler.handleError(apiKeyError, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(result.error?.severity).toBe(ErrorSeverity.HIGH);
      expect(result.error?.retryable).toBe(false);
      expect(result.error?.suggestedAction).toContain('API key');
    });

    it('should classify rate limiting errors correctly', () => {
      const rateLimitError = new Error('Rate limit exceeded');
      const result = errorHandler.handleError(rateLimitError, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.category).toBe(ErrorCategory.RATE_LIMIT);
      expect(result.error?.retryable).toBe(true);
      expect(result.error?.suggestedAction).toContain('wait');
    });

    it('should classify network errors correctly', () => {
      const networkError = new Error('ECONNREFUSED');
      const result = errorHandler.handleError(networkError, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.category).toBe(ErrorCategory.NETWORK);
      expect(result.error?.retryable).toBe(true);
      expect(result.error?.suggestedAction).toContain('connection');
    });

    it('should classify validation errors correctly', () => {
      const validationError = new Error('Invalid input format');
      const result = errorHandler.handleError(validationError, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.category).toBe(ErrorCategory.VALIDATION);
      expect(result.error?.retryable).toBe(false);
      expect(result.error?.suggestedAction).toContain('input');
    });

    it('should classify AI service errors correctly', () => {
      const aiError = new Error('Model temporarily unavailable');
      const result = errorHandler.handleError(aiError, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.category).toBe(ErrorCategory.AI_SERVICE);
      expect(result.error?.retryable).toBe(true);
    });

    it('should handle unknown errors with appropriate fallback', () => {
      const unknownError = new Error('Something completely unexpected');
      const result = errorHandler.handleError(unknownError, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.category).toBe(ErrorCategory.UNKNOWN);
      expect(result.error?.severity).toBe(ErrorSeverity.MEDIUM);
      expect(result.fallbackData).toBeDefined();
    });
  });

  describe('Error Logging and Tracking', () => {
    it('should log errors with proper context', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const testError = new Error('Test error for logging');
      errorHandler.handleError(testError, mockContext);

      expect(consoleErrorSpy).toHaveBeenCalled();
      const logCall = consoleErrorSpy.mock.calls[0];
      expect(logCall[0]).toContain('Tips Error');
      
      consoleErrorSpy.mockRestore();
    });

    it('should track error frequency for analysis', () => {
      const error1 = new Error('API key invalid');
      const error2 = new Error('API key invalid');
      const error3 = new Error('Network timeout');

      errorHandler.handleError(error1, mockContext);
      errorHandler.handleError(error2, mockContext);
      errorHandler.handleError(error3, mockContext);

      const stats = errorHandler.getErrorStats();
      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByCategory.AUTHENTICATION).toBe(2);
      expect(stats.errorsByCategory.NETWORK).toBe(1);
    });

    it('should maintain error history with limits', () => {
      // Generate more errors than the history limit
      for (let i = 0; i < 150; i++) {
        const error = new Error(`Test error ${i}`);
        errorHandler.handleError(error, { ...mockContext, sessionId: `session-${i}` });
      }

      const stats = errorHandler.getErrorStats();
      // Should not exceed the maximum history size (100)
      expect(stats.totalErrors).toBeLessThanOrEqual(100);
    });

    it('should provide error trend analysis', () => {
      // Create errors over different time periods
      const now = Date.now();
      const oldContext = { ...mockContext, sessionId: 'old-session' };
      
      // Mock Date.now for old errors
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => now - 2 * 60 * 60 * 1000); // 2 hours ago
      
      errorHandler.handleError(new Error('Old error'), oldContext);
      
      // Restore Date.now for recent errors
      Date.now = originalDateNow;
      
      errorHandler.handleError(new Error('Recent error 1'), mockContext);
      errorHandler.handleError(new Error('Recent error 2'), mockContext);

      const trends = errorHandler.getErrorTrends();
      expect(trends.recentErrorRate).toBeGreaterThan(trends.overallErrorRate);
    });
  });

  describe('Retry Logic and Backoff', () => {
    it('should implement exponential backoff for retryable errors', () => {
      const retryableError = new Error('Service temporarily unavailable');
      
      const result1 = errorHandler.handleError(retryableError, mockContext, 0);
      const result2 = errorHandler.handleError(retryableError, mockContext, 1);
      const result3 = errorHandler.handleError(retryableError, mockContext, 2);

      expect(result1.error?.retryable).toBe(true);
      expect(result2.error?.retryable).toBe(true);
      expect(result3.error?.retryable).toBe(false); // Should stop retrying after max attempts
    });

    it('should not retry non-retryable errors', () => {
      const nonRetryableError = new Error('Invalid API key');
      const result = errorHandler.handleError(nonRetryableError, mockContext, 0);

      expect(result.error?.retryable).toBe(false);
    });

    it('should track retry attempts correctly', () => {
      const retryableError = new Error('Network timeout');
      
      errorHandler.handleError(retryableError, mockContext, 0);
      errorHandler.handleError(retryableError, mockContext, 1);
      errorHandler.handleError(retryableError, mockContext, 2);

      const stats = errorHandler.getErrorStats();
      expect(stats.retryAttempts).toBe(3);
    });
  });

  describe('Fallback Data Generation', () => {
    it('should provide appropriate fallback data for different error types', () => {
      const networkError = new Error('Connection failed');
      const result = errorHandler.handleError(networkError, mockContext);

      expect(result.fallbackData).toBeDefined();
      expect(result.fallbackData.tips).toBeDefined();
      expect(Array.isArray(result.fallbackData.tips)).toBe(true);
      expect(result.fallbackData.tips.length).toBeGreaterThan(0);
    });

    it('should generate contextually relevant fallback tips', () => {
      const contextWithPreferences = {
        ...mockContext,
        userPreferences: { preferredCategories: ['Health', 'Productivity'] }
      };

      const error = new Error('AI service unavailable');
      const result = errorHandler.handleError(error, contextWithPreferences);

      if (result.fallbackData) {
        // Fallback tips should be basic but relevant
        expect(result.fallbackData.tips).toBeDefined();
        result.fallbackData.tips.forEach(tip => {
          expect(tip.id).toBeDefined();
          expect(tip.title).toBeDefined();
          expect(tip.suggestion).toBeDefined();
          expect(tip.actionSteps).toBeDefined();
        });
      }
    });

    it('should include fallback summary and encouragement', () => {
      const error = new Error('Service unavailable');
      const result = errorHandler.handleError(error, mockContext);

      if (result.fallbackData) {
        expect(result.fallbackData.summary).toBeDefined();
        expect(result.fallbackData.summary.overallTheme).toBeDefined();
        expect(result.fallbackData.summary.encouragement).toBeDefined();
        expect(result.fallbackData.summary.keyInsights).toBeDefined();
      }
    });
  });

  describe('Context Sanitization', () => {
    it('should sanitize sensitive information from error context', () => {
      const sensitiveContext = {
        ...mockContext,
        apiKey: 'secret-api-key-123',
        userEmail: 'user@example.com',
        sessionToken: 'sensitive-session-token'
      };

      const error = new Error('Test error');
      const result = errorHandler.handleError(error, sensitiveContext as any);

      // Check that sensitive info is not included in error context
      const errorContextStr = JSON.stringify(result.error?.context || {});
      expect(errorContextStr).not.toContain('secret-api-key');
      expect(errorContextStr).not.toContain('user@example.com');
      expect(errorContextStr).not.toContain('sensitive-session-token');
    });

    it('should preserve non-sensitive context information', () => {
      const error = new Error('Test error');
      const result = errorHandler.handleError(error, mockContext);

      expect(result.error?.context).toBeDefined();
      expect(result.error?.context.userId).toBe(mockContext.userId);
      expect(result.error?.context.sessionId).toBe(mockContext.sessionId);
      expect(result.error?.context.userTimezone).toBe(mockContext.userTimezone);
    });
  });

  describe('User-Friendly Error Messages', () => {
    it('should provide clear messages for common errors', () => {
      const testCases = [
        { error: new Error('API key not found'), expectedContent: 'API key' },
        { error: new Error('Rate limit exceeded'), expectedContent: 'too many requests' },
        { error: new Error('Network error'), expectedContent: 'connection' },
        { error: new Error('Invalid input'), expectedContent: 'invalid' }
      ];

      testCases.forEach(({ error, expectedContent }) => {
        const result = errorHandler.handleError(error, mockContext);
        expect(result.error?.message.toLowerCase()).toContain(expectedContent.toLowerCase());
      });
    });

    it('should suggest actionable solutions', () => {
      const apiKeyError = new Error('Unauthorized');
      const result = errorHandler.handleError(apiKeyError, mockContext);

      expect(result.error?.suggestedAction).toBeDefined();
      expect(result.error?.suggestedAction.length).toBeGreaterThan(10);
      expect(result.error?.suggestedAction).toContain('API key');
    });

    it('should avoid technical jargon in user messages', () => {
      const technicalError = new Error('ERR_CONNECTION_REFUSED ECONNREFUSED 127.0.0.1:443');
      const result = errorHandler.handleError(technicalError, mockContext);

      // User message should be friendly, not technical
      expect(result.error?.message).not.toContain('ECONNREFUSED');
      expect(result.error?.message).not.toContain('127.0.0.1');
      expect(result.error?.message.toLowerCase()).toContain('connection');
    });
  });

  describe('Error Wrapper Function', () => {
    it('should wrap successful operations correctly', async () => {
      const successfulOperation = async () => ({
        tips: [{ id: '1', title: 'Test Tip', type: 'Health' }],
        summary: { overallTheme: 'Test' }
      });

      const result = await withErrorHandling(successfulOperation, mockContext);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tips).toBeDefined();
        expect(result.data.summary).toBeDefined();
      }
    });

    it('should handle thrown errors in wrapped operations', async () => {
      const failingOperation = async () => {
        throw new Error('Operation failed');
      };

      const result = await withErrorHandling(failingOperation, mockContext);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error.message).toContain('Operation failed');
      }
    });

    it('should handle async operation timeouts', async () => {
      const slowOperation = async () => {
        return new Promise((resolve) => {
          setTimeout(() => resolve({ tips: [], summary: {} }), 30000); // 30 seconds
        });
      };

      const startTime = Date.now();
      const result = await withErrorHandling(slowOperation, mockContext);
      const endTime = Date.now();

      // Should not wait the full 30 seconds
      expect(endTime - startTime).toBeLessThan(15000);
      
      if (!result.success) {
        expect(result.error?.category).toBe(ErrorCategory.TIMEOUT);
      }
    });
  });

  describe('Response Helpers', () => {
    it('should create success responses correctly', () => {
      const mockData = {
        tips: [{ id: '1', title: 'Test', type: 'Health' }],
        summary: { overallTheme: 'Test Theme' }
      };

      const response = createSuccessResponse(mockData);

      expect(response.success).toBe(true);
      if (response.success) {
        expect(response.data).toBe(mockData);
      }
    });

    it('should create error responses correctly', () => {
      const mockError = {
        code: 'TEST_ERROR',
        message: 'Test error message',
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.MEDIUM,
        timestamp: new Date(),
        context: mockContext,
        retryable: false,
        suggestedAction: 'Fix the issue'
      };

      const response = createErrorResponse(mockError);

      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.error).toBe(mockError);
      }
    });
  });

  describe('Error Recovery Strategies', () => {
    it('should implement circuit breaker pattern for repeated failures', () => {
      // Simulate repeated failures
      for (let i = 0; i < 10; i++) {
        const error = new Error('Service unavailable');
        errorHandler.handleError(error, { ...mockContext, sessionId: `session-${i}` });
      }

      const stats = errorHandler.getErrorStats();
      expect(stats.circuitBreakerStatus).toBeDefined();
      
      // After many failures, should trigger circuit breaker
      if (stats.totalErrors >= 5) {
        expect(stats.circuitBreakerStatus).toBe('open');
      }
    });

    it('should provide degraded service during high error rates', () => {
      // Simulate high error rate
      for (let i = 0; i < 5; i++) {
        const error = new Error('AI service overloaded');
        errorHandler.handleError(error, mockContext);
      }

      const stats = errorHandler.getErrorStats();
      const isHighErrorRate = stats.recentErrorRate > 0.5;
      
      if (isHighErrorRate) {
        // Should provide fallback recommendations
        const error = new Error('Another AI service error');
        const result = errorHandler.handleError(error, mockContext);
        
        expect(result.fallbackData).toBeDefined();
        expect(result.error?.suggestedAction).toContain('try again later');
      }
    });
  });

  describe('Integration with External Services', () => {
    it('should handle external service monitoring integration', () => {
      const criticalError = new Error('Critical system failure');
      const result = errorHandler.handleError(criticalError, mockContext);

      // Should flag critical errors appropriately
      expect(result.error?.severity).toBe(ErrorSeverity.CRITICAL);
      
      // In a real implementation, this would trigger external alerts
      expect(result.error?.code).toBeDefined();
      expect(result.error?.timestamp).toBeInstanceOf(Date);
    });

    it('should provide error data in analytics-friendly format', () => {
      const error = new Error('Analytics test error');
      const result = errorHandler.handleError(error, mockContext);

      const analyticsData = errorHandler.getAnalyticsData();
      
      expect(analyticsData).toBeDefined();
      expect(analyticsData.errorsByCategory).toBeDefined();
      expect(analyticsData.errorTrends).toBeDefined();
      expect(analyticsData.retrySuccessRate).toBeDefined();
    });
  });
});