
'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from './ui/button';
import { useTimeBubbles, type MissedTaskGroup } from '@/context/time-bubbles-context';
import { ChevronLeft, Lightbulb, Zap, HeartPulse, BrainCircuit, Rocket, Star, Sparkles, Target, Battery, Activity } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { cn } from '@/lib/utils';
import type { DailyTips } from '@/types';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';
import { Card, CardContent } from './ui/card';
import { useAuth } from '@/context/auth-context';
import { ProModal } from './pro-modal';
import { ApiKeyModal } from './api-key-modal';
import { SmartSuggestions } from './smart-suggestions';
import { HabitStackingModal } from './habit-stacking-modal';
import { EnergyTrackingPanel } from './energy-tracking-panel';

const tipIcons: Record<string, LucideIcon> = {
  Productivity: Zap,
  Health: HeartPulse,
  Mindfulness: BrainCircuit,
  Efficiency: Rocket,
  Motivation: Lightbulb,
};

type View = 'main' | 'insights' | 'tips' | 'habit' | 'energy';

export function AIOptimizerDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<View>('main');
  
  const { 
    getDailyTips, 
    dailyTips, 
    isLoadingTips,
    getDailyInsights,
    dailyInsights,
    isLoadingInsights,
    clearDailyInsights,
    timeBlocks
  } = useTimeBubbles();
  
  const { isPro, geminiApiKey } = useAuth();
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isHabitStackingOpen, setIsHabitStackingOpen] = useState(false);

  const handleOpen = (e: React.MouseEvent) => {
    if (!isPro) {
      e.preventDefault();
      setIsProModalOpen(true);
    } else if (!geminiApiKey) {
      e.preventDefault();
      setIsApiKeyModalOpen(true);
    } else {
      setIsOpen(true);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setView('main'); // Reset view when drawer closes
      clearDailyInsights();
    }
  }, [isOpen, clearDailyInsights]);

  const handleFetchTips = () => {
    if (isPro && geminiApiKey && !dailyTips && !isLoadingTips) {
        getDailyTips();
    }
    setView('tips');
  }
  
  const handleFetchInsights = () => {
    if (isPro && geminiApiKey && !dailyInsights && !isLoadingInsights) {
        getDailyInsights();
    }
    setView('insights');
  }

  const renderMainView = () => (
    <div className="space-y-4 pt-4">
      <Button variant="outline" className="w-full justify-start gap-3 py-6 text-base" onClick={handleFetchInsights}>
        <Activity className="h-5 w-5 text-primary" /> Daily Insights
      </Button>
      <Button variant="outline" className="w-full justify-start gap-3 py-6 text-base" onClick={handleFetchTips}>
        <Lightbulb className="h-5 w-5 text-amber-500" /> Daily Tips
      </Button>
      <Button variant="outline" className="w-full justify-start gap-3 py-6 text-base" onClick={() => setIsHabitStackingOpen(true)}>
        <Target className="h-5 w-5 text-green-500" /> Habit Stacking
      </Button>
      <Button variant="outline" className="w-full justify-start gap-3 py-6 text-base" onClick={() => setView('energy')}>
        <Battery className="h-5 w-5 text-blue-500" /> Energy Tracking
      </Button>
    </div>
  );
  
  const renderInsightsView = () => (
    <div className="py-4">
      {isLoadingInsights ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : dailyInsights ? (
        <Card className="border-none shadow-none bg-transparent">
          <CardContent className="p-0">
            <h3 className="font-bold text-xl mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent bg-[size:200%_auto] animate-gradient-move">{dailyInsights.title}</h3>
            <p className="text-base text-muted-foreground mb-6">{dailyInsights.summary}</p>
            <div className="mb-4">
              <p className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent bg-[size:200%_auto] animate-gradient-move">💡 Productivity Insight</p>
              <p className="text-sm text-muted-foreground">{dailyInsights.productivityInsight}</p>
            </div>
             <div className="mb-4">
              <p className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent bg-[size:200%_auto] animate-gradient-move">😊 Mood Insight</p>
              <p className="text-sm text-muted-foreground">{dailyInsights.moodInsight}</p>
            </div>
             <div className="mb-4">
              <p className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent bg-[size:200%_auto] animate-gradient-move">🚀 Recommendation</p>
              <p className="text-sm text-muted-foreground">{dailyInsights.recommendation}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Click the button below to analyze your day and get personalized insights.
        </div>
      )}
      <div className="mt-6 text-center">
        <Button onClick={getDailyInsights} disabled={isLoadingInsights}>
            {isLoadingInsights ? "Analyzing..." : "Analyze My Day"}
        </Button>
      </div>
    </div>
  );

  const renderTipsView = () => (
    <>
      {isLoadingTips && (
        <div className="space-y-4 pt-4">
          <Skeleton className="h-40 w-full" />
          <div className="flex justify-center gap-4">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      )}
      {!isLoadingTips && dailyTips && dailyTips.tips.length > 0 && (
        <div className='relative px-8'>
            <Carousel className="w-full" opts={{ loop: true }}>
            <CarouselContent>
                {dailyTips.tips.map((tip, index) => (
                <CarouselItem key={index}>
                    <div className="p-1">
                    <Card className='bg-secondary/40 border-none'>
                        <CardContent className="flex flex-col items-center justify-center p-6 aspect-square">
                        <div className="h-6 w-6 mb-3 text-primary"><tipIcons.Motivation /></div>
                        <p className='text-lg font-semibold text-primary/90 text-center mb-2'>{tip.type}</p>
                        <p className="text-sm text-center text-foreground/80">{tip.suggestion}</p>
                        </CardContent>
                    </Card>
                    </div>
                </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className='-left-2' />
            <CarouselNext className='-right-2' />
            </Carousel>
        </div>
      )}
      {!isLoadingTips && (!dailyTips || dailyTips.tips.length === 0) && (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertTitle>No tips available yet.</AlertTitle>
          <AlertDescription>
            Once you complete a day's schedule, refresh to get tips for tomorrow.
          </AlertDescription>
        </Alert>
      )}
      <div className="mt-6 text-center">
        <Button onClick={getDailyTips} disabled={isLoadingTips}>
          {isLoadingTips ? "Optimizing..." : "Refresh Tips"}
        </Button>
      </div>
    </>
  );

  const renderEnergyView = () => (
    <EnergyTrackingPanel />
  );

  return (
    <>
      <div id="ai-tips-drawer-trigger" className={cn("fixed top-1/2 -translate-y-1/2 right-0 z-40 transition-transform duration-500", isOpen && "translate-x-[-384px]")}>
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-r-none rounded-l-full h-16 w-10 border-r-0 pulse-glow"
            onClick={handleOpen}
          >
              <Sparkles className="h-5 w-5 text-amber-400" />
          </Button>
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-[400px] sm:w-[400px] sm:max-w-none bg-background/80 backdrop-blur-lg border-l border-border/50">
          <SheetHeader className='mb-4'>
            {view !== 'main' && (
              <Button variant="ghost" size="sm" onClick={() => setView('main')} className="absolute top-4 left-4 h-auto p-1.5">
                  <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            <SheetTitle className="flex items-center justify-center text-2xl">
                <Sparkles className="h-7 w-7 mr-3 text-amber-400"/>
                AI Optimizer
            </SheetTitle>
            <SheetDescription className='text-center'>
                Your hub for AI-powered productivity features.
            </SheetDescription>
          </SheetHeader>
          
          <div className="h-full overflow-y-auto pb-20 no-scrollbar">
            {view === 'main' && renderMainView()}
            {view === 'insights' && renderInsightsView()}
            {view === 'tips' && renderTipsView()}
            {view === 'energy' && renderEnergyView()}
          </div>
        </SheetContent>
      </Sheet>

      <ProModal isOpen={isProModalOpen} onClose={() => setIsProModalOpen(false)} />
      <ApiKeyModal isOpen={isApiKeyModalOpen} onClose={() => setIsApiKeyModalOpen(false)} />
       {isPro && (
        <HabitStackingModal 
          isOpen={isHabitStackingOpen} 
          onClose={() => setIsHabitStackingOpen(false)}
          routineBubbles={timeBlocks.filter(b => b.category === 'personal' || b.title.toLowerCase().includes('routine'))}
        />
      )}
    </>
  );
}
