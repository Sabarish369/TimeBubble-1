
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
  count = 12, 
  speed = 0.5,
  size = 6,
  colors = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--bubble-sky-blue))', 'hsl(var(--bubble-lavender))']
}: AtmosphericLightsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    type ParticleState = {
      el: HTMLDivElement;
      x: number; // pixel position
      y: number; // pixel position
      vx: number; // velocity x
      vy: number; // velocity y
      wander: number;
      drag: number;
    };
    const states: ParticleState[] = [];

    const setup = () => {
      const rect = container.getBoundingClientRect();
      states.length = 0; // Clear existing states
      
      // Clear existing DOM elements
      while (container.firstChild) {
          container.removeChild(container.firstChild);
      }

      for (let i = 0; i < count; i++) {
        const particleSize = size + Math.random() * size;
        const light = document.createElement('div');
        light.className = 'absolute rounded-full';
        light.style.width = `${particleSize}px`;
        light.style.height = `${particleSize}px`;
        light.style.background = colors[i % colors.length];
        light.style.filter = `blur(${Math.max(1, particleSize / 3).toFixed(1)}px)`;

        const x = Math.random() * rect.width;
        const y = Math.random() * rect.height;
        
        container.appendChild(light);

        states.push({
          el: light,
          x,
          y,
          vx: (Math.random() - 0.5) * speed * 2,
          vy: (Math.random() - 0.5) * speed * 2,
          wander: 0.1 + Math.random() * 0.4,
          drag: 0.9 + Math.random() * 0.05,
        });
      }
    };

    let last = performance.now();
    const animate = (now: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      for (const s of states) {
        // Add wandering behavior
        s.vx += (Math.random() - 0.5) * s.wander;
        s.vy += (Math.random() - 0.5) * s.wander;

        // Apply drag/friction
        s.vx *= s.drag;
        s.vy *= s.drag;
        
        // Update position with velocity
        s.x += s.vx;
        s.y += s.vy;
        
        // Gentle bounds checking to steer particles back
        const steerStrength = 0.01;
        if (s.x < 0) s.vx += steerStrength;
        if (s.x > rect.width) s.vx -= steerStrength;
        if (s.y < 0) s.vy += steerStrength;
        if (s.y > rect.height) s.vy -= steerStrength;

        // Clamp position to stay within view and prevent escape
        s.x = Math.max(0, Math.min(s.x, rect.width));
        s.y = Math.max(0, Math.min(s.y, rect.height));

        s.el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
        
        // Subtle opacity fade based on velocity
        const velocityMagnitude = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
        s.el.style.opacity = (0.2 + Math.min(0.5, velocityMagnitude * 0.5)).toFixed(2);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    setup();
    
    // Use a ResizeObserver to re-initialize on container resize smoothly
    const resizeObserver = new ResizeObserver(() => {
        // This could be enhanced to reposition particles relative to the new size,
        // but for now, a simple re-init is safer than complex logic that might jump.
        // A simple setup call is better than the original logic that caused jumps.
        setup();
    });
    resizeObserver.observe(container);

    rafRef.current = requestAnimationFrame(animate);

    // Cleanup function
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
      if(container) {
          while (container.firstChild) {
              container.removeChild(container.firstChild);
          }
      }
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
        div > div { will-change: transform, opacity; }
      `}</style>
    </div>
  );
}
