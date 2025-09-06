'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Send, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';

export function SimpleFeedback() {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast({
        title: 'Feedback Required',
        description: 'Please enter your feedback before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: feedback.trim(),
          userId: user?.uid || 'anonymous',
          userEmail: user?.email || 'anonymous',
        }),
      });

      // Always show success to user, regardless of actual result
      setIsSubmitted(true);
      setFeedback('');
      
      toast({
        title: 'Feedback Submitted',
        description: 'Thank you for your feedback! We appreciate your input.',
      });

      // Reset after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false);
      }, 3000);

      // Log errors silently without showing to user
      if (!response.ok) {
        console.error('Feedback submission failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // Still show success to user even if there was an error
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <div>
              <h3 className="text-lg font-semibold">Thank you!</h3>
              <p className="text-sm text-muted-foreground">
                Your feedback has been submitted successfully.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Share Your Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Tell us what you think about TimeBubble..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="min-h-[100px] resize-none"
        />
        <Button
          onClick={handleSubmit}
          disabled={!feedback.trim() || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Submit Feedback
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
