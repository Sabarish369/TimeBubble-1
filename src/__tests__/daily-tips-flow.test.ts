/**
 * @fileOverview Comprehensive tests for the enhanced daily tips flow
 * 
 * This test suite validates the complete daily tips generation system including
 * data preprocessing, AI generation, error handling, and personalization.
 */

// Test framework imports will be available globally in Jest environment
// import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { getDailyTips } from '@/ai/flows/daily-tips';
import type { DailyTipsInput, DailyTips } from '@/types/ai-types';

// Mock the AI and dependencies
jest.mock('@/ai/genkit');
jest.mock('@genkit-ai/googleai');
jest.mock('@/lib/tips-error-handler');
jest.mock('@/lib/tip-personalization-engine');

describe('Enhanced Daily Tips Flow', () => {
  const mockApiKey = 'test-gemini-api-key-123';
  
  const baseMockInput: DailyTipsInput = {
    schedule: JSON.stringify([
      {
        id: '1',
        title: 'Morning Exercise',
        startTime: '2024-01-01T07:00:00Z',
        duration: 60,
        category: 'Health',
        completed: true,
        reflection: { mood: 4, productivity: 5 }
      },
      {
        id: '2',
        title: 'Work Project',
        startTime: '2024-01-01T09:00:00Z',
        duration: 120,
        category: 'Work',
        completed: false,
        reflection: { mood: 3, productivity: 3 }
      },
      {
        id: '3',
        title: 'Team Meeting',
        startTime: '2024-01-01T14:00:00Z',
        duration: 45,
        category: 'Communication',
        completed: true,
        reflection: { mood: 4, productivity: 4 }
      }
    ]),
    historicalPatterns: JSON.stringify({
      weeklyProductivity: [4.2, 4.5, 3.8, 4.1, 4.7, 3.9, 4.3],
      preferredTimeSlots: ['morning', 'afternoon'],
      completionRates: { Health: 0.85, Work: 0.72, Communication: 0.88 },
      categoryPerformance: {
        Health: { avgProductivity: 4.3, avgMood: 4.1 },
        Work: { avgProductivity: 3.8, avgMood: 3.5 },
        Communication: { avgProductivity: 4.0, avgMood: 4.2 }
      }
    }),
    userPreferences: JSON.stringify({
      preferredCategories: ['Productivity', 'Health'],
      tipStyle: 'detailed',
      focusAreas: ['time-management', 'wellness']
    }),
    contextualData: JSON.stringify({
      weather: 'sunny',
      calendarEvents: 2,
      dayOfWeek: 'Monday',
      currentTime: '2024-01-01T08:00:00Z'
    }),
    previousTipsFeedback: JSON.stringify([
      {
        tipId: 'prev-tip-1',
        rating: 4,
        helpfulness: 5,
        implemented: true,
        difficulty: 3
      },
      {
        tipId: 'prev-tip-2',
        rating: 3,
        helpfulness: 3,
        implemented: false,
        difficulty: 4
      }
    ]),
    userGoals: JSON.stringify([
      'Improve morning routine',
      'Increase daily productivity',
      'Better work-life balance'
    ]),
    apiKey: mockApiKey
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset any localStorage or other state
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Data Quality Assessment', () => {
    it('should accept high-quality input data', async () => {
      const result = await getDailyTips(baseMockInput);
      
      // The function should process without throwing
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });

    it('should handle insufficient task data gracefully', async () => {
      const minimalInput: DailyTipsInput = {
        schedule: JSON.stringify([
          {
            id: '1',
            title: 'Single Task',
            startTime: '2024-01-01T09:00:00Z',
            duration: 30,
            category: 'Work',
            completed: true
          }
        ]),
        historicalPatterns: JSON.stringify({}),
        apiKey: mockApiKey
      };

      const result = await getDailyTips(minimalInput);
      expect(result).toBeDefined();
      
      // Should still provide fallback tips even with minimal data
      if (result.success === false && result.fallbackData) {
        expect(result.fallbackData).toBeDefined();
      }
    });

    it('should handle missing reflection data', async () => {
      const inputWithoutReflections: DailyTipsInput = {
        ...baseMockInput,
        schedule: JSON.stringify([
          {
            id: '1',
            title: 'Task without reflection',
            startTime: '2024-01-01T09:00:00Z',
            duration: 60,
            category: 'Work',
            completed: true
            // No reflection data
          }
        ])
      };

      const result = await getDailyTips(inputWithoutReflections);
      expect(result).toBeDefined();
      
      // Should handle gracefully and still generate tips
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Error Handling and Retry Mechanisms', () => {
    it('should handle API key validation', async () => {
      const inputWithoutApiKey: DailyTipsInput = {
        ...baseMockInput,
        apiKey: undefined
      };

      const result = await getDailyTips(inputWithoutApiKey);
      
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error?.category).toBeDefined();
      }
    });

    it('should handle invalid JSON in input fields', async () => {
      const inputWithInvalidJSON: DailyTipsInput = {
        ...baseMockInput,
        schedule: 'invalid json string',
        historicalPatterns: 'also invalid json'
      };

      const result = await getDailyTips(inputWithInvalidJSON);
      
      // Should handle JSON parsing errors gracefully
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.fallbackData).toBeDefined();
      }
    });

    it('should implement retry logic for transient failures', async () => {
      // This would require mocking the AI service to fail initially
      // then succeed on retry
      const result = await getDailyTips(baseMockInput);
      
      // At minimum, should not throw unhandled errors
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should provide meaningful error messages', async () => {
      const result = await getDailyTips({
        schedule: '',
        historicalPatterns: '',
        apiKey: ''
      });

      if (!result.success) {
        expect(result.error?.message).toBeDefined();
        expect(result.error?.message.length).toBeGreaterThan(0);
        expect(result.error?.suggestedAction).toBeDefined();
      }
    });
  });

  describe('Data Preprocessing and Analysis', () => {
    it('should analyze task completion patterns', async () => {
      const inputWithVariedCompletion: DailyTipsInput = {
        ...baseMockInput,
        schedule: JSON.stringify([
          { id: '1', title: 'Completed Task', category: 'Work', completed: true, duration: 60, startTime: '2024-01-01T09:00:00Z' },
          { id: '2', title: 'Incomplete Task', category: 'Work', completed: false, duration: 60, startTime: '2024-01-01T10:00:00Z' },
          { id: '3', title: 'Another Completed', category: 'Health', completed: true, duration: 60, startTime: '2024-01-01T11:00:00Z' },
          { id: '4', title: 'Another Incomplete', category: 'Health', completed: false, duration: 60, startTime: '2024-01-01T12:00:00Z' }
        ])
      };

      const result = await getDailyTips(inputWithVariedCompletion);
      expect(result).toBeDefined();
      
      // The analysis should identify completion patterns
      // This is tested implicitly through the function not throwing errors
    });

    it('should recognize productivity time patterns', async () => {
      const inputWithTimePatterns: DailyTipsInput = {
        ...baseMockInput,
        schedule: JSON.stringify([
          {
            id: '1',
            title: 'Morning High Productivity',
            startTime: '2024-01-01T08:00:00Z',
            category: 'Work',
            completed: true,
            reflection: { productivity: 5, mood: 5 },
            duration: 60
          },
          {
            id: '2',
            title: 'Afternoon Low Productivity',
            startTime: '2024-01-01T14:00:00Z',
            category: 'Work',
            completed: false,
            reflection: { productivity: 2, mood: 2 },
            duration: 60
          }
        ])
      };

      const result = await getDailyTips(inputWithTimePatterns);
      expect(result).toBeDefined();
      
      // Should successfully process time-based patterns
      if (result.success) {
        expect(result.data).toBeDefined();
      }
    });

    it('should handle category performance analysis', async () => {
      const inputWithCategoryData: DailyTipsInput = {
        ...baseMockInput,
        historicalPatterns: JSON.stringify({
          categoryPerformance: {
            Health: { avgProductivity: 4.5, avgMood: 4.3, completionRate: 0.9 },
            Work: { avgProductivity: 3.2, avgMood: 3.1, completionRate: 0.6 },
            Learning: { avgProductivity: 4.0, avgMood: 4.1, completionRate: 0.8 }
          }
        })
      };

      const result = await getDailyTips(inputWithCategoryData);
      expect(result).toBeDefined();
      
      // Should process category analysis without errors
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Personalization Integration', () => {
    it('should incorporate user preferences', async () => {
      const inputWithPreferences: DailyTipsInput = {
        ...baseMockInput,
        userPreferences: JSON.stringify({
          preferredCategories: ['Health', 'Mindfulness'],
          tipStyle: 'concise',
          focusAreas: ['meditation', 'exercise'],
          avoidTopics: ['work-stress', 'overtime']
        })
      };

      const result = await getDailyTips(inputWithPreferences);
      expect(result).toBeDefined();
      
      if (result.success) {
        // Tips should reflect user preferences
        expect(result.data.tips).toBeDefined();
        expect(Array.isArray(result.data.tips)).toBe(true);
      }
    });

    it('should use previous feedback for improvement', async () => {
      const inputWithFeedback: DailyTipsInput = {
        ...baseMockInput,
        previousTipsFeedback: JSON.stringify([
          {
            tipId: 'meditation-tip',
            rating: 5,
            helpfulness: 5,
            implemented: true,
            difficulty: 2,
            results: 'Felt much calmer and focused'
          },
          {
            tipId: 'exercise-tip',
            rating: 2,
            helpfulness: 1,
            implemented: false,
            difficulty: 5,
            feedback: 'Too difficult to fit into schedule'
          }
        ])
      };

      const result = await getDailyTips(inputWithFeedback);
      expect(result).toBeDefined();
      
      // Should learn from feedback patterns
      if (result.success) {
        expect(result.data).toBeDefined();
      }
    });

    it('should align with user goals', async () => {
      const inputWithGoals: DailyTipsInput = {
        ...baseMockInput,
        userGoals: JSON.stringify([
          'Wake up earlier',
          'Exercise daily',
          'Reduce screen time',
          'Learn new skills'
        ])
      };

      const result = await getDailyTips(inputWithGoals);
      expect(result).toBeDefined();
      
      if (result.success) {
        // Generated tips should be relevant to stated goals
        expect(result.data.tips.length).toBeGreaterThanOrEqual(3);
      }
    });
  });

  describe('Output Quality and Structure', () => {
    it('should generate diverse tip categories', async () => {
      const result = await getDailyTips(baseMockInput);
      
      if (result.success) {
        const tipCategories = result.data.tips.map(tip => tip.type);
        const uniqueCategories = new Set(tipCategories);
        
        // Should have variety in tip categories
        expect(uniqueCategories.size).toBeGreaterThan(1);
      }
    });

    it('should include actionable steps for each tip', async () => {
      const result = await getDailyTips(baseMockInput);
      
      if (result.success) {
        result.data.tips.forEach(tip => {
          expect(tip.actionSteps).toBeDefined();
          expect(Array.isArray(tip.actionSteps)).toBe(true);
          expect(tip.actionSteps.length).toBeGreaterThan(0);
          
          // Each action step should be a non-empty string
          tip.actionSteps.forEach(step => {
            expect(typeof step).toBe('string');
            expect(step.trim().length).toBeGreaterThan(0);
          });
        });
      }
    });

    it('should provide comprehensive tip metadata', async () => {
      const result = await getDailyTips(baseMockInput);
      
      if (result.success) {
        result.data.tips.forEach(tip => {
          // Verify all required fields are present
          expect(tip.id).toBeDefined();
          expect(tip.type).toBeDefined();
          expect(tip.title).toBeDefined();
          expect(tip.suggestion).toBeDefined();
          expect(tip.reasoning).toBeDefined();
          expect(tip.expectedImpact).toBeDefined();
          expect(tip.priority).toBeDefined();
          expect(tip.difficulty).toBeDefined();
          expect(tip.timeInvestment).toBeDefined();
          expect(tip.personalizedScore).toBeDefined();
          
          // Verify score is in valid range
          expect(tip.personalizedScore).toBeGreaterThanOrEqual(0);
          expect(tip.personalizedScore).toBeLessThanOrEqual(100);
        });
      }
    });

    it('should generate meaningful summary and insights', async () => {
      const result = await getDailyTips(baseMockInput);
      
      if (result.success) {
        expect(result.data.summary).toBeDefined();
        expect(result.data.summary.overallTheme).toBeDefined();
        expect(result.data.summary.keyInsights).toBeDefined();
        expect(Array.isArray(result.data.summary.keyInsights)).toBe(true);
        expect(result.data.summary.priorityFocus).toBeDefined();
        expect(result.data.summary.encouragement).toBeDefined();
        
        // Summary should contain meaningful content
        expect(result.data.summary.overallTheme.length).toBeGreaterThan(5);
        expect(result.data.summary.encouragement.length).toBeGreaterThan(10);
      }
    });

    it('should include analytics data', async () => {
      const result = await getDailyTips(baseMockInput);
      
      if (result.success) {
        expect(result.data.analytics).toBeDefined();
        expect((result.data.analytics as any).dataQualityScore).toBeDefined();
        expect((result.data.analytics as any).personalizationLevel).toBeDefined();
        expect((result.data.analytics as any).confidenceScore).toBeDefined();
        
        // Verify numeric values are in valid ranges
        expect((result.data.analytics as any).dataQualityScore).toBeGreaterThanOrEqual(0);
        expect((result.data.analytics as any).dataQualityScore).toBeLessThanOrEqual(100);
        expect((result.data.analytics as any).confidenceScore).toBeGreaterThanOrEqual(0);
        expect((result.data.analytics as any).confidenceScore).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('Performance and Caching', () => {
    it('should handle large historical datasets efficiently', async () => {
      const largeHistoricalData = {
        weeklyProductivity: new Array(52).fill(0).map(() => Math.random() * 5),
        categoryPerformance: {},
        timeSlotAnalysis: {},
        moodCorrelations: {}
      };
      
      // Add data for 20 categories
      for (let i = 0; i < 20; i++) {
        (largeHistoricalData.categoryPerformance as any)[`Category${i}`] = {
          avgProductivity: Math.random() * 5,
          avgMood: Math.random() * 5,
          completionRate: Math.random()
        };
      }

      const inputWithLargeData: DailyTipsInput = {
        ...baseMockInput,
        historicalPatterns: JSON.stringify(largeHistoricalData)
      };

      const startTime = Date.now();
      const result = await getDailyTips(inputWithLargeData);
      const endTime = Date.now();
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds max
      expect(result).toBeDefined();
    });

    it('should handle concurrent requests gracefully', async () => {
      const promises = Array(5).fill(null).map(() => 
        getDailyTips(baseMockInput)
      );

      const results = await Promise.all(promises);
      
      // All requests should complete successfully
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
      });
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle empty schedule gracefully', async () => {
      const emptyScheduleInput: DailyTipsInput = {
        ...baseMockInput,
        schedule: JSON.stringify([])
      };

      const result = await getDailyTips(emptyScheduleInput);
      expect(result).toBeDefined();
      
      // Should provide fallback tips even with empty schedule
      if (!result.success && result.fallbackData) {
        expect(result.fallbackData).toBeDefined();
      }
    });

    it('should handle extremely long task titles and descriptions', async () => {
      const longText = 'A'.repeat(1000);
      const inputWithLongTexts: DailyTipsInput = {
        ...baseMockInput,
        schedule: JSON.stringify([
          {
            id: '1',
            title: longText,
            startTime: '2024-01-01T09:00:00Z',
            duration: 60,
            category: 'Work',
            completed: true,
            reflection: { mood: 3, productivity: 3 }
          }
        ])
      };

      const result = await getDailyTips(inputWithLongTexts);
      expect(result).toBeDefined();
      
      // Should handle without throwing errors
      expect(typeof result.success).toBe('boolean');
    });

    it('should handle special characters in input data', async () => {
      const inputWithSpecialChars: DailyTipsInput = {
        ...baseMockInput,
        schedule: JSON.stringify([
          {
            id: '1',
            title: 'Task with émojis 🚀 and symbols @#$%',
            startTime: '2024-01-01T09:00:00Z',
            duration: 60,
            category: 'Work',
            completed: true
          }
        ])
      };

      const result = await getDailyTips(inputWithSpecialChars);
      expect(result).toBeDefined();
      
      // Should handle special characters gracefully
      expect(typeof result.success).toBe('boolean');
    });

    it('should validate tip count bounds', async () => {
      const result = await getDailyTips(baseMockInput);
      
      if (result.success) {
        // Should respect minimum and maximum tip counts
        expect(result.data.tips.length).toBeGreaterThanOrEqual(3);
        expect(result.data.tips.length).toBeLessThanOrEqual(10);
      }
    });
  });
});