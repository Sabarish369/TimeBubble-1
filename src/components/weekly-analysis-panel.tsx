'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTimeBubbles } from '@/context/time-bubbles-context';
import { BarChart2, Trophy, AlertTriangle, ListChecks, Calendar } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

export function WeeklyAnalysisPanel() {
  const {
    getWeeklyAnalysis,
    weeklyAnalysis,
    isLoadingWeeklyAnalysis,
  } = useTimeBubbles();

  const kpiItems = useMemo(() => {
    if (!weeklyAnalysis) return [];
    const k = weeklyAnalysis.kpis;
    return [
      { label: 'Completion Rate', value: `${Math.round(k.completionRate * 100)}%` },
      { label: 'Completed', value: `${k.completedBubbles}/${k.totalBubbles}` },
      { label: 'Total Minutes', value: `${k.totalMinutes}` },
      { label: 'Done Minutes', value: `${k.totalCompletedMinutes}` },
      { label: 'Avg Productivity', value: `${k.avgProductivity.toFixed(2)}` },
      { label: 'Mood', value: `${k.dominantMood}` },
    ];
  }, [weeklyAnalysis]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5" /> Weekly Analysis</CardTitle>
          <CardDescription>Summarize the last 7 days and get a focused plan for next week.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={getWeeklyAnalysis} disabled={isLoadingWeeklyAnalysis}>
            {isLoadingWeeklyAnalysis ? 'Analyzing Week…' : 'Analyze Last 7 Days'}
          </Button>
        </CardContent>
      </Card>

      {isLoadingWeeklyAnalysis && (
        <Card>
          <CardContent className="py-6 space-y-3">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoadingWeeklyAnalysis && weeklyAnalysis && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Overview</CardTitle>
              <CardDescription>{weeklyAnalysis.summary}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {kpiItems.map((i) => (
                  <div key={i.label} className="p-3 rounded-lg bg-muted/50 border">
                    <div className="text-xs text-muted-foreground">{i.label}</div>
                    <div className="font-semibold">{i.value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5" /> Top Wins</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {weeklyAnalysis.topWins.map((w, i) => (
                <div key={i} className="text-sm">• {w}</div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Bottlenecks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {weeklyAnalysis.bottlenecks.map((b, i) => (
                <div key={i} className="text-sm">• {b}</div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5" /> Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {weeklyAnalysis.recommendations.map((r, i) => (
                <div key={i} className="text-sm">• {r}</div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Next Week Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {weeklyAnalysis.nextWeekPlan.map((p, i) => (
                <div key={i} className="text-sm">
                  <span className="font-medium">{p.goal}:</span> {p.rationale}
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

