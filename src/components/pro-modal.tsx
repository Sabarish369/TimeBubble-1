
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
import { Zap, BarChart, BrainCircuit, Star, Sparkles, Crown } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const proFeatures = [
  {
    icon: Zap,
    title: 'Advanced AI Insights',
    description: 'Get weekly/monthly reports and predictive planning.',
    gradient: 'from-yellow-400 to-orange-500',
  },
  {
    icon: BrainCircuit,
    title: 'Proactive AI-Powered Tips',
    description: 'Receive real-time, contextual advice to optimize your day as it happens.',
    gradient: 'from-purple-400 to-pink-500',
  },
  {
    icon: BarChart,
    title: 'Long-Term Trend Analysis',
    description: 'Understand your habits with personalized weekly and monthly reports.',
    gradient: 'from-blue-400 to-cyan-500',
  },
  {
    icon: Star,
    title: 'Custom API Key',
    description: 'Bring your own free Gemini API key for unlimited AI usage and complete control.',
    gradient: 'from-emerald-400 to-teal-500',
  },
];

export function ProModal({ isOpen, onClose }: ProModalProps) {
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
          <div className={`p-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 mb-6 transform transition-all duration-700 ${isVisible ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}`}>
            <Crown className="h-10 w-10 text-white drop-shadow-lg" />
          </div>
          <DialogTitle className={`text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent transform transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            Upgrade to TimeBubble Pro
          </DialogTitle>
          <DialogDescription className={`text-lg text-muted-foreground max-w-sm mx-auto transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '200ms' }}>
            Unlock powerful AI features to supercharge your productivity and gain deeper insights.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6 relative z-10">
          {proFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index} 
                className={`flex items-start gap-4 p-4 rounded-xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-white/20 hover:bg-white/70 dark:hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}
                style={{ transitionDelay: `${300 + index * 100}ms` }}
              >
                <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg transform hover:scale-110 transition-transform duration-200`}>
                  <Icon className="h-6 w-6 text-white drop-shadow-sm" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-foreground mb-1">{feature.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className={`flex-col gap-3 relative z-10 transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '700ms' }}>
          <Button 
            size="lg" 
            className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 relative overflow-hidden group"
            asChild
          >
            <Link href="/upgrade">
              <Sparkles className="h-5 w-5 mr-2 group-hover:animate-spin" />
              View Pro Plans
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-700" />
            </Link>
          </Button>
          <Button 
            size="lg" 
            variant="ghost" 
            onClick={onClose}
            className="w-full hover:bg-white/10 transition-colors duration-200"
          >
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
