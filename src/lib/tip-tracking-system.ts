/**
 * @fileOverview Tip Tracking and Feedback System
 * 
 * This module provides comprehensive tracking of tip effectiveness, user feedback,
 * and analytics to continuously improve the daily tips system.
 */

import { 
  type EnhancedTip, 
  type TipFeedback, 
  type TipAnalytics 
} from '@/types/ai-types';
import { tipPersonalizationEngine } from './tip-personalization-engine';

// Tracking configuration
const TRACKING_CONFIG = {
  MAX_FEEDBACK_HISTORY: 500,
  ANALYTICS_RETENTION_DAYS: 90,
  FEEDBACK_REMINDER_DELAY_HOURS: 24,
  MIN_FEEDBACK_FOR_INSIGHTS: 10
};

// Tip interaction types
type TipInteractionType = 
  | 'viewed'
  | 'expanded'
  | 'marked_helpful'
  | 'marked_not_helpful'
  | 'implemented'
  | 'skipped'
  | 'shared'
  | 'bookmarked';

// Tip interaction tracking interface
interface TipInteraction {
  tipId: string;
  userId: string;
  interactionType: TipInteractionType;
  timestamp: Date;
  context?: {
    sessionId: string;
    deviceType: string;
    timeOfDay: string;
    dayOfWeek: string;
  };
  additionalData?: any;
}

// Tip implementation tracking
interface TipImplementation {
  tipId: string;
  userId: string;
  implementedAt: Date;
  completionStatus: 'partial' | 'complete' | 'abandoned';
  difficulty: 'easier_than_expected' | 'as_expected' | 'harder_than_expected';
  timeSpent: number; // in minutes
  notes?: string;
  results?: string;
}

// Tip effectiveness metrics
interface TipEffectivenessMetrics {
  tipId: string;
  category: string;
  subCategory?: string;
  totalViews: number;
  implementationRate: number;
  averageRating: number;
  helpfulnessScore: number;
  difficultyAccuracy: number;
  timeAccuracy: number;
  userSatisfactionScore: number;
  contextualRelevanceScore: number;
}

// Analytics insights
interface AnalyticsInsights {
  overallEffectiveness: number;
  topPerformingCategories: string[];
  strugglingCategories: string[];
  userEngagementTrends: any[];
  personalizationEffectiveness: number;
  recommendedImprovements: string[];
  successPatterns: any[];
}

/**
 * Main tip tracking and feedback system class
 */
export class TipTrackingSystem {
  private static instance: TipTrackingSystem;
  private interactions: TipInteraction[] = [];
  private implementations: TipImplementation[] = [];
  private feedbackHistory: TipFeedback[] = [];
  private effectivenessMetrics: Map<string, TipEffectivenessMetrics> = new Map();
  private analyticsCache: { data: AnalyticsInsights; timestamp: number } | null = null;

  private constructor() {
    this.loadTrackingData();
    this.setupPeriodicAnalytics();
  }

  static getInstance(): TipTrackingSystem {
    if (!TipTrackingSystem.instance) {
      TipTrackingSystem.instance = new TipTrackingSystem();
    }
    return TipTrackingSystem.instance;
  }

  /**
   * Tracks tip interactions (views, clicks, etc.)
   */
  trackTipInteraction(
    tipId: string, 
    interactionType: TipInteractionType, 
    additionalData?: any
  ): void {
    const interaction: TipInteraction = {
      tipId,
      userId: this.getCurrentUserId(),
      interactionType,
      timestamp: new Date(),
      context: this.getCurrentContext(),
      additionalData
    };

    this.interactions.push(interaction);
    this.updateEffectivenessMetrics(tipId, interactionType);
    
    // Clean up old interactions
    this.cleanupOldInteractions();
    
    // Save to persistent storage
    this.saveTrackingData();

    console.log(`Tracked ${interactionType} for tip ${tipId}`);
  }

