
'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Star, Sparkles, Zap, Crown, Gem } from 'lucide-react';

interface PremiumBubbleIntroProps {
  className?: string;
}

export function PremiumBubbleIntro({ className }: PremiumBubbleIntroProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Start animation sequence
    setIsVisible(true);
  }, []);

  return (
    <div className={cn(
      "relative w-full h-64 md:h-80 overflow-hidden rounded-2xl",
      "flex items-center justify-center",
      className
    )}>
      {/* Main content with phase animations */}
      <div className={cn(
        "relative z-10 text-center transition-all duration-1000",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
      )}>
        <div className="transition-all duration-700">
          <Crown className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 text-primary" />
        </div>

        <div className="transition-all duration-700 delay-200">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            LIMITED TIME OFFER
          </h2>
        </div>

        <div className="transition-all duration-700 delay-400">
          <p className="text-lg md:text-xl text-muted-foreground mb-4">
            Unlock <span className="font-semibold text-primary">Lifetime Pro</span> Access
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span>One-time payment</span>
            <Gem className="w-4 h-4 text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}
