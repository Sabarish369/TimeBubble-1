
'use client';

import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTimeBubbles } from '@/context/time-bubbles-context';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Skeleton } from './ui/skeleton';
import { DailyInsights } from '@/types/ai-types';

export function SmartSuggestions() {
  const { getDailyInsights, dailyInsights, isLoadingInsights, clearDailyInsights } = useTimeBubbles();

  const renderInsight = (title: string, content: string) => (
    <div className="mb-2">
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-sm text-muted-foreground">{content}</p>
    </div>
  );

  return (
    <Popover onOpenChange={(open) => !open && clearDailyInsights()}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <span className="sr-only">Daily Insights</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96">
        <Card className="border-none shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Daily Insights
            </CardTitle>
            <CardDescription>Your personalized AI-powered daily summary.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingInsights ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : dailyInsights ? (
              <div>
                <h3 className="font-bold text-lg mb-2">{dailyInsights.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{dailyInsights.summary}</p>
                {renderInsight("💡 Productivity Insight", dailyInsights.productivityInsight)}
                {renderInsight("😊 Mood Insight", dailyInsights.moodInsight)}
                {renderInsight("🚀 Recommendation", dailyInsights.recommendation)}
              </div>
            ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">
                    Click the button below to analyze your day and get personalized insights.
                </div>
            )}
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={getDailyInsights} disabled={isLoadingInsights}>
              {isLoadingInsights ? 'Analyzing...' : 'Analyze My Day'}
            </Button>
          </CardFooter>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