  /**
   * Records tip implementation details
   */
  recordTipImplementation(implementation: Omit<TipImplementation, 'userId'>): void {
    const fullImplementation: TipImplementation = {
      ...implementation,
      userId: this.getCurrentUserId()
    };

    this.implementations.push(fullImplementation);
    this.updateImplementationMetrics(implementation.tipId, implementation);
    
    // Track as interaction
    this.trackTipInteraction(implementation.tipId, 'implemented', {
      completionStatus: implementation.completionStatus,
      timeSpent: implementation.timeSpent
    });

    console.log(`Recorded implementation for tip ${implementation.tipId}`);
  }

  /**
   * Records user feedback on tips
   */
  recordTipFeedback(feedback: TipFeedback): void {
    this.feedbackHistory.push(feedback);
    this.updateFeedbackMetrics(feedback.tipId, feedback);
    
    // Send to personalization engine for learning
    tipPersonalizationEngine.recordTipFeedback(feedback);
    
    // Track as interaction
    this.trackTipInteraction(feedback.tipId, 'marked_helpful', {
      rating: feedback.rating,
      helpfulness: feedback.helpfulness
    });

    // Clean up old feedback
    this.cleanupOldFeedback();
    
    this.saveTrackingData();

    console.log(`Recorded feedback for tip ${feedback.tipId}: ${feedback.rating}/5 stars`);
  }

  /**
   * Gets effectiveness metrics for a specific tip
   */
  getTipEffectiveness(tipId: string): TipEffectivenessMetrics | null {
    return this.effectivenessMetrics.get(tipId) || null;
  }

  /**
   * Gets overall analytics and insights
   */
  getAnalyticsInsights(): AnalyticsInsights {
    // Return cached analytics if recent
    if (this.analyticsCache && 
        Date.now() - this.analyticsCache.timestamp < 60 * 60 * 1000) { // 1 hour cache
      return this.analyticsCache.data;
    }

    const insights = this.generateAnalyticsInsights();
    this.analyticsCache = {
      data: insights,
      timestamp: Date.now()
    };

    return insights;
  }

  /**
   * Gets user engagement statistics
   */
  getUserEngagementStats(): {
    totalInteractions: number;
    implementationRate: number;
    averageFeedbackRating: number;
    engagementTrend: 'increasing' | 'stable' | 'decreasing';
    mostEngagedCategories: string[];
  } {
    const userId = this.getCurrentUserId();
    const userInteractions = this.interactions.filter(i => i.userId === userId);
    const userImplementations = this.implementations.filter(i => i.userId === userId);
    const userFeedback = this.feedbackHistory.filter(f => f.tipId); // Simplified check

    const implementationRate = userInteractions.length > 0 ? 
      (userImplementations.length / userInteractions.filter(i => i.interactionType === 'viewed').length) * 100 : 0;

    const averageFeedbackRating = userFeedback.length > 0 ?
      userFeedback.reduce((sum, f) => sum + f.rating, 0) / userFeedback.length : 0;

    // Calculate engagement trend (simplified)
    const recentInteractions = userInteractions.filter(i => 
      Date.now() - i.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000
    ).length;
    const previousWeekInteractions = userInteractions.filter(i => {
      const daysDiff = (Date.now() - i.timestamp.getTime()) / (24 * 60 * 60 * 1000);
      return daysDiff >= 7 && daysDiff < 14;
    }).length;

    let engagementTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (recentInteractions > previousWeekInteractions * 1.2) {
      engagementTrend = 'increasing';
    } else if (recentInteractions < previousWeekInteractions * 0.8) {
      engagementTrend = 'decreasing';
    }

    // Get most engaged categories
    const categoryEngagement = new Map<string, number>();
    userInteractions.forEach(interaction => {
      // This would need to be enhanced to get category from tip metadata
      // For now, simplified implementation
    });

    return {
      totalInteractions: userInteractions.length,
      implementationRate,
      averageFeedbackRating,
      engagementTrend,
      mostEngagedCategories: [] // Simplified for now
    };
  }

