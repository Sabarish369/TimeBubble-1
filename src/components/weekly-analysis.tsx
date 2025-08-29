'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Award, 
  Calendar, 
  Clock, 
  Activity,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle,
  AlertCircle,
  Info,
  KeyRound
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from 'date-fns';
import { useTimeBubbles } from '@/context/time-bubbles-context';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import type { WeeklyAnalysis, ProgressData } from '@/types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface WeeklyAnalysisProps {
  isOpen: boolean;
  onClose: () => void;
}

// Client-side API call wrapper
const callWeeklyAnalysisAPI = async (input: any) => {
  try {
    const response = await fetch('/api/weekly-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate weekly analysis');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Weekly analysis API error:', error);
    throw error;
  }
};

export function WeeklyAnalysis({ isOpen, onClose }: WeeklyAnalysisProps) {
  const [analysis, setAnalysis] = useState<WeeklyAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isDataReady, setIsDataReady] = useState(false);
  
  const { timeBlocks, currentDate, getBlocksForDate } = useTimeBubbles();
  const { user, isPro, geminiApiKey } = useAuth();

  // Memoize week boundaries to prevent unnecessary recalculations
  const weekBounds = useMemo(() => ({
    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
    end: endOfWeek(currentDate, { weekStartsOn: 1 })
  }), [currentDate]);

  // Generate progress data for the current week by loading each day's blocks
  const [weekProgressData, setWeekProgressData] = useState<ProgressData[]>([]);
  const [weekSummary, setWeekSummary] = useState<{
    totalBlocks: number;
    completedBlocks: number;
    totalHours: number;
    categoryBreakdown: Record<string, { hours: number; blocks: number; completed: number }>;
  } | null>(null);

  const generateWeekProgressData = useCallback(async () => {
    if (!isOpen) return; // Don't generate data if modal is closed
    
    setIsDataReady(false);
    const weekDays = eachDayOfInterval({ start: weekBounds.start, end: weekBounds.end });
    const results: ProgressData[] = [];
    const categoryBreakdown: Record<string, { hours: number; blocks: number; completed: number }> = {
      work: { hours: 0, blocks: 0, completed: 0 },
      personal: { hours: 0, blocks: 0, completed: 0 },
      break: { hours: 0, blocks: 0, completed: 0 },
      study: { hours: 0, blocks: 0, completed: 0 },
      health: { hours: 0, blocks: 0, completed: 0 }
    };

    let totalBlocks = 0;
    let completedBlocks = 0;
    let totalHours = 0;

    for (const day of weekDays) {
      const dayKey = format(day, 'yyyy-MM-dd');
      const dayBlocks = await getBlocksForDate(day);

      // Only count blocks from current week date range
      const validBlocks = dayBlocks.filter(block => {
        const blockDate = new Date(block.startTime);
        return blockDate >= weekBounds.start && blockDate <= weekBounds.end;
      });

      totalBlocks += validBlocks.length;
      const dayCompletedBlocks = validBlocks.filter(block => block.completed);
      completedBlocks += dayCompletedBlocks.length;
      
      const dayCompletionRate = validBlocks.length > 0 ? (dayCompletedBlocks.length / validBlocks.length) * 100 : 0;

      // Calculate productivity scores only from completed blocks with reflections
      const productivityScores = dayCompletedBlocks
        .map(block => block.reflection?.productivity || 0)
        .filter(score => score > 0);
      const averageProductivity = productivityScores.length > 0
        ? productivityScores.reduce((sum: number, score: number) => sum + score, 0) / productivityScores.length
        : 0;

      // Calculate mood scores from completed blocks
      const moodScoreMap: Record<string, number> = {
        'happy': 5,
        'focused': 4,
        'neutral': 3,
        'stressed': 2,
        'tired': 1
      };
      const moodScores = dayCompletedBlocks
        .map(block => block.reflection?.mood ? moodScoreMap[block.reflection.mood] || 0 : 0)
        .filter(score => score > 0);
      const averageMood = moodScores.length > 0
        ? moodScores.reduce((sum: number, score: number) => sum + score, 0) / moodScores.length
        : 0;

      // Calculate category-specific hours (only from completed blocks for accuracy)
      const categoryHours = {
        work: 0,
        personal: 0,
        break: 0,
        study: 0,
        health: 0
      };

      // Process all blocks for category breakdown (planned vs completed)
      validBlocks.forEach(block => {
        const category = block.category as keyof typeof categoryHours;
        if (categoryBreakdown[category]) {
          categoryBreakdown[category].blocks += 1;
          categoryBreakdown[category].hours += (block.duration || 0) / 60;
          
          if (block.completed) {
            categoryBreakdown[category].completed += 1;
            categoryHours[category] += (block.duration || 0) / 60;
          }
        }
      });

      totalHours += Object.values(categoryHours).reduce((sum, hours) => sum + hours, 0);

      // Calculate consistency score based on completion rate and regularity
      const hasActivity = dayCompletedBlocks.length > 0;
      const targetCompletionRate = 75; // Target 75% completion rate
      const consistencyScore = hasActivity 
        ? Math.max(0, 100 - Math.abs(dayCompletionRate - targetCompletionRate) * 1.5) 
        : 0;

      // Calculate work-life balance score
      const workHours = categoryHours.work;
      const lifeHours = categoryHours.personal + categoryHours.break + categoryHours.health;
      const totalDayHours = workHours + lifeHours;
      const balanceScore = totalDayHours > 0 
        ? Math.max(0, 100 - Math.abs((workHours / totalDayHours) - 0.6) * 150) // Target 60% work, 40% life
        : 0;

      results.push({
        date: dayKey,
        completionRate: dayCompletionRate,
        productivityScore: averageProductivity * 20, // Scale to 0-100
        moodScore: averageMood * 20, // Scale to 0-100
        workHours: categoryHours.work,
        personalHours: categoryHours.personal,
        consistencyScore,
        balanceScore,
      });
    }

    // Update all state at once to prevent multiple re-renders
    setWeekProgressData(results);
    setWeekSummary({
      totalBlocks,
      completedBlocks,
      totalHours,
      categoryBreakdown
    });
    setIsDataReady(true);
  }, [weekBounds.start, weekBounds.end, getBlocksForDate, isOpen]);

  // Single effect to handle modal opening and data generation
  useEffect(() => {
    if (isOpen) {
      // Reset states when modal opens
      setAnalysis(null);
      setError(null);
      setIsDataReady(false);
      // Generate progress data
      generateWeekProgressData();
    } else {
      // Reset states when modal closes
      setActiveTab('overview');
      setAnalysis(null);
      setError(null);
      setIsDataReady(false);
    }
  }, [isOpen, generateWeekProgressData]);

  const fetchWeeklyAnalysis = useCallback(async () => {
    if (!weekProgressData.length || !weekSummary) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate real-time analysis using current week data
      const analysisResult = await callWeeklyAnalysisAPI({
        weekData: weekProgressData,
        previousWeekData: [], // TODO: Implement previous week data loading
        apiKey: geminiApiKey
      });
      
      // Enhance the analysis with our computed summary data
      const enhancedAnalysis: WeeklyAnalysis = {
        ...analysisResult,
        // Use our more accurate calculations
        completionRate: weekSummary.totalBlocks > 0 
          ? Math.round((weekSummary.completedBlocks / weekSummary.totalBlocks) * 100)
          : 0,
        totalWorkHours: weekSummary.categoryBreakdown.work.hours,
        totalPersonalHours: weekSummary.categoryBreakdown.personal.hours,
        totalBreakHours: weekSummary.categoryBreakdown.break.hours,
        totalStudyHours: weekSummary.categoryBreakdown.study.hours,
        // Calculate overall score from week data
        overallScore: Math.round(
          weekProgressData.reduce((sum, day) => {
            const dayScore = (day.completionRate * 0.4) + 
                           (day.productivityScore * 0.3) + 
                           (day.consistencyScore * 0.2) + 
                           (day.balanceScore * 0.1);
            return sum + dayScore;
          }, 0) / Math.max(weekProgressData.length, 1)
        )
      };
      
      setAnalysis(enhancedAnalysis);
    } catch (err: any) {
      console.error('Failed to generate weekly analysis:', err);
      // Fallback to local analysis if API fails
      try {
        const fallbackAnalysis = generateLocalAnalysis(weekProgressData, weekSummary);
        setAnalysis(fallbackAnalysis);
      } catch (fallbackErr) {
        setError(err.message || 'Failed to generate weekly analysis');
      }
    } finally {
      setIsLoading(false);
    }
  }, [weekProgressData, weekSummary, geminiApiKey]);

  // Single effect to handle analysis generation after data is ready
  useEffect(() => {
    if (isDataReady && isPro && geminiApiKey && weekProgressData.length > 0 && weekSummary) {
      fetchWeeklyAnalysis();
    } else if (isDataReady && (!isPro || !geminiApiKey)) {
      setError(isPro ? 'API key required for weekly analysis' : 'Pro subscription required for weekly analysis');
    } else if (isDataReady && weekProgressData.length === 0) {
      setError('No data available for this week. Complete some tasks to generate analysis.');
    }
  }, [isDataReady, isPro, geminiApiKey, weekProgressData.length, weekSummary, fetchWeeklyAnalysis]);

  // Generate local analysis as fallback
  const generateLocalAnalysis = (progressData: ProgressData[], summary: NonNullable<typeof weekSummary>): WeeklyAnalysis => {
    const avgCompletion = progressData.reduce((sum, day) => sum + day.completionRate, 0) / Math.max(progressData.length, 1);
    const avgProductivity = progressData.reduce((sum, day) => sum + day.productivityScore, 0) / Math.max(progressData.length, 1);
    const avgConsistency = progressData.reduce((sum, day) => sum + day.consistencyScore, 0) / Math.max(progressData.length, 1);
    const avgBalance = progressData.reduce((sum, day) => sum + day.balanceScore, 0) / Math.max(progressData.length, 1);

    const overallScore = Math.round(
      (avgCompletion * 0.4) + (avgProductivity * 0.3) + (avgConsistency * 0.2) + (avgBalance * 0.1)
    );

    const insights: WeeklyAnalysis['insights'] = [
      {
        title: 'Weekly Completion Performance',
        description: `You completed ${summary.completedBlocks} out of ${summary.totalBlocks} planned tasks this week (${Math.round(avgCompletion)}%).`,
        type: 'productivity',
        impact: avgCompletion >= 70 ? 'positive' : avgCompletion >= 50 ? 'neutral' : 'negative',
        metric: Math.round(avgCompletion)
      },
      {
        title: 'Time Distribution Analysis',
        description: `You spent ${Math.round(summary.totalHours)} hours on planned activities across ${Object.keys(summary.categoryBreakdown).length} categories.`,
        type: 'balance',
        impact: summary.totalHours >= 20 ? 'positive' : 'neutral',
        metric: Math.round(summary.totalHours)
      }
    ];

    const recommendations: WeeklyAnalysis['recommendations'] = [
      {
        title: avgCompletion < 60 ? 'Improve Task Completion' : 'Maintain Good Momentum',
        description: avgCompletion < 60 
          ? 'Focus on completing smaller, more achievable tasks to build momentum.'
          : 'You\'re doing well with task completion. Consider taking on slightly more challenging goals.',
        priority: avgCompletion < 60 ? 'high' : 'medium',
        expectedImpact: avgCompletion < 60 ? 15 : 8,
        actionable: true
      }
    ];

    const trends: WeeklyAnalysis['trends'] = [
      {
        metric: 'Daily Consistency',
        currentValue: Math.round(avgConsistency),
        previousValue: 0, // No previous week data available
        change: 0,
        direction: 'stable',
        significance: 'medium'
      }
    ];

    return {
      overallScore,
      completionRate: Math.round(avgCompletion),
      productivityScore: Math.round(avgProductivity),
      consistencyScore: Math.round(avgConsistency),
      balanceScore: Math.round(avgBalance),
      totalWorkHours: summary.categoryBreakdown.work.hours,
      totalPersonalHours: summary.categoryBreakdown.personal.hours,
      totalBreakHours: summary.categoryBreakdown.break.hours,
      totalStudyHours: summary.categoryBreakdown.study.hours,
      insights,
      recommendations,
      trends
    };
  };

  useEffect(() => {
    if (isOpen && isPro && geminiApiKey && weekProgressData.length > 0) {
      fetchWeeklyAnalysis();
    }
  }, [isOpen, isPro, geminiApiKey, weekProgressData]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-blue-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'bg-green-500' };
    if (score >= 70) return { label: 'Good', color: 'bg-blue-500' };
    if (score >= 50) return { label: 'Fair', color: 'bg-yellow-500' };
    return { label: 'Poor', color: 'bg-red-500' };
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up': return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'down': return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      case 'stable': return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-primary" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Weekly Analysis</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary/80">Beta</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {format(weekBounds.start, 'MMM d')} - {format(weekBounds.end, 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
            {isPro && geminiApiKey && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchWeeklyAnalysis}
                disabled={isLoading || !weekProgressData.length}
              >
                {isLoading ? 'Analyzing...' : 'Refresh Analysis'}
              </Button>
            )}
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {!isPro ? (
            <div className="text-center py-12">
              <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Pro Feature</h3>
              <p className="text-muted-foreground mb-4">
                Upgrade to Pro to unlock comprehensive weekly analysis with detailed insights and progress tracking.
              </p>
              <Button>Upgrade to Pro</Button>
            </div>
          ) : !geminiApiKey ? (
            <div className="text-center py-12">
              <KeyRound className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">API Key Required</h3>
              <p className="text-muted-foreground mb-4">
                Please set your Google AI API key to generate weekly analysis.
              </p>
              <Button>Set API Key</Button>
            </div>
          ) : isLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-20 mb-2" />
                      <Skeleton className="h-8 w-16" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Skeleton className="h-64 w-full" />
            </div>
                     ) : error ? (
             <div className="text-center py-12">
               <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
               <h3 className="text-lg font-semibold mb-2">No Analysis Available</h3>
               <p className="text-muted-foreground mb-4">{error}</p>
               <p className="text-sm text-muted-foreground mb-4">
                 Complete tasks throughout the week to automatically generate your weekly analysis.
               </p>
             </div>
          ) : analysis ? (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Overall Score</p>
                        <p className={cn("text-2xl font-bold", getScoreColor(analysis.overallScore))}>
                          {analysis.overallScore}
                        </p>
                      </div>
                      <Badge className={getScoreBadge(analysis.overallScore).color}>
                        {getScoreBadge(analysis.overallScore).label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Completion Rate</p>
                        <p className="text-2xl font-bold text-blue-500">
                          {Math.round(analysis.completionRate)}%
                        </p>
                      </div>
                      <Target className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Productivity</p>
                        <p className="text-2xl font-bold text-green-500">
                          {Math.round(analysis.productivityScore)}
                        </p>
                      </div>
                      <Activity className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Balance</p>
                        <p className="text-2xl font-bold text-purple-500">
                          {Math.round(analysis.balanceScore)}
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="insights">Insights</TabsTrigger>
                  <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                  <TabsTrigger value="trends">Trends</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* Enhanced Progress Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Weekly Progress
                      </CardTitle>
                      <div className="text-sm text-muted-foreground">
                        {weekSummary ? (
                          `${weekSummary.completedBlocks} of ${weekSummary.totalBlocks} tasks completed this week`
                        ) : (
                          'Daily completion rates and activity levels'
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="relative h-80">
                        {/* Enhanced grid lines */}
                        <div className="pointer-events-none absolute inset-0">
                          <div className="absolute inset-0 grid grid-rows-5">
                            <div className="border-t border-border/40" />
                            <div className="border-t border-border/40" />
                            <div className="border-t border-border/40" />
                            <div className="border-t border-border/40" />
                            <div className="border-t border-border/40" />
                          </div>
                        </div>

                        <div className="absolute inset-0 flex items-end justify-between gap-1 px-8 pb-16">
                          {weekProgressData.length > 0 ? weekProgressData.map((day) => {
                            const pct = Math.max(0, Math.min(100, day.completionRate));
                            // Ensure minimum height of 8px for visibility when there's any data
                            const heightPct = pct > 0 ? Math.max(8, (pct / 100) * 100) : day.workHours > 0 || day.personalHours > 0 ? 5 : 0;
                            const isToday = format(new Date(), 'yyyy-MM-dd') === day.date;
                            const dayName = format(new Date(day.date), 'EEE');
                            const totalHours = day.workHours + day.personalHours;
                            
                            return (
                              <div key={day.date} className="flex flex-col items-center gap-3 w-16 group cursor-pointer">
                                {/* Day label */}
                                <div className={cn(
                                  "text-xs font-medium transition-colors",
                                  isToday ? "text-primary font-bold" : "text-muted-foreground group-hover:text-foreground"
                                )}>
                                  {dayName}
                                  {isToday && (
                                    <div className="w-1 h-1 bg-primary rounded-full mx-auto mt-1" />
                                  )}
                                </div>
                                
                                {/* Chart bar container */}
                                <div className="relative w-full h-48 flex items-end">
                                  {/* Completion rate bar */}
                                  <div
                                    className={cn(
                                      "w-full rounded-t-md shadow-sm transition-all duration-700 group-hover:shadow-lg border border-white/20",
                                      pct >= 80 ? "bg-gradient-to-t from-green-600 via-green-500 to-green-400" :
                                      pct >= 60 ? "bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400" :
                                      pct >= 40 ? "bg-gradient-to-t from-yellow-600 via-yellow-500 to-yellow-400" :
                                      pct > 0 ? "bg-gradient-to-t from-orange-600 via-orange-500 to-orange-400" :
                                      totalHours > 0 ? "bg-gradient-to-t from-gray-500 via-gray-400 to-gray-300" :
                                      "bg-gradient-to-t from-gray-300 to-gray-200"
                                    )}
                                    style={{ height: `${heightPct}%` }}
                                  >
                                    {/* Glow effect for better visibility */}
                                    {pct > 0 && (
                                      <div className={cn(
                                        "absolute inset-0 rounded-t-md opacity-50",
                                        pct >= 80 ? "shadow-lg shadow-green-400/50" :
                                        pct >= 60 ? "shadow-lg shadow-blue-400/50" :
                                        pct >= 40 ? "shadow-lg shadow-yellow-400/50" :
                                        "shadow-lg shadow-orange-400/50"
                                      )} />
                                    )}
                                  </div>
                                  
                                  {/* Tooltip on hover */}
                                  <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                    <div className="font-medium">{format(new Date(day.date), 'MMM d')}</div>
                                    <div>Completion: {Math.round(pct)}%</div>
                                    <div>Hours: {Math.round(totalHours * 10) / 10}h</div>
                                    <div>Productivity: {Math.round(day.productivityScore)}</div>
                                  </div>
                                </div>
                                
                                {/* Percentage label */}
                                <div className={cn(
                                  "text-xs font-bold transition-colors",
                                  pct >= 70 ? "text-green-600" : 
                                  pct >= 50 ? "text-blue-600" : 
                                  pct > 0 ? "text-orange-600" : 
                                  totalHours > 0 ? "text-gray-600" : "text-gray-400"
                                )}>
                                  {Math.round(pct)}%
                                </div>
                                
                                {/* Hours indicator */}
                                {totalHours > 0 && (
                                  <div className="text-[10px] text-muted-foreground">
                                    {Math.round(totalHours * 10) / 10}h
                                  </div>
                                )}
                              </div>
                            );
                          }) : (
                            // Fallback when no data is available
                            ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                              <div key={day} className="flex flex-col items-center gap-3 w-16">
                                <div className="text-xs font-medium text-muted-foreground">{day}</div>
                                <div className="relative w-full h-48 flex items-end">
                                  <div className="w-full h-2 bg-gradient-to-t from-gray-200 to-gray-100 rounded-t-md" />
                                </div>
                                <div className="text-xs font-bold text-gray-400">0%</div>
                                <div className="text-[10px] text-muted-foreground">No data</div>
                              </div>
                            ))
                          )}
                        </div>
                        
                        {/* Chart legend */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/80 to-transparent">
                          <div className="flex items-center justify-center gap-6 text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-gradient-to-t from-green-600 to-green-400 rounded" />
                              <span className="text-muted-foreground">Excellent (80%+)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-gradient-to-t from-blue-600 to-blue-400 rounded" />
                              <span className="text-muted-foreground">Good (60%+)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-gradient-to-t from-orange-600 to-orange-400 rounded" />
                              <span className="text-muted-foreground">Needs Work</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Weekly Statistics Summary */}
                  {weekSummary && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-5 w-5" />
                          Week at a Glance
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
                            <div className="text-2xl font-bold text-primary">{weekSummary.totalBlocks}</div>
                            <div className="text-sm text-muted-foreground">Total Tasks</div>
                          </div>
                          <div className="text-center p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                            <div className="text-2xl font-bold text-green-600">{weekSummary.completedBlocks}</div>
                            <div className="text-sm text-muted-foreground">Completed</div>
                          </div>
                          <div className="text-center p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                            <div className="text-2xl font-bold text-blue-600">{Math.round(weekSummary.totalHours)}h</div>
                            <div className="text-sm text-muted-foreground">Total Hours</div>
                          </div>
                          <div className="text-center p-4 rounded-lg bg-orange-500/5 border border-orange-500/20">
                            <div className="text-2xl font-bold text-orange-600">
                              {weekSummary.totalBlocks > 0 ? Math.round((weekSummary.completedBlocks / weekSummary.totalBlocks) * 100) : 0}%
                            </div>
                            <div className="text-sm text-muted-foreground">Success Rate</div>
                          </div>
                        </div>
                        
                        {/* Category breakdown */}
                        <div className="mt-6">
                          <h4 className="text-sm font-medium mb-3">Category Breakdown</h4>
                          <div className="space-y-3">
                            {Object.entries(weekSummary.categoryBreakdown).map(([category, data]) => {
                              if (data.blocks === 0) return null;
                              const completionRate = data.blocks > 0 ? (data.completed / data.blocks) * 100 : 0;
                              return (
                                <div key={category} className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "w-3 h-3 rounded-full",
                                      category === 'work' ? "bg-blue-500" :
                                      category === 'personal' ? "bg-green-500" :
                                      category === 'study' ? "bg-purple-500" :
                                      category === 'break' ? "bg-yellow-500" :
                                      category === 'health' ? "bg-red-500" : "bg-gray-500"
                                    )} />
                                    <span className="text-sm capitalize">{category}</span>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm">
                                    <span>{data.completed}/{data.blocks} tasks</span>
                                    <span>{Math.round(data.hours * 10) / 10}h</span>
                                    <span className={cn(
                                      "font-medium",
                                      completionRate >= 80 ? "text-green-600" :
                                      completionRate >= 60 ? "text-blue-600" :
                                      completionRate >= 40 ? "text-yellow-600" : "text-red-600"
                                    )}>
                                      {Math.round(completionRate)}%
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Detailed Scores */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Score Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Productivity</span>
                            <span>{Math.round(analysis.productivityScore)}</span>
                          </div>
                          <Progress value={analysis.productivityScore} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Consistency</span>
                            <span>{Math.round(analysis.consistencyScore)}</span>
                          </div>
                          <Progress value={analysis.consistencyScore} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Balance</span>
                            <span>{Math.round(analysis.balanceScore)}</span>
                          </div>
                          <Progress value={analysis.balanceScore} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Time Distribution</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Work</span>
                          <span className="font-medium">{Math.round(analysis.totalWorkHours)}h</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Personal</span>
                          <span className="font-medium">{Math.round(analysis.totalPersonalHours)}h</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Study</span>
                          <span className="font-medium">{Math.round(analysis.totalStudyHours)}h</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Break</span>
                          <span className="font-medium">{Math.round(analysis.totalBreakHours)}h</span>
                        </div>
                        {weekSummary && (
                          <div className="pt-3 border-t border-border/50">
                            <div className="flex justify-between items-center text-sm font-medium">
                              <span>Total Planned</span>
                              <span>{Math.round(weekSummary.totalHours)}h</span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                              <span>Health Activities</span>
                              <span>{Math.round(weekSummary.categoryBreakdown.health?.hours || 0)}h</span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="insights" className="space-y-4">
                  {analysis.insights.map((insight, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-2 rounded-full",
                            insight.impact === 'positive' ? "bg-green-100 text-green-600" :
                            insight.impact === 'negative' ? "bg-red-100 text-red-600" :
                            "bg-blue-100 text-blue-600"
                          )}>
                            {insight.type === 'productivity' && <Activity className="h-4 w-4" />}
                            {insight.type === 'consistency' && <Target className="h-4 w-4" />}
                            {insight.type === 'balance' && <Clock className="h-4 w-4" />}
                            {insight.type === 'improvement' && <TrendingUp className="h-4 w-4" />}
                            {insight.type === 'achievement' && <Award className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{insight.title}</h4>
                            <p className="text-sm text-muted-foreground">{insight.description}</p>
                            {insight.metric && (
                              <div className="mt-2">
                                <Badge variant="secondary">
                                  {insight.metric}% {insight.previousWeek && `(${insight.previousWeek > insight.metric ? '-' : '+'}${Math.abs(insight.metric - insight.previousWeek)}%)`}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="recommendations" className="space-y-4">
                  {analysis.recommendations.map((rec, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-2 rounded-full",
                            rec.priority === 'high' ? "bg-red-100 text-red-600" :
                            rec.priority === 'medium' ? "bg-yellow-100 text-yellow-600" :
                            "bg-green-100 text-green-600"
                          )}>
                            <Lightbulb className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{rec.title}</h4>
                              <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'secondary' : 'default'}>
                                {rec.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Expected Impact: {rec.expectedImpact}%</span>
                              <span>{rec.actionable ? 'Actionable' : 'Informational'}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="trends" className="space-y-4">
                  {analysis.trends.map((trend, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{trend.metric}</h4>
                            <p className="text-sm text-muted-foreground">
                              {trend.currentValue} vs {trend.previousValue}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getTrendIcon(trend.direction)}
                            <Badge variant={trend.significance === 'high' ? 'default' : 'secondary'}>
                              {trend.change > 0 ? '+' : ''}{Math.round(trend.change)}%
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
