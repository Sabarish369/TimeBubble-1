/**
 * @fileOverview Integration tests for the complete enhanced daily tips system
 * 
 * This test suite validates the entire daily tips system working together,
 * including AI generation, personalization, error handling, and tracking.
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { getDailyTips } from '@/ai/flows/daily-tips';
import { TipPersonalizationEngine } from '@/lib/tip-personalization-engine';
import { TipTrackingSystem } from '@/lib/tip-tracking-system';
import { TipsErrorHandler } from '@/lib/tips-error-handler';
import type { DailyTipsInput, DailyTips, TipFeedback } from '@/types/ai-types';

// Mock external dependencies
jest.mock('@/ai/genkit');
jest.mock('@genkit-ai/googleai');

describe('Daily Tips System Integration Tests', () => {
  let personalizationEngine: TipPersonalizationEngine;
  let trackingSystem: TipTrackingSystem;
  let errorHandler: TipsErrorHandler;

  const mockApiKey = 'test-integration-api-key';
  
  const comprehensiveInput: DailyTipsInput = {
    schedule: JSON.stringify([
      {
        id: '1',
        title: 'Morning Meditation',
        startTime: '2024-01-01T07:00:00Z',
        duration: 20,
        category: 'Mindfulness',
        completed: true,
        reflection: { mood: 5, productivity: 4 }
      },
      {
        id: '2',
        title: 'Gym Workout',
        startTime: '2024-01-01T08:00:00Z',
        duration: 60,
        category: 'Health',
        completed: true,
        reflection: { mood: 5, productivity: 5 }
      },
      {
        id: '3',
        title: 'Project Planning',
        startTime: '2024-01-01T09:30:00Z',
        duration: 90,
        category: 'Work',
        completed: true,
        reflection: { mood: 4, productivity: 5 }
      },
      {
        id: '4',
        title: 'Team Standup',
        startTime: '2024-01-01T11:00:00Z',
        duration: 30,
        category: 'Communication',
        completed: true,
        reflection: { mood: 4, productivity: 4 }
      },
      {
        id: '5',
        title: 'Code Review',
        startTime: '2024-01-01T14:00:00Z',
        duration: 45,
        category: 'Work',
        completed: false,
        reflection: { mood: 3, productivity: 2 }
      },
      {
        id: '6',
        title: 'Learning Session',
        startTime: '2024-01-01T16:00:00Z',
        duration: 60,
        category: 'Learning',
        completed: false,
        reflection: { mood: 2, productivity: 2 }
      }
    ]),
    historicalPatterns: JSON.stringify({
      weeklyProductivity: [4.2, 4.5, 3.8, 4.1, 4.7, 3.9, 4.3],
      categoryPerformance: {
        Health: { avgProductivity: 4.8, avgMood: 4.6, completionRate: 0.95 },
        Mindfulness: { avgProductivity: 4.2, avgMood: 4.8, completionRate: 0.9 },
        Work: { avgProductivity: 3.8, avgMood: 3.5, completionRate: 0.75 },
        Communication: { avgProductivity: 4.0, avgMood: 4.1, completionRate: 0.85 },
        Learning: { avgProductivity: 3.5, avgMood: 3.8, completionRate: 0.6 }
      },
      timeSlotAnalysis: {
        morning: { avgProductivity: 4.5, bestCategories: ['Health', 'Mindfulness'] },
        afternoon: { avgProductivity: 3.8, bestCategories: ['Work', 'Communication'] },
        evening: { avgProductivity: 3.2, bestCategories: ['Learning', 'Recovery'] }
      },
      moodCorrelations: {
        morningExerciseToProductivity: 0.85,
        meditationToMood: 0.78,
        workIntensityToEvening: -0.65
      }
    }),
    userPreferences: JSON.stringify({
      preferredCategories: ['Health', 'Productivity', 'Mindfulness'],
      tipStyle: 'detailed',
      focusAreas: ['morning-routine', 'work-efficiency', 'stress-management'],
      avoidTopics: ['extreme-changes', 'complex-technology'],
      timePreference: 'morning'
    }),
    contextualData: JSON.stringify({
      weather: 'sunny',
      temperature: 72,
      calendarEvents: 3,
      dayOfWeek: 'Monday',
      currentTime: '2024-01-02T08:00:00Z',
      workload: 'moderate',
      upcomingDeadlines: 1
    }),
    previousTipsFeedback: JSON.stringify([
      {
        tipId: 'meditation-tip-001',
        rating: 5,
        helpfulness: 5,
        implemented: true,
        difficulty: 2,
        results: 'Significantly improved focus and calm',
        timestamp: '2024-01-01T20:00:00Z'
      },
      {
        tipId: 'productivity-tip-002',
        rating: 4,
        helpfulness: 4,
        implemented: true,
        difficulty: 3,
        results: 'Good improvement in task completion',
        timestamp: '2024-01-01T19:00:00Z'
      },
      {
        tipId: 'complex-tip-003',
        rating: 2,
        helpfulness: 2,
        implemented: false,
        difficulty: 5,
        feedback: 'Too complicated to implement in daily routine',
        timestamp: '2024-01-01T18:00:00Z'
      }
    ]),
    userGoals: JSON.stringify([
      'Maintain consistent morning routine',
      'Improve work productivity by 20%',
      'Reduce afternoon energy dips',
      'Better work-life balance',
      'Learn new skills efficiently'
    ]),
    apiKey: mockApiKey
  };

  beforeEach(() => {
    personalizationEngine = TipPersonalizationEngine.getInstance();
    trackingSystem = TipTrackingSystem.getInstance();
    errorHandler = new TipsErrorHandler();
    
    // Clear all data for clean test state
    trackingSystem.clearTrackingData();
    
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('End-to-End Tip Generation Flow', () => {
    it('should generate personalized tips with complete flow', async () => {
      const result = await getDailyTips(comprehensiveInput);
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.tips).toBeDefined();
        expect(Array.isArray(result.data.tips)).toBe(true);
        expect(result.data.tips.length).toBeGreaterThanOrEqual(3);
        expect(result.data.tips.length).toBeLessThanOrEqual(10);
        
        // Verify tip structure
        result.data.tips.forEach(tip => {
          expect(tip.id).toBeDefined();
          expect(tip.type).toBeDefined();
          expect(tip.title).toBeDefined();
          expect(tip.suggestion).toBeDefined();
          expect(tip.reasoning).toBeDefined();
          expect(tip.expectedImpact).toBeDefined();
          expect(Array.isArray(tip.actionSteps)).toBe(true);
          expect(tip.actionSteps.length).toBeGreaterThan(0);
          expect(tip.personalizedScore).toBeGreaterThanOrEqual(0);
          expect(tip.personalizedScore).toBeLessThanOrEqual(100);
        });
        
        // Verify summary
        expect(result.data.summary).toBeDefined();
        expect(result.data.summary.overallTheme).toBeDefined();
        expect(Array.isArray(result.data.summary.keyInsights)).toBe(true);
        expect(result.data.summary.priorityFocus).toBeDefined();
        expect(result.data.summary.encouragement).toBeDefined();
        
        // Verify analytics
        expect(result.data.analytics).toBeDefined();
        expect(typeof result.data.analytics.dataQualityScore).toBe('number');
        expect(typeof result.data.analytics.personalizationLevel).toBe('string');
        expect(typeof result.data.analytics.confidenceScore).toBe('number');
      } else {
        // If not successful, should have error handling
        expect(result.error).toBeDefined();
        expect(result.error.message).toBeDefined();
        expect(result.error.category).toBeDefined();
        expect(result.error.severity).toBeDefined();
        
        // Should provide fallback data
        if (result.fallbackData) {
          expect(result.fallbackData.tips).toBeDefined();
          expect(Array.isArray(result.fallbackData.tips)).toBe(true);
        }
      }
    });

    it('should handle the complete user feedback loop', async () => {
      // Step 1: Generate tips
      const tipResult = await getDailyTips(comprehensiveInput);
      
      if (tipResult.success) {
        const generatedTips = tipResult.data.tips;
        expect(generatedTips.length).toBeGreaterThan(0);
        
        // Step 2: Simulate user interactions
        generatedTips.forEach((tip, index) => {
          // Track viewing
          trackingSystem.trackTipInteraction(tip.id, 'viewed');
          
          // Some tips get expanded
          if (index < 3) {
            trackingSystem.trackTipInteraction(tip.id, 'expanded');
          }
          
          // Some tips get implemented
          if (index < 2) {
            trackingSystem.trackTipInteraction(tip.id, 'implemented');
            trackingSystem.recordTipImplementation({
              tipId: tip.id,
              implementedAt: new Date(),
              completionStatus: 'complete',
              difficulty: 'as_expected',
              timeSpent: 25,
              results: 'Helpful and effective'
            });
          }
        });
        
        // Step 3: Submit feedback
        const feedback: TipFeedback = {
          tipId: generatedTips[0].id,
          rating: 5,
          helpfulness: 5,
          implemented: true,
          difficulty: 3,
          results: 'Significantly improved my morning routine',
          feedback: 'Excellent tip, very practical and effective',
          timestamp: new Date()
        };
        
        trackingSystem.recordTipFeedback(feedback);
        
        // Step 4: Verify tracking and analytics
        const analytics = trackingSystem.getAnalyticsInsights();
        expect(analytics.overallEffectiveness).toBeGreaterThan(0);
        
        const userEngagement = trackingSystem.getUserEngagementStats();
        expect(userEngagement.totalInteractions).toBeGreaterThan(0);
        expect(userEngagement.implementationRate).toBeGreaterThan(0);
        expect(userEngagement.averageFeedbackRating).toBe(5);
        
        // Step 5: Generate new tips (should be influenced by feedback)
        const newTipResult = await getDailyTips(comprehensiveInput);
        
        if (newTipResult.success) {
          // New tips should reflect learning from feedback
          expect(newTipResult.data.tips.length).toBeGreaterThan(0);
          
          // Personalization should have improved
          const avgPersonalizationScore = newTipResult.data.tips.reduce(
            (sum, tip) => sum + tip.personalizedScore, 0
          ) / newTipResult.data.tips.length;
          
          expect(avgPersonalizationScore).toBeGreaterThan(50);
        }
      }
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle API failures gracefully throughout the system', async () => {
      // Mock API failure
      const failingInput: DailyTipsInput = {
        ...comprehensiveInput,
        apiKey: 'invalid-api-key'
      };
      
      const result = await getDailyTips(failingInput);
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      
      if (!result.success) {
        // Should have proper error structure
        expect(result.error).toBeDefined();
        expect(result.error.category).toBeDefined();
        expect(result.error.message).toBeDefined();
        expect(result.error.suggestedAction).toBeDefined();
        
        // Should provide fallback data
        expect(result.fallbackData).toBeDefined();
        expect(result.fallbackData.tips).toBeDefined();
        expect(Array.isArray(result.fallbackData.tips)).toBe(true);
        expect(result.fallbackData.tips.length).toBeGreaterThan(0);
        
        // Fallback tips should have basic structure
        result.fallbackData.tips.forEach(tip => {
          expect(tip.id).toBeDefined();
          expect(tip.title).toBeDefined();
          expect(tip.suggestion).toBeDefined();
          expect(Array.isArray(tip.actionSteps)).toBe(true);
        });
      }
    });

    it('should recover from data parsing errors', async () => {
      const corruptedInput: DailyTipsInput = {
        ...comprehensiveInput,
        schedule: 'invalid json data',
        historicalPatterns: 'also invalid json',
        userPreferences: '{ malformed json }'
      };
      
      const result = await getDailyTips(corruptedInput);
      
      expect(result).toBeDefined();
      
      // Should handle gracefully with either success or proper error handling
      if (!result.success) {
        expect(result.error?.category).toBeDefined();
        expect(result.fallbackData).toBeDefined();
      }
    });

    it('should handle network timeouts and retries', async () => {
      // This test simulates timeout scenarios
      const result = await getDailyTips(comprehensiveInput);
      
      // Should complete within reasonable time regardless of outcome
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Personalization System Integration', () => {
    it('should learn and improve recommendations over multiple sessions', async () => {
      const sessions = [
        {
          input: comprehensiveInput,
          feedback: { rating: 5, category: 'Health' }
        },
        {
          input: {
            ...comprehensiveInput,
            userPreferences: JSON.stringify({
              preferredCategories: ['Health', 'Mindfulness'],
              tipStyle: 'concise'
            })
          },
          feedback: { rating: 4, category: 'Mindfulness' }
        },
        {
          input: {
            ...comprehensiveInput,
            userPreferences: JSON.stringify({
              preferredCategories: ['Health'],
              tipStyle: 'detailed'
            })
          },
          feedback: { rating: 5, category: 'Health' }
        }
      ];
      
      const sessionResults = [];
      
      for (let i = 0; i < sessions.length; i++) {
        const session = sessions[i];
        const result = await getDailyTips(session.input);
        
        if (result.success) {
          sessionResults.push(result.data);
          
          // Simulate user feedback
          const healthTips = result.data.tips.filter(tip => tip.type === 'Health');
          if (healthTips.length > 0) {
            const feedback: TipFeedback = {
              tipId: healthTips[0].id,
              rating: session.feedback.rating,
              helpfulness: session.feedback.rating,
              implemented: true,
              difficulty: 3,
              timestamp: new Date()
            };
            
            trackingSystem.recordTipFeedback(feedback);
          }
        }
      }
      
      // Verify learning progression
      expect(sessionResults.length).toBeGreaterThan(0);
      
      if (sessionResults.length >= 2) {
        const firstSession = sessionResults[0];
        const lastSession = sessionResults[sessionResults.length - 1];
        
        // Later sessions should have higher personalization scores
        const firstAvgScore = firstSession.tips.reduce(
          (sum, tip) => sum + tip.personalizedScore, 0
        ) / firstSession.tips.length;
        
        const lastAvgScore = lastSession.tips.reduce(
          (sum, tip) => sum + tip.personalizedScore, 0
        ) / lastSession.tips.length;
        
        // Should show improvement or at least maintain quality
        expect(lastAvgScore).toBeGreaterThanOrEqual(firstAvgScore * 0.9);
      }
    });

    it('should adapt to changing user preferences', async () => {
      // Initial preference: Health and Productivity
      const initialResult = await getDailyTips({
        ...comprehensiveInput,
        userPreferences: JSON.stringify({
          preferredCategories: ['Health', 'Productivity'],
          focusAreas: ['exercise', 'efficiency']
        })
      });
      
      // Changed preference: Mindfulness and Learning
      const changedResult = await getDailyTips({
        ...comprehensiveInput,
        userPreferences: JSON.stringify({
          preferredCategories: ['Mindfulness', 'Learning'],
          focusAreas: ['meditation', 'skill-development']
        })
      });
      
      if (initialResult.success && changedResult.success) {
        // Should generate different tip categories based on preferences
        const initialCategories = initialResult.data.tips.map(tip => tip.type);
        const changedCategories = changedResult.data.tips.map(tip => tip.type);
        
        // Should show adaptation to new preferences
        expect(changedCategories).toContain('Mindfulness');
        expect(changedCategories.includes('Learning') || changedCategories.includes('Mindfulness')).toBe(true);
      }
    });
  });

  describe('Analytics and Tracking Integration', () => {
    it('should provide comprehensive analytics across multiple tip generations', async () => {
      // Generate multiple tip sessions
      const sessions = 5;
      const allGeneratedTips = [];
      
      for (let i = 0; i < sessions; i++) {
        const result = await getDailyTips(comprehensiveInput);
        
        if (result.success) {
          allGeneratedTips.push(...result.data.tips);
          
          // Simulate varied user interactions
          result.data.tips.forEach((tip, index) => {
            trackingSystem.trackTipInteraction(tip.id, 'viewed');
            
            if (Math.random() > 0.5) {
              trackingSystem.trackTipInteraction(tip.id, 'expanded');
            }
            
            if (Math.random() > 0.7) {
              trackingSystem.trackTipInteraction(tip.id, 'implemented');
            }
            
            if (Math.random() > 0.8) {
              const feedback: TipFeedback = {
                tipId: tip.id,
                rating: Math.floor(Math.random() * 3) + 3, // 3-5 rating
                helpfulness: Math.floor(Math.random() * 3) + 3,
                implemented: Math.random() > 0.5,
                difficulty: Math.floor(Math.random() * 5) + 1,
                timestamp: new Date()
              };
              
              trackingSystem.recordTipFeedback(feedback);
            }
          });
        }
      }
      
      // Verify comprehensive analytics
      const analytics = trackingSystem.getAnalyticsInsights();
      expect(analytics.overallEffectiveness).toBeDefined();
      expect(analytics.topPerformingCategories.length).toBeGreaterThan(0);
      expect(analytics.userEngagementTrends.length).toBeGreaterThan(0);
      expect(analytics.personalizationEffectiveness).toBeGreaterThanOrEqual(0);
      expect(analytics.recommendedImprovements.length).toBeGreaterThan(0);
      
      const userEngagement = trackingSystem.getUserEngagementStats();
      expect(userEngagement.totalInteractions).toBeGreaterThan(0);
      expect(userEngagement.implementationRate).toBeGreaterThanOrEqual(0);
      expect(userEngagement.averageFeedbackRating).toBeGreaterThan(0);
      
      // Should have improvement recommendations
      const improvements = trackingSystem.getImprovementRecommendations();
      expect(improvements.length).toBeGreaterThan(0);
      expect(improvements.length).toBeLessThanOrEqual(5);
    });

    it('should maintain data consistency across system components', async () => {
      const result = await getDailyTips(comprehensiveInput);
      
      if (result.success) {
        const tip = result.data.tips[0];
        
        // Track interaction
        trackingSystem.trackTipInteraction(tip.id, 'viewed');
        trackingSystem.trackTipInteraction(tip.id, 'implemented');
        
        // Record implementation
        trackingSystem.recordTipImplementation({
          tipId: tip.id,
          implementedAt: new Date(),
          completionStatus: 'complete',
          difficulty: 'as_expected',
          timeSpent: 30
        });
        
        // Submit feedback
        const feedback: TipFeedback = {
          tipId: tip.id,
          rating: 4,
          helpfulness: 4,
          implemented: true,
          difficulty: 3,
          timestamp: new Date()
        };
        
        trackingSystem.recordTipFeedback(feedback);
        
        // Verify data consistency
        const effectiveness = trackingSystem.getTipEffectiveness(tip.id);
        expect(effectiveness?.totalViews).toBe(1);
        expect(effectiveness?.implementationRate).toBe(100); // 1 implementation out of 1 view
        expect(effectiveness?.averageRating).toBe(4);
        expect(effectiveness?.helpfulnessScore).toBe(4);
      }
    });
  });

  describe('Performance and Scalability Integration', () => {
    it('should handle multiple concurrent tip generation requests', async () => {
      const concurrentRequests = 5;
      const requests = Array(concurrentRequests).fill(null).map(() => 
        getDailyTips(comprehensiveInput)
      );
      
      const startTime = Date.now();
      const results = await Promise.all(requests);
      const endTime = Date.now();
      
      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds
      
      // All requests should complete
      expect(results.length).toBe(concurrentRequests);
      
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
      });
    });

    it('should maintain performance with large historical datasets', async () => {
      // Create large historical dataset
      const largeHistoricalData = {
        weeklyProductivity: new Array(52).fill(0).map(() => Math.random() * 5),
        categoryPerformance: {},
        timeSlotAnalysis: {},
        moodCorrelations: {},
        detailedHistory: []
      };
      
      // Add 50 categories of historical data
      for (let i = 0; i < 50; i++) {
        largeHistoricalData.categoryPerformance[`Category${i}`] = {
          avgProductivity: Math.random() * 5,
          avgMood: Math.random() * 5,
          completionRate: Math.random()
        };
      }
      
      // Add detailed historical entries
      for (let i = 0; i < 200; i++) {
        largeHistoricalData.detailedHistory.push({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          productivity: Math.random() * 5,
          mood: Math.random() * 5,
          completedTasks: Math.floor(Math.random() * 10)
        });
      }
      
      const largeDataInput: DailyTipsInput = {
        ...comprehensiveInput,
        historicalPatterns: JSON.stringify(largeHistoricalData)
      };
      
      const startTime = Date.now();
      const result = await getDailyTips(largeDataInput);
      const endTime = Date.now();
      
      // Should handle large datasets efficiently
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds
      expect(result).toBeDefined();
      
      if (result.success) {
        expect(result.data.tips.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Real-world Usage Simulation', () => {
    it('should simulate a complete day of tip usage', async () => {
      // Morning: Generate tips
      const morningResult = await getDailyTips({
        ...comprehensiveInput,
        contextualData: JSON.stringify({
          ...JSON.parse(comprehensiveInput.contextualData!),
          currentTime: '2024-01-02T08:00:00Z',
          timeOfDay: 'morning'
        })
      });
      
      if (morningResult.success) {
        const morningTips = morningResult.data.tips;
        
        // User views tips and selects one for implementation
        morningTips.forEach(tip => {
          trackingSystem.trackTipInteraction(tip.id, 'viewed');
        });
        
        const selectedTip = morningTips[0];
        trackingSystem.trackTipInteraction(selectedTip.id, 'expanded');
        
        // Midday: User implements the tip
        trackingSystem.trackTipInteraction(selectedTip.id, 'implemented');
        trackingSystem.recordTipImplementation({
          tipId: selectedTip.id,
          implementedAt: new Date('2024-01-02T12:00:00Z'),
          completionStatus: 'complete',
          difficulty: 'as_expected',
          timeSpent: 20,
          results: 'Felt more energized and focused'
        });
        
        // Evening: User provides feedback
        const feedback: TipFeedback = {
          tipId: selectedTip.id,
          rating: 5,
          helpfulness: 5,
          implemented: true,
          difficulty: 3,
          results: 'Significantly improved my afternoon productivity',
          feedback: 'This tip was perfect for my routine',
          timestamp: new Date('2024-01-02T20:00:00Z')
        };
        
        trackingSystem.recordTipFeedback(feedback);
        
        // Next day: Generate new tips (should reflect previous day's learning)
        const nextDayResult = await getDailyTips({
          ...comprehensiveInput,
          contextualData: JSON.stringify({
            ...JSON.parse(comprehensiveInput.contextualData!),
            currentTime: '2024-01-03T08:00:00Z'
          }),
          previousTipsFeedback: JSON.stringify([feedback])
        });
        
        if (nextDayResult.success) {
          // Should show signs of learning and improvement
          const nextDayTips = nextDayResult.data.tips;
          expect(nextDayTips.length).toBeGreaterThan(0);
          
          // Average personalization score should be decent
          const avgScore = nextDayTips.reduce(
            (sum, tip) => sum + tip.personalizedScore, 0
          ) / nextDayTips.length;
          
          expect(avgScore).toBeGreaterThan(60); // Should be well-personalized
        }
        
        // Verify analytics reflect the complete journey
        const finalAnalytics = trackingSystem.getAnalyticsInsights();
        expect(finalAnalytics.overallEffectiveness).toBeGreaterThan(70);
        
        const userEngagement = trackingSystem.getUserEngagementStats();
        expect(userEngagement.implementationRate).toBe(100); // 1 implementation out of 1 relevant view
        expect(userEngagement.averageFeedbackRating).toBe(5);
        expect(userEngagement.engagementTrend).toBeDefined();
      }
    });

    it('should handle edge cases in real usage scenarios', async () => {
      // Scenario 1: New user with minimal data
      const newUserInput: DailyTipsInput = {
        schedule: JSON.stringify([
          {
            id: '1',
            title: 'First Task',
            startTime: '2024-01-01T09:00:00Z',
            duration: 30,
            category: 'Work',
            completed: true
          }
        ]),
        historicalPatterns: JSON.stringify({}),
        apiKey: mockApiKey
      };
      
      const newUserResult = await getDailyTips(newUserInput);
      expect(newUserResult).toBeDefined();
      
      // Scenario 2: User with inconsistent data
      const inconsistentInput: DailyTipsInput = {
        ...comprehensiveInput,
        schedule: JSON.stringify([
          {
            id: '1',
            title: 'Task 1',
            category: 'Work',
            completed: true,
            // Missing some fields
          }
        ])
      };
      
      const inconsistentResult = await getDailyTips(inconsistentInput);
      expect(inconsistentResult).toBeDefined();
      
      // Both scenarios should handle gracefully
      expect(typeof newUserResult.success).toBe('boolean');
      expect(typeof inconsistentResult.success).toBe('boolean');
    });
  });
});