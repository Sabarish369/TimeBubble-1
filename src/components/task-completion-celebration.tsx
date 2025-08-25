'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle, Star, Zap } from 'lucide-react';

interface TaskCompletionCelebrationProps {
  isVisible: boolean;
  onComplete?: () => void;
  position?: { x: number; y: number };
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  type: 'sparkle' | 'star' | 'zap' | 'bubble';
  size: number;
  rotation: number;
  rotationSpeed: number;
}

export function TaskCompletionCelebration({ 
  isVisible, 
  onComplete, 
  position = { x: 0, y: 0 } 
}: TaskCompletionCelebrationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showMainCelebration, setShowMainCelebration] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Create initial burst of particles
      const newParticles: Particle[] = [];
      
      // Sparkles
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        newParticles.push({
          id: i,
          x: position.x,
          y: position.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 60 + Math.random() * 30,
          type: 'sparkle',
          size: 8 + Math.random() * 8,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 20
        });
      }

      // Stars
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
        const speed = 1.5 + Math.random() * 2;
        newParticles.push({
          id: 100 + i,
          x: position.x,
          y: position.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 80 + Math.random() * 40,
          type: 'star',
          size: 12 + Math.random() * 8,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 15
        });
      }

      // Zap effects
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
        const speed = 3 + Math.random() * 2;
        newParticles.push({
          id: 200 + i,
          x: position.x,
          y: position.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 50 + Math.random() * 20,
          type: 'zap',
          size: 10 + Math.random() * 6,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 25
        });
      }

      // Floating bubbles
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const speed = 0.8 + Math.random() * 1.2;
        newParticles.push({
          id: 300 + i,
          x: position.x,
          y: position.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 100 + Math.random() * 50,
          type: 'bubble',
          size: 16 + Math.random() * 12,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10
        });
      }

      setParticles(newParticles);
      setShowMainCelebration(true);

      // Auto-hide after animation
      const timer = setTimeout(() => {
        setShowMainCelebration(false);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 500);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, position.x, position.y, onComplete]);

  useEffect(() => {
    if (particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles(prev => 
        prev.map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          life: particle.life + 1,
          rotation: particle.rotation + particle.rotationSpeed * 0.1,
          vy: particle.vy + 0.05, // Gravity effect
          vx: particle.vx * 0.99, // Air resistance
        })).filter(particle => particle.life < particle.maxLife)
      );
    }, 16); // 60fps

    return () => clearInterval(interval);
  }, [particles]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Main celebration overlay */}
      <AnimatePresence>
        {showMainCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {/* Central celebration */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 15,
                delay: 0.2
              }}
              className="relative"
            >
                             <div className="w-24 h-24 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-2xl">
                 <CheckCircle className="w-12 h-12 text-white" style={{ strokeWidth: 2 }} />
               </div>
              
                             {/* Ripple effect */}
               <motion.div
                 initial={{ scale: 0, opacity: 1 }}
                 animate={{ scale: 3, opacity: 0 }}
                 transition={{ duration: 1.5, repeat: 2, ease: "easeOut" }}
                 className="absolute inset-0 border-2 border-green-400 rounded-full"
                 style={{ filter: 'drop-shadow(0 0 2px rgba(34, 197, 94, 0.8))' }}
               />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Particle animations */}
      {particles.map(particle => {
        const progress = particle.life / particle.maxLife;
        const opacity = 1 - progress;
        const scale = 1 - progress * 0.5;

        return (
          <motion.div
            key={particle.id}
            initial={{ 
              x: position.x, 
              y: position.y, 
              scale: 0, 
              opacity: 0 
            }}
            animate={{ 
              x: particle.x, 
              y: particle.y, 
              scale: scale, 
              opacity: opacity,
              rotate: particle.rotation
            }}
            transition={{ duration: 0.1 }}
            className="absolute"
            style={{
              width: particle.size,
              height: particle.size,
            }}
          >
                         {particle.type === 'sparkle' && (
               <Sparkles 
                 className="w-full h-full text-yellow-400" 
                 style={{ 
                   filter: 'drop-shadow(0 0 4px rgba(251, 191, 36, 1))',
                   strokeWidth: 1.5
                 }}
               />
             )}
             {particle.type === 'star' && (
               <Star 
                 className="w-full h-full text-blue-400" 
                 style={{ 
                   filter: 'drop-shadow(0 0 4px rgba(96, 165, 250, 1))',
                   strokeWidth: 1.5
                 }}
               />
             )}
             {particle.type === 'zap' && (
               <Zap 
                 className="w-full h-full text-purple-400" 
                 style={{ 
                   filter: 'drop-shadow(0 0 4px rgba(168, 85, 247, 1))',
                   strokeWidth: 1.5
                 }}
               />
             )}
             {particle.type === 'bubble' && (
               <div 
                 className="w-full h-full rounded-full bg-gradient-to-br from-pink-400 to-rose-500"
                 style={{ 
                   filter: 'drop-shadow(0 0 4px rgba(236, 72, 153, 1))',
                   background: `radial-gradient(circle, rgba(236, 72, 153, 1) 0%, rgba(244, 63, 94, 0.9) 100%)`
                 }}
               />
             )}
          </motion.div>
        );
      })}

      {/* Background glow effect */}
      <AnimatePresence>
        {showMainCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-emerald-500/5 to-teal-500/5"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
