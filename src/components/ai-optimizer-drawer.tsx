
'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  const [isClient, setIsClient] = useState(false);
  
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

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  const handleFetchTips = useCallback(() => {
    if (isPro && geminiApiKey) {
        getDailyTips();
    }
    setView('tips');
  }, [isPro, geminiApiKey, getDailyTips]);
  
  const handleFetchInsights = useCallback(() => {
    if (isPro && geminiApiKey && !dailyInsights && !isLoadingInsights) {
        getDailyInsights();
    }
    setView('insights');
  }, [isPro, geminiApiKey, dailyInsights, isLoadingInsights, getDailyInsights]);

  const renderMainView = () => (
    <div className="space-y-6 pt-4">
      <div 
        className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-amber-400/30 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-400/10 cursor-pointer backdrop-blur-sm"
        onClick={handleFetchInsights}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-orange-500 flex items-center justify-center shadow-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white mb-2">Daily Insights</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Get AI-powered analysis of your daily patterns and productivity insights.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div 
        className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-amber-400/30 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-400/10 cursor-pointer backdrop-blur-sm"
        onClick={handleFetchTips}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <Lightbulb className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white mb-2">Daily Tips</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Receive personalized productivity tips and optimization suggestions.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div 
        className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-amber-400/30 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-400/10 cursor-pointer backdrop-blur-sm"
        onClick={() => setIsHabitStackingOpen(true)}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white mb-2">Habit Stacking</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Build better habits by stacking them with your existing routines.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div 
        className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-amber-400/30 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-400/10 cursor-pointer backdrop-blur-sm"
        onClick={() => setView('energy')}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Battery className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white mb-2">Energy Tracking</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Monitor your energy levels and optimize your schedule accordingly.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {isPro && (
        <div className="flex items-center justify-center space-x-2 p-4 rounded-lg bg-gradient-to-r from-amber-400/20 to-orange-500/20 border border-amber-400/30">
          <Star className="h-4 w-4 text-amber-400" />
          <span className="text-amber-400 font-medium">Pro Features Active</span>
        </div>
      )}
    </div>
  );
  
  const renderInsightsView = () => (
    <div className="py-4">
      
      {isLoadingInsights ? (
        <div className="space-y-4">
          <div className="h-8 w-3/4 bg-slate-700/50 rounded animate-pulse" />
          <div className="h-16 w-full bg-slate-700/50 rounded animate-pulse" />
          <div className="h-12 w-full bg-slate-700/50 rounded animate-pulse" />
          <div className="h-12 w-full bg-slate-700/50 rounded animate-pulse" />
          <div className="h-12 w-full bg-slate-700/50 rounded animate-pulse" />
        </div>
      ) : dailyInsights ? (
        <div className="rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">{dailyInsights.title}</h3>
            <div className="flex space-x-1">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <Sparkles className="h-4 w-4 text-blue-400" />
              <Sparkles className="h-4 w-4 text-purple-400" />
            </div>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">{dailyInsights.summary}</p>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-orange-500 flex items-center justify-center">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-amber-400 mb-1">💡 Productivity Insight</div>
                <div className="text-sm text-slate-300">{dailyInsights.productivityInsight}</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <HeartPulse className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-cyan-400 mb-1">😊 Mood Insight</div>
                <div className="text-sm text-slate-300">{dailyInsights.moodInsight}</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Rocket className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-emerald-400 mb-1">🚀 Recommendation</div>
                <div className="text-sm text-slate-300">{dailyInsights.recommendation}</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-slate-400 text-sm">
            Click the button below to analyze your day and get personalized insights.
          </p>
        </div>
      )}
      <div className="mt-6 text-center">
        <Button 
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium px-6 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl" 
          onClick={getDailyInsights} 
          disabled={isLoadingInsights}
        >
            {isLoadingInsights ? "Analyzing..." : "Analyze My Day"}
        </Button>
      </div>
    </div>
  );

  const renderTipsView = () => (
    <div>
      
      {isLoadingTips && (
        <div className="space-y-4 pt-4">
          <div className="h-40 w-full bg-slate-700/50 rounded animate-pulse" />
          <div className="flex justify-center gap-4">
            <div className="h-8 w-16 bg-slate-700/50 rounded animate-pulse" />
            <div className="h-8 w-16 bg-slate-700/50 rounded animate-pulse" />
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
                    <div className="rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 p-6 aspect-square relative backdrop-blur-sm">
                        <div className="absolute top-3 right-3 flex space-x-1">
                          <Sparkles className="h-3 w-3 text-amber-400" />
                          <Sparkles className="h-3 w-3 text-blue-400" />
                        </div>
                        <div className="flex flex-col items-center text-center h-full justify-center space-y-4">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                            {tipIcons[tip.type] ? React.createElement(tipIcons[tip.type], { className: "h-6 w-6 text-white" }) : <Lightbulb className="h-6 w-6 text-white" />}
                          </div>
                          <div>
                            <p className='text-xs font-medium text-amber-400 mb-2'>{tip.type}</p>
                            <p className="text-sm text-slate-300 leading-relaxed">{tip.suggestion}</p>
                          </div>
                        </div>
                    </div>
                    </div>
                </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className='bg-slate-800/80 border-slate-700/50 text-white hover:bg-slate-700/80 -left-2' />
            <CarouselNext className='bg-slate-800/80 border-slate-700/50 text-white hover:bg-slate-700/80 -right-2' />
            </Carousel>
        </div>
      )}
      {!isLoadingTips && (!dailyTips || dailyTips.tips.length === 0) && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
            <Lightbulb className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-slate-400 text-sm">
            Once you complete a day's schedule, refresh to get tips for tomorrow.
          </p>
        </div>
      )}
      <div className="mt-6 text-center">
        <Button 
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium px-6 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl" 
          onClick={getDailyTips} 
          disabled={isLoadingTips}
        >
          {isLoadingTips ? "Optimizing..." : "Refresh Tips"}
        </Button>
      </div>
    </div>
  );

  const renderEnergyView = () => (
    <EnergyTrackingPanel />
  );
  
  if (!isClient) {
    return null;
  }

  return (
    <>
      <button 
        id="ai-tips-drawer-trigger"
        onClick={handleOpen}
        className={cn(
          "ai-button-trigger",
          isOpen && "open"
        )}
        aria-label="Open AI Optimizer"
      >
        <Sparkles 
          className="h-6 w-6 text-white drop-shadow-sm" 
        />
      </button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="ai-optimizer-sheet">
          {/* AI Magic Bubbles */}
          <div className="ai-magic-bubble-1" />
          <div className="ai-magic-bubble-2" />
          <div className="ai-magic-bubble-3" />
          <div className="ai-magic-bubble-4" />
          <div className="ai-magic-bubble-5" />
          
          <SheetHeader className='mb-6'>
            <SheetTitle asChild>
                <div className='relative flex items-center justify-center'>
                    {view !== 'main' && (
                        <Button variant="ghost" size="sm" onClick={() => setView('main')} className="ai-back-button">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    )}
                    <div className="ai-sheet-title">
                      <div className="ai-title-icon">
                        <div className="ai-title-glow" />
                        <Sparkles className="h-8 w-8 text-amber-400 relative z-10"/>
                      </div>
                      <span className="ai-title-text">AI Optimizer</span>
                    </div>
                </div>
            </SheetTitle>
            <SheetDescription asChild>
                <p className="ai-sheet-description">
                    Your hub for AI-powered productivity features.
                </p>
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
