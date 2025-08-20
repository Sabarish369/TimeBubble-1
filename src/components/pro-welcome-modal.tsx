'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Sparkles, BarChart, Star, Lightbulb, MessageSquareQuote, Crown, CheckCircle } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';
import { Card, CardContent } from './ui/card';
import { useState, useEffect } from 'react';

interface ProWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const proFeatures = [
  {
    icon: Sparkles,
    title: 'Daily AI Insights',
    description: 'At the end of your day, click the sparkles icon in the header to get a personalized summary of your productivity, mood patterns, and actionable recommendations.',
  },
  {
    icon: Lightbulb,
    title: 'Proactive AI Tips',
    description: 'Throughout your day, open the AI tips drawer on the right to get real-time, contextual advice to optimize your well-being and stay on track.',
  },
   {
    icon: MessageSquareQuote,
    title: 'Personalized Daily Tip',
    description: 'Get a unique, inspiring tip based on your schedule for the day, right in your sidebar. Click it to refresh your inspiration at any time.',
  },
  {
    icon: BarChart,
    title: 'Unlimited Templates',
    description: 'Create as many custom bubble templates as you need to streamline your planning and get started faster.',
  },
];

export function ProWelcomeModal({ isOpen, onClose }: ProWelcomeModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 100);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg border-0 bg-gradient-to-br from-background via-background/95 to-primary/5 backdrop-blur-xl shadow-2xl">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden rounded-lg">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-xl animate-pulse" />
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-tr from-accent/20 to-primary/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <DialogHeader className="text-center items-center relative z-10">
          <div className={`p-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 mb-6 shadow-xl transform transition-all duration-700 ${isVisible ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}`}>
            <Crown className="h-10 w-10 text-white drop-shadow-lg" />
          </div>
          <DialogTitle className={`text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent transform transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            Welcome to TimeBubble Pro! 🎉
          </DialogTitle>
          <DialogDescription className={`max-w-md mx-auto text-lg text-muted-foreground transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '200ms' }}>
            You now have access to powerful AI features. Here's how to get the most out of your upgrade:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-6 relative z-10">
          {proFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index} 
                className={`flex items-start gap-4 p-4 rounded-xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-white/20 hover:bg-white/70 dark:hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg magical-hover transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}
                style={{ transitionDelay: `${300 + index * 100}ms` }}
              >
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-md text-white mt-1 transform hover:scale-110 transition-transform duration-200">
                  <Icon className="h-5 w-5 drop-shadow-sm" />
                </div>
                <div>
                  <p className="font-bold text-foreground mb-1">{feature.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className={`relative z-10 transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '700ms' }}>
          <Button 
            onClick={onClose} 
            className="w-full py-3 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 btn-magic relative overflow-hidden"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Got it, thanks!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}