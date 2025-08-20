
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Sparkles, Crown, Zap, BrainCircuit, BarChart, Star, CheckCircle, X } from 'lucide-react';
import { useState, useEffect } from 'react';

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
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 100);
      const interval = setInterval(() => {
        setCurrentFeature((prev) => (prev + 1) % proFeatures.length);
      }, 3000);
      return () => clearInterval(interval);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border-0 bg-gradient-to-br from-background via-background/95 to-primary/10 backdrop-blur-xl shadow-2xl overflow-hidden">
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

        <div className="relative z-10 p-8">
          {/* Header */}
          <DialogHeader className="text-center items-center mb-8">
            <div className={`p-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 mb-6 transform transition-all duration-1000 ${isVisible ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}`}>
              <Crown className="h-12 w-12 text-white drop-shadow-lg" />
            </div>
            <DialogTitle className={`text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              Welcome to TimeBubble Pro! 🎉
            </DialogTitle>
            <DialogDescription className={`text-lg text-muted-foreground max-w-md mx-auto transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '200ms' }}>
              You now have access to powerful AI features that will supercharge your productivity.
            </DialogDescription>
          </DialogHeader>

          {/* Feature showcase */}
          <div className="mb-8">
            <div className="relative h-64 overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
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
                    <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed max-w-sm">{feature.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Feature indicators */}
            <div className="flex justify-center gap-2 mt-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {[
              { icon: Sparkles, text: 'Click the sparkles icon in the header for daily insights' },
              { icon: BrainCircuit, text: 'Open the AI tips drawer for real-time suggestions' },
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

          {/* Action button */}
          <div className={`text-center transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '800ms' }}>
            <Button
              onClick={onClose}
              size="lg"
              className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 relative overflow-hidden group"
            >
              <CheckCircle className="h-5 w-5 mr-2 group-hover:animate-spin" />
              Got it! Let's start
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-700" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
