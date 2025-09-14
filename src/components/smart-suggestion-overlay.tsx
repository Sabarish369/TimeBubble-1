'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Lightbulb, X, Clock, Calendar, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BubbleSuggestion } from '@/lib/user-pattern-analyzer';
import { format } from 'date-fns';

interface SmartSuggestionOverlayProps {
  suggestions: BubbleSuggestion[];
  activeSuggestion: BubbleSuggestion | null;
  isVisible: boolean;
  showTooltip: boolean;
  onAccept: (suggestion: BubbleSuggestion) => void;
  onDismiss: (suggestionId: string) => void;
  onDismissAll: () => void;
  onHideTooltip: () => void;
  className?: string;
}

export function SmartSuggestionOverlay({
  suggestions,
  activeSuggestion,
  isVisible,
  showTooltip,
  onAccept,
  onDismiss,
  onDismissAll,
  onHideTooltip,
  className
}: SmartSuggestionOverlayProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Handle keyboard interactions
  useEffect(() => {
    if (!isVisible || suggestions.length === 0) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Tab':
          event.preventDefault();
          if (suggestions[selectedIndex]) {
            onAccept(suggestions[selectedIndex]);
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'Escape':
          event.preventDefault();
          onDismissAll();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, suggestions, selectedIndex, onAccept, onDismissAll]);

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions]);

  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={cn(
            "absolute z-50 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-4 min-w-80 max-w-md",
            "border-primary/20 bg-gradient-to-br from-background to-muted/30",
            className
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm font-medium text-foreground">Smart Suggestions</span>
              <Badge variant="secondary" className="text-xs">
                {suggestions.length}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismissAll}
              className="h-6 w-6 p-0 hover:bg-destructive/10"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Suggestions List */}
          <div className="space-y-2 mb-3">
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "relative p-3 rounded-md border cursor-pointer transition-all duration-200",
                  "hover:border-primary/40 hover:bg-muted/50",
                  selectedIndex === index
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/50 bg-background/50",
                  "group"
                )}
                onClick={() => {
                  setSelectedIndex(index);
                  onAccept(suggestion);
                }}
              >
                {/* Confidence indicator */}
                <div className="absolute top-2 right-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    suggestion.confidence > 0.7 ? "bg-green-500" :
                    suggestion.confidence > 0.5 ? "bg-yellow-500" : "bg-orange-500"
                  )} />
                </div>

                {/* Suggestion content */}
                <div className="pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm text-foreground truncate">
                      {suggestion.title}
                    </h4>
                    <Badge variant="outline" className="text-xs capitalize">
                      {suggestion.category}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{format(suggestion.startTime, 'HH:mm')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{suggestion.duration}min</span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground/80 line-clamp-2">
                    {suggestion.reason}
                  </p>
                </div>

                {/* Selection indicator */}
                {selectedIndex === index && (
                  <motion.div
                    layoutId="selection-indicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.div>
            ))}
          </div>

          {/* Footer with keyboard hint */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">↑↓</kbd>
              <span>Navigate</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Esc</kbd>
              <span>Dismiss</span>
            </div>
            
            <Tooltip open={showTooltip}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-xs text-primary font-medium">
                  <Keyboard className="h-3 w-3" />
                  <span>Tab to accept</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs">
                  Press <kbd className="px-1 py-0.5 bg-background rounded text-xs">Tab</kbd> to quickly accept the selected suggestion and create the bubble.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onHideTooltip}
                  className="mt-2 h-6 text-xs"
                >
                  Got it
                </Button>
              </TooltipContent>
            </Tooltip>
          </div>
        </motion.div>
      </AnimatePresence>
    </TooltipProvider>
  );
}
