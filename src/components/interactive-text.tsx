'use client';

import { useEffect, useRef, useState } from 'react';

interface InteractiveTextProps {
  text: string;
  className?: string;
}

export default function InteractiveText({ text, className = '' }: InteractiveTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseenter', handleMouseEnter);
      container.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseenter', handleMouseEnter);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  const getCharacterStyle = (index: number, charElement: HTMLSpanElement | null) => {
    if (!isHovering || !charElement) {
      return {
        fontWeight: 400,
        transform: 'scale(1)'
      };
    }

    const rect = charElement.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    
    if (!containerRect) return { fontWeight: 400, transform: 'scale(1)' };

    const charCenterX = rect.left + rect.width / 2 - containerRect.left;
    const charCenterY = rect.top + rect.height / 2 - containerRect.top;
    
    const distance = Math.sqrt(
      Math.pow(mousePosition.x - charCenterX, 2) + 
      Math.pow(mousePosition.y - charCenterY, 2)
    );

    const maxDistance = 150;
    const normalizedDistance = Math.min(distance / maxDistance, 1);
    const effect = 1 - normalizedDistance;

    const fontWeight = 400 + (500 * effect);
    const scale = 1 + (0.3 * effect);

    return {
      fontWeight: Math.round(fontWeight),
      transform: `scale(${scale})`,
      transition: 'all 0.1s ease-out'
    };
  };

  return (
    <div 
      ref={containerRef}
      className={`relative cursor-none select-none ${className}`}
      style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight text-gradient">
        {text.split('').map((char, index) => (
          <span
            key={index}
            ref={(el) => {
              if (el) {
                const style = getCharacterStyle(index, el);
                Object.assign(el.style, style);
              }
            }}
            className="inline-block"
            style={{
              fontWeight: 400,
              transform: 'scale(1)',
              transition: 'all 0.1s ease-out'
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </h1>
    </div>
  );
}
