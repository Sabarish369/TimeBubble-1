'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AtmosphericLightsProps {
  className?: string;
  count?: number;
  speed?: number;
  size?: number;
  colors?: string[];
}

export function AtmosphericLights({ 
  className, 
  count = 8, 
  speed = 20, 
  size = 4,
  colors = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--bubble-sky-blue))', 'hsl(var(--bubble-lavender))']
}: AtmosphericLightsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const lights: HTMLDivElement[] = [];
    type BubbleState = {
      el: HTMLDivElement;
      x: number; // percentage [0,100]
      y: number; // percentage [0,100]
      baseX: number;
      baseY: number;
      riseSpeed: number; // % per second
      swayAmp: number; // px
      swayFreq: number; // radians per second
      wobbleAmp: number; // px
      wobbleFreq: number; // radians per second
      phaseX: number;
      phaseY: number;
      pixelSize: number;
      dirY: number; // -1 upwards, 1 downwards
    };
    const states: BubbleState[] = [];

    // Create light particles
    for (let i = 0; i < count; i++) {
      const light = document.createElement('div');
      light.className = 'absolute rounded-full opacity-70';
      const px = size + Math.random() * size * 1.5;
      light.style.width = `${px}px`;
      light.style.height = `${px}px`;
      light.style.background = colors[i % colors.length];
      const startX = Math.random() * 100;
      const startY = Math.random() * 100;
      light.style.left = `${startX}%`;
      light.style.top = `${startY}%`;
      light.style.filter = `blur(${Math.max(0, (6 - px / 2)).toFixed(1)}px)`;
      
      container.appendChild(light);
      lights.push(light);

      const s: BubbleState = {
        el: light,
        x: startX,
        y: startY,
        baseX: startX,
        baseY: startY,
        riseSpeed: (speed * 0.02) + Math.random() * (speed * 0.015), // percent/sec
        swayAmp: 8 + Math.random() * 16,
        swayFreq: 0.5 + Math.random() * 0.8,
        wobbleAmp: 4 + Math.random() * 8,
        wobbleFreq: 0.8 + Math.random() * 1.2,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        pixelSize: px,
        dirY: -1,
      };
      states.push(s);
    }

    let last = performance.now();
    const animate = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); // cap delta to avoid jumps
      last = now;
      const rect = container.getBoundingClientRect();
      const widthPx = rect.width;
      const heightPx = rect.height;

      for (const s of states) {
        // natural vertical drift with gentle reversal at bounds (no teleport)
        s.y += s.dirY * s.riseSpeed * dt;
        if (s.y < -2) {
          s.y = -2;
          s.dirY = 1; // start drifting down
        }
        if (s.y > 102) {
          s.y = 102;
          s.dirY = -1; // start drifting up
        }

        // horizontal sway and slight vertical wobble in pixels
        const t = now / 1000;
        const swayX = Math.sin(t * s.swayFreq + s.phaseX) * s.swayAmp;
        const wobbleY = Math.cos(t * s.wobbleFreq + s.phaseY) * s.wobbleAmp;

        // convert percent position to pixels + offsets
        const xPx = (s.x / 100) * widthPx + swayX;
        const yPx = (s.y / 100) * heightPx + wobbleY;

        s.el.style.transform = `translate3d(${xPx}px, ${yPx}px, 0)`;
        // also adjust opacity subtly based on vertical position
        const o = 0.35 + 0.35 * Math.sin((t * 0.5) + s.phaseY);
        s.el.style.opacity = o.toFixed(2);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    // Cleanup function
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lights.forEach(light => {
        if (light.parentNode) {
          light.parentNode.removeChild(light);
        }
      });
    };
  }, [count, speed, size, colors]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none",
        className
      )}
    >
      <style jsx>{`
        div { will-change: transform, opacity; }
      `}</style>
    </div>
  );
}


