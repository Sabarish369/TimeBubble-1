
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

interface Bubble {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  phase: number;
  frequency: number;
  amplitude: number;
  buoyancy: number;
  wobble: number;
  element?: HTMLDivElement;
}

export function AtmosphericLights({ 
  className, 
  count = 8, 
  speed = 0.3,
  size = 12,
  colors = [
    'hsl(var(--bubble-sky-blue) / 0.6)',     // Sky blue
    'hsl(var(--bubble-peach) / 0.55)',       // Peach  
    'hsl(var(--bubble-lavender) / 0.6)',     // Lavender
    'hsl(var(--bubble-mint) / 0.55)',        // Mint
    'hsl(var(--bubble-rose-gold) / 0.6)',    // Rose gold
    'hsl(var(--bubble-coral) / 0.55)',       // Coral
    'hsl(var(--bubble-aqua) / 0.6)',         // Aqua
    'hsl(var(--bubble-lime) / 0.55)',        // Lime
    'hsl(var(--bubble-canary) / 0.6)',       // Canary
    'hsl(var(--bubble-indigo) / 0.55)',      // Indigo
  ]
}: AtmosphericLightsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const timeRef = useRef(0);

  // Add this function to ensure bubbles stay within boundaries
  const keepWithinBounds = (bubble: Bubble, rect: DOMRect) => {
    // Ensure the bubble always stays within the container bounds
    if (bubble.y < 0) bubble.y = 0;
    if (bubble.y > rect.height) bubble.y = rect.height;
    if (bubble.x < 0) bubble.x = 0;
    if (bubble.x > rect.width) bubble.x = rect.width;
    return bubble;
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let rect = container.getBoundingClientRect();

    // Create bubbles with natural physics properties
    const createBubble = (id: number): Bubble => {
      const bubbleSize = size + Math.random() * size * 0.8;
      const startX = Math.random() * rect.width;
      const startY = rect.height + bubbleSize; // Start from bottom
      
      return {
        id,
        x: startX,
        y: startY,
        vx: (Math.random() - 0.5) * speed * 0.5, // Gentle horizontal drift
        vy: -speed * (0.8 + Math.random() * 0.4), // Upward movement
        size: bubbleSize,
        opacity: 0.3 + Math.random() * 0.4,
        color: colors[Math.floor(Math.random() * colors.length)],
        phase: Math.random() * Math.PI * 2,
        frequency: 0.02 + Math.random() * 0.02,
        amplitude: 10 + Math.random() * 15,
        buoyancy: 0.98 + Math.random() * 0.02,
        wobble: 0.5 + Math.random() * 0.5,
      };
    };

    // Initialize bubbles
    const initializeBubbles = () => {
      // Clear existing elements
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      
      bubblesRef.current = [];
      
      for (let i = 0; i < count; i++) {
        const bubble = createBubble(i);
        // Spread initial positions vertically for a more natural start
        bubble.y = rect.height + Math.random() * rect.height * 0.5;
        
        // Create DOM element with enhanced colorful styling
        const element = document.createElement('div');
        element.className = 'absolute pointer-events-none';
        
        // Create a more vibrant gradient based on the bubble color
        const baseColor = bubble.color;
        const highlightColor = baseColor.replace('0.6)', '0.8)').replace('0.55)', '0.75)');
        const glowColor = baseColor.replace('0.6)', '0.3)').replace('0.55)', '0.25)');
        
        element.style.cssText = `
          width: ${bubble.size}px;
          height: ${bubble.size}px;
          border-radius: 50%;
          background: radial-gradient(circle at 25% 25%, 
            rgba(255, 255, 255, 0.4), 
            ${highlightColor} 30%,
            ${baseColor} 60%,
            ${glowColor} 100%
          );
          backdrop-filter: blur(2px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 
            inset 0 2px 4px rgba(255, 255, 255, 0.3),
            0 0 15px ${glowColor},
            0 4px 12px rgba(0, 0, 0, 0.1);
          will-change: transform, opacity;
        `;
        
        bubble.element = element;
        container.appendChild(element);
        bubblesRef.current.push(bubble);
      }
    };

    // Animation loop with natural bubble physics
    const animate = () => {
      if (!containerRef.current) return;
      
      timeRef.current += 1;
      rect = containerRef.current.getBoundingClientRect();
      
      bubblesRef.current.forEach((bubble, index) => {
        if (!bubble.element) return;
        
        // Natural floating physics
        // Add sinusoidal wobble for natural movement
        const wobbleX = Math.sin(timeRef.current * bubble.frequency + bubble.phase) * bubble.amplitude * 0.1;
        const wobbleY = Math.cos(timeRef.current * bubble.frequency * 1.3 + bubble.phase) * bubble.amplitude * 0.05;
        
        // Apply buoyancy (natural upward force)
        bubble.vy *= bubble.buoyancy;
        bubble.vy -= 0.01; // Gentle upward acceleration
        
        // Add horizontal drift with subtle randomness
        bubble.vx += (Math.random() - 0.5) * 0.002;
        bubble.vx *= 0.999; // Air resistance
        
        // Update position
        bubble.x += bubble.vx + wobbleX * 0.1;
        bubble.y += bubble.vy + wobbleY * 0.1;
        
        // Continuous horizontal wrapping for seamless flow
        if (bubble.x < -bubble.size) {
          bubble.x = rect.width + bubble.size;
        } else if (bubble.x > rect.width + bubble.size) {
          bubble.x = -bubble.size;
        }
        
        // Continuous vertical cycling - bubbles always flow
        if (bubble.y < -bubble.size * 2) {
          // Reset to bottom with new properties for continuous flow
          bubble.y = rect.height + bubble.size + Math.random() * 50;
          bubble.x = Math.random() * rect.width;
          bubble.vx = (Math.random() - 0.5) * speed * 0.5;
          bubble.vy = -speed * (0.8 + Math.random() * 0.4);
          bubble.phase = Math.random() * Math.PI * 2;
          bubble.opacity = 0.3 + Math.random() * 0.4;
        }
        
        // Keep bubbles strictly within container bounds
        bubble.x = Math.max(-bubble.size, Math.min(rect.width + bubble.size, bubble.x));
        bubble.y = Math.max(-bubble.size * 2, Math.min(rect.height + bubble.size + 50, bubble.y));
        
        // Calculate opacity based on position (fade near edges)
        const edgeFadeZone = 50;
        let positionOpacity = 1;
        
        if (bubble.y > rect.height - edgeFadeZone) {
          positionOpacity = Math.max(0, (rect.height - bubble.y) / edgeFadeZone);
        } else if (bubble.y < edgeFadeZone) {
          positionOpacity = Math.max(0, bubble.y / edgeFadeZone);
        }
        
        const finalOpacity = bubble.opacity * positionOpacity;
        
        // Apply transformations with smooth interpolation
        bubble.element.style.transform = `translate3d(${bubble.x.toFixed(2)}px, ${bubble.y.toFixed(2)}px, 0) scale(${(1 + Math.sin(timeRef.current * bubble.frequency + bubble.phase) * 0.1).toFixed(3)})`;
        bubble.element.style.opacity = finalOpacity.toFixed(3);
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    // Handle resize
    const handleResize = () => {
      rect = container.getBoundingClientRect();
      // Reposition bubbles that are out of bounds
      bubblesRef.current.forEach(bubble => {
        if (bubble.x > rect.width) {
          bubble.x = Math.random() * rect.width;
        }
      });
    };

    // Setup
    initializeBubbles();
    animate();
    
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      resizeObserver.disconnect();
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      bubblesRef.current = [];
    };
  }, [count, speed, size, colors]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none",
        className
      )}
      style={{
        background: 'transparent',
        contain: 'strict',
        zIndex: 0,
        clipPath: 'inset(0 0 0 0)', // Force clipping to boundaries
        position: 'absolute', // Ensure absolute positioning
        height: '100%', // Explicit height
        width: '100%', // Explicit width
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    />
  );
}