  /**
   * Gets recommendations for improving tip effectiveness
   */
  getImprovementRecommendations(): string[] {
    const insights = this.getAnalyticsInsights();
    const recommendations = [...insights.recommendedImprovements];

    // Add dynamic recommendations based on current data
    const userStats = this.getUserEngagementStats();
    
    if (userStats.implementationRate < 30) {
      recommendations.push('Consider simplifying tip complexity to improve implementation rates');
    }
    
    if (userStats.averageFeedbackRating < 3.5) {
      recommendations.push('Focus on improving tip relevance and personalization');
    }
    
    if (userStats.engagementTrend === 'decreasing') {
      recommendations.push('Increase tip variety and freshness to maintain engagement');
    }

    return recommendations.slice(0, 5); // Return top 5 recommendations
  }

  /**
   * Exports tracking data for analysis or backup
   */
  exportTrackingData(): {
    interactions: TipInteraction[];
    implementations: TipImplementation[];
    feedback: TipFeedback[];
    metrics: Record<string, TipEffectivenessMetrics>;
    analytics: AnalyticsInsights;
  } {
    return {
      interactions: this.interactions,
      implementations: this.implementations,
      feedback: this.feedbackHistory,
      metrics: Object.fromEntries(this.effectivenessMetrics),
      analytics: this.getAnalyticsInsights()
    };
  }

  /**
   * Clears all tracking data (for testing or privacy)
   */
  clearTrackingData(): void {
    this.interactions = [];
    this.implementations = [];
    this.feedbackHistory = [];
    this.effectivenessMetrics.clear();
    this.analyticsCache = null;
    
    this.saveTrackingData();
    console.log('Cleared all tracking data');
  }

  // Private methods

  private generateAnalyticsInsights(): AnalyticsInsights {
    const totalTips = this.effectivenessMetrics.size;
    const totalInteractions = this.interactions.length;
    const totalImplementations = this.implementations.length;
    const totalFeedback = this.feedbackHistory.length;

    // Calculate overall effectiveness
    const metricsArray = Array.from(this.effectivenessMetrics.values());
    const overallEffectiveness = metricsArray.length > 0 ?
      metricsArray.reduce((sum, m) => sum + m.userSatisfactionScore, 0) / metricsArray.length : 0;

    // Identify top performing categories
    const categoryPerformance = new Map<string, number>();
    metricsArray.forEach(metric => {
      const current = categoryPerformance.get(metric.category) || 0;
      categoryPerformance.set(metric.category, current + metric.userSatisfactionScore);
    });

    const sortedCategories = Array.from(categoryPerformance.entries())
      .sort(([,a], [,b]) => b - a);
    
    const topPerformingCategories = sortedCategories.slice(0, 3).map(([category]) => category);
    const strugglingCategories = sortedCategories.slice(-2).map(([category]) => category);

    // Calculate personalization effectiveness
    const personalizedTips = metricsArray.filter(m => m.contextualRelevanceScore > 70);
    const personalizationEffectiveness = personalizedTips.length / Math.max(metricsArray.length, 1) * 100;

    // Generate improvement recommendations
    const recommendedImprovements = [];
    
    if (overallEffectiveness < 60) {
      recommendedImprovements.push('Improve overall tip quality and relevance');
    }
    
    if (personalizationEffectiveness < 50) {
      recommendedImprovements.push('Enhance personalization algorithms');
    }
    
    if (totalImplementations / Math.max(totalInteractions, 1) < 0.3) {
      recommendedImprovements.push('Simplify tip implementation steps');
    }

    return {
      overallEffectiveness,
      topPerformingCategories,
      strugglingCategories,
      userEngagementTrends: this.calculateEngagementTrends(),
      personalizationEffectiveness,
      recommendedImprovements,
      successPatterns: this.identifySuccessPatterns()
    };
  }

