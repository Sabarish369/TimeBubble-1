
'use client';

import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Sparkles, Crown, Zap, BrainCircuit, BarChart, Star, CheckCircle, X, ArrowRight, ArrowLeft, Play, Trophy, Gift } from 'lucide-react';
import { LockBreakingBubble } from './lock-breaking-bubble';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface EnhancedProWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const welcomeSteps = [
  {
    id: 'welcome',
    title: 'Welcome to TimeBubble Pro! 🎉',
    subtitle: 'You\'ve unlocked the full power of AI-driven time management',
    icon: Crown,
    content: (
      <div className="text-center space-y-6">
        <div className="flex justify-center mb-4">
          <LockBreakingBubble size="lg" />
        </div>
        <div className="space-y-3">
          <h3 className="text-2xl font-bold text-primary">Unlock Complete! 🔓</h3>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
            Your TimeBubble has been freed from limitations! You now have access to unlimited AI insights, 
            proactive tips, and advanced productivity features that will transform how you manage your time.
          </p>
        </div>
      </div>
    ),
    showContinue: true,
    continueText: 'Let\'s explore your new features',
  },
  {
    id: 'ai-insights',
    title: 'Daily AI Insights',
    subtitle: 'Get personalized productivity summaries every day',
    icon: Sparkles,
    content: (
      <div className="space-y-6">
        <div className="flex items-center justify-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border border-yellow-400/30">
          <Sparkles className="h-8 w-8 text-yellow-500" />
          <div className="text-left">
            <h4 className="font-semibold text-foreground">Click the sparkles icon in the header</h4>
            <p className="text-sm text-muted-foreground">Get your daily productivity summary and insights</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white/10 border border-white/20">
            <h5 className="font-semibold text-foreground mb-2">What you'll get:</h5>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Productivity patterns
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Mood insights
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Actionable recommendations
              </li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-white/10 border border-white/20">
            <h5 className="font-semibold text-foreground mb-2">Best time to use:</h5>
            <p className="text-sm text-muted-foreground">At the end of your day to reflect and plan for tomorrow</p>
          </div>
        </div>
      </div>
    ),
    showContinue: true,
    continueText: 'Next: AI Tips & Suggestions',
  },
  {
    id: 'ai-tips',
    title: 'Proactive AI Tips',
    subtitle: 'Real-time guidance throughout your day',
    icon: BrainCircuit,
    content: (
      <div className="space-y-6">
        <div className="flex items-center justify-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-purple-400/20 to-pink-500/20 border border-purple-400/30">
          <BrainCircuit className="h-8 w-8 text-purple-500" />
          <div className="text-left">
            <h4 className="font-semibold text-foreground">Open the AI tips drawer on the right</h4>
            <p className="text-sm text-muted-foreground">Get contextual advice when you need it most</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white/10 border border-white/20">
            <h5 className="font-semibold text-foreground mb-2">Smart suggestions:</h5>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Energy optimization
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Habit stacking
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Focus techniques
              </li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-white/10 border border-white/20">
            <h5 className="font-semibold text-foreground mb-2">When to check:</h5>
            <p className="text-sm text-muted-foreground">Between tasks, during breaks, or when you need motivation</p>
          </div>
        </div>
      </div>
    ),
    showContinue: true,
    continueText: 'Next: Unlimited Templates',
  },
  {
    id: 'templates',
    title: 'Unlimited Templates',
    subtitle: 'Create as many custom bubble templates as you need',
    icon: BarChart,
    content: (
      <div className="space-y-6">
        <div className="flex items-center justify-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-blue-400/20 to-cyan-500/20 border border-blue-400/30">
          <BarChart className="h-8 w-8 text-blue-500" />
          <div className="text-left">
            <h4 className="font-semibold text-foreground">Right-click on the timeline</h4>
            <p className="text-sm text-muted-foreground">Create new bubbles and save them as templates</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white/10 border border-white/20">
            <h5 className="font-semibold text-foreground mb-2">Template ideas:</h5>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Work meetings
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Study sessions
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Exercise routines
              </li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-white/10 border border-white/20">
            <h5 className="font-semibold text-foreground mb-2">Pro tip:</h5>
            <p className="text-sm text-muted-foreground">Use consistent colors and durations for similar activities</p>
          </div>
        </div>
      </div>
    ),
    showContinue: true,
    continueText: 'Next: API Key Setup',
  },
  {
    id: 'api-setup',
    title: 'API Key Setup',
    subtitle: 'Bring your own Gemini API key for unlimited AI usage',
    icon: Star,
    content: (
      <div className="space-y-6">
        <div className="flex items-center justify-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-500/20 border border-emerald-400/30">
          <Star className="h-8 w-8 text-emerald-500" />
          <div className="text-left">
            <h4 className="font-semibold text-foreground">Set up your API key</h4>
            <p className="text-sm text-muted-foreground">Get complete control over your AI usage</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white/10 border border-white/20">
            <h5 className="font-semibold text-foreground mb-2">Why set up an API key:</h5>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Unlimited AI requests
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Better privacy control
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Custom AI models
              </li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-white/10 border border-white/20">
            <h5 className="font-semibold text-foreground mb-2">How to get one:</h5>
            <p className="text-sm text-muted-foreground">Visit Google AI Studio to create your Gemini API key</p>
          </div>
        </div>
      </div>
    ),
    showContinue: true,
    continueText: 'Next: Get Started',
  },
  {
    id: 'get-started',
    title: 'You\'re All Set! 🚀',
    subtitle: 'Ready to supercharge your productivity',
    icon: Trophy,
    content: (
      <div className="text-center space-y-6">
        <div className="p-6 rounded-full bg-gradient-to-br from-green-400 to-blue-500 mx-auto w-24 h-24 flex items-center justify-center shadow-2xl">
          <Trophy className="h-12 w-12 text-white drop-shadow-lg" />
        </div>
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-foreground">Welcome to the Pro Club!</h3>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
            You now have everything you need to take your time management to the next level. Start exploring your new features and watch your productivity soar!
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Gift className="h-4 w-4 text-primary" />
            <span>All future Pro features are included in your lifetime access</span>
          </div>
        </div>
      </div>
    ),
    showContinue: false,
  },
];

