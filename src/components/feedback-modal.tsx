'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { SimpleFeedback } from './simple-feedback';

export function FeedbackModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
          <MessageSquare className="h-5 w-5" />
          <span className="sr-only">Give Feedback</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Feedback</DialogTitle>
          <DialogDescription>
            Help us improve TimeBubble by sharing your thoughts and suggestions.
          </DialogDescription>
        </DialogHeader>
        <SimpleFeedback />
      </DialogContent>
    </Dialog>
  );
}
