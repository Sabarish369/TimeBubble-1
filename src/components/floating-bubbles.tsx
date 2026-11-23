'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface FloatingBubblesProps {
  count?: number;
  className?: string;
}

const FloatingBubbles: React.FC<FloatingBubblesProps> = ({ 
  count = 15,
  className = ""
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const bubbles = containerRef.current.querySelectorAll('.bubble');
    
    bubbles.forEach((bubble, index) => {
      const element = bubble as HTMLElement;
      
      // Random initial position
      const startX = Math.random() * window.innerWidth;
      const startY = window.innerHeight + 100;
      
      // Random size
      const size = Math.random() * 60 + 20; // 20-80px
      element.style.width = `${size}px`;
      element.style.height = `${size}px`;
      
      // Random color/opacity
      const opacity = Math.random() * 0.3 + 0.1; // 0.1-0.4
      element.style.opacity = opacity.toString();
      
      // Set initial position
      gsap.set(element, {
        x: startX,
        y: startY,
        scale: 0
      });
      
      // Animate bubble floating up
      const tl = gsap.timeline({ repeat: -1 });
      
      tl.to(element, {
        scale: 1,
        duration: 0.5,
        ease: "back.out(1.7)"
      })
      .to(element, {
        y: -200,
        x: startX + (Math.random() - 0.5) * 300, // Slight horizontal drift
        rotation: Math.random() * 360,
        duration: Math.random() * 8 + 12, // 12-20 seconds
        ease: "none"
      }, 0.5)
      .to(element, {
        scale: 0,
        opacity: 0,
        duration: 1,
        ease: "power2.in"
      }, "-=2")
      .set(element, {
        x: Math.random() * window.innerWidth,
        y: window.innerHeight + 100,
        scale: 0,
        opacity: opacity,
        rotation: 0
      });
      
      // Stagger start times
      tl.delay(Math.random() * 5);
    });

    // Handle window resize
    const handleResize = () => {
      bubbles.forEach((bubble) => {
        const element = bubble as HTMLElement;
        gsap.set(element, {
          x: Math.random() * window.innerWidth
        });
      });
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      gsap.killTweensOf(bubbles);
    };
  }, [count]);

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none overflow-hidden z-0 ${className}`}
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="bubble absolute rounded-full bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm border border-white/10"
          style={{
            filter: 'blur(0.5px)',
          }}
        />
      ))}
    </div>
  );
};

export default FloatingBubbles;
