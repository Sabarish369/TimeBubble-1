
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


interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

interface TooltipStyle {
    top?: string;
    left?: string;
    bottom?: string;
    right?: string;
    transform: string;
}

export function InteractiveTutorial({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0);
  const [elementRect, setElementRect] = useState<ElementRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<TooltipStyle | {}>({});
  const isMobile = useIsMobile();
  const [show, setShow] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);


  const calculatePositions = useCallback(() => {
    const element = document.getElementById(tutorialSteps[step].elementId);
    if (!element) {
        // If element not found, skip to next step or finish
        if (step < tutorialSteps.length - 1) {
            setStep(s => s + 1);
        } else {
            onFinish();
        }
        return;
    }

    const rect = element.getBoundingClientRect();
    const newElementRect = {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      right: rect.right,
      bottom: rect.bottom,
    };
    setElementRect(newElementRect);
    
    // Calculate Tooltip Position
    let currentStepConfig = { ...tutorialSteps[step] };
    const tooltipEl = tooltipRef.current;
    const tooltipWidth = tooltipEl?.offsetWidth || 288; // Default width if not rendered
    const tooltipHeight = tooltipEl?.offsetHeight || 150; // Default height
    const gap = 16; // 1rem gap

    // Adjust for mobile
    if (isMobile) {
        if (currentStepConfig.tooltipPosition === 'left' || currentStepConfig.tooltipPosition === 'right') {
            currentStepConfig.tooltipPosition = 'bottom';
        }
    }
    
    let style: TooltipStyle = { transform: '' };

    switch(currentStepConfig.tooltipPosition) {
        case 'top':
            style = {
                left: `${newElementRect.left + newElementRect.width / 2}px`,
                bottom: `${window.innerHeight - newElementRect.top + gap}px`,
                transform: 'translateX(-50%)',
            };
            break;
        case 'bottom':
            style = {
                left: `${newElementRect.left + newElementRect.width / 2}px`,
                top: `${newElementRect.bottom + gap}px`,
                transform: 'translateX(-50%)',
            };
            break;
        case 'left':
            style = {
                top: `${newElementRect.top + newElementRect.height / 2}px`,
                right: `${window.innerWidth - newElementRect.left + gap}px`,
                transform: 'translateY(-50%)',
            };
            break;
        case 'right':
        default:
            style = {
                top: `${newElementRect.top + newElementRect.height / 2}px`,
                left: `${newElementRect.right + gap}px`,
                transform: 'translateY(-50%)',
            };
            break;
    }

    // Boundary checks to prevent off-screen tooltips
    if (style.left && (parseInt(style.left, 10) + tooltipWidth > window.innerWidth)) {
        style.left = `${window.innerWidth - tooltipWidth - gap}px`;
    }
    if (style.left && parseInt(style.left, 10) < 0) {
        style.left = `${gap}px`;
    }
     if (style.top && (parseInt(style.top, 10) + tooltipHeight > window.innerHeight)) {
        style.top = `${window.innerHeight - tooltipHeight - gap}px`;
    }

    setTooltipStyle(style);

  }, [step, onFinish, isMobile]);

  useEffect(() => {
     // A small delay to allow the UI to settle before calculating positions.
    const timer = setTimeout(() => {
        calculatePositions();
        setShow(true);
    }, 150);

    window.addEventListener('resize', calculatePositions);
    return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', calculatePositions);
    }
  }, [calculatePositions, step]); // Rerun when step changes

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

  if (!elementRect || !show) {
    return null; // Don't render until we have the style
  }

  const currentStep = tutorialSteps[step];
  
  const padding = 8;

  return (
    <div className="fixed inset-0 z-[100]">
        {/* Overlay */}
        <div 
            className="fixed inset-0 bg-black/60 transition-all duration-300"
            style={{
                clipPath: `path("M0,0H${window.innerWidth}V${window.innerHeight}H0V0ZM${elementRect.left - padding},${elementRect.top - padding}V${elementRect.bottom + padding}H${elementRect.right + padding}V${elementRect.top - padding}H${elementRect.left - padding}Z")`,
            }}
        />

        {/* Tooltip */}
        <div
            ref={tooltipRef}
            className={cn(
                "absolute w-72 p-4 rounded-lg bg-background text-foreground shadow-2xl transition-all duration-300"
            )}
            style={tooltipStyle}
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
