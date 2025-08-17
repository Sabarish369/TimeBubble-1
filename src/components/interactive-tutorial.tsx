
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from './ui/button';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface TutorialStep {
  elementId: string;
  title: string;
  description: string;
  tooltipPosition: 'top' | 'bottom' | 'left' | 'right';
}

const tutorialSteps: TutorialStep[] = [
  {
    elementId: 'sidebar',
    title: 'Welcome to TimeBubble!',
    description: "Let's take a quick tour. This is your sidebar, where you can find templates to quickly plan your day.",
    tooltipPosition: 'right',
  },
  {
    elementId: 'first-template-item',
    title: 'Drag & Drop Templates',
    description: 'Try dragging a template like "Focus Work" from here and dropping it onto the timeline to your right to schedule a task.',
    tooltipPosition: 'right',
  },
  {
    elementId: 'timeline-main',
    title: 'Your Visual Timeline',
    description: "This is your timeline. Double-click anywhere on an empty spot to create a custom time bubble for a specific time.",
    tooltipPosition: 'left',
  },
  {
    elementId: 'header-actions',
    title: 'Daily Insights & More',
    description: "At the end of your day, use the 'Sparkles' icon up here to get AI-powered insights on how you spent your time.",
    tooltipPosition: 'bottom',
  },
  {
    elementId: 'ai-tips-drawer-trigger',
    title: 'Get Proactive Tips',
    description: "Click the lightbulb icon to get real-time AI tips to improve your well-being and productivity throughout the day.",
    tooltipPosition: 'left',
  },
];


interface HighlightStyle {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function InteractiveTutorial({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0);
  const [style, setStyle] = useState<HighlightStyle | null>(null);
  const isMobile = useIsMobile();
  const [show, setShow] = useState(false);

  const calculateStyle = useCallback(() => {
    const element = document.getElementById(tutorialSteps[step].elementId);
    if (element) {
      const rect = element.getBoundingClientRect();
      setStyle({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    } else {
        // If element not found, move to next step or finish
        if (step < tutorialSteps.length - 1) {
            setStep(s => s + 1);
        } else {
            onFinish();
        }
    }
  }, [step, onFinish]);

  useEffect(() => {
     // A small delay to allow the UI to settle before calculating positions.
    const timer = setTimeout(() => {
        calculateStyle();
        setShow(true);
    }, 150);

    window.addEventListener('resize', calculateStyle);
    return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', calculateStyle);
    }
  }, [calculateStyle]);

  const handleNext = () => {
    if (step < tutorialSteps.length - 1) {
      setStep(step + 1);
    } else {
      onFinish();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  if (!style || !show) {
    return null; // Don't render until we have the style
  }

  const currentStep = tutorialSteps[step];
  
  const tooltipPositionClasses = {
      top: `bottom-full left-1/2 -translate-x-1/2 mb-4`,
      bottom: `top-full left-1/2 -translate-x-1/2 mt-4`,
      left: `right-full top-1/2 -translate-y-1/2 mr-4`,
      right: `left-full top-1/2 -translate-y-1/2 ml-4`,
  };

  // Adjust for mobile
  if (isMobile) {
      if (currentStep.tooltipPosition === 'left' || currentStep.tooltipPosition === 'right') {
          currentStep.tooltipPosition = 'bottom';
      }
  }


  return (
    <div className="fixed inset-0 z-[100]">
        {/* Overlay */}
        <div 
            className="fixed inset-0 bg-black/60 transition-all duration-300"
            style={{
                clipPath: `path("M0,0H${window.innerWidth}V${window.innerHeight}H0V0ZM${style.left-4},${style.top-4}V${style.top + style.height+4}H${style.left+style.width+4}V${style.top-4}H${style.left-4}Z")`,
            }}
        />

        {/* Tooltip */}
        <div
            className={cn(
                "absolute w-72 p-4 rounded-lg bg-background text-foreground shadow-2xl transition-all duration-300",
                tooltipPositionClasses[currentStep.tooltipPosition]
            )}
            style={{ 
                top: style.top,
                left: style.left
            }}
        >
            <h3 className="font-bold text-lg mb-2">{currentStep.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{currentStep.description}</p>
            <div className="flex justify-between items-center">
                 <span className='text-xs text-muted-foreground'>{step + 1} / {tutorialSteps.length}</span>
                <div className='flex gap-2'>
                    {step > 0 && (
                        <Button variant="outline" size="sm" onClick={handlePrev}>
                            <ArrowLeft className="mr-1 h-4 w-4" /> Prev
                        </Button>
                    )}
                    <Button size="sm" onClick={handleNext}>
                        {step === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
                        <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    </div>
  );
}
