'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskCompletionCelebrationProps {
  isVisible: boolean;
  onComplete?: () => void;
  position?: { x: number; y: number };
}

interface ConfettiBubble {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  rotation: number;
  rotationSpeed: number;
}

// Move colors outside component to prevent recreation on every render
const CONFETTI_COLORS = [
  '#FF6B6B', // Coral
  '#4ECDC4', // Turquoise
  '#45B7D1', // Sky Blue
  '#96CEB4', // Mint
  '#FECA57', // Yellow
  '#FF9FF3', // Pink
  '#54A0FF', // Blue
  '#5F27CD', // Purple
  '#00D2D3', // Cyan
  '#FF9F43'  // Orange
];

export function TaskCompletionCelebration({ 
  isVisible, 
  onComplete
}: TaskCompletionCelebrationProps) {
  const [confetti, setConfetti] = useState<ConfettiBubble[]>([]);

  useEffect(() => {
    if (!isVisible) {
      setConfetti([]);
      return;
    }

    // Create confetti bubbles that float around the bubble
    const createConfetti = () => {
      const newConfetti: ConfettiBubble[] = [];
      
      // Create bubbles around the perimeter of the time bubble
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const radius = 80 + Math.random() * 40; // Start outside the bubble
        const speed = 1 + Math.random() * 2;
        
        newConfetti.push({
          id: Date.now() + i,
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          vx: (Math.random() - 0.5) * speed,
          vy: -Math.abs(Math.random()) * speed - 1, // Always float upward
          size: 8 + Math.random() * 16,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          life: 0,
          maxLife: 180 + Math.random() * 120, // 3-5 seconds
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 8
        });
      }
      
      setConfetti(newConfetti);
    };

    createConfetti();

    // Clean up after animation
    const cleanup = setTimeout(() => {
      setConfetti([]);
      if (onComplete) onComplete();
    }, 4000);

    return () => clearTimeout(cleanup);
  }, [isVisible, onComplete]);

  // Animate confetti bubbles
  useEffect(() => {
    if (confetti.length === 0) return;

    const interval = setInterval(() => {
      setConfetti(prev => 
        prev.map(bubble => {
          const progress = bubble.life / bubble.maxLife;
          const opacity = progress < 0.1 ? progress * 10 : 
                         progress > 0.8 ? (1 - progress) * 5 : 1;
          
          return {
            ...bubble,
            x: bubble.x + bubble.vx,
            y: bubble.y + bubble.vy,
            life: bubble.life + 1,
            rotation: bubble.rotation + bubble.rotationSpeed,
            // Add slight air resistance and gentle floating motion
            vx: bubble.vx * 0.99 + (Math.random() - 0.5) * 0.1,
            vy: bubble.vy * 0.99 - 0.05, // Constant upward drift
          };
        }).filter(bubble => bubble.life < bubble.maxLife)
      );
    }, 16); // 60fps

    return () => clearInterval(interval);
  }, [confetti]);

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-visible">
      {/* Floating confetti bubbles */}
      {confetti.map(bubble => {
        const progress = bubble.life / bubble.maxLife;
        const opacity = progress < 0.1 ? progress * 10 : 
                       progress > 0.8 ? (1 - progress) * 5 : 1;
        const scale = 0.8 + Math.sin(bubble.life * 0.1) * 0.2; // Gentle pulsing
        
        return (
          <motion.div
            key={bubble.id}
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
              width: bubble.size,
              height: bubble.size,
              marginLeft: -(bubble.size / 2),
              marginTop: -(bubble.size / 2),
              transform: `translate(${bubble.x}px, ${bubble.y}px) rotate(${bubble.rotation}deg) scale(${scale})`,
              opacity: opacity * 0.8
            }}
          >
            <div
              className="w-full h-full rounded-full"
              style={{
                backgroundColor: bubble.color,
                boxShadow: `0 0 ${bubble.size * 0.5}px ${bubble.color}40, inset 0 2px 4px rgba(255, 255, 255, 0.3)`,
                border: '2px solid rgba(255, 255, 255, 0.6)'
              }}
            />
          </motion.div>
        );
      })}

      {/* Simple success indicator */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-green-400/10 rounded-lg border border-green-400/30"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
