
'use client';

import { useEffect, useState, memo } from 'react';
import { cn } from '@/lib/utils';

const confettiColors = [
    'hsl(var(--primary))',
    'hsl(var(--accent))',
    'hsl(var(--bubble-mint))',
    'hsl(var(--bubble-peach))',
    'hsl(var(--bubble-sky-blue))',
    'hsl(var(--bubble-rose-gold))',
    'hsl(var(--bubble-lavender))',
    'hsl(var(--bubble-coral))',
    'hsl(var(--bubble-canary))',
    'hsl(var(--bubble-aqua))',
    '#FFD700', // Gold
    '#FF6B6B', // Coral
    '#4ECDC4', // Turquoise
    '#45B7D1', // Sky Blue
    '#96CEB4', // Mint
    '#FECA57', // Sunny Yellow
];

const confettiShapes = ['circle', 'square', 'triangle', 'star'];
const confettiCount = 200;
const duration = 8000; // 8 seconds

interface ConfettiPiece {
    id: number;
    color: string;
    left: string;
    animationDelay: string;
    animationDuration: string;
    transform: string;
    size: number;
    shape: string;
    rotationSpeed: number;
}

const generateConfetti = (): ConfettiPiece[] => {
    return Array.from({ length: confettiCount }).map((_, i) => ({
        id: i,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 2000}ms`,
        animationDuration: `${Math.random() * 3000 + 4000}ms`,
        transform: `rotate(${Math.random() * 360}deg)`,
        size: Math.random() * 8 + 4, // 4-12px
        shape: confettiShapes[Math.floor(Math.random() * confettiShapes.length)],
        rotationSpeed: Math.random() * 720 + 360, // 360-1080 degrees
    }));
};

const keyframes = `
@keyframes confetti-fall {
  0% {
    transform: translateY(-15vh) rotateZ(0deg) rotateX(0deg) scale(1);
    opacity: 1;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(110vh) rotateZ(var(--rotation)) rotateX(360deg) scale(0.5);
    opacity: 0;
  }
}

@keyframes confetti-burst {
  0% {
    transform: translateY(-10vh) translateX(0) scale(0) rotate(0deg);
    opacity: 0;
  }
  10% {
    transform: translateY(-5vh) translateX(var(--burst-x)) scale(1.2) rotate(180deg);
    opacity: 1;
  }
  100% {
    transform: translateY(110vh) translateX(var(--burst-x)) scale(0.8) rotate(var(--rotation));
    opacity: 0;
  }
}

@keyframes sparkle {
  0%, 100% {
    transform: scale(0) rotate(0deg);
    opacity: 0;
  }
  50% {
    transform: scale(1) rotate(180deg);
    opacity: 1;
  }
}

@keyframes float-celebration {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  33% {
    transform: translateY(-10px) rotate(5deg);
  }
  66% {
    transform: translateY(-5px) rotate(-5deg);
  }
}
`;

export const CelebrationPopper = memo(() => {
    const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
    const [isMounted, setIsMounted] = useState(false);
    const [sparkles, setSparkles] = useState<ConfettiPiece[]>([]);

    useEffect(() => {
        // Inject keyframes into the document head
        if (typeof window !== 'undefined') {
            const styleSheet = document.createElement("style");
            styleSheet.type = "text/css";
            styleSheet.innerText = keyframes;
            document.head.appendChild(styleSheet);
            return () => {
                document.head.removeChild(styleSheet);
            };
        }
    }, []);

    useEffect(() => {
        setConfetti(generateConfetti());
        // Generate some sparkles for extra magic
        setSparkles(Array.from({ length: 30 }).map((_, i) => ({
            id: i + 1000,
            color: '#FFD700',
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3000}ms`,
            animationDuration: `2000ms`,
            transform: `rotate(${Math.random() * 360}deg)`,
            size: Math.random() * 4 + 2,
            shape: 'star',
            rotationSpeed: 360,
        })));
        const timer = setTimeout(() => setIsMounted(true), 100);
        return () => clearTimeout(timer);
    }, []);

    if (!isMounted) return null;

    const getShapeStyles = (shape: string, size: number, color: string) => {
        const baseStyles = {
            width: `${size}px`,
            height: `${size}px`,
            position: 'absolute' as const,
            top: 0,
        };

        switch (shape) {
            case 'circle':
                return {
                    ...baseStyles,
                    backgroundColor: color,
                    borderRadius: '50%',
                };
            case 'square':
                return {
                    ...baseStyles,
                    backgroundColor: color,
                    transform: 'rotate(45deg)',
                };
            case 'triangle':
                return {
                    ...baseStyles,
                    width: 0,
                    height: 0,
                    borderLeft: `${size/2}px solid transparent`,
                    borderRight: `${size/2}px solid transparent`,
                    borderBottom: `${size}px solid ${color}`,
                    backgroundColor: 'transparent',
                };
            case 'star':
                return {
                    ...baseStyles,
                    backgroundColor: color,
                    clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                };
            default:
                return {
                    ...baseStyles,
                    backgroundColor: color,
                    borderRadius: '50%',
                };
        }
    };

    return (
        <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
            {/* Main confetti burst */}
            {confetti.map(({ id, color, left, animationDelay, animationDuration, size, shape, rotationSpeed }) => (
                <div
                    key={id}
                    style={{
                        ...getShapeStyles(shape, size, color),
                        left,
                        animation: `${Math.random() > 0.3 ? 'confetti-fall' : 'confetti-burst'} ${animationDuration} ${animationDelay} ease-out forwards`,
                        '--rotation': `${rotationSpeed}deg`,
                        '--burst-x': `${(Math.random() - 0.5) * 200}px`,
                    } as React.CSSProperties}
                />
            ))}
            
            {/* Magical sparkles */}
            {sparkles.map(({ id, color, left, animationDelay, animationDuration, size }) => (
                <div
                    key={id}
                    style={{
                        ...getShapeStyles('star', size, color),
                        left,
                        top: `${Math.random() * 50}%`,
                        animation: `sparkle ${animationDuration} ${animationDelay} ease-in-out infinite`,
                        filter: 'brightness(1.5) drop-shadow(0 0 4px currentColor)',
                    }}
                />
            ))}

            {/* Floating celebration text */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div 
                    className="text-6xl font-bold text-transparent bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text filter drop-shadow-lg"
                    style={{
                        animation: 'float-celebration 3s ease-in-out infinite',
                        animationDelay: '500ms',
                    }}
                >
                    🎉
                </div>
            </div>
        </div>
    );
});

CelebrationPopper.displayName = 'CelebrationPopper';
