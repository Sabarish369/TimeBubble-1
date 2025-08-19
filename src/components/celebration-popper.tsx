
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
];

const confettiCount = 100;
const duration = 5000; // 5 seconds

interface ConfettiPiece {
    id: number;
    color: string;
    left: string;
    animationDelay: string;
    animationDuration: string;
    transform: string;
}

const generateConfetti = (): ConfettiPiece[] => {
    return Array.from({ length: confettiCount }).map((_, i) => ({
        id: i,
        color: confettiColors[i % confettiColors.length],
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * duration}ms`,
        animationDuration: `${Math.random() * 2000 + 3000}ms`,
        transform: `rotate(${Math.random() * 360}deg)`,
    }));
};

const keyframes = `
@keyframes confetti-fall {
  0% {
    transform: translateY(-10vh) rotateZ(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(110vh) rotateZ(720deg);
    opacity: 0;
  }
}
`;

export const CelebrationPopper = memo(() => {
    const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
    const [isMounted, setIsMounted] = useState(false);

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
        const timer = setTimeout(() => setIsMounted(true), 100);
        return () => clearTimeout(timer);
    }, []);

    if (!isMounted) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
            {confetti.map(({ id, color, left, animationDelay, animationDuration, transform }) => (
                <div
                    key={id}
                    className="absolute top-0 w-2 h-2 rounded-full"
                    style={{
                        backgroundColor: color,
                        left,
                        animation: `confetti-fall ${animationDuration} ${animationDelay} linear forwards`,
                        transform,
                    }}
                />
            ))}
        </div>
    );
});

CelebrationPopper.displayName = 'CelebrationPopper';
