
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, BrainCircuit, BarChart, Star, ChevronRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface ProModalProps {
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

export function ProModal({ isOpen, onClose }: ProModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showFeatures, setShowFeatures] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 100);
      setTimeout(() => setShowFeatures(true), 800);
    } else {
      setIsVisible(false);
      setShowFeatures(false);
      setCurrentStep(0);
    }
  }, [isOpen]);

  const nextStep = () => {
    if (currentStep < proFeatures.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-auto bg-gradient-to-br from-background via-primary/5 to-accent/10 border-primary/20 backdrop-blur-xl relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-accent/20 to-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          
          {/* Floating sparkles */}
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-gradient-to-r from-primary to-accent rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        <DialogHeader className={`text-center space-y-4 relative z-10 transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-lg opacity-50 animate-pulse" />
              <Crown className="h-16 w-16 text-primary relative z-10 drop-shadow-lg" />
            </div>
          </div>
          
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-pulse">
            Upgrade to Pro
          </DialogTitle>
          
          <DialogDescription className="text-lg text-muted-foreground">
            Unlock the full potential of TimeBubble with AI-powered insights and unlimited customization.
          </DialogDescription>
        </DialogHeader>

        {/* Step-by-step feature showcase */}
        {showFeatures && (
          <div className="py-6 relative z-10">
            <div className="text-center mb-4">
              <div className="text-sm text-muted-foreground mb-2">
                Feature {currentStep + 1} of {proFeatures.length}
              </div>
              <div className="flex justify-center gap-2 mb-4">
                {proFeatures.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i === currentStep ? 'bg-primary scale-125' : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="min-h-[200px] flex items-center justify-center">
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
                      <div className={`w-20 h-20 mx-auto mb-4 flex items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-xl transform hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-10 w-10 text-white drop-shadow-sm" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
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
                disabled={currentStep === 0}
                className="flex items-center gap-2 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              {currentStep < proFeatures.length - 1 ? (
                <Button
                  onClick={nextStep}
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 relative overflow-hidden group"
                  asChild
                >
                  <Link href="/upgrade">
                    <Sparkles className="h-5 w-5 mr-2 group-hover:animate-spin" />
                    View Pro Plans
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-700" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="pt-4 relative z-10">
          <Button
            size="lg"
            variant="ghost"
            onClick={onClose}
            className="w-full hover:bg-white/10 transition-colors duration-200"
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
