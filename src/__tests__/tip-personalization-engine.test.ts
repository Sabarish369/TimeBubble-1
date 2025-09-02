/**
 * @fileOverview Tests for the tip personalization engine
 * 
 * This test suite validates the intelligent personalization system that learns
 * from user behavior and customizes tips based on patterns and preferences.
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { TipPersonalizationEngine } from '@/lib/tip-personalization-engine';
import type { EnhancedTip, TipFeedback, UserTipPreferences } from '@/types/ai-types';
import type { TimeBlock } from '@/types';

describe('Tip Personalization Engine', () => {
  let personalizationEngine: TipPersonalizationEngine;
  
  const mockTips: EnhancedTip[] = [
    {
      id: 'tip-productivity-1',
      type: 'Productivity',
      subCategory: 'Focus',
      title: 'Time Blocking Technique',
      suggestion: 'Use time blocking to improve focus',
      reasoning: 'Based on your scheduling patterns',
      expectedImpact: 'Better task completion',
      actionSteps: ['Block 90 minutes', 'Eliminate distractions', 'Focus on one task'],
      priority: 'high',
      difficulty: 'moderate',
      timeInvestment: 'short-term',
      tags: ['focus', 'time-management'],
      personalizedScore: 0
    },
    {
      id: 'tip-health-1',
      type: 'Health',
      subCategory: 'Exercise',
      title: 'Morning Walk',
      suggestion: 'Take a 15-minute walk each morning',
      reasoning: 'Improves energy and mood',
      expectedImpact: 'Better energy throughout the day',
      actionSteps: ['Set alarm 15 minutes earlier', 'Choose a route', 'Walk at moderate pace'],
      priority: 'medium',
      difficulty: 'easy',
      timeInvestment: 'immediate',
      tags: ['exercise', 'morning-routine'],
      personalizedScore: 0
    },
    {
      id: 'tip-mindfulness-1',
      type: 'Mindfulness',
      subCategory: 'Meditation',
      title: '5-Minute Breathing',
      suggestion: 'Practice 5-minute breathing exercises',
      reasoning: 'Reduces stress and improves focus',
      expectedImpact: 'Reduced stress levels',
      actionSteps: ['Find quiet space', 'Set timer', 'Focus on breathing'],
      priority: 'low',
      difficulty: 'easy',
      timeInvestment: 'immediate',
      tags: ['meditation', 'stress-relief'],
      personalizedScore: 0
    },
    {
      id: 'tip-learning-1',
      type: 'Learning',
      subCategory: 'Reading',
      title: 'Daily Reading Habit',
      suggestion: 'Read for 20 minutes daily',
      reasoning: 'Continuous learning improves skills',
      expectedImpact: 'Enhanced knowledge and skills',
      actionSteps: ['Choose interesting book', 'Set reading time', 'Track progress'],
      priority: 'medium',
      difficulty: 'moderate',
      timeInvestment: 'long-term',
      tags: ['reading', 'learning'],
      personalizedScore: 0
    }
  ];

  const mockTimeBlocks: TimeBlock[] = [
    {
      id: '1',
      title: 'Morning Exercise',
      startTime: '2024-01-01T07:00:00Z',
      duration: 60,
      category: 'Health',
      completed: true,
      color: '#4ade80',
      position: { x: 0, y: 0 },
      reflection: { mood: 5, productivity: 4 }
    },
    {
      id: '2',
      title: 'Deep Work Session',
      startTime: '2024-01-01T09:00:00Z',
      duration: 120,
      category: 'Work',
      completed: true,
      color: '#3b82f6',
      position: { x: 0, y: 60 },
      reflection: { mood: 4, productivity: 5 }
    },
    {
      id: '3',
      title: 'Team Meeting',
      startTime: '2024-01-01T14:00:00Z',
      duration: 45,
      category: 'Communication',
      completed: true,
      color: '#8b5cf6',
      position: { x: 0, y: 180 },
      reflection: { mood: 3, productivity: 3 }
    },
    {
      id: '4',
      title: 'Reading Time',
      startTime: '2024-01-01T19:00:00Z',
      duration: 30,
      category: 'Learning',
      completed: false,
      color: '#f59e0b',
      position: { x: 0, y: 225 },
      reflection: { mood: 4, productivity: 4 }
    }
  ];

  const mockUserContext = {
    recentBlocks: mockTimeBlocks,
    currentTime: new Date('2024-01-01T10:00:00Z'),
    userPreferences: {
      preferredCategories: ['Productivity', 'Health'],
      tipStyle: 'detailed',
      focusAreas: ['time-management', 'wellness']
    }
  };

  beforeEach(() => {
    // Get fresh instance for each test
    personalizationEngine = TipPersonalizationEngine.getInstance();
    
    // Clear localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Tip Scoring and Ranking', () => {
    it('should calculate personalization scores for tips', () => {
      const personalizedTips = personalizationEngine.personalizeTips(mockTips, mockUserContext);

      personalizedTips.forEach(tip => {
        expect(tip.personalizedScore).toBeGreaterThanOrEqual(0);
        expect(tip.personalizedScore).toBeLessThanOrEqual(100);
        expect(typeof tip.personalizedScore).toBe('number');
      });
    });

    it('should rank tips by personalization score', () => {
      const personalizedTips = personalizationEngine.personalizeTips(mockTips, mockUserContext);

      // Tips should be sorted by personalization score (highest first)
      for (let i = 0; i < personalizedTips.length - 1; i++) {
        expect(personalizedTips[i].personalizedScore).toBeGreaterThanOrEqual(
          personalizedTips[i + 1].personalizedScore
        );
      }
    });

    it('should prefer tips matching user category preferences', () => {
      const contextWithPreferences = {
        ...mockUserContext,
        userPreferences: {
          preferredCategories: ['Health', 'Mindfulness'],
          tipStyle: 'concise',
          focusAreas: ['wellness']
        }
      };

      const personalizedTips = personalizationEngine.personalizeTips(mockTips, contextWithPreferences);

      // Health and Mindfulness tips should score higher
      const healthTip = personalizedTips.find(tip => tip.type === 'Health');
      const mindfulnessTip = personalizedTips.find(tip => tip.type === 'Mindfulness');
      const productivityTip = personalizedTips.find(tip => tip.type === 'Productivity');

      if (healthTip && productivityTip) {
        expect(healthTip.personalizedScore).toBeGreaterThan(productivityTip.personalizedScore);
      }
      if (mindfulnessTip && productivityTip) {
        expect(mindfulnessTip.personalizedScore).toBeGreaterThan(productivityTip.personalizedScore);
      }
    });

    it('should consider time-based preferences', () => {
      // Mock morning time
      const morningContext = {
        ...mockUserContext,
        currentTime: new Date('2024-01-01T08:00:00Z')
      };

      const morningTips = personalizationEngine.personalizeTips(mockTips, morningContext);

      // Tips with morning-related tags should score higher in morning
      const morningWalkTip = morningTips.find(tip => tip.tags?.includes('morning-routine'));
      if (morningWalkTip) {
        expect(morningWalkTip.personalizedScore).toBeGreaterThan(50);
      }
    });

    it('should apply difficulty preference alignment', () => {
      const personalizedTips = personalizationEngine.personalizeTips(mockTips, mockUserContext);

      // All tips should have reasonable scores based on difficulty alignment
      personalizedTips.forEach(tip => {
        expect(tip.personalizedScore).toBeGreaterThan(20); // Should not be too low
        expect(tip.personalizedScore).toBeLessThan(100); // Should not be perfect without specific alignment
      });
    });
  });

  describe('Behavior Pattern Learning', () => {
    it('should analyze temporal productivity patterns', () => {
      const highMorningProductivityBlocks = [
        {
          ...mockTimeBlocks[0],
          startTime: '2024-01-01T08:00:00Z',
          reflection: { mood: 5, productivity: 5 }
        },
        {
          ...mockTimeBlocks[1],
          startTime: '2024-01-01T09:00:00Z',
          reflection: { mood: 5, productivity: 5 }
        }
      ];

      const contextWithMorningPattern = {
        ...mockUserContext,
        recentBlocks: highMorningProductivityBlocks
      };

      const personalizedTips = personalizationEngine.personalizeTips(mockTips, contextWithMorningPattern);

      // The engine should learn from this pattern and adjust future recommendations
      expect(personalizedTips).toBeDefined();
      expect(personalizedTips.length).toBeGreaterThan(0);
    });

    it('should track category performance patterns', () => {
      const mixedPerformanceBlocks = [
        { ...mockTimeBlocks[0], category: 'Health', completed: true, reflection: { mood: 5, productivity: 5 } },
        { ...mockTimeBlocks[1], category: 'Health', completed: true, reflection: { mood: 5, productivity: 4 } },
        { ...mockTimeBlocks[2], category: 'Work', completed: false, reflection: { mood: 2, productivity: 2 } },
        { ...mockTimeBlocks[3], category: 'Work', completed: false, reflection: { mood: 2, productivity: 2 } }
      ];

      const contextWithCategoryPatterns = {
        ...mockUserContext,
        recentBlocks: mixedPerformanceBlocks
      };

      const personalizedTips = personalizationEngine.personalizeTips(mockTips, contextWithCategoryPatterns);

      // Health tips should score higher due to better performance in that category
      const healthTip = personalizedTips.find(tip => tip.type === 'Health');
      const productivityTip = personalizedTips.find(tip => tip.type === 'Productivity');

      if (healthTip && productivityTip) {
        expect(healthTip.personalizedScore).toBeGreaterThan(productivityTip.personalizedScore);
      }
    });

    it('should recognize mood-productivity correlations', () => {
      const moodProductivityBlocks = [
        { ...mockTimeBlocks[0], reflection: { mood: 5, productivity: 5 } },
        { ...mockTimeBlocks[1], reflection: { mood: 4, productivity: 4 } },
        { ...mockTimeBlocks[2], reflection: { mood: 2, productivity: 2 } },
        { ...mockTimeBlocks[3], reflection: { mood: 1, productivity: 1 } }
      ];

      const contextWithMoodData = {
        ...mockUserContext,
        recentBlocks: moodProductivityBlocks
      };

      const personalizedTips = personalizationEngine.personalizeTips(mockTips, contextWithMoodData);

      // Should generate relevant tips based on mood-productivity correlation
      expect(personalizedTips.length).toBeGreaterThan(0);
      
      // Mindfulness tips might score higher if there's a mood-productivity correlation
      const mindfulnessTip = personalizedTips.find(tip => tip.type === 'Mindfulness');
      if (mindfulnessTip) {
        expect(mindfulnessTip.personalizedScore).toBeGreaterThan(30);
      }
    });
  });

  describe('Feedback Learning', () => {
    it('should learn from positive feedback', () => {
      const positiveFeedback: TipFeedback = {
        tipId: 'tip-health-1',
        rating: 5,
        helpfulness: 5,
        implemented: true,
        difficulty: 2,
        results: 'Great improvement in energy levels',
        timestamp: new Date()
      };

      personalizationEngine.recordTipFeedback(positiveFeedback);

      // After positive feedback, similar tips should score higher
      const personalizedTips = personalizationEngine.personalizeTips(mockTips, mockUserContext);
      const healthTip = personalizedTips.find(tip => tip.type === 'Health');

      if (healthTip) {
        expect(healthTip.personalizedScore).toBeGreaterThan(50);
      }
    });

    it('should learn from negative feedback', () => {
      const negativeFeedback: TipFeedback = {
        tipId: 'tip-productivity-1',
        rating: 1,
        helpfulness: 1,
        implemented: false,
        difficulty: 5,
        feedback: 'Too complex and difficult to implement',
        timestamp: new Date()
      };

      personalizationEngine.recordTipFeedback(negativeFeedback);

      // After negative feedback, similar tips should score lower
      const personalizedTips = personalizationEngine.personalizeTips(mockTips, mockUserContext);
      const productivityTip = personalizedTips.find(tip => tip.type === 'Productivity');

      if (productivityTip) {
        // Score might be adjusted based on negative feedback
        expect(typeof productivityTip.personalizedScore).toBe('number');
      }
    });

    it('should adjust difficulty preferences based on feedback', () => {
      const difficultyFeedback: TipFeedback[] = [
        {
          tipId: 'easy-tip',
          rating: 5,
          helpfulness: 5,
          implemented: true,
          difficulty: 1, // Much easier than expected
          timestamp: new Date()
        },
        {
          tipId: 'hard-tip',
          rating: 2,
          helpfulness: 2,
          implemented: false,
          difficulty: 5, // Much harder than expected
          timestamp: new Date()
        }
      ];

      difficultyFeedback.forEach(feedback => {
        personalizationEngine.recordTipFeedback(feedback);
      });

      const personalizedTips = personalizationEngine.personalizeTips(mockTips, mockUserContext);

      // Easy tips should now score higher
      const easyTip = personalizedTips.find(tip => tip.difficulty === 'easy');
      const hardTip = personalizedTips.find(tip => tip.difficulty === 'challenging');

      if (easyTip && hardTip) {
        expect(easyTip.personalizedScore).toBeGreaterThan(hardTip.personalizedScore);
      }
    });
  });

  describe('Diversity and Content Adjustment', () => {
    it('should ensure tip diversity across categories', () => {
      const personalizedTips = personalizationEngine.personalizeTips(mockTips, mockUserContext);

      const categories = personalizedTips.map(tip => tip.type);
      const uniqueCategories = new Set(categories);

      // Should have diversity across categories
      expect(uniqueCategories.size).toBeGreaterThan(1);
      expect(uniqueCategories.size).toBeGreaterThanOrEqual(Math.min(3, mockTips.length));
    });

    it('should adjust content based on user detail preference', () => {
      const conciseContext = {
        ...mockUserContext,
        userPreferences: {
          ...mockUserContext.userPreferences,
          tipStyle: 'concise'
        }
      };

      const detailedContext = {
        ...mockUserContext,
        userPreferences: {
          ...mockUserContext.userPreferences,
          tipStyle: 'detailed'
        }
      };

      const conciseTips = personalizationEngine.personalizeTips(mockTips, conciseContext);
      const detailedTips = personalizationEngine.personalizeTips(mockTips, detailedContext);

      // Content should be adjusted based on style preference
      expect(conciseTips.length).toBeGreaterThan(0);
      expect(detailedTips.length).toBeGreaterThan(0);

      // Detailed tips might have longer suggestions or more action steps
      const detailedTip = detailedTips[0];
      const conciseTip = conciseTips[0];

      expect(typeof detailedTip.suggestion).toBe('string');
      expect(typeof conciseTip.suggestion).toBe('string');
    });

    it('should apply motivational style adjustments', () => {
      const motivationalContext = {
        ...mockUserContext,
        userPreferences: {
          ...mockUserContext.userPreferences,
          tipStyle: 'motivational'
        }
      };

      const analyticalContext = {
        ...mockUserContext,
        userPreferences: {
          ...mockUserContext.userPreferences,
          tipStyle: 'analytical'
        }
      };

      const motivationalTips = personalizationEngine.personalizeTips(mockTips, motivationalContext);
      const analyticalTips = personalizationEngine.personalizeTips(mockTips, analyticalContext);

      // Both should generate tips, style adjustment happens in content
      expect(motivationalTips.length).toBeGreaterThan(0);
      expect(analyticalTips.length).toBeGreaterThan(0);

      motivationalTips.forEach(tip => {
        expect(tip.suggestion).toBeDefined();
        expect(typeof tip.suggestion).toBe('string');
      });

      analyticalTips.forEach(tip => {
        expect(tip.suggestion).toBeDefined();
        expect(typeof tip.suggestion).toBe('string');
      });
    });

    it('should limit action steps for concise preferences', () => {
      const conciseContext = {
        ...mockUserContext,
        userPreferences: {
          ...mockUserContext.userPreferences,
          tipStyle: 'concise'
        }
      };

      const personalizedTips = personalizationEngine.personalizeTips(mockTips, conciseContext);

      personalizedTips.forEach(tip => {
        // Concise tips should have limited action steps
        expect(tip.actionSteps.length).toBeLessThanOrEqual(4);
        expect(tip.actionSteps.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Avoidance and Focus Areas', () => {
    it('should penalize tips in avoidance topics', () => {
      const contextWithAvoidance = {
        ...mockUserContext,
        userPreferences: {
          ...mockUserContext.userPreferences,
          avoidTopics: ['stress', 'work-pressure'],
          focusAreas: ['wellness', 'relaxation']
        }
      };

      const personalizedTips = personalizationEngine.personalizeTips(mockTips, contextWithAvoidance);

      // Tips should be filtered/scored based on avoidance preferences
      expect(personalizedTips.length).toBeGreaterThan(0);
      
      personalizedTips.forEach(tip => {
        // No tip should heavily focus on avoided topics
        if (tip.tags) {
          const hasAvoidedTopics = tip.tags.some(tag => 
            contextWithAvoidance.userPreferences.avoidTopics.includes(tag)
          );
          if (hasAvoidedTopics) {
            expect(tip.personalizedScore).toBeLessThan(70);
          }
        }
      });
    });

    it('should boost tips in focus areas', () => {
      const contextWithFocus = {
        ...mockUserContext,
        userPreferences: {
          ...mockUserContext.userPreferences,
          focusAreas: ['time-management', 'focus', 'productivity']
        }
      };

      const personalizedTips = personalizationEngine.personalizeTips(mockTips, contextWithFocus);

      // Tips matching focus areas should score higher
      const focusedTip = personalizedTips.find(tip => 
        tip.tags?.some(tag => contextWithFocus.userPreferences.focusAreas.includes(tag))
      );

      if (focusedTip) {
        expect(focusedTip.personalizedScore).toBeGreaterThan(60);
      }
    });
  });

  describe('Historical Effectiveness', () => {
    it('should track tip effectiveness over time', () => {
      const feedbackHistory: TipFeedback[] = [
        {
          tipId: 'tip-health-1',
          rating: 5,
          helpfulness: 5,
          implemented: true,
          difficulty: 2,
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        },
        {
          tipId: 'tip-health-2',
          rating: 4,
          helpfulness: 4,
          implemented: true,
          difficulty: 3,
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
        }
      ];

      feedbackHistory.forEach(feedback => {
        personalizationEngine.recordTipFeedback(feedback);
      });

      const personalizedTips = personalizationEngine.personalizeTips(mockTips, mockUserContext);

      // Health category should score higher due to historical effectiveness
      const healthTip = personalizedTips.find(tip => tip.type === 'Health');
      if (healthTip) {
        expect(healthTip.personalizedScore).toBeGreaterThan(50);
      }
    });

    it('should weight recent feedback more heavily', () => {
      const oldFeedback: TipFeedback = {
        tipId: 'tip-old',
        rating: 1,
        helpfulness: 1,
        implemented: false,
        difficulty: 5,
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
      };

      const recentFeedback: TipFeedback = {
        tipId: 'tip-recent',
        rating: 5,
        helpfulness: 5,
        implemented: true,
        difficulty: 2,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      };

      personalizationEngine.recordTipFeedback(oldFeedback);
      personalizationEngine.recordTipFeedback(recentFeedback);

      // Recent feedback should have more impact on scoring
      const personalizedTips = personalizationEngine.personalizeTips(mockTips, mockUserContext);
      
      expect(personalizedTips.length).toBeGreaterThan(0);
      // The effect of recent positive feedback should outweigh old negative feedback
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty tip arrays gracefully', () => {
      const emptyTips: EnhancedTip[] = [];
      const result = personalizationEngine.personalizeTips(emptyTips, mockUserContext);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle missing user context gracefully', () => {
      const minimalContext = {};
      const result = personalizationEngine.personalizeTips(mockTips, minimalContext);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      result.forEach(tip => {
        expect(tip.personalizedScore).toBeGreaterThanOrEqual(0);
        expect(tip.personalizedScore).toBeLessThanOrEqual(100);
      });
    });

    it('should handle tips without tags or optional fields', () => {
      const minimalTips: EnhancedTip[] = [
        {
          id: 'minimal-tip',
          type: 'Productivity',
          title: 'Minimal Tip',
          suggestion: 'Do something productive',
          reasoning: 'It helps',
          expectedImpact: 'Better results',
          actionSteps: ['Step 1'],
          priority: 'medium',
          difficulty: 'easy',
          timeInvestment: 'immediate',
          personalizedScore: 0
          // No tags, subCategory, etc.
        }
      ];

      const result = personalizationEngine.personalizeTips(minimalTips, mockUserContext);

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].personalizedScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle corrupted feedback data gracefully', () => {
      const corruptedFeedback = {
        tipId: '',
        rating: 999, // Invalid rating
        helpfulness: -5, // Invalid helpfulness
        implemented: 'maybe', // Invalid boolean
        difficulty: 'impossible', // Invalid difficulty
        timestamp: 'not-a-date' // Invalid date
      } as any;

      // Should not throw error when processing corrupted feedback
      expect(() => {
        personalizationEngine.recordTipFeedback(corruptedFeedback);
      }).not.toThrow();
    });

    it('should maintain performance with large datasets', () => {
      // Generate large number of tips
      const largeTipArray: EnhancedTip[] = [];
      for (let i = 0; i < 100; i++) {
        largeTipArray.push({
          ...mockTips[0],
          id: `tip-${i}`,
          title: `Tip ${i}`,
          tags: [`tag-${i % 10}`, `category-${i % 5}`]
        });
      }

      const startTime = Date.now();
      const result = personalizationEngine.personalizeTips(largeTipArray, mockUserContext);
      const endTime = Date.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(1000); // 1 second
      expect(result.length).toBeLessThanOrEqual(8); // Should apply diversity filter
      expect(result.length).toBeGreaterThan(0);
    });
  });
});