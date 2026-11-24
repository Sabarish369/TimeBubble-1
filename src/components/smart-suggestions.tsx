
'use client';

import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTimeBubbles } from '@/context/time-bubbles-context';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { Skeleton } from './ui/skeleton';
import { DailyInsights } from '@/types/ai-types';
import { useAuth } from '@/context/auth-context';
import { useState, useEffect } from 'react';
import { ApiKeyModal } from './api-key-modal';

export function SmartSuggestions() {
  const { getDailyInsights, dailyInsights, isLoadingInsights, clearDailyInsights } = useTimeBubbles();
  const { geminiApiKey } = useAuth();
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Listen for API key modal events
  useEffect(() => {
    const handleOpenApiKeyModal = () => {
      setIsApiKeyModalOpen(true);
    };
    
    window.addEventListener('openApiKeyModal', handleOpenApiKeyModal);
    return () => window.removeEventListener('openApiKeyModal', handleOpenApiKeyModal);
  }, []);

  const handleOpen = () => {
    if (!geminiApiKey) {
      setIsApiKeyModalOpen(true);
    }
    // If they have a key, the SheetTrigger will open the sheet automatically
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    if (!geminiApiKey) {
      e.preventDefault(); // Prevent Sheet from opening
      handleOpen();
    }
  }

  const renderInsight = (title: string, content: string) => (
    <div className="mb-4">
      <p className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent bg-[size:200%_auto] animate-gradient-move">{title}</p>
      <p className="text-sm text-muted-foreground">{content}</p>
    </div>
  );

  return (
    <>
      <Sheet onOpenChange={(open) => !open && clearDailyInsights()}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" onClick={handleTriggerClick}>
            <Sparkles className="h-5 w-5 text-amber-500" />
            <span className="sr-only">Daily Insights</span>
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[400px] sm:w-[400px] sm:max-w-none bg-background/80 backdrop-blur-lg border-l border-border/50">
          <SheetHeader className='mb-4 text-left'>
            <SheetTitle className="flex items-center text-2xl">
              <Sparkles className="h-7 w-7 mr-3 text-amber-400" />
              Daily Insights
            </SheetTitle>
            <SheetDescription>
              Your personalized AI-powered daily summary and analysis.
            </SheetDescription>
          </SheetHeader>
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
                  {renderInsight("💡 Productivity Insight", dailyInsights.productivityInsight)}
                  {renderInsight("😊 Mood Insight", dailyInsights.moodInsight)}
                  {renderInsight("🚀 Recommendation", dailyInsights.recommendation)}
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Click the button below to analyze your day and get personalized insights.
              </div>
            )}
          </div>
          <div className="absolute bottom-6 left-6 right-6">
            <Button className="w-full" size="lg" onClick={getDailyInsights} disabled={isLoadingInsights}>
              {isLoadingInsights ? 'Analyzing...' : 'Analyze My Day'}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              💡 If you encounter API errors, update your Gemini API key in the modal that opens
            </p>
          </div>
        </SheetContent>
      </Sheet>
      <ApiKeyModal isOpen={isApiKeyModalOpen} onClose={() => setIsApiKeyModalOpen(false)} />
    </>
  );
}
