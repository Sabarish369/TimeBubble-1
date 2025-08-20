
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Battery, BatteryLow, Zap, TrendingUp, Clock, Brain } from 'lucide-react';
import { format, isToday, subDays } from 'date-fns';
import type { EnergyLevel, EnergyTracking } from '@/types';
import { useAuth } from '@/context/auth-context';
import { useTimeBubbles } from '@/context/time-bubbles-context';
import { getEnergyOptimizationSuggestions } from '@/ai/flows/energy-optimization';

export function EnergyTrackingPanel() {
  const [currentEnergy, setCurrentEnergy] = useState<EnergyLevel>(3);
  const [energyContext, setEnergyContext] = useState('');
  const [energyHistory, setEnergyHistory] = useState<EnergyTracking[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, geminiApiKey } = useAuth();
  const { getBlocksForDate, currentDate } = useTimeBubbles();

  useEffect(() => {
    loadEnergyHistory();
  }, [user]);

  const loadEnergyHistory = async () => {
    if (!user) return;
    
    // In a real implementation, this would load from Firestore
    // For now, we'll use localStorage for demo
    const stored = localStorage.getItem(`energy_history_${user.uid}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      setEnergyHistory(parsed.map((e: any) => ({
        ...e,
        timestamp: new Date(e.timestamp)
      })));
    }
  };

  const saveEnergyLevel = async () => {
    if (!user) return;

    const newEntry: EnergyTracking = {
      level: currentEnergy,
      timestamp: new Date(),
      context: energyContext.trim() || undefined
    };

    const updatedHistory = [...energyHistory, newEntry];
    setEnergyHistory(updatedHistory);
    
    // Save to localStorage (in real app, save to Firestore)
    localStorage.setItem(`energy_history_${user.uid}`, JSON.stringify(updatedHistory));
    
    setEnergyContext('');
    
    // Trigger AI recommendations if we have enough data
    if (updatedHistory.length >= 3 && geminiApiKey) {
      await getEnergyRecommendations(updatedHistory);
    }
  };

  const getEnergyRecommendations = async (history: EnergyTracking[]) => {
    if (!geminiApiKey) return;

    setIsLoading(true);
    try {
      const upcomingTasks = await getBlocksForDate(currentDate);
      const incompleteTasks = upcomingTasks.filter(b => !b.completed);

      const result = await getEnergyOptimizationSuggestions({
        apiKey: geminiApiKey,
        energyHistory: JSON.stringify(history.slice(-10)), // Last 10 entries
        upcomingTasks: JSON.stringify(incompleteTasks.map(t => ({
          id: t.id,
          title: t.title,
          category: t.category,
          duration: t.duration,
          startTime: format(t.startTime, 'HH:mm')
        }))),
        currentTime: format(new Date(), 'HH:mm')
      });

      setRecommendations(result.recommendations);
    } catch (error) {
      console.error('Failed to get energy recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEnergyIcon = (level: EnergyLevel) => {
    if (level <= 2) return <BatteryLow className="h-4 w-4 text-red-500" />;
    if (level <= 3) return <Battery className="h-4 w-4 text-yellow-500" />;
    return <Zap className="h-4 w-4 text-green-500" />;
  };

  const getEnergyLabel = (level: EnergyLevel) => {
    const labels = ['Very Low', 'Low', 'Moderate', 'High', 'Very High'];
    return labels[level - 1];
  };

  const todaysEntries = energyHistory.filter(e => isToday(e.timestamp));
  const averageEnergy = todaysEntries.length > 0 
    ? Math.round(todaysEntries.reduce((sum, e) => sum + e.level, 0) / todaysEntries.length)
    : 0;

  return (
    <div className="space-y-4">
      {/* Energy Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Battery className="h-5 w-5" />
            Track Your Energy
          </CardTitle>
          <CardDescription>
            Log your current energy level to get personalized scheduling recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Current Energy Level</span>
              <div className="flex items-center gap-2">
                {getEnergyIcon(currentEnergy)}
                <span className="text-sm">{getEnergyLabel(currentEnergy)}</span>
              </div>
            </div>
            <Slider
              value={[currentEnergy]}
              onValueChange={(value) => setCurrentEnergy(value[0] as EnergyLevel)}
              max={5}
              min={1}
              step={1}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">
              What's affecting your energy? (optional)
            </label>
            <Textarea
              value={energyContext}
              onChange={(e) => setEnergyContext(e.target.value)}
              placeholder="e.g., just had coffee, tired from meeting, post-workout..."
              rows={2}
            />
          </div>

          <Button onClick={saveEnergyLevel} className="w-full">
            Log Energy Level
          </Button>
        </CardContent>
      </Card>

      {/* Today's Energy Summary */}
      {todaysEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Today's Energy Pattern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Average Energy</p>
                <div className="flex items-center gap-2">
                  {getEnergyIcon(averageEnergy as EnergyLevel)}
                  <span className="font-semibold">{getEnergyLabel(averageEnergy as EnergyLevel)}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Entries Today</p>
                <p className="font-semibold">{todaysEntries.length}</p>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              {todaysEntries.slice(-3).map((entry, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {getEnergyIcon(entry.level)}
                    <span>{format(entry.timestamp, 'HH:mm')}</span>
                  </div>
                  {entry.context && (
                    <span className="text-muted-foreground text-xs max-w-32 truncate">
                      {entry.context}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Energy-Optimized Schedule
            </CardTitle>
            <CardDescription>
              AI suggestions based on your energy patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.slice(0, 3).map((rec, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{rec.taskId}</span>
                    <Badge variant={rec.priority === 'high' ? 'default' : 'secondary'}>
                      {rec.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Optimal time: {rec.suggestedTime}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{rec.reasoning}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm">Analyzing energy patterns...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