  private updateEffectivenessMetrics(tipId: string, interactionType: TipInteractionType): void {
    if (!this.effectivenessMetrics.has(tipId)) {
      this.effectivenessMetrics.set(tipId, {
        tipId,
        category: 'Unknown', // Would need to be passed in
        totalViews: 0,
        implementationRate: 0,
        averageRating: 0,
        helpfulnessScore: 0,
        difficultyAccuracy: 0,
        timeAccuracy: 0,
        userSatisfactionScore: 0,
        contextualRelevanceScore: 0
      });
    }

    const metrics = this.effectivenessMetrics.get(tipId)!;
    
    if (interactionType === 'viewed') {
      metrics.totalViews++;
    }
    
    // Update implementation rate
    const tipInteractions = this.interactions.filter(i => i.tipId === tipId);
    const implementedCount = tipInteractions.filter(i => i.interactionType === 'implemented').length;
    const viewedCount = tipInteractions.filter(i => i.interactionType === 'viewed').length;
    
    metrics.implementationRate = viewedCount > 0 ? (implementedCount / viewedCount) * 100 : 0;
  }

  private updateImplementationMetrics(tipId: string, implementation: TipImplementation): void {
    const metrics = this.effectivenessMetrics.get(tipId);
    if (!metrics) return;

    // Update difficulty accuracy based on user experience vs predicted difficulty
    // This would need more sophisticated implementation
    
    // Update time accuracy
    // This would need original time estimate vs actual time spent
  }

  private updateFeedbackMetrics(tipId: string, feedback: TipFeedback): void {
    const metrics = this.effectivenessMetrics.get(tipId);
    if (!metrics) return;

    // Update average rating
    const tipFeedback = this.feedbackHistory.filter(f => f.tipId === tipId);
    metrics.averageRating = tipFeedback.reduce((sum, f) => sum + f.rating, 0) / tipFeedback.length;
    
    // Update helpfulness score
    metrics.helpfulnessScore = tipFeedback.reduce((sum, f) => sum + f.helpfulness, 0) / tipFeedback.length;
    
    // Update user satisfaction score (composite metric)
    metrics.userSatisfactionScore = (metrics.averageRating * 0.4 + metrics.helpfulnessScore * 0.3 + metrics.implementationRate * 0.003) * 10;
  }

  private calculateEngagementTrends(): any[] {
    // Calculate weekly engagement trends
    const weeklyData = [];
    const now = new Date();
    
    for (let week = 0; week < 12; week++) {
      const weekStart = new Date(now.getTime() - (week + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - week * 7 * 24 * 60 * 60 * 1000);
      
      const weekInteractions = this.interactions.filter(i => 
        i.timestamp >= weekStart && i.timestamp < weekEnd
      ).length;
      
      weeklyData.push({
        week: `Week ${12 - week}`,
        interactions: weekInteractions
      });
    }
    
    return weeklyData.reverse();
  }

  private identifySuccessPatterns(): any[] {
    // Identify patterns in successful tip implementations
    const successfulImplementations = this.implementations.filter(i => 
      i.completionStatus === 'complete'
    );
    
    // Group by various factors to identify patterns
    const patterns = [];
    
    // Time-based patterns
    const timePatterns = new Map<string, number>();
    successfulImplementations.forEach(impl => {
      const hour = impl.implementedAt.getHours();
      const timeSlot = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
      timePatterns.set(timeSlot, (timePatterns.get(timeSlot) || 0) + 1);
    });
    
    const bestTimeSlot = Array.from(timePatterns.entries())
      .sort(([,a], [,b]) => b - a)[0];
    
    if (bestTimeSlot && bestTimeSlot[1] > 2) {
      patterns.push({
        type: 'temporal',
        pattern: `Users are most successful implementing tips in the ${bestTimeSlot[0]}`,
        confidence: Math.min(bestTimeSlot[1] / successfulImplementations.length, 1)
      });
    }
    
    return patterns;
  }

  private getCurrentUserId(): string {
    // In a real implementation, this would get the actual user ID
    return 'user_' + (localStorage.getItem('user_id') || 'anonymous');
  }

  private getCurrentContext(): TipInteraction['context'] {
    return {
      sessionId: 'session_' + Date.now(),
      deviceType: typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop',
      timeOfDay: this.getTimeOfDay(),
      dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' })
    };
  }

  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    if (hour < 22) return 'evening';
    return 'night';
  }

