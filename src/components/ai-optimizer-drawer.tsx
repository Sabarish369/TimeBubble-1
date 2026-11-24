
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
import { ChevronLeft, ChevronRight, Lightbulb, Zap, HeartPulse, BrainCircuit, Rocket, Star, Sparkles, Target, Battery, Activity, MessageCircle, ThumbsUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { cn } from '@/lib/utils';
import type { DailyTips } from '@/types';
import type { EnhancedTip } from '@/types/ai-types';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';
import { Card, CardContent } from './ui/card';
import { useAuth } from '@/context/auth-context';
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
  
  const { geminiApiKey } = useAuth();
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isHabitStackingOpen, setIsHabitStackingOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Listen for API key modal events
  useEffect(() => {
    const handleOpenApiKeyModal = () => {
      setIsApiKeyModalOpen(true);
    };
    
    window.addEventListener('openApiKeyModal', handleOpenApiKeyModal);
    return () => window.removeEventListener('openApiKeyModal', handleOpenApiKeyModal);
  }, []);

  const handleOpen = (e: React.MouseEvent) => {
    if (!geminiApiKey) {
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

  // Track tip views when tips are loaded and displayed
  useEffect(() => {
    // Tip tracking removed with feedback system cleanup
  }, [dailyTips, view]);

  const handleFetchTips = useCallback(() => {
    if (geminiApiKey) {
      getDailyTips();
    }
    setView('tips');
  }, [geminiApiKey, getDailyTips]);
  
  const handleFetchInsights = useCallback(() => {
    if (geminiApiKey && !dailyInsights && !isLoadingInsights) {
        getDailyInsights();
    }
    setView('insights');
  }, [geminiApiKey, dailyInsights, isLoadingInsights, getDailyInsights]);

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
              <h3 className="text-xl font-semibold text-white mb-2">Daily Insights</h3>
              <p className="text-slate-300 text-base leading-relaxed">
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
              <h3 className="text-xl font-semibold text-white mb-2">Daily Tips</h3>
              <p className="text-slate-300 text-lg leading-relaxed">
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
              <h3 className="text-xl font-semibold text-white mb-2">Habit Stacking</h3>
              <p className="text-slate-300 text-lg leading-relaxed">
                Coming Very Soon! Build better habits by stacking them with your existing routines.
              </p>
              <div className="mt-2 text-xs text-amber-400 font-medium">
                Feature in development - Contact timebubblehelp@gmail.com for updates
              </div>
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
              <h3 className="text-xl font-semibold text-white mb-2">Energy Tracking</h3>
              <p className="text-slate-300 text-lg leading-relaxed">
                Monitor your energy levels and optimize your schedule accordingly.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-center space-x-2 p-4 rounded-lg bg-gradient-to-r from-amber-400/20 to-orange-500/20 border border-amber-400/30">
        <Star className="h-4 w-4 text-amber-400" />
        <span className="text-amber-400 font-medium">All Features Included</span>
      </div>
    </div>
  );
  
  const renderInsightsView = () => (
    <div className="py-4 px-4">
      
      {isLoadingInsights ? (
        <div className="space-y-4">
          <div className="h-8 w-3/4 bg-slate-700/50 rounded animate-pulse mx-auto" />
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
          <p className="text-lg text-slate-300 leading-relaxed mb-6 text-center">{dailyInsights.summary}</p>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-orange-500 flex items-center justify-center">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-medium text-amber-400 mb-1">💡 Productivity Insight</div>
                <div className="text-lg text-slate-300">{dailyInsights.productivityInsight}</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <HeartPulse className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-medium text-cyan-400 mb-1">😊 Mood Insight</div>
                <div className="text-lg text-slate-300">{dailyInsights.moodInsight}</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Rocket className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-medium text-emerald-400 mb-1">🚀 Recommendation</div>
                <div className="text-lg text-slate-300">{dailyInsights.recommendation}</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-slate-400 text-base max-w-sm mx-auto leading-relaxed">
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
        <p className="text-xs text-slate-400 text-center mt-2">
          💡 If you encounter API errors, update your Gemini API key in the modal that opens
        </p>
      </div>
    </div>
  );

  const renderTipsView = () => (
    <div className="px-4">
      {isLoadingTips && (
        <div className="space-y-4 pt-4">
          <div className="text-center mb-4">
            <div className="inline-flex items-center space-x-2 text-amber-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-400"></div>
              <span className="text-base font-medium">Analyzing your patterns...</span>
            </div>
          </div>
          <div className="h-40 w-full bg-slate-700/50 rounded animate-pulse" />
          <div className="flex justify-center gap-4">
            <div className="h-8 w-24 bg-slate-700/50 rounded animate-pulse" />
            <div className="h-8 w-20 bg-slate-700/50 rounded animate-pulse" />
            <div className="h-8 w-28 bg-slate-700/50 rounded animate-pulse" />
          </div>
          <div className="text-center">
            <div className="h-4 w-3/4 mx-auto bg-slate-700/50 rounded animate-pulse" />
          </div>
        </div>
      )}
      
      {!isLoadingTips && dailyTips && dailyTips.tips && dailyTips.tips.length > 0 && (
        <div className='relative'>
          {/* Tips Summary Section */}
          {dailyTips.summary && (
            <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20 text-center">
              <h4 className="text-lg font-semibold text-blue-400 mb-2">
                {dailyTips.summary.overallTheme}
              </h4>
              <p className="text-base text-slate-300 mb-3 leading-relaxed">
                {dailyTips.summary.encouragement}
              </p>
              {dailyTips.summary.keyInsights && dailyTips.summary.keyInsights.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center">
                  {dailyTips.summary.keyInsights.slice(0, 2).map((insight, idx) => (
                    <span key={idx} className="text-base bg-blue-500/20 text-blue-300 px-3 py-1 rounded">
                      {insight}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Tips Carousel */}
          <div className='relative'>
            <Carousel className="w-full" opts={{ loop: true }}>
              <div className="px-2">
                <CarouselContent className="-ml-2 md:-ml-4">
                  {dailyTips.tips.map((tip, index) => {
                    return (
                      <CarouselItem key={tip.id || index} className="pl-2 md:pl-4">
                        <div className="p-1">
                          <div className="rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 p-6 aspect-square relative backdrop-blur-sm hover:border-amber-400/30 transition-all duration-300">
                            {/* Priority and Difficulty Indicators */}
                            <div className="absolute top-3 left-3 flex space-x-1">
                              {tip.priority === 'high' && (
                                <div className="w-2 h-2 bg-red-400 rounded-full" title="High Priority" />
                              )}
                              {tip.priority === 'medium' && (
                                <div className="w-2 h-2 bg-yellow-400 rounded-full" title="Medium Priority" />
                              )}
                              {tip.priority === 'low' && (
                                <div className="w-2 h-2 bg-green-400 rounded-full" title="Low Priority" />
                              )}
                            </div>
                            
                            <div className="absolute top-3 right-3 flex space-x-1">
                              <Sparkles className="h-3 w-3 text-amber-400" />
                              {tip.personalizedScore > 80 && (
                                <Sparkles className="h-3 w-3 text-blue-400" />
                              )}
                              {tip.personalizedScore > 90 && (
                                <Sparkles className="h-3 w-3 text-purple-400" />
                              )}
                            </div>
                            
                            <div className="flex flex-col h-full justify-between">
                              {/* Icon and Type */}
                              <div className="flex items-center justify-center mb-3">
                                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                                  {tipIcons[tip.type] ? React.createElement(tipIcons[tip.type], { className: "h-8 w-8 text-white" }) : <Lightbulb className="h-8 w-8 text-white" />}
                                </div>
                              </div>
                              
                              {/* Content */}
                              <div className="flex-1 text-center space-y-2">
                                <div>
                                  <p className='text-base font-medium text-amber-400 mb-1'>{tip.type}</p>
                                  {tip.title && (
                                    <h5 className="text-lg font-semibold text-white mb-2 leading-tight">{tip.title}</h5>
                                  )}
                                  <p className="text-base text-slate-300 leading-relaxed px-1">{tip.suggestion}</p>
                                </div>
                                
                                {/* Additional Info */}
                                {tip.expectedImpact && (
                                  <div className="mt-2 pt-2 border-t border-slate-600/30">
                                    <p className="text-sm text-slate-400">
                                      <span className="text-green-400">Expected:</span> {tip.expectedImpact}
                                    </p>
                                  </div>
                                )}
                                
                                {/* Time Investment */}
                                {tip.estimatedDuration && (
                                  <div className="flex items-center justify-center space-x-2 text-sm text-slate-400">
                                    <span>⏱️</span>
                                    <span>{tip.estimatedDuration}</span>
                                    <span>•</span>
                                    <span className="capitalize">{tip.difficulty}</span>
                                  </div>
                                )}
                              </div>
                              
                            </div>
                          </div>
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
              </div>
              <div className="flex justify-between w-full absolute top-1/2 -translate-y-1/2 pointer-events-none">
                <div className="pointer-events-auto">
                  <CarouselPrevious className='bg-green-700 border-green-600/50 text-white hover:bg-green-600 hover:scale-110 h-10 w-10 shadow-lg transition-all duration-300 relative transform-none'>
                    <ChevronLeft className="h-5 w-5" />
                  </CarouselPrevious>
                </div>
                <div className="pointer-events-auto">
                  <CarouselNext className='bg-green-700 border-green-600/50 text-white hover:bg-green-600 hover:scale-110 h-10 w-10 shadow-lg transition-all duration-300 relative transform-none'>
                    <ChevronRight className="h-5 w-5" />
                  </CarouselNext>
                </div>
              </div>
            </Carousel>
          </div>
          
          {/* Analytics Summary */}
          {dailyTips.analytics && (
            <div className="mt-6 mx-4 p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <h4 className="text-lg font-semibold text-slate-300 mb-3 flex items-center justify-center">
                <Activity className="h-5 w-5 mr-2" />
                Your Insights
              </h4>
              <div className="space-y-2 text-base text-slate-400">
                {dailyTips.analytics.completionRateAnalysis && (
                  <p className="text-center">📊 {dailyTips.analytics.completionRateAnalysis}</p>
                )}
                {dailyTips.analytics.productivityTrends && (
                  <p className="text-center">📈 {dailyTips.analytics.productivityTrends}</p>
                )}
                {dailyTips.analytics.strengths && dailyTips.analytics.strengths.length > 0 && (
                  <p className="text-center">💪 Strengths: {dailyTips.analytics.strengths.slice(0, 2).join(', ')}</p>
                )}
              </div>
            </div>
          )}
          
          {/* Metadata */}
          {dailyTips.metadata && (
            <div className="mt-4 text-center">
              <div className="flex items-center justify-center space-x-4 text-sm text-slate-500">
                <span>Quality: {dailyTips.metadata.dataQuality}/100</span>
                <span>•</span>
                <span>Personalization: {dailyTips.metadata.personalizationLevel}/100</span>
              </div>
              {dailyTips.metadata.suggestedReviewTime && (
                <p className="text-sm text-slate-400 mt-1">
                  💡 Best reviewed {dailyTips.metadata.suggestedReviewTime}
                </p>
              )}
            </div>
          )}
        </div>
      )}
      
      {!isLoadingTips && (!dailyTips || !dailyTips.tips || dailyTips.tips.length === 0) && (
        <div className="text-center py-8 px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
            <Lightbulb className="h-8 w-8 text-slate-400" />
          </div>
          <h4 className="text-xl font-semibold text-white mb-2">Ready for Daily Tips?</h4>
          <p className="text-base text-slate-400 mb-4 leading-relaxed max-w-sm mx-auto">
            Add some time blocks for today to get AI-powered tips.
          </p>
          <div className="space-y-2 text-base text-slate-500 max-w-xs mx-auto">
            <p>• Create time blocks for your tasks</p>
            <p>• Complete them with reflections</p>
            <p>• Get insights based on your patterns</p>
          </div>
        </div>
      )}
      
      <div className="mt-6 text-center px-4">
        <Button 
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium px-6 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl" 
          onClick={getDailyTips} 
          disabled={isLoadingTips}
        >
          {isLoadingTips ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Analyzing...
            </>
          ) : (
            "Generate Tips"
          )}
        </Button>
        <p className="text-xs text-slate-400 text-center mt-2">
          💡 If you encounter API errors, update your Gemini API key in the modal that opens
        </p>
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

      <ApiKeyModal isOpen={isApiKeyModalOpen} onClose={() => setIsApiKeyModalOpen(false)} />
      <HabitStackingModal
        isOpen={isHabitStackingOpen}
        onClose={() => setIsHabitStackingOpen(false)}
        routineBubbles={timeBlocks.filter(b => {
            const title = b.title.toLowerCase();
            const category = b.category.toLowerCase();
            
            // Filter for routine-like activities
            return (
              category === 'personal' ||
              category === 'health' ||
              category === 'work' ||
              title.includes('routine') ||
              title.includes('workout') ||
              title.includes('exercise') ||
              title.includes('meeting') ||
              title.includes('breakfast') ||
              title.includes('lunch') ||
              title.includes('dinner') ||
              title.includes('commute') ||
              title.includes('shower') ||
              title.includes('meditation') ||
              title.includes('reading') ||
              b.duration >= 15 // Activities longer than 15 minutes are good anchors
            );
        })}
      />
    </>
  );
}
