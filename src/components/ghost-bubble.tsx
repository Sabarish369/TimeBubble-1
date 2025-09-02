'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Briefcase, BookOpen, Coffee, User, Heart } from 'lucide-react';
import type { BubbleCategory } from '@/types';

interface GhostBubbleProps {
  template: {
    title: string;
    category: BubbleCategory;
    duration: number;
    color: string;
    description?: string;
  };
  position: { x: number; y: number };
  isVisible: boolean;
  onDrop?: () => void;
}

const categoryIcons: Record<BubbleCategory, React.ComponentType<{ className?: string }>> = {
  work: Briefcase,
  study: BookOpen,
  break: Coffee,
  personal: User,
  health: Heart,
};

export function GhostBubble({ template, position, isVisible, onDrop }: GhostBubbleProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const IconComponent = categoryIcons[template.category];

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    } else {
      setIsAnimating(false);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const durationInHours = template.duration / 60;
  const height = Math.max(60, durationInHours * 60); // Minimum 60px height

  return (
    <div
      className={cn(
        "fixed pointer-events-none z-[100] transition-all duration-300 ease-out",
        isAnimating && "ghost-bubble-visible",
        !isVisible && "opacity-0 scale-95"
      )}
      style={{
        left: position.x,
        top: position.y,
        width: '280px', // Fixed width for consistency
        height: `${height}px`,
        transform: 'translate(-50%, -50%)',
        marginLeft: '0', // Reset any inherited margin
        marginTop: '0', // Reset any inherited margin
      }}
    >
      {/* Ghost bubble background with glow effect */}
      <div 
        className={cn(
          "absolute inset-0 rounded-xl border-2 border-dashed transition-all duration-300",
          "ghost-bubble-background"
        )}
        style={{
          background: `linear-gradient(135deg, 
            hsl(var(--bubble-${template.color}) / 0.2) 0%, 
            hsl(var(--bubble-${template.color}) / 0.1) 50%, 
            hsl(var(--bubble-${template.color}) / 0.15) 100%)`,
          borderColor: `hsl(var(--bubble-${template.color}) / 0.5)`,
          boxShadow: `0 0 25px hsl(var(--bubble-${template.color}) / 0.4), 
                       inset 0 1px 0 hsl(var(--bubble-${template.color}) / 0.3)`,
        }}
      />

      {/* Floating particles around the ghost bubble */}
      <div className="absolute inset-0 overflow-hidden rounded-xl">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full ghost-particle"
            style={{
              left: `${20 + (i * 15) % 60}%`,
              top: `${30 + (i * 20) % 40}%`,
              width: `${4 + (i % 3)}px`,
              height: `${4 + (i % 3)}px`,
              background: `hsl(var(--bubble-${template.color}) / 0.7)`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <IconComponent className="h-5 w-5 text-white/90" />
          <span className="text-sm font-semibold text-white truncate">
            {template.title}
          </span>
        </div>
        <div className="text-xs text-white/80">
          {template.duration} min
        </div>
      </div>

      {/* Drop zone indicator */}
      <div className="absolute inset-0 rounded-xl border-2 border-dashed border-white/40 opacity-0 transition-opacity duration-300 ghost-drop-zone" />
    </div>
  );
}