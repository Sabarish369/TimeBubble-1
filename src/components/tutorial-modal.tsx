
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { GanttChartSquare, Sparkles, Wand2, Lightbulb, BarChart, ArrowRight, ArrowLeft } from 'lucide-react';
import { Progress } from './ui/progress';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const tutorialSteps = [
  {
    icon: GanttChartSquare,
    title: 'Welcome to TimeBubble!',
    description: "Let's take a quick tour of the key features to get you started. This is your timeline, where you can visually plan your day.",
  },
  {
    icon: Wand2,
    title: 'Drag & Drop Templates',
    description: 'The sidebar on the left holds your templates. Drag a template onto the timeline to quickly schedule a task. You can create your own, too!',
  },
  {
    icon: ArrowRight,
    title: 'Create Bubbles Manually',
    description: 'Double-click anywhere on the timeline to create a custom time bubble for a specific time.',
  },
  {
    icon: BarChart,
    title: 'Reflect on Your Day',
    description: 'When a bubble finishes, you can reflect on your productivity and mood. This helps our AI learn about your work patterns.',
  },
  {
    icon: Sparkles,
    title: 'Get AI Insights',
    description: 'Click the sparkles icon in the header at the end of your day. Our AI will analyze your completed bubbles and give you personalized insights.',
  },
  {
    icon: Lightbulb,
    title: 'AI-Powered Tips',
    description: "Look for the lightbulb on the right side of your screen. You'll find real-time, proactive tips to help you stay on track and improve your well-being.",
  },
];

export function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < tutorialSteps.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const currentStep = tutorialSteps[step];
  const Icon = currentStep.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center items-center">
            <div className='p-4 rounded-full bg-primary/10 mb-4'>
                <Icon className="h-10 w-10 text-primary" />
            </div>
          <DialogTitle className="text-2xl">{currentStep.title}</DialogTitle>
          <DialogDescription className="px-4">
            {currentStep.description}
          </DialogDescription>
        </DialogHeader>

        <Progress value={((step + 1) / tutorialSteps.length) * 100} className="w-full my-4" />

        <DialogFooter className="flex justify-between w-full">
            {step > 0 ? (
                <Button variant="outline" onClick={handlePrev}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
            ) : <div />}
          <Button onClick={handleNext}>
            {step === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
            {step < tutorialSteps.length - 1 && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