  private cleanupOldInteractions(): void {
    const cutoffDate = new Date(Date.now() - TRACKING_CONFIG.ANALYTICS_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    this.interactions = this.interactions.filter(i => i.timestamp > cutoffDate);
  }

  private cleanupOldFeedback(): void {
    if (this.feedbackHistory.length > TRACKING_CONFIG.MAX_FEEDBACK_HISTORY) {
      this.feedbackHistory = this.feedbackHistory
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, TRACKING_CONFIG.MAX_FEEDBACK_HISTORY);
    }
  }

  private loadTrackingData(): void {
    try {
      // Load interactions
      const interactions = localStorage.getItem('tip_interactions');
      if (interactions) {
        this.interactions = JSON.parse(interactions).map((i: any) => ({
          ...i,
          timestamp: new Date(i.timestamp)
        }));
      }

      // Load implementations
      const implementations = localStorage.getItem('tip_implementations');
      if (implementations) {
        this.implementations = JSON.parse(implementations).map((i: any) => ({
          ...i,
          implementedAt: new Date(i.implementedAt)
        }));
      }

      // Load feedback
      const feedback = localStorage.getItem('tip_feedback');
      if (feedback) {
        this.feedbackHistory = JSON.parse(feedback).map((f: any) => ({
          ...f,
          timestamp: new Date(f.timestamp)
        }));
      }

      // Load metrics
      const metrics = localStorage.getItem('tip_effectiveness_metrics');
      if (metrics) {
        const metricsData = JSON.parse(metrics);
        this.effectivenessMetrics = new Map(Object.entries(metricsData));
      }
    } catch (error) {
      console.error('Error loading tracking data:', error);
    }
  }

  private saveTrackingData(): void {
    try {
      localStorage.setItem('tip_interactions', JSON.stringify(this.interactions));
      localStorage.setItem('tip_implementations', JSON.stringify(this.implementations));
      localStorage.setItem('tip_feedback', JSON.stringify(this.feedbackHistory));
      localStorage.setItem('tip_effectiveness_metrics', 
        JSON.stringify(Object.fromEntries(this.effectivenessMetrics)));
    } catch (error) {
      console.error('Error saving tracking data:', error);
    }
  }

  private setupPeriodicAnalytics(): void {
    // Set up periodic analytics computation (every hour)
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.analyticsCache = null; // Invalidate cache
        this.getAnalyticsInsights(); // Recompute
      }, 60 * 60 * 1000); // 1 hour
    }
  }
}

// Export singleton instance
export const tipTrackingSystem = TipTrackingSystem.getInstance();

// Export utility functions for easier integration
export const trackTipView = (tipId: string) => 
  tipTrackingSystem.trackTipInteraction(tipId, 'viewed');

export const trackTipImplementation = (tipId: string, details: Omit<TipImplementation, 'userId' | 'tipId'>) =>
  tipTrackingSystem.recordTipImplementation({ tipId, ...details });

export const submitTipFeedback = (feedback: TipFeedback) =>
  tipTrackingSystem.recordTipFeedback(feedback);

export const getTipAnalytics = () =>
  tipTrackingSystem.getAnalyticsInsights();

export const getUserEngagement = () =>
  tipTrackingSystem.getUserEngagementStats();