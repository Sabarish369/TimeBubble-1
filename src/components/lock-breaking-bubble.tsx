'use client';

import { Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LockBreakingBubbleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LockBreakingBubble({ className, size = 'md' }: LockBreakingBubbleProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const lockSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  return (
    <div className={cn("lock-bubble-container", className)}>
      {/* Main bubble with lock */}
      <div className={cn(
        "lock-bubble relative rounded-full bg-gradient-to-br from-primary/80 to-accent/60 border-2 border-primary/40 flex items-center justify-center",
        sizeClasses[size]
      )}>
        {/* Lock icon that shakes and then breaks */}
        <Lock className={cn(
          "lock-on-bubble lock-break text-white/90",
          lockSizeClasses[size]
        )} />
        
        {/* Lock pieces that scatter when breaking */}
        <div className="lock-pieces lock-piece-1" />
        <div className="lock-pieces lock-piece-2" />
        <div className="lock-pieces lock-piece-3" />
        <div className="lock-pieces lock-piece-4" />
        
        {/* Sparkle burst effect when lock breaks */}
        <div className="sparkle-burst sparkle-1" />
        <div className="sparkle-burst sparkle-2" />
        <div className="sparkle-burst sparkle-3" />
        <div className="sparkle-burst sparkle-4" />
        <div className="sparkle-burst sparkle-5" />
        <div className="sparkle-burst sparkle-6" />
      </div>

      {/* Floating bubble that appears after lock breaks */}
      <div className={cn(
        "absolute inset-0 rounded-full bg-gradient-to-br from-primary/90 to-accent/70 border-2 border-primary/50 flex items-center justify-center opacity-0",
        sizeClasses[size],
        "bubble-float-free bubble-glow"
      )}>
        <Unlock className={cn(
          "text-white/90",
          lockSizeClasses[size]
        )} />
      </div>

      {/* Ambient glow around the bubble */}
      <div className={cn(
        "absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-xl scale-150 opacity-0",
        "animate-pulse"
      )} />
    </div>
  );
}

