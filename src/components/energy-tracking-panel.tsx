
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, Clock, Zap } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { useTimeBubbles } from '@/context/time-bubbles-context';
import { getEnergyOptimizationSuggestions } from '@/ai/flows/energy-optimization';
import type { EnergyOptimizationOutput } from '@/types/ai-types';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export function EnergyTrackingPanel() {
  const [analysis, setAnalysis] = useState<EnergyOptimizationOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, geminiApiKey } = useAuth();
  const { timeBlocks, currentDate } = useTimeBubbles();

  const handleAnalyzeEnergy = async () => {
    if (!geminiApiKey) return;

    const completedTasks = timeBlocks.filter(b => b.completed && b.reflection);
    const upcomingTasks = timeBlocks.filter(b => !b.completed);

    if (completedTasks.length < 2) {
      alert("Please complete and reflect on at least two bubbles to analyze your energy patterns.");
      return;
    }

    setIsLoading(true);
    setAnalysis(null);
    try {
      const result = await getEnergyOptimizationSuggestions({
        apiKey: geminiApiKey,
        dailyData: JSON.stringify(completedTasks.map(t => ({
          title: t.title,
          category: t.category,
          startTime: format(t.startTime, 'HH:mm'),
          reflection: t.reflection,
        }))),
        upcomingTasks: JSON.stringify(upcomingTasks.map(t => ({
          id: t.id,
          title: t.title,
          category: t.category,
          duration: t.duration,
        }))),
        currentTime: format(new Date(), 'HH:mm')
      });

      setAnalysis(result);
    } catch (error) {
      console.error('Failed to get energy recommendations:', error);
      alert("There was an error analyzing your energy. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const getEnergyIcon = (level: number) => {
    if (level <= 2) return <Zap className="h-4 w-4 text-red-500" />;
    if (level <= 3) return <Zap className="h-4 w-4 text-yellow-500" />;
    return <Zap className="h-4 w-4 text-green-500" />;
  };

  const getEnergyLabel = (level: number) => {
    const labels = ['Very Low', 'Low', 'Moderate', 'High', 'Very High'];
    return labels[Math.round(level) - 1];
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Energy Optimizer
          </CardTitle>
          <CardDescription>
            Let AI analyze your reflections to find your peak energy times and optimize your schedule.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleAnalyzeEnergy} disabled={isLoading || !geminiApiKey} className="w-full">
            {isLoading ? 'Analyzing...' : 'Analyze Energy & Optimize Schedule'}
          </Button>
           {!geminiApiKey && (
             <p className="text-xs text-muted-foreground text-center mt-2">Please set your Gemini API key to use this feature.</p>
           )}
        </CardContent>
      </Card>

      {isLoading && (
         <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm">Analyzing reflections...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {analysis && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" />
                Energy Forecast
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2 text-center">
                <div>
                    <p className="text-sm text-muted-foreground">Next Hour</p>
                    <div className="flex items-center justify-center gap-1 font-semibold">
                        {getEnergyIcon(analysis.energyForecast.nextHour)}
                        <span>{getEnergyLabel(analysis.energyForecast.nextHour)}</span>
                    </div>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Next 3 Hrs</p>
                    <div className="flex items-center justify-center gap-1 font-semibold">
                        {getEnergyIcon(analysis.energyForecast.nextThreeHours)}
                        <span>{getEnergyLabel(analysis.energyForecast.nextThreeHours)}</span>
                    </div>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Evening</p>
                    <div className="flex items-center justify-center gap-1 font-semibold">
                        {getEnergyIcon(analysis.energyForecast.evening)}
                        <span>{getEnergyLabel(analysis.energyForecast.evening)}</span>
                    </div>
                </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                Scheduling Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysis.recommendations.length > 0 ? analysis.recommendations.map((rec, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-lg border">
                  <div className="font-medium text-sm">{rec.taskId}</div>
                  <div className="flex items-center gap-2 text-sm text-primary font-semibold my-1">
                    <Clock className="h-3 w-3" />
                    <span>Suggested Time: {rec.suggestedTime}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{rec.reasoning}</p>
                </div>
              )) : (
                <Alert>
                  <AlertTitle>No recommendations right now.</AlertTitle>
                  <AlertDescription>
                    All your upcoming tasks seem well-placed, or there isn't enough data to suggest a change.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
