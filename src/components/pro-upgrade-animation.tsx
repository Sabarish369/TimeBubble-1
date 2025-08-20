
'use client';

import { useEffect, useState } from 'react';
import { Crown, Unlock, Sparkles, Star, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ProUpgradeAnimationProps {
    isVisible: boolean;
    onComplete: () => void;
}

export function ProUpgradeAnimation({ isVisible, onComplete }: ProUpgradeAnimationProps) {
    const [stage, setStage] = useState<'rising' | 'unlocking' | 'celebration' | 'complete'>('rising');
    const [bubblePosition, setBubblePosition] = useState({ x: 50, y: 100 });
    const [showContinueButton, setShowContinueButton] = useState(false);

    useEffect(() => {
        if (!isVisible) return;

        const animationSequence = async () => {
            // Stage 1: Rising
            setTimeout(() => {
                setBubblePosition({ x: 50, y: 50 });
            }, 100);

            // Stage 2: Unlocking (after 3 seconds)
            setTimeout(() => {
                setStage('unlocking');
            }, 3000);

            // Stage 3: Celebration (after 6 seconds)
            setTimeout(() => {
                setStage('celebration');
            }, 6000);

            // Stage 4: Show continue button (after 9 seconds)
            setTimeout(() => {
                setShowContinueButton(true);
            }, 9000);
        };

        animationSequence();
    }, [isVisible]);

    const handleContinue = () => {
        setStage('complete');
        onComplete();
    };

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
                    stage === 'celebration' && "transform scale-100"
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
                            {/* Sparkles around unlock - properly positioned */}
                            {[...Array(6)].map((_, i) => {
                                const angle = (i * Math.PI * 2) / 6;
                                const radius = 50;
                                const x = Math.cos(angle) * radius;
                                const y = Math.sin(angle) * radius;
                                
                                return (
                                    <Sparkles
                                        key={i}
                                        className="absolute w-6 h-6 text-yellow-400 animate-ping"
                                        style={{
                                            left: `calc(50% + ${x}px)`,
                                            top: `calc(50% + ${y}px)`,
                                            transform: 'translate(-50%, -50%)',
                                            animationDelay: `${i * 0.2}s`,
                                        }}
                                    />
                                );
                            })}
                        </div>
                    )}

                    {stage === 'celebration' && (
                        <div className="relative text-center">
                            <Crown className="w-20 h-20 text-white drop-shadow-lg mx-auto mb-2 animate-bounce" />
                            <div className="text-white font-bold text-xl drop-shadow-lg">
                                TimeBubble Pro
                            </div>
                            <div className="text-white/80 text-sm mt-1">
                                Unlocked!
                            </div>
                            
                            {/* Celebration particles - properly aligned in circle */}
                            {[...Array(12)].map((_, i) => {
                                const angle = (i * Math.PI * 2) / 12;
                                const radius = 80;
                                const x = Math.cos(angle) * radius;
                                const y = Math.sin(angle) * radius;
                                
                                return (
                                    <Star
                                        key={i}
                                        className="absolute w-4 h-4 text-yellow-400 animate-ping"
                                        style={{
                                            left: `calc(50% + ${x}px)`,
                                            top: `calc(50% + ${y}px)`,
                                            transform: 'translate(-50%, -50%)',
                                            animationDelay: `${i * 0.1}s`,
                                            animationDuration: '1.5s',
                                        }}
                                    />
                                );
                            })}
                        </div>
                    )}

                    {/* Bubble shine effect */}
                    <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-white/30 to-transparent opacity-60" />
                    
                    {/* Bubble reflection */}
                    <div className="absolute top-8 left-8 w-8 h-8 rounded-full bg-white/40 blur-sm" />
                </div>

                {/* Ripple effects - smoother animation */}
                {(stage === 'unlocking' || stage === 'celebration') && (
                    <>
                        <div className="absolute inset-0 rounded-full border-2 border-primary/50 animate-ping" style={{ animationDuration: '3s' }} />
                        <div className="absolute inset-0 rounded-full border-2 border-accent/50 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                        <div className="absolute inset-0 rounded-full border-2 border-white/50 animate-ping" style={{ animationDuration: '3s', animationDelay: '2s' }} />
                    </>
                )}
            </div>

            {/* Stage descriptions */}
            <div className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 text-center">
                {stage === 'rising' && (
                    <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-1000">
                        <h2 className="text-3xl font-bold text-white mb-2">
                            Activating TimeBubble Pro...
                        </h2>
                        <p className="text-white/80 text-lg">
                            Your productivity upgrade is rising!
                        </p>
                    </div>
                )}
                
                {stage === 'unlocking' && (
                    <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-1000">
                        <h2 className="text-3xl font-bold text-white mb-2">
                            Unlocking Pro Features...
                        </h2>
                        <p className="text-white/80 text-lg">
                            Breaking the limits of productivity!
                        </p>
                    </div>
                )}

                {stage === 'celebration' && (
                    <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-1000">
                        <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                            🎉 Welcome to Pro!
                        </h2>
                        <p className="text-white/80 text-lg">
                            Your productivity just got supercharged!
                        </p>
                    </div>
                )}
            </div>

            {/* Continue button */}
            {showContinueButton && (
                <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                    <Button 
                        onClick={handleContinue}
                        size="lg"
                        className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                        Continue
                        <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                </div>
            )}
        </div>
    );
}
