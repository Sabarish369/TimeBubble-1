
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, BrainCircuit, BarChart, Star, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';

interface EnhancedProWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const proFeatures = [
  {
    icon: Sparkles,
    title: 'Daily AI Insights',
    description: 'Get personalized summaries of your productivity and mood patterns at the end of each day.',
    gradient: 'from-yellow-400 to-orange-500',
  },
  {
    icon: BrainCircuit,
    title: 'Proactive AI Tips',
    description: 'Receive real-time, contextual advice throughout your day to optimize your well-being.',
    gradient: 'from-purple-400 to-pink-500',
  },
  {
    icon: BarChart,
    title: 'Unlimited Templates',
    description: 'Create as many custom bubble templates as you need to streamline your planning.',
    gradient: 'from-blue-400 to-cyan-500',
  },
  {
    icon: Star,
    title: 'Custom API Key',
    description: 'Bring your own Gemini API key for unlimited AI usage and complete control.',
    gradient: 'from-emerald-400 to-teal-500',
  },
];

export function EnhancedProWelcomeModal({ isOpen, onClose }: EnhancedProWelcomeModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 100);
    } else {
      setIsVisible(false);
      setCurrentStep(0);
      setShowWelcome(true);
    }
  }, [isOpen]);

  const nextStep = () => {
    if (showWelcome) {
      setShowWelcome(false);
      setCurrentStep(0);
    } else if (currentStep < proFeatures.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else if (!showWelcome) {
      setShowWelcome(true);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg mx-auto bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 border-green-200 dark:border-green-800 backdrop-blur-xl relative overflow-hidden">
        {/* Celebration background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-emerald-400/20 to-teal-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          
          {/* Floating celebration particles */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${1 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        {showWelcome ? (
          // Welcome screen
          <div className="relative z-10">
            <DialogHeader className={`text-center space-y-6 transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-lg opacity-50 animate-pulse" />
                  <CheckCircle className="h-20 w-20 text-green-500 relative z-10 drop-shadow-lg animate-bounce" />
                </div>
              </div>
              
              <DialogTitle className="text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                🎉 Welcome to Pro!
              </DialogTitle>
              
              <DialogDescription className="text-lg text-muted-foreground">
                Congratulations! You've successfully upgraded to TimeBubble Pro. 
                Let's explore what amazing features you now have access to.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-8 text-center">
              <Button
                onClick={nextStep}
                size="lg"
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Explore Pro Features
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          // Feature showcase
          <div className="relative z-10">
            <DialogHeader className="text-center mb-6">
              <DialogTitle className="text-2xl font-bold text-foreground">
                Pro Features Tour
              </DialogTitle>
              <div className="text-sm text-muted-foreground mt-2">
                Feature {currentStep + 1} of {proFeatures.length}
              </div>
              <div className="flex justify-center gap-2 mt-3">
                {proFeatures.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i === currentStep ? 'bg-green-500 scale-125' : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            </DialogHeader>

            <div className="min-h-[250px] flex items-center justify-center">
              {proFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className={`absolute inset-x-0 transition-all duration-500 transform ${
                      index === currentStep
                        ? 'translate-x-0 opacity-100'
                        : index < currentStep
                        ? '-translate-x-full opacity-0'
                        : 'translate-x-full opacity-0'
                    }`}
                  >
                    <div className="p-6 text-center">
                      <div className={`w-24 h-24 mx-auto mb-6 flex items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-xl transform hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-12 w-12 text-white drop-shadow-sm" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-4">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed text-sm">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center mt-6">
              <Button
                variant="ghost"
                onClick={prevStep}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>

              <Button
                onClick={nextStep}
                className={`font-semibold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2 ${
                  currentStep === proFeatures.length - 1
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                    : 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white'
                }`}
              >
                {currentStep === proFeatures.length - 1 ? (
                  <>
                    Start Using Pro
                    <CheckCircle className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Next Feature
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
