
'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Star, Sparkles, Zap, Crown, Gem } from 'lucide-react';

interface PremiumBubbleIntroProps {
  className?: string;
}

export function PremiumBubbleIntro({ className }: PremiumBubbleIntroProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);

  useEffect(() => {
    // Start animation sequence
    setIsVisible(true);
    
    const phaseTimer = setTimeout(() => setCurrentPhase(1), 500);
    const phase2Timer = setTimeout(() => setCurrentPhase(2), 1500);
    const phase3Timer = setTimeout(() => setCurrentPhase(3), 2500);

    return () => {
      clearTimeout(phaseTimer);
      clearTimeout(phase2Timer);
      clearTimeout(phase3Timer);
    };
  }, []);

  return (
    <div className={cn(
      "relative w-full h-64 md:h-80 overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-slate-800 border border-primary/20",
      "flex items-center justify-center",
      className
    )}>
      {/* Floating premium bubbles */}
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "absolute rounded-full premium-bubble",
            )}
            style={{
              left: `${15 + (i * 12) % 70}%`,
              top: `${20 + (i * 15) % 60}%`,
              width: `${20 + (i % 3) * 15}px`,
              height: `${20 + (i % 3) * 15}px`,
              background: `hsl(var(--bubble-${['indigo', 'teal', 'amber', 'rose-gold', 'sky-blue'][i % 5]}))`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${6 + (i % 4) * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Sparkle effects */}
      <div className="absolute inset-0">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "absolute sparkle-effect",
            )}
            style={{
              left: `${10 + (i * 8) % 80}%`,
              top: `${15 + (i * 10) % 70}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${5 + (i % 4) * 2}s`,
            }}
          >
            <Sparkles className="w-3 h-3 text-yellow-400/80" />
          </div>
        ))}
      </div>

      {/* Main content with phase animations */}
      <div className={cn(
        "relative z-10 text-center transition-all duration-1000",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
      )}>
        {/* Phase 1: Crown appears */}
        <div className={cn(
          "transition-all duration-700",
          currentPhase >= 1 ? "opacity-100 scale-100" : "opacity-0 scale-50"
        )}>
          <Crown className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 text-yellow-500 animate-bounce" />
        </div>

        {/* Phase 2: Title appears */}
        <div className={cn(
          "transition-all duration-700 delay-200",
          currentPhase >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            LIMITED TIME OFFER
          </h2>
        </div>

        {/* Phase 3: Subtitle and CTA appear */}
        <div className={cn(
          "transition-all duration-700 delay-400",
          currentPhase >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <p className="text-lg md:text-xl text-muted-foreground mb-4">
            Unlock <span className="font-semibold text-primary">Lifetime Pro</span> Access
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />
            <span>One-time payment</span>
            <Gem className="w-4 h-4 text-primary animate-pulse" />
          </div>
        </div>
      </div>

      {/* Floating premium indicators */}
      <div className="absolute top-4 right-4">
        <div className={cn(
          "premium-indicator animate-premium-glow",
          currentPhase >= 2 ? "opacity-100 scale-100" : "opacity-0 scale-0"
        )}>
          <Star className="w-6 h-6 text-yellow-500" />
        </div>
      </div>

      <div className="absolute top-4 left-4">
        <div className={cn(
          "premium-indicator animate-premium-glow-delayed",
          currentPhase >= 2 ? "opacity-100 scale-100" : "opacity-0 scale-0"
        )}>
          <Gem className="w-6 h-6 text-primary" />
        </div>
      </div>

      {/* Bottom wave effect */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-900 to-transparent" />
    </div>
  );
}
