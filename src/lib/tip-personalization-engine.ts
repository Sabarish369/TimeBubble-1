/**
 * @fileOverview Intelligent Tip Personalization Engine
 * 
 * This module provides advanced personalization capabilities for the daily tips system.
 * It learns from user behavior, preferences, and feedback to continuously improve
 * tip relevance and effectiveness.
 */

import { 
  type EnhancedTip, 
  type UserTipPreferences, 
  type TipFeedback 
} from '@/types/ai-types';
import { type TimeBlock } from '@/types';

// Personalization configuration
const PERSONALIZATION_CONFIG = {
  LEARNING_RATE: 0.1,
  MIN_FEEDBACK_COUNT: 5,
  PREFERENCE_DECAY_RATE: 0.95, // How quickly old preferences fade
  PATTERN_RECOGNITION_THRESHOLD: 0.7,
  MAX_PERSONALIZATION_HISTORY: 100
};

// User behavior patterns interface
interface UserBehaviorPattern {
  patternId: string;
  patternType: 'temporal' | 'categorical' | 'productivity' | 'mood' | 'completion';
  confidence: number;
  frequency: number;
  lastSeen: Date;
  context: any;
}

// Personalization weights interface
interface PersonalizationWeights {
  categoryPreferences: Record<string, number>;
  timeBasedPreferences: Record<string, number>;
  difficultyPreference: number; // -1 to 1, where -1 prefers easy, 1 prefers challenging
  detailLevel: number; // 0 to 1, where 0 prefers concise, 1 prefers detailed
  motivationalStyle: number; // 0 to 1, where 0 prefers analytical, 1 prefers motivational
  focusAreas: Record<string, number>;
  avoidanceTopics: Record<string, number>;
}

// Tip effectiveness tracking
interface TipEffectiveness {
  tipId: string;
  category: string;
  implemented: boolean;
  userRating: number;
  impactScore: number;
  contextSimilarity: number;
  timestamp: Date;
}

/**
 * Main personalization engine class
 */
export class TipPersonalizationEngine {
  private static instance: TipPersonalizationEngine | null = null;
  private behaviorPatterns: Map<string, UserBehaviorPattern> = new Map();
  private personalizationWeights: PersonalizationWeights;
  private tipEffectiveness: TipEffectiveness[] = [];
  private userPreferences: UserTipPreferences;
  
  private constructor() {
    if (typeof window !== 'undefined' && localStorage.getItem('personalizationWeights')) {
      this.personalizationWeights = JSON.parse(localStorage.getItem('personalizationWeights')!);
    } else {
      this.personalizationWeights = this.initializeWeights();
    }
    
    if (typeof window !== 'undefined' && localStorage.getItem('userPreferences')) {
      this.userPreferences = JSON.parse(localStorage.getItem('userPreferences')!);
    } else {
      this.userPreferences = this.loadUserPreferences();
    }
    
    this.loadPersonalizationData();
  }

  static getInstance(): TipPersonalizationEngine {
    if (!TipPersonalizationEngine.instance) {
      TipPersonalizationEngine.instance = new TipPersonalizationEngine();
    }
    return TipPersonalizationEngine.instance;
  }

  /**
   * Personalizes tips based on user behavior and preferences
   */
  personalizeTips(tips: EnhancedTip[], userContext: any): EnhancedTip[] {
    // Update behavior patterns based on current context
    this.updateBehaviorPatterns(userContext);
    
    // Score and rank tips based on personalization
    const scoredTips = tips.map(tip => ({
      ...tip,
      personalizedScore: this.calculatePersonalizationScore(tip, userContext),
      personalizedReason: this.generatePersonalizationReason(tip, userContext)
    }));
    
    // Sort by personalization score and select top tips
    const sortedTips = scoredTips.sort((a, b) => b.personalizedScore - a.personalizedScore);
    
    // Apply diversity filter to ensure variety
    const diverseTips = this.applyDiversityFilter(sortedTips);
    
    // Adjust tip content based on user preferences
    return diverseTips.map(tip => this.adjustTipContent(tip));
  }

