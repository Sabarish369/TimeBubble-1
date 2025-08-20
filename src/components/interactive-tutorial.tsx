
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from './ui/button';
import { ArrowRight, ArrowLeft, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTimeBubbles } from '@/context/time-bubbles-context';

interface TutorialStep {
  elementId?: string;
  title: string;
  description: string;
  tooltipPosition: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: () => void;
}

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
  const { setActionableBlock } = useTimeBubbles();

  const tutorialSteps: TutorialStep[] = [
    {
      elementId: 'sidebar',
      title: '🎉 Welcome to TimeBubble!',
      description: "Let's take a magical tour! This is your command center - the sidebar where all your templates live. Think of it as your personal productivity toolkit.",
      tooltipPosition: 'right',
    },
    {
      elementId: 'templates-header',
      title: '📚 Your Template Library',
      description: 'These are pre-made templates to speed up your planning. Each bubble has a category, duration, and beautiful color to help organize your day visually.',
      tooltipPosition: 'right',
    },
    {
      elementId: 'first-template-item',
      title: '✨ Drag & Drop Magic',
      description: 'Try dragging any template (like "Focus Work") from here and dropping it onto the timeline. Watch the magic happen as it creates a perfectly timed bubble!',
      tooltipPosition: 'right',
    },
    {
      elementId: 'timeline-main',
      title: '🎯 Your Visual Timeline',
      description: "This is where the magic happens! Double-click anywhere on an empty spot to create a custom time bubble. You can also resize bubbles by dragging their edges.",
      tooltipPosition: 'center',
    },
    {
      elementId: 'date-navigation',
      title: '🗓️ Time Travel Controls',
      description: "Navigate through time with these controls. Plan your future, review your past, or jump to any date. Your productivity journey awaits!",
      tooltipPosition: 'bottom',
    },
    {
      elementId: 'missed-tasks-button',
      title: '📋 Never Miss a Beat',
      description: "Life happens! Click this history button to see any bubbles you missed. You can reschedule them with just a click - no guilt, just progress.",
      tooltipPosition: 'right',
    },
    {
      elementId: 'header-actions',
      title: '🚀 AI-Powered Insights',
      description: "At the end of your day, click the 'Sparkles' icon to get personalized AI insights about your productivity patterns and helpful suggestions.",
      tooltipPosition: 'bottom',
    },
    {
      elementId: 'feedback-section',
      title: '💝 Share Your Voice',
      description: "Found something you love or want to improve? Use the feedback section to help us make TimeBubble even better for you!",
      tooltipPosition: 'right',
    },
    {
      elementId: 'ai-tips-drawer-trigger',
      title: 'Get Proactive Tips',
      description: "Click the lightbulb icon to get real-time AI tips to improve your well-being and productivity throughout the day.",
      tooltipPosition: 'left',
    },
  ];

  const calculatePositions = useCallback(() => {
    const currentStepConfig = tutorialSteps[step];
    
    // Handle action-only steps that don't highlight an element
    if (!currentStepConfig.elementId) {
      setElementRect(null); // No element to highlight
      const style: TooltipStyle = {
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      };
      setTooltipStyle(style);
      if(currentStepConfig.action) currentStepConfig.action();
      return;
    } else {
        // Clear any fake blocks from previous steps
        setActionableBlock(null);
    }

    const element = document.getElementById(currentStepConfig.elementId);
    if (!element) {
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
    
    const tooltipEl = tooltipRef.current;
    const tooltipWidth = tooltipEl?.offsetWidth || 288; 
    const tooltipHeight = tooltipEl?.offsetHeight || 150;
    const gap = 16; 

    let tempTooltipPosition = currentStepConfig.tooltipPosition;
    if (isMobile) {
        if (tempTooltipPosition === 'left' || tempTooltipPosition === 'right' || tempTooltipPosition === 'center') {
            tempTooltipPosition = 'bottom';
        }
    }
    
    let style: TooltipStyle = { transform: '' };

    switch(tempTooltipPosition) {
        case 'top':
            style = {
                left: `${newElementRect.left + newElementRect.width / 2}px`,
                top: `${newElementRect.top - gap}px`,
                transform: 'translate(-50%, -100%)',
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
                left: `${newElementRect.left - gap}px`,
                transform: 'translate(-100%, -50%)',
            };
            break;
        case 'center':
            style = {
                top: `${newElementRect.top + newElementRect.height / 2}px`,
                left: `${newElementRect.left + newElementRect.width / 2}px`,
                transform: 'translate(-50%, -50%)',
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

    // Boundary checks to ensure the tooltip is always visible
    let finalLeft = style.left ? parseFloat(style.left) : 0;
    let finalTop = style.top ? parseFloat(style.top) : 0;

    // Adjust for transform
    if (style.transform.includes('translateX(-50%)')) finalLeft -= tooltipWidth / 2;
    if (style.transform.includes('translateY(-50%)')) finalTop -= tooltipHeight / 2;
    if (style.transform.includes('translateX(-100%)')) finalLeft -= tooltipWidth;
    if (style.transform.includes('translateY(-100%)')) finalTop -= tooltipHeight;
    
    if (finalLeft < gap) {
      style.left = `${gap}px`;
    }
    if (finalLeft + tooltipWidth > window.innerWidth - gap) {
      style.left = `${window.innerWidth - tooltipWidth - gap}px`;
    }
    if (finalTop < gap) {
      style.top = `${gap}px`;
    }
    if (finalTop + tooltipHeight > window.innerHeight - gap) {
      style.top = `${window.innerHeight - tooltipHeight - gap}px`;
    }
    
    // After boundary checks, if we moved the tooltip, we might need to reset transform.
    // This part is tricky; for now, we'll let the simple boundary check handle it.
    // The most important thing is visibility.

    setTooltipStyle(style);

  }, [step, onFinish, isMobile, setActionableBlock, tutorialSteps]);

  useEffect(() => {
    const timer = setTimeout(() => {
        calculatePositions();
        setShow(true);
    }, 150);

    window.addEventListener('resize', calculatePositions);
    return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', calculatePositions);
    }
  }, [calculatePositions, step]);

  const handleNext = () => {
    if (step < tutorialSteps.length - 1) {
      setStep(step + 1);
    } else {
      setActionableBlock(null);
      onFinish();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setActionableBlock(null);
      setStep(step - 1);
    }
  };
  
  const handleFinish = () => {
    setActionableBlock(null);
    onFinish();
  }

  if (!show) {
    return null;
  }

  const currentStep = tutorialSteps[step];
  
  const padding = 8;
  const overlayBorderRadius = '6px';

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
        {/* Overlays to dim the background but allow interaction with the highlighted element */}
        {elementRect && (
            <>
                {/* Top */}
                <div className="fixed bg-black/60" style={{ left: 0, top: 0, width: '100%', height: `${elementRect.top - padding}px` }}></div>
                {/* Bottom */}
                <div className="fixed bg-black/60" style={{ left: 0, top: `${elementRect.bottom + padding}px`, width: '100%', bottom: 0 }}></div>
                {/* Left */}
                <div className="fixed bg-black/60" style={{ left: 0, top: `${elementRect.top - padding}px`, width: `${elementRect.left - padding}px`, height: `${elementRect.height + padding * 2}px` }}></div>
                {/* Right */}
                <div className="fixed bg-black/60" style={{ left: `${elementRect.right + padding}px`, top: `${elementRect.top - padding}px`, right: 0, height: `${elementRect.height + padding * 2}px` }}></div>
                {/* Highlight border */}
                <div 
                    className='fixed ring-2 ring-primary ring-offset-2 ring-offset-background/80'
                    style={{
                        left: `${elementRect.left - padding}px`,
                        top: `${elementRect.top - padding}px`,
                        width: `${elementRect.width + padding * 2}px`,
                        height: `${elementRect.height + padding * 2}px`,
                        borderRadius: overlayBorderRadius,
                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
                    }}
                />
            </>
        )}
        
        {/* If there's no elementRect, it's a central modal, so dim everything */}
        {!elementRect && (
            <div className="fixed inset-0 bg-black/60"></div>
        )}

        {/* Enhanced Tooltip */}
        <div
            ref={tooltipRef}
            className={cn(
                "absolute w-80 p-6 rounded-xl bg-gradient-to-br from-background via-background/95 to-primary/5 text-foreground shadow-2xl border border-primary/20 backdrop-blur-sm transition-all duration-500 pointer-events-auto transform animate-in fade-in-0 zoom-in-95"
            )}
            style={tooltipStyle}
        >
            {/* Magical glow effect */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 blur-xl -z-10" />
            
            <div className="relative">
                <h3 className="font-bold text-xl mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {currentStep.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                    {currentStep.description}
                </p>
                
                {/* Progress bar */}
                <div className="w-full bg-secondary/30 rounded-full h-1 mb-4">
                    <div 
                        className="bg-gradient-to-r from-primary to-accent h-1 rounded-full transition-all duration-500" 
                        style={{ width: `${((step + 1) / tutorialSteps.length) * 100}%` }}
                    />
                </div>
                
                <div className="flex justify-between items-center">
                    <span className='text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-full'>
                        {step + 1} of {tutorialSteps.length}
                    </span>
                    <div className='flex gap-2'>
                        <Button variant="ghost" size="sm" onClick={handleFinish} className="hover:bg-secondary/80">
                            Skip Tour
                        </Button>
                        {step > 0 && (
                            <Button variant="outline" size="sm" onClick={handlePrev} className="hover:scale-105 transition-transform">
                                <ArrowLeft className="mr-1 h-4 w-4" /> Back
                            </Button>
                        )}
                        <Button size="sm" onClick={handleNext} className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white hover:scale-105 transition-all duration-200">
                            {step === tutorialSteps.length - 1 ? '🎉 Finish' : 'Next'}
                            <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}

    