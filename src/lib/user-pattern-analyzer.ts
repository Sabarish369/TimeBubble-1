import type { TimeBlock, BubbleCategory } from '@/types';
import { format, getHours, getMinutes, getDay, startOfWeek, endOfWeek, isWithinInterval, differenceInDays } from 'date-fns';

export interface UserPattern {
  category: BubbleCategory;
  preferredTimes: { hour: number; minute: number; frequency: number }[];
  preferredDays: { day: number; frequency: number }[];
  averageDuration: number;
  commonTitles: { title: string; frequency: number }[];
  totalOccurrences: number;
}

export interface BubbleSuggestion {
  id: string;
  title: string;
  category: BubbleCategory;
  duration: number;
  startTime: Date;
  confidence: number; // 0-1 score
  reason: string;
  color?: string;
}

export interface UserActivityStats {
  totalBubbles: number;
  categoryCounts: Record<BubbleCategory, number>;
  mostActiveHours: number[];
  mostActiveDays: number[];
  averageSessionDuration: number;
  patterns: UserPattern[];
}

export class UserPatternAnalyzer {
  private patterns: Map<BubbleCategory, UserPattern> = new Map();
  private readonly MIN_PATTERN_OCCURRENCES = 2; // Lowered for testing
  private readonly CONFIDENCE_THRESHOLD = 0.1; // Lowered for testing

  /**
   * Analyze user's historical bubble data to identify patterns
   */
  analyzePatterns(historicalBlocks: TimeBlock[]): UserActivityStats {
    console.log('📊 Analyzing patterns for', historicalBlocks.length, 'historical blocks');
    this.patterns.clear();
    
    if (historicalBlocks.length === 0) {
      console.log('❌ No historical blocks found');
      return this.getEmptyStats();
    }

    const categoryGroups = this.groupBlocksByCategory(historicalBlocks);
    const patterns: UserPattern[] = [];

    // Analyze patterns for each category
    for (const [category, blocks] of categoryGroups.entries()) {
      console.log(`📈 Category ${category}: ${blocks.length} blocks`);
      if (blocks.length >= this.MIN_PATTERN_OCCURRENCES) {
        const pattern = this.analyzeCategory(category, blocks);
        this.patterns.set(category, pattern);
        patterns.push(pattern);
        console.log(`✅ Pattern created for ${category}:`, pattern);
      } else {
        console.log(`⚠️ Not enough blocks for ${category} pattern (need ${this.MIN_PATTERN_OCCURRENCES}, have ${blocks.length})`);
      }
    }

    return {
      totalBubbles: historicalBlocks.length,
      categoryCounts: this.getCategoryCounts(historicalBlocks),
      mostActiveHours: this.getMostActiveHours(historicalBlocks),
      mostActiveDays: this.getMostActiveDays(historicalBlocks),
      averageSessionDuration: this.getAverageSessionDuration(historicalBlocks),
      patterns
    };
  }

  /**
   * Generate suggestions based on current context
   */
  generateSuggestions(
    currentTime: Date,
    existingBlocks: TimeBlock[],
    context: 'creating' | 'moving' | 'editing',
    targetBlock?: TimeBlock
  ): BubbleSuggestion[] {
    console.log('🎯 Generating suggestions:', { context, currentHour: getHours(currentTime), patternsCount: this.patterns.size });
    const suggestions: BubbleSuggestion[] = [];
    const currentHour = getHours(currentTime);
    const currentDay = getDay(currentTime);

    // Generate suggestions based on patterns
    for (const [category, pattern] of this.patterns.entries()) {
      console.log(`🔄 Processing pattern for ${category}`);
      const suggestion = this.generateCategorySuggestion(
        category,
        pattern,
        currentTime,
        currentHour,
        currentDay,
        existingBlocks,
        context,
        targetBlock
      );

      if (suggestion) {
        console.log(`💡 Generated suggestion for ${category}:`, { confidence: suggestion.confidence, threshold: this.CONFIDENCE_THRESHOLD });
        if (suggestion.confidence >= this.CONFIDENCE_THRESHOLD) {
          suggestions.push(suggestion);
        } else {
          console.log(`⚠️ Suggestion confidence too low: ${suggestion.confidence} < ${this.CONFIDENCE_THRESHOLD}`);
        }
      } else {
        console.log(`❌ No suggestion generated for ${category}`);
      }
    }

    // Sort by confidence score
    const finalSuggestions = suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3); // Limit to top 3 suggestions
    