  /**
   * Calculates personalization score for a tip
   */
  private calculatePersonalizationScore(tip: EnhancedTip, userContext: any): number {
    let score = 50; // Base score
    
    // Category preference scoring
    const categoryWeight = this.personalizationWeights.categoryPreferences[tip.type] || 0;
    score += categoryWeight * 20;
    
    // Time-based preference scoring
    const currentHour = new Date().getHours();
    const timeSlot = this.getTimeSlot(currentHour);
    const timeWeight = this.personalizationWeights.timeBasedPreferences[timeSlot] || 0;
    score += timeWeight * 15;
    
    // Difficulty preference scoring
    const difficultyScore = this.getDifficultyScore(tip.difficulty);
    const difficultyAlignment = 1 - Math.abs(this.personalizationWeights.difficultyPreference - difficultyScore);
    score += difficultyAlignment * 10;
    
    // Focus area alignment
    if (tip.tags) {
      const focusAlignment = tip.tags.reduce((sum, tag) => {
        return sum + (this.personalizationWeights.focusAreas[tag] || 0);
      }, 0) / tip.tags.length;
      score += focusAlignment * 15;
    }
    
    // Avoidance topics penalty
    if (tip.tags) {
      const avoidancePenalty = tip.tags.reduce((sum, tag) => {
        return sum + (this.personalizationWeights.avoidanceTopics[tag] || 0);
      }, 0);
      score -= avoidancePenalty * 20;
    }
    
    // Historical effectiveness scoring
    const effectivenessScore = this.getHistoricalEffectiveness(tip.type, tip.subCategory);
    score += effectivenessScore * 10;
    
    // Pattern-based scoring
    const patternScore = this.getPatternBasedScore(tip, userContext);
    score += patternScore * 15;
    
    // Recent feedback influence
    const recentFeedbackScore = this.getRecentFeedbackScore(tip.type);
    score += recentFeedbackScore * 10;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Updates behavior patterns based on user actions
   */
  private updateBehaviorPatterns(userContext: any): void {
    if (!userContext.recentBlocks) return;
    
    // Analyze temporal patterns
    this.analyzeTemporalPatterns(userContext.recentBlocks);
    
    // Analyze category patterns
    this.analyzeCategoryPatterns(userContext.recentBlocks);
    
    // Analyze productivity patterns
    this.analyzeProductivityPatterns(userContext.recentBlocks);
    
    // Analyze mood patterns
    this.analyzeMoodPatterns(userContext.recentBlocks);
    
    // Clean up old patterns
    this.cleanupOldPatterns();
  }

  /**
   * Analyzes temporal patterns in user behavior
   */
  private analyzeTemporalPatterns(blocks: TimeBlock[]): void {
    const hourlyProductivity = new Map<number, number[]>();
    
    blocks.forEach(block => {
      if (block.reflection?.productivity) {
        const hour = new Date(block.startTime).getHours();
        if (!hourlyProductivity.has(hour)) {
          hourlyProductivity.set(hour, []);
        }
        hourlyProductivity.get(hour)!.push(block.reflection.productivity);
      }
    });
    
    // Identify peak performance hours
    hourlyProductivity.forEach((productivityScores, hour) => {
      const avgProductivity = productivityScores.reduce((a, b) => a + b, 0) / productivityScores.length;
      
      if (avgProductivity >= 4 && productivityScores.length >= 3) {
        const patternId = `peak_hour_${hour}`;
        this.behaviorPatterns.set(patternId, {
          patternId,
          patternType: 'temporal',
          confidence: Math.min(productivityScores.length / 10, 1),
          frequency: productivityScores.length,
          lastSeen: new Date(),
          context: { hour, avgProductivity }
        });
      }
    });
  }

  /**
   * Analyzes category patterns
   */
  private analyzeCategoryPatterns(blocks: TimeBlock[]): void {
    const categoryPerformance = new Map<string, { completed: number, total: number, avgProductivity: number }>();
    
    blocks.forEach(block => {
      if (!categoryPerformance.has(block.category)) {
        categoryPerformance.set(block.category, { completed: 0, total: 0, avgProductivity: 0 });
      }
      
      const stats = categoryPerformance.get(block.category)!;
      stats.total++;
      if (block.completed) stats.completed++;
      if (block.reflection?.productivity) {
        stats.avgProductivity = (stats.avgProductivity * (stats.total - 1) + block.reflection.productivity) / stats.total;
      }
    });
    
    // Update category preferences based on performance
    categoryPerformance.forEach((stats, category) => {
      const completionRate = stats.completed / stats.total;
      const performanceScore = (completionRate * 0.6 + (stats.avgProductivity / 5) * 0.4);
      
      if (stats.total >= 3) {
        this.personalizationWeights.categoryPreferences[category] = 
          (this.personalizationWeights.categoryPreferences[category] || 0.5) * 0.8 + performanceScore * 0.2;
      }
    });
  }

  /**
   * Analyzes productivity patterns
   */
  private analyzeProductivityPatterns(blocks: TimeBlock[]): void {
    const productivityBlocks = blocks.filter(b => b.reflection?.productivity);
    
    if (productivityBlocks.length < 5) return;
    
    const avgProductivity = productivityBlocks.reduce((sum, b) => sum + b.reflection!.productivity!, 0) / productivityBlocks.length;
    const highProductivityThreshold = avgProductivity + 1;
    
    const highProductivityBlocks = productivityBlocks.filter(b => b.reflection!.productivity! >= highProductivityThreshold);
    
    // Analyze common characteristics of high productivity blocks
    const highProdCharacteristics = {
      timeSlots: new Map<string, number>(),
      categories: new Map<string, number>(),
      durations: [] as number[]
    };
    
    highProductivityBlocks.forEach(block => {
      const hour = new Date(block.startTime).getHours();
      const timeSlot = this.getTimeSlot(hour);
      
      highProdCharacteristics.timeSlots.set(timeSlot, (highProdCharacteristics.timeSlots.get(timeSlot) || 0) + 1);
      highProdCharacteristics.categories.set(block.category, (highProdCharacteristics.categories.get(block.category) || 0) + 1);
      highProdCharacteristics.durations.push(block.duration);
    });
    
    // Update time-based preferences
    highProdCharacteristics.timeSlots.forEach((count, timeSlot) => {
      const weight = count / highProductivityBlocks.length;
      this.personalizationWeights.timeBasedPreferences[timeSlot] = 
        (this.personalizationWeights.timeBasedPreferences[timeSlot] || 0.5) * 0.7 + weight * 0.3;
    });
  }

  /**
   * Analyzes mood patterns
   */
  private analyzeMoodPatterns(blocks: TimeBlock[]): void {
    const moodBlocks = blocks.filter(b => b.reflection?.mood);
    
    if (moodBlocks.length < 5) return;
    
    // Analyze mood-productivity correlation
    const moodProductivityPairs = moodBlocks
      .filter(b => b.reflection?.productivity && b.reflection?.mood)
      .map(b => ({ mood: b.reflection!.mood!, productivity: b.reflection!.productivity! }));
    
    if (moodProductivityPairs.length >= 5) {
      const correlation = this.calculateCorrelation(
        moodProductivityPairs.map(p => {
          switch (p.mood) {
            case 'happy': return 5;
            case 'focused': return 4;
            case 'neutral': return 3;
            case 'tired': return 2;
            case 'stressed': return 1;
            default: return 3;
          }
        }),
        moodProductivityPairs.map(p => p.productivity)
      );
      
      if (correlation > 0.5) {
        this.behaviorPatterns.set('mood_productivity_correlation', {
          patternId: 'mood_productivity_correlation',
          patternType: 'mood',
          confidence: Math.min(correlation, 1),
          frequency: moodProductivityPairs.length,
          lastSeen: new Date(),
          context: { correlation, strength: 'positive' }
        });
      }
    }
  }

  /**
   * Applies diversity filter to ensure tip variety
   */
  private applyDiversityFilter(tips: EnhancedTip[]): EnhancedTip[] {
    const selectedTips: EnhancedTip[] = [];
    const usedCategories = new Set<string>();
    const usedSubCategories = new Set<string>();
    
    // Always include the highest scored tip
    if (tips.length > 0) {
      selectedTips.push(tips[0]);
      usedCategories.add(tips[0].type);
      if (tips[0].subCategory) usedSubCategories.add(tips[0].subCategory);
    }
    
    // Add diverse tips while maintaining quality
    for (let i = 1; i < tips.length && selectedTips.length < 8; i++) {
      const tip = tips[i];
      
      // Prefer tips from unused categories
      if (!usedCategories.has(tip.type)) {
        selectedTips.push(tip);
        usedCategories.add(tip.type);
        if (tip.subCategory) usedSubCategories.add(tip.subCategory);
      } else if (tip.subCategory && !usedSubCategories.has(tip.subCategory) && selectedTips.length < 6) {
        // Add tips from unused subcategories if main categories are covered
        selectedTips.push(tip);
        if (tip.subCategory) usedSubCategories.add(tip.subCategory);
      } else if (tip.personalizedScore > 70 && selectedTips.length < 7) {
        // Add high-scoring tips even if category is repeated
        selectedTips.push(tip);
      }
    }
    
    return selectedTips;
  }

  /**
   * Adjusts tip content based on user preferences
   */
  private adjustTipContent(tip: EnhancedTip): EnhancedTip {
    let adjustedTip = { ...tip };
    
    // Adjust detail level based on preference
    if (this.personalizationWeights.detailLevel < 0.3) {
      // User prefers concise tips
      adjustedTip.suggestion = this.makeConcise(tip.suggestion);
      adjustedTip.actionSteps = tip.actionSteps.slice(0, 3); // Limit to 3 steps
    } else if (this.personalizationWeights.detailLevel > 0.7) {
      // User prefers detailed tips
      if (tip.reasoning) {
        adjustedTip.suggestion = `${tip.suggestion} ${tip.reasoning}`;
      }
    }
    
    // Adjust motivational style
    if (this.personalizationWeights.motivationalStyle > 0.7) {
      adjustedTip.suggestion = this.addMotivationalLanguage(tip.suggestion);
    } else if (this.personalizationWeights.motivationalStyle < 0.3) {
      adjustedTip.suggestion = this.makeAnalytical(tip.suggestion);
    }
    
    return adjustedTip;
  }

  /**
   * Records tip feedback for learning
   */
  recordTipFeedback(feedback: TipFeedback): void {
    this.tipEffectiveness.push({
      tipId: feedback.tipId,
      category: '', // Would need to be passed in
      implemented: feedback.implemented,
      userRating: feedback.rating,
      impactScore: feedback.helpfulness,
      contextSimilarity: 1, // Would need context comparison
      timestamp: feedback.timestamp
    });
    
    // Update weights based on feedback
    this.updateWeightsFromFeedback(feedback);
    
    // Save to persistent storage
    this.savePersonalizationData();
  }

  // Helper methods
  private initializeWeights(): PersonalizationWeights {
    return {
      categoryPreferences: {},
      timeBasedPreferences: { morning: 0.5, afternoon: 0.5, evening: 0.5 },
      difficultyPreference: 0, // Neutral
      detailLevel: 0.5, // Balanced
      motivationalStyle: 0.5, // Balanced
      focusAreas: {},
      avoidanceTopics: {}
    };
  }

  private loadUserPreferences(): UserTipPreferences {
    const defaultPrefs = {
      preferredCategories: [],
      tipStyle: 'balanced' as any,
      focusAreas: [],
      avoidTopics: [],
      timePreference: 'morning' as 'morning' | 'evening' | 'both' | undefined
    };

    if (typeof window === 'undefined') {
      return defaultPrefs;
    }

    try {
      const stored = localStorage.getItem('user_tip_preferences');
      return stored ? JSON.parse(stored) : defaultPrefs;
    } catch {
      return defaultPrefs;
    }
  }

  private loadPersonalizationData(): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const stored = localStorage.getItem('tip_personalization_weights');
      if (stored) {
        this.personalizationWeights = { ...this.personalizationWeights, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading personalization data:', error);
    }
  }

  private savePersonalizationData(): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      localStorage.setItem('tip_personalization_weights', JSON.stringify(this.personalizationWeights));
    } catch (error) {
      console.error('Error saving personalization data:', error);
    }
  }

  private getTimeSlot(hour: number): string {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'evening';
  }

  private getDifficultyScore(difficulty: string): number {
    switch (difficulty) {
      case 'easy': return 0;
      case 'moderate': return 0.5;
      case 'challenging': return 1;
      default: return 0.5;
    }
  }

  private getHistoricalEffectiveness(category: string, subCategory?: string): number {
    const relevantFeedback = this.tipEffectiveness.filter(t => t.category === category);
    if (relevantFeedback.length === 0) return 0;
    
    const avgRating = relevantFeedback.reduce((sum, t) => sum + t.userRating, 0) / relevantFeedback.length;
    return (avgRating - 3) * 0.2; // Convert 1-5 scale to -0.4 to 0.4
  }

  private getPatternBasedScore(tip: EnhancedTip, userContext: any): number {
    let score = 0;
    
    // Check for matching patterns
    this.behaviorPatterns.forEach(pattern => {
      if (pattern.patternType === 'temporal' && tip.timeInvestment) {
        const currentHour = new Date().getHours();
        if (pattern.context.hour === currentHour) {
          score += pattern.confidence * 10;
        }
      }
    });
    
    return Math.min(score, 15);
  }

  private getRecentFeedbackScore(category: string): number {
    const recentFeedback = this.tipEffectiveness
      .filter(t => t.category === category && 
               Date.now() - t.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000) // Last 7 days
      .slice(-5); // Last 5 pieces of feedback
    
    if (recentFeedback.length === 0) return 0;
    
    const avgRating = recentFeedback.reduce((sum, t) => sum + t.userRating, 0) / recentFeedback.length;
    return (avgRating - 3) * 0.15;
  }

  private cleanupOldPatterns(): void {
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    this.behaviorPatterns.forEach((pattern, key) => {
      if (pattern.lastSeen < oneMonthAgo || pattern.confidence < 0.2) {
        this.behaviorPatterns.delete(key);
      }
    });
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const correlation = (n * sumXY - sumX * sumY) / 
      Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return isNaN(correlation) ? 0 : correlation;
  }

  private makeConcise(text: string): string {
    // Simple implementation - in production, could use NLP
    const sentences = text.split('. ');
    return sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '.' : '');
  }

  private addMotivationalLanguage(text: string): string {
    const motivationalPhrases = [
      "You've got this!",
      "This will boost your productivity!",
      "You're making great progress!",
      "This small change will make a big difference!"
    ];
    
    const randomPhrase = motivationalPhrases[Math.floor(Math.random() * motivationalPhrases.length)];
    return `${text} ${randomPhrase}`;
  }

  private makeAnalytical(text: string): string {
    // Add data-driven language
    return text.replace(/you should/gi, 'data suggests you should')
               .replace(/this will/gi, 'this is likely to')
               .replace(/try/gi, 'consider');
  }

  private updateWeightsFromFeedback(feedback: TipFeedback): void {
    // Simple learning algorithm - could be made more sophisticated
    const learningRate = PERSONALIZATION_CONFIG.LEARNING_RATE;
    const ratingNormalized = (feedback.rating - 3) / 2; // Convert 1-5 to -1 to 1
    
    // This is a simplified implementation
    // In production, you'd want more sophisticated learning algorithms
  }

  private generatePersonalizationReason(tip: EnhancedTip, userContext: any): string {
    const reasons = [];
    
    const categoryWeight = this.personalizationWeights.categoryPreferences[tip.type];
    if (categoryWeight > 0.7) {
      reasons.push(`you perform well with ${tip.type.toLowerCase()} tasks`);
    }
    
    if (tip.personalizedScore > 80) {
      reasons.push('highly relevant to your current patterns');
    }
    
    return reasons.length > 0 ? `Recommended because ${reasons.join(' and ')}.` : '';
  }
}

// Export singleton instance
export const tipPersonalizationEngine = TipPersonalizationEngine.getInstance();