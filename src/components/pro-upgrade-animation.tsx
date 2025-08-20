
'use client';

import { useEffect, useState } from 'react';
import { Crown, Unlock, Sparkles, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProUpgradeAnimationProps {
    isVisible: boolean;
    onComplete: () => void;
}

export function ProUpgradeAnimation({ isVisible, onComplete }: ProUpgradeAnimationProps) {
    const [stage, setStage] = useState<'rising' | 'unlocking' | 'celebration' | 'complete'>('rising');
    const [bubblePosition, setBubblePosition] = useState({ x: 50, y: 100 });

    useEffect(() => {
        if (!isVisible) return;

        const timeline = [
            { stage: 'rising' as const, duration: 2000 },
            { stage: 'unlocking' as const, duration: 1500 },
            { stage: 'celebration' as const, duration: 2000 },
            { stage: 'complete' as const, duration: 500 },
        ];

        let currentTimeout: NodeJS.Timeout;
        let currentIndex = 0;

        const runStage = () => {
            if (currentIndex < timeline.length) {
                const { stage: nextStage, duration } = timeline[currentIndex];
                setStage(nextStage);
                
                if (nextStage === 'rising') {
                    // Animate bubble rising from bottom
                    setTimeout(() => setBubblePosition({ x: 50, y: 50 }), 100);
                }
                
                currentTimeout = setTimeout(() => {
                    currentIndex++;
                    runStage();
                }, duration);
            } else {
                onComplete();
            }
        };

        runStage();

        return () => {
            if (currentTimeout) clearTimeout(currentTimeout);
        };
    }, [isVisible, onComplete]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-black/80 via-black/60 to-black/80 backdrop-blur-sm flex items-center justify-center overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-2 h-2 bg-gradient-to-r from-primary to-accent rounded-full animate-pulse"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${2 + Math.random() * 2}s`,
                        }}
                    />
                ))}
            </div>

            {/* Main bubble animation */}
            <div
                className={cn(
                    "relative transition-all duration-2000 ease-out",
                    stage === 'rising' && "transform translate-y-0 scale-100",
                    stage === 'unlocking' && "transform scale-110",
                    stage === 'celebration' && "transform scale-100 animate-pulse"
                )}
                style={{
                    transform: `translate(${bubblePosition.x - 50}vw, ${bubblePosition.y - 50}vh)`,
                }}
            >
                {/* Bubble container */}
                <div className={cn(
                    "relative w-64 h-64 rounded-full flex items-center justify-center transition-all duration-1000",
                    stage === 'rising' && "bg-gradient-to-br from-primary/20 to-accent/20 border-4 border-primary/30",
                    stage === 'unlocking' && "bg-gradient-to-br from-primary/40 to-accent/40 border-4 border-primary/60",
                    stage === 'celebration' && "bg-gradient-to-br from-primary to-accent border-4 border-white/50"
                )}>
                    
                    {/* Lock/Unlock animation */}
                    {stage === 'rising' && (
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-primary rounded-lg relative bg-primary/20">
                                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-8 h-6 border-4 border-primary border-b-0 rounded-t-full" />
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full" />
                            </div>
                        </div>
                    )}

                    {stage === 'unlocking' && (
                        <div className="relative animate-bounce">
                            <Unlock className="w-20 h-20 text-white drop-shadow-lg animate-pulse" />
                            {/* Sparkles around unlock */}
                            {[...Array(6)].map((_, i) => (
                                <Sparkles
                                    key={i}
                                    className="absolute w-6 h-6 text-yellow-400 animate-ping"
                                    style={{
                                        top: `${10 + Math.sin((i * Math.PI) / 3) * 40}px`,
                                        left: `${10 + Math.cos((i * Math.PI) / 3) * 40}px`,
                                        animationDelay: `${i * 0.2}s`,
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {stage === 'celebration' && (
                        <div className="relative text-center animate-bounce">
                            <Crown className="w-20 h-20 text-white drop-shadow-lg mx-auto mb-2" />
                            <div className="text-white font-bold text-xl drop-shadow-lg">
                                TimeBubble Pro
                            </div>
                            <div className="text-white/80 text-sm mt-1">
                                Unlocked!
                            </div>
                            
                            {/* Celebration particles */}
                            {[...Array(8)].map((_, i) => (
                                <Star
                                    key={i}
                                    className="absolute w-4 h-4 text-yellow-400 animate-ping"
                                    style={{
                                        top: `${50 + Math.sin((i * Math.PI) / 4) * 80}%`,
                                        left: `${50 + Math.cos((i * Math.PI) / 4) * 80}%`,
                                        transform: 'translate(-50%, -50%)',
                                        animationDelay: `${i * 0.15}s`,
                                        animationDuration: '1.2s',
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Bubble shine effect */}
                    <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-white/30 to-transparent opacity-60" />
                    
                    {/* Bubble reflection */}
                    <div className="absolute top-8 left-8 w-8 h-8 rounded-full bg-white/40 blur-sm" />
                </div>

                {/* Ripple effects */}
                {(stage === 'unlocking' || stage === 'celebration') && (
                    <>
                        <div className="absolute inset-0 rounded-full border-2 border-primary/50 animate-ping" style={{ animationDuration: '2s' }} />
                        <div className="absolute inset-0 rounded-full border-2 border-accent/50 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
                        <div className="absolute inset-0 rounded-full border-2 border-white/50 animate-ping" style={{ animationDuration: '2s', animationDelay: '1s' }} />
                    </>
                )}
            </div>

            {/* Text animation */}
            {stage === 'celebration' && (
                <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-1000">
                    <h2 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        🎉 Welcome to Pro!
                    </h2>
                    <p className="text-white/80 text-lg">
                        Your productivity just got supercharged!
                    </p>
                </div>
            )}
        </div>
    );
}
