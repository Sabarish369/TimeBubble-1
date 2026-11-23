
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
import { Sparkles, BarChart, Star, Lightbulb, MessageSquareQuote, Crown, CheckCircle, X } from 'lucide-react';
import { LockBreakingBubble } from './lock-breaking-bubble';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ProWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const proFeatures = [
  {
    icon: Sparkles,
    title: 'Daily AI Insights',
    description: 'At the end of your day, click the sparkles icon in the header to get a personalized summary of your productivity, mood patterns, and actionable recommendations.',
    gradient: 'from-yellow-400 to-orange-500',
  },
  {
    icon: Lightbulb,
    title: 'Proactive AI Tips',
    description: 'Throughout your day, open the AI tips drawer on the right to get real-time, contextual advice to optimize your well-being and stay on track.',
    gradient: 'from-purple-400 to-pink-500',
  },
   {
    icon: MessageSquareQuote,
    title: 'Personalized Daily Tip',
    description: 'Get a unique, inspiring tip based on your schedule for the day, right in your sidebar. Click it to refresh your inspiration at any time.',
    gradient: 'from-blue-400 to-cyan-500',
  },
  {
    icon: BarChart,
    title: 'Unlimited Templates',
    description: 'Create as many custom bubble templates as you need to streamline your planning and get started faster.',
    gradient: 'from-emerald-400 to-teal-500',
  },
];

export function ProWelcomeModal({ isOpen, onClose }: ProWelcomeModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 100);
      // Auto-rotate through features
      const interval = setInterval(() => {
        setCurrentFeature((prev) => (prev + 1) % proFeatures.length);
      }, 4000);
      return () => clearInterval(interval);
    } else {
      setIsVisible(false);
      setCurrentFeature(0);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border-0 bg-gradient-to-br from-background via-background/95 to-primary/10 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden rounded-lg">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-xl animate-pulse" />
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-tr from-accent/20 to-primary/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200"
        >
          <X className="h-5 w-5" />
        </button>

        <DialogHeader className="text-center items-center relative z-10">
          <div className={`mb-6 transform transition-all duration-700 ${isVisible ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}`}>
            <LockBreakingBubble size="md" />
          </div>
          <DialogTitle className={`text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent transform transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            Welcome to TimeBubble Pro! 🎉
          </DialogTitle>
          <DialogDescription className={`max-w-md mx-auto text-lg text-muted-foreground transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '200ms' }}>
            You now have access to powerful AI features. Here's how to get the most out of your upgrade:
          </DialogDescription>
        </DialogHeader>

        {/* Feature showcase with smooth transitions */}
        <div className="relative h-80 overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 my-6">
          {proFeatures.map((feature, index) => {
            const Icon = feature.icon;
            const isActive = index === currentFeature;
            return (
              <div
                key={index}
                className={`absolute inset-0 p-8 flex flex-col items-center justify-center text-center transition-all duration-700 transform ${
                  isActive ? 'translate-x-0 opacity-100 scale-100' : index < currentFeature ? 'translate-x-[-100%] opacity-0 scale-95' : 'translate-x-[100%] opacity-0 scale-95'
                }`}
              >
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-xl mb-4 transform transition-transform duration-300 ${isActive ? 'scale-100' : 'scale-90'}`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed max-w-sm">{feature.description}</p>
              </div>
            );
          })}

          {/* Feature indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {proFeatures.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentFeature(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentFeature ? 'bg-primary scale-125' : 'bg-primary/30 hover:bg-primary/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Quick tips */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {[
            { icon: Sparkles, text: 'Click the sparkles icon in the header for daily insights' },
            { icon: Lightbulb, text: 'Open the AI tips drawer for real-time suggestions' },
          ].map((tip, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 transform transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
              style={{ transitionDelay: `${600 + index * 100}ms` }}
            >
              <tip.icon className="h-5 w-5 text-primary flex-shrink-0" />
              <p className="text-sm text-muted-foreground">{tip.text}</p>
            </div>
          ))}
        </div>

        <DialogFooter className={`relative z-10 transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '800ms' }}>
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
