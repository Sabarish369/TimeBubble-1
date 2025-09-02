'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Star, ThumbsUp, ThumbsDown, Clock, Target, Lightbulb } from 'lucide-react';
import { type EnhancedTip, type TipFeedback } from '@/types/ai-types';
import { tipTrackingSystem } from '@/lib/tip-tracking-system';
import { useToast } from '@/hooks/use-toast';

interface TipFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  tip: EnhancedTip;
  onFeedbackSubmitted?: (feedback: TipFeedback) => void;
}

export function TipFeedbackModal({ 
  isOpen, 
  onClose, 
  tip, 
  onFeedbackSubmitted 
}: TipFeedbackModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [helpfulness, setHelpfulness] = useState<number>(0);
  const [implemented, setImplemented] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<number>(3);
  const [results, setResults] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: 'Rating Required',
        description: 'Please provide a rating before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const feedbackData: TipFeedback = {
        tipId: tip.id,
        rating,
        helpfulness,
        implemented,
        difficulty,
        results: results.trim() || undefined,
        feedback: feedback.trim() || undefined,
        timestamp: new Date(),
      };

      // Record feedback in tracking system
      tipTrackingSystem.recordTipFeedback(feedbackData);
      
      // Record implementation if applicable
      if (implemented) {
        tipTrackingSystem.recordTipImplementation({
          tipId: tip.id,
          implementedAt: new Date(),
          completionStatus: 'complete',
          difficulty: difficulty > 3 ? 'harder_than_expected' : 
                     difficulty < 3 ? 'easier_than_expected' : 'as_expected',
          timeSpent: 0, // Could be enhanced to track actual time
          notes: feedback.trim() || undefined,
          results: results.trim() || undefined,
        });
      }

      // Call callback if provided
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(feedbackData);
      }

      toast({
        title: 'Feedback Submitted',
        description: 'Thank you for your feedback! This helps improve our recommendations.',
      });

      // Reset form and close
      handleReset();
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Submission Failed',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setRating(0);
    setHelpfulness(0);
    setImplemented(false);
    setDifficulty(3);
    setResults('');
    setFeedback('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const renderStarRating = (
    value: number, 
    onChange: (value: number) => void, 
    label: string
  ) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-slate-300">{label}</Label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`transition-colors ${
              star <= value 
                ? 'text-yellow-400 hover:text-yellow-300' 
                : 'text-slate-600 hover:text-slate-500'
            }`}
          >
            <Star className={`h-6 w-6 ${
              star <= value ? 'fill-current' : ''
            }`} />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-white">
            <Lightbulb className="h-5 w-5 text-amber-400" />
            <span>Rate This Tip</span>
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Help us improve our recommendations by sharing your experience with this tip.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tip Summary */}
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs font-medium text-amber-400">{tip.type}</span>
              {tip.priority === 'high' && (
                <div className="w-2 h-2 bg-red-400 rounded-full" title="High Priority" />
              )}
            </div>
            {tip.title && (
              <h4 className="font-semibold text-white mb-1">{tip.title}</h4>
            )}
            <p className="text-sm text-slate-300">{tip.suggestion}</p>
          </div>

          {/* Overall Rating */}
          {renderStarRating(rating, setRating, "Overall Rating *")}

          {/* Helpfulness Rating */}
          {renderStarRating(
            helpfulness, 
            setHelpfulness, 
            "How helpful was this tip?"
          )}

          {/* Implementation Status */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-300">Implementation</Label>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="implemented"
                checked={implemented}
                onCheckedChange={(checked) => setImplemented(checked as boolean)}
                className="border-slate-600"
              />
              <Label 
                htmlFor="implemented" 
                className="text-sm text-slate-400 cursor-pointer"
              >
                I implemented this tip
              </Label>
            </div>
          </div>

          {/* Difficulty Rating (if implemented) */}
          {implemented && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-300">
                How difficult was it to implement?
              </Label>
              <RadioGroup 
                value={difficulty.toString()} 
                onValueChange={(value) => setDifficulty(parseInt(value))}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="easy" className="border-slate-600" />
                  <Label htmlFor="easy" className="text-sm text-slate-400">Much easier</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id="somewhat-easy" className="border-slate-600" />
                  <Label htmlFor="somewhat-easy" className="text-sm text-slate-400">Easier</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="3" id="as-expected" className="border-slate-600" />
                  <Label htmlFor="as-expected" className="text-sm text-slate-400">As expected</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="4" id="somewhat-hard" className="border-slate-600" />
                  <Label htmlFor="somewhat-hard" className="text-sm text-slate-400">Harder</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="5" id="hard" className="border-slate-600" />
                  <Label htmlFor="hard" className="text-sm text-slate-400">Much harder</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Results (if implemented) */}
          {implemented && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-300">
                What results did you experience?
              </Label>
              <Textarea
                value={results}
                onChange={(e) => setResults(e.target.value)}
                placeholder="Describe the impact or results of implementing this tip..."
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                rows={3}
              />
            </div>
          )}

          {/* Additional Feedback */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-300">
              Additional Feedback (Optional)
            </Label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Any additional thoughts or suggestions for improvement..."
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
              rows={3}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              'Submit Feedback'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}