
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
import { useTimeBubbles } from '@/context/time-bubbles-context';
import { ChevronLeft, Lightbulb, Zap, HeartPulse, BrainCircuit, Rocket } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { cn } from '@/lib/utils';
import type { DailyTips } from '@/types';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';
import { Card, CardContent } from './ui/card';

const tipIcons: Record<string, LucideIcon> = {
  Productivity: Zap,
  Health: HeartPulse,
  Mindfulness: BrainCircuit,
  Efficiency: Rocket,
  Motivation: Lightbulb,
};

export function DailyTipsDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const { getDailyTips, dailyTips, isLoadingTips } = useTimeBubbles();

  useEffect(() => {
    // Fetch tips when the drawer is opened for the first time
    if (isOpen && !dailyTips && !isLoadingTips) {
      getDailyTips();
    }
  }, [isOpen, dailyTips, isLoadingTips, getDailyTips]);
  
  const TipIcon = ({ type }: { type: string }) => {
    const Icon = tipIcons[type] || Lightbulb;
    return <Icon className="h-6 w-6 mb-3 text-primary" />;
  };

  return (
    <>
      <div className={cn("absolute top-1/2 -translate-y-1/2 right-0 z-40 transition-transform duration-500", isOpen && "translate-x-[-384px]")}>
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-r-none rounded-l-full h-16 w-10 border-r-0 pulse-glow"
            onClick={() => setIsOpen(true)}
          >
              <Lightbulb className="h-5 w-5 text-amber-400" />
          </Button>
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-[400px] sm:w-[400px] sm:max-w-none bg-background/80 backdrop-blur-lg border-l border-border/50">
          <SheetHeader className='mb-4'>
            <SheetTitle className="flex items-center text-2xl">
                <Lightbulb className="h-7 w-7 mr-3 text-amber-400"/>
                AI Daily Optimizer
            </SheetTitle>
            <SheetDescription>
                Actionable insights to enhance your focus and well-being, updated throughout your day.
            </SheetDescription>
          </SheetHeader>

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
             <Carousel className="w-full" opts={{loop: true}}>
                <CarouselContent>
                  {dailyTips.tips.map((tip, index) => (
                    <CarouselItem key={index}>
                      <div className="p-1">
                        <Card className='bg-secondary/40 border-none'>
                          <CardContent className="flex flex-col items-center justify-center p-6 aspect-square">
                            <TipIcon type={tip.type} />
                             <p className='text-lg font-semibold text-primary/90 text-center mb-2'>{tip.type}</p>
                             <p className="text-sm text-center text-foreground/80">{tip.suggestion}</p>
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className='-left-4' />
                <CarouselNext className='-right-4' />
              </Carousel>
          )}

          {!isLoadingTips && (!dailyTips || dailyTips.tips.length === 0) && (
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>No tips available yet.</AlertTitle>
                <AlertDescription>
                  Start your day or refresh to get new AI-powered suggestions.
                </AlertDescription>
              </Alert>
          )}

          <div className="mt-6 text-center">
            <Button onClick={getDailyTips} disabled={isLoadingTips}>
                {isLoadingTips ? "Optimizing..." : "Refresh Tips"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