export function EnhancedProWelcomeModal({ isOpen, onClose }: EnhancedProWelcomeModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setTimeout(() => setIsVisible(true), 100);
    } else {
      setIsVisible(false);
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < welcomeSteps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleFinish = () => {
    onClose();
  };

  const currentStepData = welcomeSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === welcomeSteps.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl border-0 bg-gradient-to-br from-background via-background/95 to-primary/10 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-primary/30 to-accent/30 rounded-full blur-2xl animate-pulse" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-gradient-to-tr from-accent/30 to-primary/30 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Progress indicator */}
        <div className="absolute top-4 left-4 z-20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Step {currentStep + 1} of {welcomeSteps.length}</span>
            <div className="w-20 h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
                style={{ width: `${((currentStep + 1) / welcomeSteps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="relative z-10 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className={`text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              {currentStepData.title}
            </h2>
            <p className={`text-lg text-muted-foreground mt-2 transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '200ms' }}>
              {currentStepData.subtitle}
            </p>
          </div>

          {/* Content */}
          <div className={`min-h-[400px] transform transition-all duration-500 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            {currentStepData.content}
            </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={isFirstStep}
              className={cn(
                "flex items-center gap-2 transition-all duration-200",
                isFirstStep ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-3">
              {currentStepData.showContinue ? (
                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  {currentStep}
                  {currentStepData.continueText}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleFinish}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Exploring
                </Button>
              )}
                  </div>
            </div>

          {/* Step indicators */}
            <div className="flex justify-center gap-2 mt-6">
            {welcomeSteps.map((_, index) => (
                <button
                  key={index}
                onClick={() => {
                  setIsAnimating(true);
                  setTimeout(() => {
                    setCurrentStep(index);
                    setIsAnimating(false);
                  }, 300);
                }}
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-300",
                  index === currentStep 
                    ? "bg-primary scale-125" 
                    : index < currentStep 
                      ? "bg-green-500 hover:bg-green-400" 
                      : "bg-primary/30 hover:bg-primary/50"
                )}
                />
              ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
