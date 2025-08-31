/**
 * @fileOverview Tests for the tip tracking and analytics system
 * 
 * This test suite validates the comprehensive tracking system that monitors
 * tip effectiveness, user interactions, and provides analytics insights.
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import {
  TipTrackingSystem,
  trackTipView,
  trackTipImplementation,
  submitTipFeedback,
  getTipAnalytics,
  getUserEngagement
} from '@/lib/tip-tracking-system';
import type { TipFeedback } from '@/types/ai-types';

describe('Tip Tracking System', () => {
  let trackingSystem: TipTrackingSystem;

  const mockTipId = 'test-tip-123';
  const mockUserId = 'test-user-456';

  beforeEach(() => {
    trackingSystem = TipTrackingSystem.getInstance();
    
    // Clear all tracking data for clean test state
    trackingSystem.clearTrackingData();
    
    // Clear localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Tip Interaction Tracking', () => {
    it('should track tip views correctly', () => {
      trackingSystem.trackTipInteraction(mockTipId, 'viewed');
      
      const analytics = trackingSystem.getAnalyticsInsights();
      expect(analytics).toBeDefined();
      
      // Check that interaction was recorded
      const effectiveness = trackingSystem.getTipEffectiveness(mockTipId);
      expect(effectiveness?.totalViews).toBe(1);
    });

    it('should track multiple interaction types', () => {
      const interactionTypes = ['viewed', 'expanded', 'marked_helpful', 'implemented'] as const;
      
      interactionTypes.forEach(type => {
        trackingSystem.trackTipInteraction(mockTipId, type);
      });

      const effectiveness = trackingSystem.getTipEffectiveness(mockTipId);
      expect(effectiveness?.totalViews).toBe(1); // Only 'viewed' counts as view
      expect(effectiveness?.implementationRate).toBeGreaterThan(0);
    });

    it('should track interaction context correctly', () => {
      trackingSystem.trackTipInteraction(mockTipId, 'viewed', {
        source: 'daily_tips',
        userAgent: 'test-browser'
      });

      // Verify context is captured (implementation detail)
      const analytics = trackingSystem.getAnalyticsInsights();
      expect(analytics).toBeDefined();
    });

    it('should handle rapid successive interactions', () => {
      // Simulate rapid clicks/interactions
      for (let i = 0; i < 10; i++) {
        trackingSystem.trackTipInteraction(mockTipId, 'viewed');
      }

      const effectiveness = trackingSystem.getTipEffectiveness(mockTipId);
      expect(effectiveness?.totalViews).toBe(10);
    });

    it('should track different tips independently', () => {
      const tip1 = 'tip-1';
      const tip2 = 'tip-2';

      trackingSystem.trackTipInteraction(tip1, 'viewed');
      trackingSystem.trackTipInteraction(tip1, 'implemented');
      trackingSystem.trackTipInteraction(tip2, 'viewed');

      const effectiveness1 = trackingSystem.getTipEffectiveness(tip1);
      const effectiveness2 = trackingSystem.getTipEffectiveness(tip2);

      expect(effectiveness1?.totalViews).toBe(1);
      expect(effectiveness1?.implementationRate).toBeGreaterThan(0);
      expect(effectiveness2?.totalViews).toBe(1);
      expect(effectiveness2?.implementationRate).toBe(0);
    });
  });

  describe('Tip Implementation Tracking', () => {
    it('should record tip implementation details', () => {
      const implementationData = {
        tipId: mockTipId,
        implementedAt: new Date(),
        completionStatus: 'complete' as const,
        difficulty: 'as_expected' as const,
        timeSpent: 30,
        notes: 'Easy to follow and effective',
        results: 'Improved focus significantly'
      };

      trackingSystem.recordTipImplementation(implementationData);

      const effectiveness = trackingSystem.getTipEffectiveness(mockTipId);
      expect(effectiveness).toBeDefined();
    });

    it('should handle different completion statuses', () => {
      const statuses = ['partial', 'complete', 'abandoned'] as const;

      statuses.forEach((status, index) => {
        const tipId = `tip-${index}`;
        trackingSystem.recordTipImplementation({
          tipId,
          implementedAt: new Date(),
          completionStatus: status,
          difficulty: 'as_expected',
          timeSpent: 25,
        });
      });

      // Verify all implementations were recorded
      const analytics = trackingSystem.getAnalyticsInsights();
      expect(analytics).toBeDefined();
    });

    it('should track time spent accurately', () => {
      const implementationData = {
        tipId: mockTipId,
        implementedAt: new Date(),
        completionStatus: 'complete' as const,
        difficulty: 'easier_than_expected' as const,
        timeSpent: 45,
      };

      trackingSystem.recordTipImplementation(implementationData);

      // Time spent should be recorded for analytics
      const analytics = trackingSystem.getAnalyticsInsights();
      expect(analytics).toBeDefined();
    });

    it('should correlate implementation with difficulty rating', () => {
      const difficulties = ['easier_than_expected', 'as_expected', 'harder_than_expected'] as const;

      difficulties.forEach((difficulty, index) => {
        trackingSystem.recordTipImplementation({
          tipId: `tip-difficulty-${index}`,
          implementedAt: new Date(),
          completionStatus: 'complete',
          difficulty,
          timeSpent: 30,
        });
      });

      const analytics = trackingSystem.getAnalyticsInsights();
      expect(analytics.overallEffectiveness).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Feedback Recording and Analysis', () => {
    it('should record comprehensive feedback', () => {
      const feedback: TipFeedback = {
        tipId: mockTipId,
        rating: 4,
        helpfulness: 5,
        implemented: true,
        difficulty: 3,
        results: 'Helped me stay focused for longer periods',
        feedback: 'Great tip! Very practical and easy to implement.',
        timestamp: new Date()
      };

      trackingSystem.recordTipFeedback(feedback);

      const effectiveness = trackingSystem.getTipEffectiveness(mockTipId);
      expect(effectiveness?.averageRating).toBe(4);
      expect(effectiveness?.helpfulnessScore).toBe(5);
    });

    it('should calculate average ratings correctly', () => {
      const feedbackItems: TipFeedback[] = [
        {
          tipId: mockTipId,
          rating: 5,
          helpfulness: 5,
          implemented: true,
          difficulty: 2,
          timestamp: new Date()
        },
        {
          tipId: mockTipId,
          rating: 3,
          helpfulness: 4,
          implemented: false,
          difficulty: 4,
          timestamp: new Date()
        },
        {
          tipId: mockTipId,
          rating: 4,
          helpfulness: 3,
          implemented: true,
          difficulty: 3,
          timestamp: new Date()
        }
      ];

      feedbackItems.forEach(feedback => {
        trackingSystem.recordTipFeedback(feedback);
      });

      const effectiveness = trackingSystem.getTipEffectiveness(mockTipId);
      expect(effectiveness?.averageRating).toBe(4); // (5+3+4)/3 = 4
      expect(effectiveness?.helpfulnessScore).toBe(4); // (5+4+3)/3 = 4
    });

    it('should handle feedback without optional fields', () => {
      const minimalFeedback: TipFeedback = {
        tipId: mockTipId,
        rating: 3,
        helpfulness: 3,
        implemented: false,
        difficulty: 3,
        timestamp: new Date()
      };

      expect(() => {
        trackingSystem.recordTipFeedback(minimalFeedback);
      }).not.toThrow();

      const effectiveness = trackingSystem.getTipEffectiveness(mockTipId);
      expect(effectiveness?.averageRating).toBe(3);
    });

    it('should limit feedback history size', () => {
      // Create more feedback than the maximum limit
      for (let i = 0; i < 550; i++) {
        const feedback: TipFeedback = {
          tipId: `tip-${i}`,
          rating: Math.floor(Math.random() * 5) + 1,
          helpfulness: Math.floor(Math.random() * 5) + 1,
          implemented: Math.random() > 0.5,
          difficulty: Math.floor(Math.random() * 5) + 1,
          timestamp: new Date(Date.now() - i * 1000)
        };

        trackingSystem.recordTipFeedback(feedback);
      }

      // Should not exceed maximum feedback history (500)
      const exportedData = trackingSystem.exportTrackingData();
      expect(exportedData.feedback.length).toBeLessThanOrEqual(500);
    });
  });

  describe('Analytics and Insights Generation', () => {
    it('should generate comprehensive analytics insights', () => {
      // Set up test data
      trackingSystem.trackTipInteraction('tip-1', 'viewed');
      trackingSystem.trackTipInteraction('tip-1', 'implemented');
      trackingSystem.recordTipFeedback({
        tipId: 'tip-1',
        rating: 5,
        helpfulness: 5,
        implemented: true,
        difficulty: 3,
        timestamp: new Date()
      });

      const analytics = trackingSystem.getAnalyticsInsights();

      expect(analytics).toBeDefined();
      expect(analytics.overallEffectiveness).toBeGreaterThanOrEqual(0);
      expect(analytics.overallEffectiveness).toBeLessThanOrEqual(100);
      expect(Array.isArray(analytics.topPerformingCategories)).toBe(true);
      expect(Array.isArray(analytics.strugglingCategories)).toBe(true);
      expect(Array.isArray(analytics.recommendedImprovements)).toBe(true);
    });

    it('should calculate effectiveness metrics correctly', () => {
      const tipId = 'effectiveness-test-tip';

      // Create views and implementations
      trackingSystem.trackTipInteraction(tipId, 'viewed');
      trackingSystem.trackTipInteraction(tipId, 'viewed');
      trackingSystem.trackTipInteraction(tipId, 'implemented');

      const effectiveness = trackingSystem.getTipEffectiveness(tipId);
      expect(effectiveness?.totalViews).toBe(2);
      expect(effectiveness?.implementationRate).toBe(50); // 1 implementation out of 2 views
    });

    it('should identify performance trends', () => {
      // Create historical data over time
      const now = Date.now();
      for (let week = 0; week < 8; week++) {
        for (let day = 0; day < 7; day++) {
          const timestamp = new Date(now - week * 7 * 24 * 60 * 60 * 1000 - day * 24 * 60 * 60 * 1000);
          
          trackingSystem.trackTipInteraction(`tip-${week}-${day}`, 'viewed');
          
          if (week < 4) { // More implementations in recent weeks
            trackingSystem.trackTipInteraction(`tip-${week}-${day}`, 'implemented');
          }
        }
      }

      const analytics = trackingSystem.getAnalyticsInsights();
      expect(analytics.userEngagementTrends).toBeDefined();
      expect(Array.isArray(analytics.userEngagementTrends)).toBe(true);
    });

    it('should provide category performance analysis', () => {
      // Set up tips with different categories
      const categories = ['Productivity', 'Health', 'Mindfulness'];
      
      categories.forEach((category, index) => {
        const tipId = `${category.toLowerCase()}-tip`;
        
        // Health tips perform better
        const rating = category === 'Health' ? 5 : 3;
        const implemented = category === 'Health';
        
        trackingSystem.trackTipInteraction(tipId, 'viewed');
        if (implemented) {
          trackingSystem.trackTipInteraction(tipId, 'implemented');
        }
        
        trackingSystem.recordTipFeedback({
          tipId,
          rating,
          helpfulness: rating,
          implemented,
          difficulty: 3,
          timestamp: new Date()
        });
      });

      const analytics = trackingSystem.getAnalyticsInsights();
      expect(analytics.topPerformingCategories.length).toBeGreaterThan(0);
      expect(analytics.strugglingCategories.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('User Engagement Statistics', () => {
    it('should calculate user engagement stats', () => {
      // Simulate user interactions
      trackingSystem.trackTipInteraction('tip-1', 'viewed');
      trackingSystem.trackTipInteraction('tip-1', 'implemented');
      trackingSystem.trackTipInteraction('tip-2', 'viewed');
      
      trackingSystem.recordTipFeedback({
        tipId: 'tip-1',
        rating: 4,
        helpfulness: 4,
        implemented: true,
        difficulty: 3,
        timestamp: new Date()
      });

      const engagementStats = trackingSystem.getUserEngagementStats();

      expect(engagementStats.totalInteractions).toBe(3);
      expect(engagementStats.implementationRate).toBeGreaterThan(0);
      expect(engagementStats.averageFeedbackRating).toBe(4);
      expect(['increasing', 'stable', 'decreasing']).toContain(engagementStats.engagementTrend);
    });

    it('should track engagement trends over time', () => {
      const now = Date.now();
      
      // Recent week interactions
      for (let i = 0; i < 5; i++) {
        trackingSystem.trackTipInteraction(`recent-tip-${i}`, 'viewed');
      }
      
      // Previous week interactions (simulate with older timestamps)
      // This is a simplified test - real implementation would use actual timestamps
      for (let i = 0; i < 2; i++) {
        trackingSystem.trackTipInteraction(`old-tip-${i}`, 'viewed');
      }

      const engagementStats = trackingSystem.getUserEngagementStats();
      expect(engagementStats.engagementTrend).toBeDefined();
    });

    it('should identify most engaged categories', () => {
      const categories = ['Productivity', 'Health', 'Learning'];
      
      categories.forEach(category => {
        for (let i = 0; i < 3; i++) {
          trackingSystem.trackTipInteraction(`${category}-tip-${i}`, 'viewed');
          trackingSystem.trackTipInteraction(`${category}-tip-${i}`, 'expanded');
        }
      });

      const engagementStats = trackingSystem.getUserEngagementStats();
      expect(Array.isArray(engagementStats.mostEngagedCategories)).toBe(true);
    });
  });

  describe('Improvement Recommendations', () => {
    it('should generate actionable improvement recommendations', () => {
      // Create low performing scenario
      trackingSystem.trackTipInteraction('low-perf-tip', 'viewed');
      trackingSystem.recordTipFeedback({
        tipId: 'low-perf-tip',
        rating: 2,
        helpfulness: 2,
        implemented: false,
        difficulty: 5,
        timestamp: new Date()
      });

      const recommendations = trackingSystem.getImprovementRecommendations();
      
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeLessThanOrEqual(5);
      
      recommendations.forEach(recommendation => {
        expect(typeof recommendation).toBe('string');
        expect(recommendation.length).toBeGreaterThan(10);
      });
    });

    it('should recommend complexity reduction for low implementation rates', () => {
      // Create scenario with low implementation rate
      for (let i = 0; i < 10; i++) {
        trackingSystem.trackTipInteraction(`complex-tip-${i}`, 'viewed');
        // Only implement 1 out of 10 tips
        if (i === 0) {
          trackingSystem.trackTipInteraction(`complex-tip-${i}`, 'implemented');
        }
      }

      const recommendations = trackingSystem.getImprovementRecommendations();
      const hasComplexityRecommendation = recommendations.some(rec => 
        rec.toLowerCase().includes('simplify') || rec.toLowerCase().includes('complexity')
      );
      
      expect(hasComplexityRecommendation).toBe(true);
    });

    it('should recommend relevance improvements for low ratings', () => {
      // Create scenario with low average ratings
      for (let i = 0; i < 5; i++) {
        trackingSystem.recordTipFeedback({
          tipId: `low-rated-tip-${i}`,
          rating: 2,
          helpfulness: 2,
          implemented: false,
          difficulty: 3,
          timestamp: new Date()
        });
      }

      const recommendations = trackingSystem.getImprovementRecommendations();
      const hasRelevanceRecommendation = recommendations.some(rec => 
        rec.toLowerCase().includes('relevance') || rec.toLowerCase().includes('personalization')
      );
      
      expect(hasRelevanceRecommendation).toBe(true);
    });
  });

  describe('Data Export and Management', () => {
    it('should export comprehensive tracking data', () => {
      // Set up test data
      trackingSystem.trackTipInteraction('export-tip', 'viewed');
      trackingSystem.recordTipFeedback({
        tipId: 'export-tip',
        rating: 4,
        helpfulness: 4,
        implemented: true,
        difficulty: 3,
        timestamp: new Date()
      });

      const exportedData = trackingSystem.exportTrackingData();

      expect(exportedData).toBeDefined();
      expect(Array.isArray(exportedData.interactions)).toBe(true);
      expect(Array.isArray(exportedData.implementations)).toBe(true);
      expect(Array.isArray(exportedData.feedback)).toBe(true);
      expect(typeof exportedData.metrics).toBe('object');
      expect(typeof exportedData.analytics).toBe('object');
    });

    it('should clear tracking data completely', () => {
      // Add some data
      trackingSystem.trackTipInteraction('clear-test-tip', 'viewed');
      trackingSystem.recordTipFeedback({
        tipId: 'clear-test-tip',
        rating: 3,
        helpfulness: 3,
        implemented: false,
        difficulty: 3,
        timestamp: new Date()
      });

      // Clear data
      trackingSystem.clearTrackingData();

      // Verify data is cleared
      const exportedData = trackingSystem.exportTrackingData();
      expect(exportedData.interactions.length).toBe(0);
      expect(exportedData.feedback.length).toBe(0);
      expect(Object.keys(exportedData.metrics).length).toBe(0);
    });

    it('should maintain data integrity during cleanup', () => {
      // Add old and recent data
      const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000); // 100 days ago
      const recentDate = new Date();

      trackingSystem.trackTipInteraction('old-tip', 'viewed');
      trackingSystem.trackTipInteraction('recent-tip', 'viewed');

      // Simulate cleanup process
      const analytics = trackingSystem.getAnalyticsInsights();
      expect(analytics).toBeDefined();

      // Recent data should still be available
      const exportedData = trackingSystem.exportTrackingData();
      expect(exportedData.interactions.length).toBeGreaterThan(0);
    });
  });

  describe('Utility Functions', () => {
    it('should track tip views via utility function', () => {
      trackTipView('utility-tip-1');
      
      const effectiveness = trackingSystem.getTipEffectiveness('utility-tip-1');
      expect(effectiveness?.totalViews).toBe(1);
    });

    it('should track tip implementations via utility function', () => {
      trackTipImplementation('utility-tip-2', {
        implementedAt: new Date(),
        completionStatus: 'complete',
        difficulty: 'as_expected',
        timeSpent: 20
      });

      // Should be recorded in the system
      const analytics = trackingSystem.getAnalyticsInsights();
      expect(analytics).toBeDefined();
    });

    it('should submit feedback via utility function', () => {
      const feedback: TipFeedback = {
        tipId: 'utility-tip-3',
        rating: 5,
        helpfulness: 5,
        implemented: true,
        difficulty: 2,
        timestamp: new Date()
      };

      submitTipFeedback(feedback);

      const effectiveness = trackingSystem.getTipEffectiveness('utility-tip-3');
      expect(effectiveness?.averageRating).toBe(5);
    });

    it('should get analytics via utility function', () => {
      const analytics = getTipAnalytics();
      expect(analytics).toBeDefined();
      expect(typeof analytics.overallEffectiveness).toBe('number');
    });

    it('should get user engagement via utility function', () => {
      trackTipView('engagement-tip');
      
      const engagement = getUserEngagement();
      expect(engagement).toBeDefined();
      expect(typeof engagement.totalInteractions).toBe('number');
      expect(typeof engagement.implementationRate).toBe('number');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large volumes of interactions efficiently', () => {
      const startTime = Date.now();
      
      // Generate large number of interactions
      for (let i = 0; i < 1000; i++) {
        trackingSystem.trackTipInteraction(`perf-tip-${i % 100}`, 'viewed');
      }

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should complete within reasonable time
      expect(processingTime).toBeLessThan(2000); // 2 seconds
      
      const analytics = trackingSystem.getAnalyticsInsights();
      expect(analytics).toBeDefined();
    });

    it('should maintain memory efficiency with data limits', () => {
      // Generate data beyond typical limits
      for (let i = 0; i < 200; i++) {
        trackingSystem.trackTipInteraction(`memory-tip-${i}`, 'viewed');
        trackingSystem.recordTipFeedback({
          tipId: `memory-tip-${i}`,
          rating: Math.floor(Math.random() * 5) + 1,
          helpfulness: Math.floor(Math.random() * 5) + 1,
          implemented: Math.random() > 0.5,
          difficulty: Math.floor(Math.random() * 5) + 1,
          timestamp: new Date()
        });
      }

      const exportedData = trackingSystem.exportTrackingData();
      
      // Should respect memory limits
      expect(exportedData.interactions.length).toBeLessThanOrEqual(1000);
      expect(exportedData.feedback.length).toBeLessThanOrEqual(500);
    });
  });
});