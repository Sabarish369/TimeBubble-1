
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
import { CheckCircle, Zap, BarChart, Cloud, Palette, FileDown, Star } from 'lucide-react';

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const proFeatures = [
  {
    icon: Cloud,
    title: 'Cloud Sync & Backup',
    description: 'Sync your bubbles across all devices securely.',
  },
  {
    icon: Zap,
    title: 'Advanced AI Insights',
    description: 'Get weekly/monthly reports and predictive planning.',
  },
  {
    icon: BarChart,
    title: 'Unlimited Templates',
    description: 'Create as many custom bubble templates as you need.',
  },
  {
    icon: Palette,
    title: 'Enhanced Customization',
    description: 'Unlock exclusive color palettes and app themes.',
  },
  {
    icon: FileDown,
    title: 'Export Data',
    description: 'Export your data to CSV or PDF for your records.',
  },
];

export function ProModal({ isOpen, onClose }: ProModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center items-center">
            <div className='p-3 rounded-full bg-primary/10 mb-4'>
                <Star className="h-8 w-8 text-amber-500" />
            </div>
          <DialogTitle className="text-2xl">Upgrade to TimeBubble Pro</DialogTitle>
          <DialogDescription>
            Unlock powerful features to supercharge your productivity and gain deeper insights.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {proFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary/10 text-primary mt-1">
                    <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold">{feature.title}</p>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button size="lg" className="w-full">
            Upgrade Now (Coming Soon)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
