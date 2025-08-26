
'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Crown, Zap, Gem } from 'lucide-react';

interface PremiumBubbleIntroProps {
  className?: string;
}

export function PremiumBubbleIntro({ className }: PremiumBubbleIntroProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Start animation sequence
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={cn(
      "relative w-full h-64 md:h-72 overflow-hidden",
      "flex items-center justify-center",
      className
    )}>
      {/* Main content with phase animations */}
      <div className={cn(
        "relative z-10 text-center transition-all duration-1000",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
      )}>
        {/* Crown Icon with Float Animation */}
        <div className="transition-all duration-700 animate-float-celebration">
          <Crown className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-6 text-amber-500" />
        </div>

        {/* Text with staggered fade-in */}
        <div 
          className="transition-all duration-700 delay-200"
          style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(10px)' }}
        >
          <h2 className="text-2xl md:text-3xl font-bold tracking-wider mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            LIMITED TIME OFFER
          </h2>
        </div>

        <div 
          className="transition-all duration-700 delay-400"
          style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(10px)' }}
        >
          <p className="text-lg md:text-xl text-muted-foreground mb-4">
            Unlock Lifetime Pro Access
          </p>
        </div>

        <div 
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground transition-all duration-700 delay-600"
          style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(10px)' }}
        >
          <Zap className="w-4 h-4 text-yellow-500" />
          <span>One-time payment</span>
          <Gem className="w-4 h-4 text-primary" />
        </div>
      </div>
    </div>
  );
}
