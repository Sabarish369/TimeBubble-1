import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap } from 'lucide-react';
import { format } from 'date-fns';
import type { TimeBlock } from '@/types';

interface SuggestedBubbleProps {
  suggestion: {
    id: string;
    title: string;
    category: TimeBlock['category'];
    duration: number;
    startTime: Date;
    confidence: number;
    color: TimeBlock['color'];
  };
  isActive: boolean;
  isIgnored: boolean;
  style: React.CSSProperties;
  onAccept: () => void;
  onDismiss: () => void;
}

const categoryColors = {
  work: 'bg-indigo-200/70 border-indigo-400 text-indigo-800',
  study: 'bg-teal-200/70 border-teal-400 text-teal-800',
  personal: 'bg-purple-200/70 border-purple-400 text-purple-800',
  health: 'bg-emerald-200/70 border-emerald-400 text-emerald-800',
  break: 'bg-amber-200/70 border-amber-400 text-amber-800'
};

export function SuggestedBubble({ 
  suggestion, 
  isActive, 
  isIgnored,
  style, 
  onAccept, 
  onDismiss 
}: SuggestedBubbleProps) {
  const colorClass = categoryColors[suggestion.category] || categoryColors.personal;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ 
        opacity: isIgnored ? 0.4 : 0.85, 
        scale: 1, 
        y: 0 
      }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      whileHover={{ 
        opacity: isIgnored ? 0.6 : 0.95, 
        scale: isIgnored ? 1.01 : 1.02 
      }}
      className={`
        absolute rounded-lg border-2 border-dashed cursor-pointer
        transition-all duration-300 shadow-lg backdrop-blur-sm
        ${colorClass}
        ${isActive ? 'ring-2 ring-blue-500 ring-offset-2 shadow-xl' : ''}
        ${isIgnored ? 'grayscale-[0.3]' : ''}
      `}
      style={style}
      onClick={isIgnored ? undefined : onAccept}
    >
      <div className="p-2 h-full flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-1">
              <Zap className="w-3 h-3 opacity-70" />
              <span className="text-xs font-medium opacity-70">
                {isIgnored ? 'Ignored' : 'Suggested'}
              </span>
            </div>
            <h4 className="text-sm font-medium truncate">{suggestion.title}</h4>
            <p className="text-xs opacity-70 capitalize">{suggestion.category}</p>
          </div>
          {!isIgnored && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="text-xs opacity-50 hover:opacity-70 ml-1"
            >
              ×
            </button>
          )}
        </div>
        
        <div className="flex items-center justify-between text-xs opacity-70">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{format(suggestion.startTime, 'HH:mm')}</span>
          </div>
          <span>{suggestion.duration}min</span>
        </div>
      </div>
      
      {isActive && !isIgnored && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 
                        bg-gray-800 text-white text-xs px-2 py-1 rounded 
                        whitespace-nowrap z-10">
          Press Tab to accept
        </div>
      )}
    </motion.div>
  );
}
