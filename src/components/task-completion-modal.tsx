'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Sparkles, Heart, Zap, Target, CheckCircle, PartyPopper, Flame, Crown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TaskCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle: string;
  productivity?: number;
  mood?: string;
  completionTime?: string;
}

const celebrationMessages = [
  "Amazing work! 🎉",
  "You crushed it! 💪",
  "Task conquered! 🏆",
  "Fantastic job! ⭐",
  "You're on fire! 🔥",
  "Mission accomplished! 🎯",
  "Outstanding! 👏",
  "You did it! 🌟"
];

const confettiColors = [
  'bg-pink-400', 'bg-purple-400', 'bg-blue-400', 'bg-green-400', 
  'bg-yellow-400', 'bg-red-400', 'bg-indigo-400', 'bg-orange-400'
];

const ConfettiPiece = ({ delay }: { delay: number }) => (
  <motion.div
    className={cn(
      "absolute w-3 h-3 rounded-full",
      confettiColors[Math.floor(Math.random() * confettiColors.length)]
    )}
    initial={{ 
      x: Math.random() * 400 - 200,
      y: -50,
      rotate: 0,
      scale: 0
    }}
    animate={{ 
      y: 600,
      rotate: 360,
      scale: [0, 1, 0.8, 0]
    }}
    transition={{ 
      duration: 3,
      delay,
      ease: "easeOut"
    }}
    style={{
      left: `${Math.random() * 100}%`
    }}
  />
);

const FloatingIcon = ({ Icon, delay, color }: { Icon: any, delay: number, color: string }) => (
  <motion.div
    className={cn("absolute", color)}
    initial={{ 
      x: Math.random() * 300 - 150,
      y: Math.random() * 300 - 150,
      scale: 0,
      rotate: 0
    }}
    animate={{ 
      scale: [0, 1.2, 1],
      rotate: [0, 180, 360],
      y: [0, -20, 0]
    }}
    transition={{ 
      duration: 2,
      delay,
      repeat: Infinity,
      repeatDelay: 3
    }}
  >
    <Icon className="h-6 w-6" />
  </motion.div>
);

export function TaskCompletionModal({ 
  isOpen, 
  onClose, 
  taskTitle, 
  productivity = 4, 
  mood = 'happy',
  completionTime 
}: TaskCompletionModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [message] = useState(celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)]);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        setCurrentStep(1);
      }, 1000);

      const confettiTimer = setTimeout(() => {
        setShowConfetti(false);
      }, 4000);

      return () => {
        clearTimeout(timer);
        clearTimeout(confettiTimer);
      };
    }
  }, [isOpen]);

  const handleClose = () => {
    setCurrentStep(0);
    setShowConfetti(false);
    onClose();
  };

  const getProductivityIcon = () => {
    if (productivity >= 5) return Crown;
    if (productivity >= 4) return Trophy;
    if (productivity >= 3) return Star;
    return Target;
  };

  const getProductivityColor = () => {
    if (productivity >= 5) return 'from-yellow-400 to-orange-500';
    if (productivity >= 4) return 'from-purple-400 to-pink-500';
    if (productivity >= 3) return 'from-blue-400 to-cyan-500';
    return 'from-green-400 to-emerald-500';
  };

  const ProductivityIcon = getProductivityIcon();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg border-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-hidden relative">
        {/* Confetti Animation */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 50 }).map((_, i) => (
              <ConfettiPiece key={i} delay={i * 0.1} />
            ))}
          </div>
        )}

        {/* Floating Icons */}
        <div className="absolute inset-0 pointer-events-none">
          <FloatingIcon Icon={Sparkles} delay={0.5} color="text-yellow-400" />
          <FloatingIcon Icon={Heart} delay={1} color="text-pink-400" />
          <FloatingIcon Icon={Zap} delay={1.5} color="text-blue-400" />
          <FloatingIcon Icon={Star} delay={2} color="text-purple-400" />
        </div>

        <div className="relative z-10 text-center py-8">
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <motion.div
                key="celebration"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: "spring", duration: 0.8 }}
              >
                {/* Main celebration icon */}
                <motion.div
                  className={cn(
                    "mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 bg-gradient-to-br",
                    getProductivityColor()
                  )}
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <ProductivityIcon className="h-12 w-12 text-white" />
                </motion.div>

                {/* Celebration message */}
                <motion.h1
                  className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4"
                  animate={{ 
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {message}
                </motion.h1>

                {/* Task title */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white/70 backdrop-blur-sm rounded-lg p-4 mb-6 border border-white/50"
                >
                  <p className="text-gray-600 text-sm mb-1">Task Completed:</p>
                  <p className="font-semibold text-gray-900 text-lg">"{taskTitle}"</p>
                </motion.div>

                {/* Animated emoji celebration */}
                <motion.div
                  className="text-6xl mb-6"
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  🎉
                </motion.div>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="space-y-6"
              >
                {/* Achievement badge */}
                <motion.div
                  className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-6"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", duration: 0.8 }}
                >
                  <CheckCircle className="h-10 w-10 text-white" />
                </motion.div>

                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Task Complete! 🏆
                </h2>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <motion.div
                    className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <Zap className="h-5 w-5 text-blue-500 mr-2" />
                      <span className="text-sm text-gray-600">Productivity</span>
                    </div>
                    <div className="flex justify-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3 + i * 0.1 }}
                        >
                          <Star 
                            className={cn(
                              "h-4 w-4 mx-0.5",
                              i < productivity ? "text-yellow-400 fill-current" : "text-gray-300"
                            )} 
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  <motion.div
                    className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <Heart className="h-5 w-5 text-pink-500 mr-2" />
                      <span className="text-sm text-gray-600">Mood</span>
                    </div>
                    <div className="text-center">
                      <span className="text-2xl">
                        {mood === 'happy' && '😊'}
                        {mood === 'focused' && '🔥'}
                        {mood === 'neutral' && '😐'}
                        {mood === 'tired' && '☕'}
                        {mood === 'stressed' && '😰'}
                      </span>
                    </div>
                  </motion.div>
                </div>

                {completionTime && (
                  <motion.div
                    className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-white/50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <p className="text-sm text-gray-600">
                      Completed in: <span className="font-semibold text-gray-900">{completionTime}</span>
                    </p>
                  </motion.div>
                )}

                {/* Motivational message */}
                <motion.div
                  className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 border border-purple-200"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <p className="text-purple-800 font-medium">
                    {productivity >= 4 
                      ? "You're absolutely crushing it! Keep this momentum going! 🚀"
                      : "Every step forward is progress. You're building great habits! 💪"
                    }
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          <motion.div
            className="flex justify-center gap-3 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: currentStep === 0 ? 2 : 1 }}
          >
            {currentStep === 0 ? (
              <Button
                onClick={() => setCurrentStep(1)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-2 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                View Details ✨
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(0)}
                  className="px-6 py-2 rounded-full border-2 border-purple-300 text-purple-600 hover:bg-purple-50"
                >
                  ← Back
                </Button>
                <Button
                  onClick={handleClose}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-2 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Continue 🎯
                </Button>
              </>
            )}
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
