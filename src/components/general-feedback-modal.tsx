'use client';

import * as React from 'react';
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
import { MessageSquare, ThumbsUp, ThumbsDown, Lightbulb, Bug, Heart, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';

interface GeneralFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GeneralFeedbackModal({ isOpen, onClose }: GeneralFeedbackModalProps) {
  const [feedbackType, setFeedbackType] = React.useState<string>('');
  const [message, setMessage] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!feedbackType || !message.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please select a feedback type and enter your message.',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'You must be signed in to submit feedback.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('Attempting to fetch /api/submit-feedback');
      const response = await fetch('/api/submit-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          feedbackType,
          message,
        }),
      });
      console.log('Fetch response received:', response.status, response.statusText);

      let responseData;
      let errorMessage = 'Failed to submit feedback. Please try again.';

      try {
        // Try to parse JSON response
        responseData = await response.json();
      } catch (parseError) {
        // If JSON parsing fails, it's likely an HTML error page
        console.error('Error parsing JSON response:', parseError);
        // Try to get text content as fallback
        try {
          const textResponse = await response.text();
          console.error('Non-JSON response content:', textResponse);
          errorMessage = textResponse.includes('Internal Server Error') 
            ? 'Server error occurred. Please try again later.' 
            : textResponse.substring(0, 100) + '...';
        } catch (textError) {
          console.error('Error getting text response:', textError);
          errorMessage = 'Server error occurred. Please try again later.';
        }
        
        // Throw error with appropriate message
        throw new Error(errorMessage);
      }

      if (!response.ok) {
        throw new Error(responseData.error || errorMessage);
      }

      toast({
        title: 'Feedback Submitted',
        description: 'Thank you for your feedback! This helps us improve TimeBubble.',
      });

      // Reset form and close
      setFeedbackType('');
      setMessage('');
      onClose();
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      // Provide more detailed error information
      let detailedMessage = error.message || 'Failed to submit feedback. Please try again.';
      
      // Handle network errors specifically
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        detailedMessage = 'Unable to connect to the feedback service. Please check your internet connection and try again.';
      }
      
      toast({
        title: 'Submission Failed',
        description: detailedMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const feedbackTypes = [
    { id: 'feature', icon: Lightbulb, label: 'Feature Request', color: 'text-yellow-500' },
    { id: 'bug', icon: Bug, label: 'Bug Report', color: 'text-red-500' },
    { id: 'praise', icon: Heart, label: 'Love It!', color: 'text-pink-500' },
    { id: 'general', icon: MessageSquare, label: 'General Feedback', color: 'text-blue-500' },
    { id: 'improvement', icon: Sparkles, label: 'Improvement Idea', color: 'text-purple-500' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-background border border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <span>Share Your Feedback</span>
          </DialogTitle>
          <DialogDescription>
            Help us make TimeBubble better! Your feedback is valuable to us.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Feedback Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">What type of feedback?</Label>
            <RadioGroup 
              value={feedbackType} 
              onValueChange={setFeedbackType}
              className="grid grid-cols-2 gap-3"
            >
              {feedbackTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <div key={type.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={type.id} id={type.id} className="sr-only" />
                    <Label 
                      htmlFor={type.id}
                      className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer w-full transition-all ${
                        feedbackType === type.id 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50 hover:bg-primary/5'
                      }`}
                    >
                      <Icon className={type.color} size={18} />
                      <span className="text-sm">{type.label}</span>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Feedback Message */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Your Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what's on your mind..."
              className="min-h-32"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !feedbackType || !message.trim()}
            className="bg-primary hover:bg-primary/90"
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