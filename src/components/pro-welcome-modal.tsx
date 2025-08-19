
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Sparkles, BarChart, Star, Lightbulb, MessageSquareQuote } from 'lucide-react';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';
import { Card, CardContent } from './ui/card';
import { useRouter } from 'next/navigation';


interface ProWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const proFeatures = [
  {
    icon: Sparkles,
    title: 'Daily AI Insights',
    description: 'At the end of your day, click the sparkles icon in the header to get a personalized summary of your productivity, mood patterns, and actionable recommendations.',
  },
  {
    icon: Lightbulb,
    title: 'Proactive AI Tips',
    description: 'Throughout your day, open the AI tips drawer on the right to get real-time, contextual advice to optimize your well-being and stay on track.',
  },
   {
    icon: MessageSquareQuote,
    title: 'Personalized Daily Tip',
    description: 'Get a unique, inspiring tip based on your schedule for the day, right in your sidebar. Click it to refresh your inspiration at any time.',
  },
  {
    icon: BarChart,
    title: 'Unlimited Templates',
    description: 'Create as many custom bubble templates as you need to streamline your planning and get started faster.',
  },
];

export function ProWelcomeModal({ isOpen, onClose }: ProWelcomeModalProps) {
  const router = useRouter();

  const handleCloseAndRedirect = () => {
    onClose();
    router.push('/app');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="text-center items-center pt-6 px-6">
          <div className='p-3 rounded-full bg-primary/10 mb-4'>
            <Star className="h-10 w-10 text-amber-500" />
          </div>
          <DialogTitle className="text-2xl md:text-3xl">Thank You for Your Support!</DialogTitle>
          <DialogDescription className="text-base">
            As an early supporter, you're helping shape the future of TimeBubble. We're excited to have you on board and your feedback is invaluable to us!
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4">
            <h3 className="text-lg font-semibold text-center mb-4">Here's what you've unlocked:</h3>
            <Carousel className="w-full" opts={{loop: true}}>
                <CarouselContent>
                    {proFeatures.map((feature, index) => (
                        <CarouselItem key={index}>
                        <div className="p-1">
                            <Card className='bg-primary/5 border-primary/20 h-56'>
                            <CardContent className="flex flex-col items-center justify-center p-6 text-center h-full">
                                <feature.icon className="h-8 w-8 mb-3 text-primary" />
                                <p className='text-xl font-semibold text-primary/90 mb-2'>{feature.title}</p>
                                <p className="text-sm text-foreground/80">{feature.description}</p>
                            </CardContent>
                            </Card>
                        </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className='-left-4' />
                <CarouselNext className='-right-4' />
            </Carousel>
        </div>


        <DialogFooter className="p-6 pt-0">
          <Button size="lg" className="w-full" onClick={handleCloseAndRedirect}>
            Start Exploring
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
