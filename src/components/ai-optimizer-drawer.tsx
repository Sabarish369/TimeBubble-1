
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
import { ChevronLeft, Lightbulb, Zap, HeartPulse, BrainCircuit, Rocket, Star, Sparkles, Target, Battery, Activity, MessageCircle, ThumbsUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { cn } from '@/lib/utils';
import type { DailyTips, EnhancedTip } from '@/types';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';
import { Card, CardContent } from './ui/card';
import { useAuth } from '@/context/auth-context';
import { ProModal } from './pro-modal';
import { ApiKeyModal } from './api-key-modal';
import { SmartSuggestions } from './smart-suggestions';
import { HabitStackingModal } from './habit-stacking-modal';
import { EnergyTrackingPanel } from './energy-tracking-panel';
import { TipFeedbackModal } from './tip-feedback-modal';
import { tipTrackingSystem, trackTipView } from '@/lib/tip-tracking-system';

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
  const [selectedTipForFeedback, setSelectedTipForFeedback] = useState<EnhancedTip | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  
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
          <div className="text-center mb-4">
            <div className="inline-flex items-center space-x-2 text-amber-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-400"></div>
              <span className="text-sm font-medium">Analyzing your patterns...</span>
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
            <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20">
              <h4 className="text-sm font-semibold text-blue-400 mb-2">
                {dailyTips.summary.overallTheme}
              </h4>
              <p className="text-xs text-slate-300 mb-3">
                {dailyTips.summary.encouragement}
              </p>
              {dailyTips.summary.keyInsights && dailyTips.summary.keyInsights.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {dailyTips.summary.keyInsights.slice(0, 2).map((insight, idx) => (
                    <span key={idx} className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                      {insight}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Tips Carousel */}
          <div className='px-8'>
            <Carousel className="w-full" opts={{ loop: true }}>
              <CarouselContent>
                {dailyTips.tips.map((tip, index) => {
                  // Track tip view when it's displayed
                  React.useEffect(() => {
                    if (tip.id) {
                      trackTipView(tip.id);
                    }
                  }, [tip.id]);
                  
                  return (
                    <CarouselItem key={tip.id || index}>
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
                          
                          <div className="flex flex-col h-full">
                            {/* Icon and Type */}
                            <div className="flex items-center justify-center mb-4">
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                                {tipIcons[tip.type] ? React.createElement(tipIcons[tip.type], { className: "h-6 w-6 text-white" }) : <Lightbulb className="h-6 w-6 text-white" />}
                              </div>
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 text-center space-y-3">
                              <div>
                                <p className='text-xs font-medium text-amber-400 mb-1'>{tip.type}</p>
                                {tip.title && (
                                  <h5 className="text-sm font-semibold text-white mb-2">{tip.title}</h5>
                                )}
                                <p className="text-sm text-slate-300 leading-relaxed">{tip.suggestion}</p>
                              </div>
                              
                              {/* Additional Info */}
                              {tip.expectedImpact && (
                                <div className="mt-3 pt-3 border-t border-slate-600/30">
                                  <p className="text-xs text-slate-400">
                                    <span className="text-green-400">Expected:</span> {tip.expectedImpact}
                                  </p>
                                </div>
                              )}
                              
                              {/* Time Investment */}
                              {tip.estimatedDuration && (
                                <div className="flex items-center justify-center space-x-2 text-xs text-slate-400">
                                  <span>⏱️</span>
                                  <span>{tip.estimatedDuration}</span>
                                  <span>•</span>
                                  <span className="capitalize">{tip.difficulty}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Feedback Button */}
                            <div className="mt-4 flex justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedTipForFeedback(tip);
                                  setIsFeedbackModalOpen(true);
                                  tipTrackingSystem.trackTipInteraction(tip.id, 'expanded');
                                }}
                                className="bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600/50 text-xs px-3 py-1"
                              >
                                <MessageCircle className="h-3 w-3 mr-1" />
                                Rate Tip
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <CarouselPrevious className='bg-slate-800/80 border-slate-700/50 text-white hover:bg-slate-700/80 -left-2' />
              <CarouselNext className='bg-slate-800/80 border-slate-700/50 text-white hover:bg-slate-700/80 -right-2' />
            </Carousel>
          </div>
          
          {/* Analytics Summary */}
          {dailyTips.analytics && (
            <div className="mt-6 p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center">
                <Activity className="h-4 w-4 mr-2" />
                Your Insights
              </h4>
              <div className="space-y-2 text-xs text-slate-400">
                {dailyTips.analytics.completionRateAnalysis && (
                  <p>📊 {dailyTips.analytics.completionRateAnalysis}</p>
                )}
                {dailyTips.analytics.productivityTrends && (
                  <p>📈 {dailyTips.analytics.productivityTrends}</p>
                )}
                {dailyTips.analytics.strengths && dailyTips.analytics.strengths.length > 0 && (
                  <p>💪 Strengths: {dailyTips.analytics.strengths.slice(0, 2).join(', ')}</p>
                )}
              </div>
            </div>
          )}
          
          {/* Metadata */}
          {dailyTips.metadata && (
            <div className="mt-4 text-center">
              <div className="flex items-center justify-center space-x-4 text-xs text-slate-500">
                <span>Quality: {dailyTips.metadata.dataQuality}/100</span>
                <span>•</span>
                <span>Personalization: {dailyTips.metadata.personalizationLevel}/100</span>
              </div>
              {dailyTips.metadata.suggestedReviewTime && (
                <p className="text-xs text-slate-400 mt-1">
                  💡 Best reviewed {dailyTips.metadata.suggestedReviewTime}
                </p>
              )}
            </div>
          )}
        </div>
      )}
      
      {!isLoadingTips && (!dailyTips || !dailyTips.tips || dailyTips.tips.length === 0) && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
            <Lightbulb className="h-8 w-8 text-slate-400" />
          </div>
          <h4 className="text-lg font-semibold text-white mb-2">Ready for Daily Tips?</h4>
          <p className="text-slate-400 text-sm mb-4">
            Complete tasks with reflections to get personalized AI-powered tips for tomorrow.
          </p>
          <div className="space-y-2 text-xs text-slate-500">
            <p>• Complete at least 3 tasks</p>
            <p>• Add mood and productivity reflections</p>
            <p>• Get insights based on your patterns</p>
          </div>
        </div>
      )}
      
      <div className="mt-6 text-center">
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
      {selectedTipForFeedback && (
        <TipFeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={() => {
            setIsFeedbackModalOpen(false);
            setSelectedTipForFeedback(null);
          }}
          tip={selectedTipForFeedback}
          onFeedbackSubmitted={() => {
            // Optionally refresh tips or show success message
            console.log('Feedback submitted for tip:', selectedTipForFeedback.id);
          }}
        />
      )}
    </>
  );
}
