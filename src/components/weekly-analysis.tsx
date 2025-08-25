'use client';

import { useState, useEffect, useCallback } from 'react';
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
  
  const { timeBlocks, currentDate, getBlocksForDate } = useTimeBubbles();
  const { user, isPro, geminiApiKey } = useAuth();

  const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
  const currentWeekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  // Generate progress data for the current week by loading each day's blocks
  const [weekProgressData, setWeekProgressData] = useState<ProgressData[]>([]);
  const generateWeekProgressData = useCallback(async () => {
    const weekDays = eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd });
    const results: ProgressData[] = [];

    for (const day of weekDays) {
      const dayKey = format(day, 'yyyy-MM-dd');
      const dayBlocks = await getBlocksForDate(day);

      const completedBlocks = dayBlocks.filter(block => block.completed);
      const completionRate = dayBlocks.length > 0 ? (completedBlocks.length / dayBlocks.length) * 100 : 0;

      const productivityScores = completedBlocks
        .map(block => block.reflection?.productivity || 0)
        .filter(score => score > 0);
      const averageProductivity = productivityScores.length > 0
        ? productivityScores.reduce((sum: number, score: number) => sum + score, 0) / productivityScores.length
        : 0;

      const moodScoreMap: Record<string, number> = {
        'happy': 5,
        'focused': 4,
        'neutral': 3,
        'stressed': 2,
        'tired': 1
      };
      const moodScores = completedBlocks
        .map(block => block.reflection?.mood ? moodScoreMap[block.reflection.mood] || 0 : 0)
        .filter(score => score > 0);
      const averageMood = moodScores.length > 0
        ? moodScores.reduce((sum: number, score: number) => sum + score, 0) / moodScores.length
        : 0;

      // Count only completed time for accuracy when nothing is done
      const workHours = completedBlocks
        .filter(block => block.category === 'work')
        .reduce((sum, block) => sum + (block.duration || 0), 0) / 60;
      const personalHours = completedBlocks
        .filter(block => block.category === 'personal')
        .reduce((sum, block) => sum + (block.duration || 0), 0) / 60;

      const hasCompleted = completedBlocks.length > 0;
      const consistencyScore = hasCompleted ? Math.max(0, 100 - (Math.abs(completionRate - 80) * 1.25)) : 0;
      const totalHours = workHours + personalHours;
      const balanceScore = hasCompleted && totalHours > 0 ? Math.max(0, 100 - Math.abs((workHours / totalHours) - 0.6) * 200) : 0;

      results.push({
        date: dayKey,
        completionRate,
        productivityScore: averageProductivity * 20,
        moodScore: averageMood * 20,
        workHours,
        personalHours,
        consistencyScore,
        balanceScore,
      });
    }

    setWeekProgressData(results);
  }, [currentWeekStart, currentWeekEnd, getBlocksForDate]);

  useEffect(() => {
    if (isOpen) {
      generateWeekProgressData();
    }
  }, [isOpen, currentWeekStart, currentWeekEnd, generateWeekProgressData]);

  const fetchWeeklyAnalysis = useCallback(async () => {
    if (!isPro || !geminiApiKey) {
      setError('Pro subscription and API key required for weekly analysis');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Load stored weekly analysis from Firestore
      const weeklyAnalysisRef = doc(db, 'users', user?.uid || '', 'weekly_analysis', format(currentWeekStart, 'yyyy-MM-dd'));
      const docSnap = await getDoc(weeklyAnalysisRef);
      
      if (docSnap.exists()) {
        setAnalysis(docSnap.data() as WeeklyAnalysis);
      } else {
        // If no stored analysis, show message that it will be generated as tasks are completed
        setError('Weekly analysis will be generated automatically as you complete tasks this week.');
      }
    } catch (err: any) {
      console.error('Failed to fetch weekly analysis:', err);
      setError(err.message || 'Failed to load weekly analysis');
    } finally {
      setIsLoading(false);
    }
  }, [isPro, geminiApiKey, currentWeekStart, user]);

  useEffect(() => {
    if (isOpen && isPro && geminiApiKey) {
      fetchWeeklyAnalysis();
    }
  }, [isOpen, isPro, geminiApiKey]);

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
                {format(currentWeekStart, 'MMM d')} - {format(currentWeekEnd, 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
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
                  {/* Progress Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Weekly Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="relative h-64">
                        {/* subtle grid lines */}
                        <div className="pointer-events-none absolute inset-0 grid grid-rows-4">
                          <div className="border-t border-border/40" />
                          <div className="border-t border-border/40" />
                          <div className="border-t border-border/40" />
                          <div className="border-t border-border/40" />
                        </div>

                        <div className="absolute inset-0 flex items-end justify-between gap-2 px-1">
                          {weekProgressData.map((day) => {
                            const pct = Math.max(0, Math.min(100, day.completionRate));
                            const heightPct = pct > 0 ? Math.max(6, pct) : 0; // ensure visible for non-zero
                            return (
                              <div key={day.date} className="flex flex-col items-center gap-2 w-10">
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(day.date), 'EEE')}
                                </div>
                                <div
                                  className="w-full rounded-t bg-gradient-to-b from-primary to-accent shadow-sm transition-[height] duration-500"
                                  style={{ height: `${heightPct}%` }}
                                />
                                <div className="text-xs font-medium">
                                  {Math.round(pct)}%
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

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
                          <span className="text-sm">Break</span>
                          <span className="font-medium">{Math.round(analysis.totalBreakHours)}h</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Study</span>
                          <span className="font-medium">{Math.round(analysis.totalStudyHours)}h</span>
                        </div>
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