    console.log('🎉 Final suggestions:', finalSuggestions.length, finalSuggestions);
    return finalSuggestions;
  }

  /**
   * Check if user typically creates bubbles at this time
   */
  isTypicalCreationTime(currentTime: Date): boolean {
    const hour = getHours(currentTime);
    const day = getDay(currentTime);

    for (const pattern of this.patterns.values()) {
      const hasTimePattern = pattern.preferredTimes.some(pt => 
        Math.abs(pt.hour - hour) <= 1 && pt.frequency >= 3
      );
      const hasDayPattern = pattern.preferredDays.some(pd => 
        pd.day === day && pd.frequency >= 3
      );

      if (hasTimePattern && hasDayPattern) {
        return true;
      }
    }

    return false;
  }

  private groupBlocksByCategory(blocks: TimeBlock[]): Map<BubbleCategory, TimeBlock[]> {
    const groups = new Map<BubbleCategory, TimeBlock[]>();
    
    for (const block of blocks) {
      if (!groups.has(block.category)) {
        groups.set(block.category, []);
      }
      groups.get(block.category)!.push(block);
    }

    return groups;
  }

  private analyzeCategory(category: BubbleCategory, blocks: TimeBlock[]): UserPattern {
    const timeFrequency = new Map<string, number>();
    const dayFrequency = new Map<number, number>();
    const titleFrequency = new Map<string, number>();
    let totalDuration = 0;

    for (const block of blocks) {
      const startTime = new Date(block.startTime);
      const hour = getHours(startTime);
      const minute = getMinutes(startTime);
      const day = getDay(startTime);

      // Track time patterns (rounded to nearest 30 minutes)
      const roundedMinute = Math.round(minute / 30) * 30;
      const timeKey = `${hour}:${roundedMinute.toString().padStart(2, '0')}`;
      timeFrequency.set(timeKey, (timeFrequency.get(timeKey) || 0) + 1);

      // Track day patterns
      dayFrequency.set(day, (dayFrequency.get(day) || 0) + 1);

      // Track title patterns (normalized)
      const normalizedTitle = this.normalizeTitle(block.title);
      titleFrequency.set(normalizedTitle, (titleFrequency.get(normalizedTitle) || 0) + 1);

      totalDuration += block.duration;
    }

    return {
      category,
      preferredTimes: Array.from(timeFrequency.entries())
        .map(([timeKey, frequency]) => {
          const [hour, minute] = timeKey.split(':').map(Number);
          return { hour, minute, frequency };
        })
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5),
      preferredDays: Array.from(dayFrequency.entries())
        .map(([day, frequency]) => ({ day, frequency }))
        .sort((a, b) => b.frequency - a.frequency),
      averageDuration: Math.round(totalDuration / blocks.length),
      commonTitles: Array.from(titleFrequency.entries())
        .map(([title, frequency]) => ({ title, frequency }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5),
      totalOccurrences: blocks.length
    };
  }

  private generateCategorySuggestion(
    category: BubbleCategory,
    pattern: UserPattern,
    currentTime: Date,
    currentHour: number,
    currentDay: number,
    existingBlocks: TimeBlock[],
    context: string,
    targetBlock?: TimeBlock
  ): BubbleSuggestion | null {
    // Find the best time match (more lenient for testing)
    const bestTimeMatch = pattern.preferredTimes.find(pt => 
      Math.abs(pt.hour - currentHour) <= 3 // More flexible time matching
    ) || pattern.preferredTimes[0]; // Fallback to first preferred time

    // Find the best day match (more lenient)
    const bestDayMatch = pattern.preferredDays.find(pd => pd.day === currentDay)
      || pattern.preferredDays[0]; // Fallback to most common day

    // Always try to generate a suggestion if we have any pattern data
    if (!bestTimeMatch && !bestDayMatch && pattern.preferredTimes.length === 0) {
      return null;
    }

    // Calculate confidence based on pattern strength (more generous for testing)
    let confidence = 0.2; // Base confidence
    let reason = '';

    if (bestTimeMatch) {
      confidence += Math.min((bestTimeMatch.frequency / pattern.totalOccurrences) * 0.6, 0.5);
      reason += `Usually ${category} at ${bestTimeMatch.hour}:${bestTimeMatch.minute.toString().padStart(2, '0')}. `;
    }

    if (bestDayMatch) {
      confidence += Math.min((bestDayMatch.frequency / pattern.totalOccurrences) * 0.4, 0.3);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      reason += `Often ${category} on ${dayNames[bestDayMatch.day]}s. `;
    }
    
    // Ensure minimum confidence for testing
    confidence = Math.max(confidence, 0.15);

    // Suggest the most common title for this category
    const suggestedTitle = pattern.commonTitles[0]?.title || `${category} task`;

    // Calculate suggested start time
    const suggestedStartTime = bestTimeMatch 
      ? new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), bestTimeMatch.hour, bestTimeMatch.minute)
      : new Date(currentTime.getTime() + 30 * 60000); // 30 minutes from now as fallback

    // Check if this time slot is available
    const isSlotAvailable = !existingBlocks.some(block => {
      const blockStart = new Date(block.startTime);
      const blockEnd = new Date(blockStart.getTime() + block.duration * 60000);
      const suggestionEnd = new Date(suggestedStartTime.getTime() + pattern.averageDuration * 60000);
      
      return (suggestedStartTime < blockEnd && suggestionEnd > blockStart);
    });

    if (!isSlotAvailable) {
      confidence *= 0.8; // Less penalty for occupied slots during testing
      reason += 'Time adjusted for availability. ';
      // Adjust time to next available slot
      const adjustedTime = new Date(suggestedStartTime.getTime() + 60 * 60000); // 1 hour later
      return {
        id: `suggestion_${category}_${Date.now()}`,
        title: suggestedTitle,
        category,
        duration: pattern.averageDuration,
        startTime: adjustedTime,
        confidence,
        reason: reason.trim() + ' (Adjusted for conflicts)'
      };
    }

    return {
      id: `suggestion_${category}_${Date.now()}`,
      title: suggestedTitle,
      category,
      duration: pattern.averageDuration,
      startTime: suggestedStartTime,
      confidence,
      reason: reason.trim()
    };
  }

  private normalizeTitle(title: string): string {
    return title.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private getCategoryCounts(blocks: TimeBlock[]): Record<BubbleCategory, number> {
    const counts = {
      work: 0,
      study: 0,
      break: 0,
      personal: 0,
      health: 0
    } as Record<BubbleCategory, number>;

    for (const block of blocks) {
      counts[block.category]++;
    }

    return counts;
  }

  private getMostActiveHours(blocks: TimeBlock[]): number[] {
    const hourCounts = new Map<number, number>();
    
    for (const block of blocks) {
      const hour = getHours(new Date(block.startTime));
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    }

    return Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([hour]) => hour);
  }

  private getMostActiveDays(blocks: TimeBlock[]): number[] {
    const dayCounts = new Map<number, number>();
    
    for (const block of blocks) {
      const day = getDay(new Date(block.startTime));
      dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
    }

    return Array.from(dayCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([day]) => day);
  }

  private getAverageSessionDuration(blocks: TimeBlock[]): number {
    if (blocks.length === 0) return 0;
    const totalDuration = blocks.reduce((sum, block) => sum + block.duration, 0);
    return Math.round(totalDuration / blocks.length);
  }

  private getEmptyStats(): UserActivityStats {
    return {
      totalBubbles: 0,
      categoryCounts: { work: 0, study: 0, break: 0, personal: 0, health: 0 },
      mostActiveHours: [],
      mostActiveDays: [],
      averageSessionDuration: 0,
      patterns: []
    };
  }
}

export const userPatternAnalyzer = new UserPatternAnalyzer();
