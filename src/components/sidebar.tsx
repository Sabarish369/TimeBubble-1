'use client';

import type { DragEvent } from 'react';
import { Briefcase, BookOpen, Coffee, User, Heart, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BUBBLE_COLORS, SIDEBAR_WIDTH } from '@/lib/constants';
import type { BubbleCategory } from '@/types';

const categoryIcons: Record<BubbleCategory, LucideIcon> = {
  work: Briefcase,
  study: BookOpen,
  break: Coffee,
  personal: User,
  health: Heart,
};

const templates: { title: string; category: BubbleCategory; duration: number, color: string }[] = [
  { title: 'Focus Work', category: 'work', duration: 90, color: BUBBLE_COLORS.mint },
  { title: 'Study Session', category: 'study', duration: 120, color: BUBBLE_COLORS["sky-blue"] },
  { title: 'Short Break', category: 'break', duration: 15, color: BUBBLE_COLORS.peach },
  { title: 'Workout', category: 'health', duration: 60, color: BUBBLE_COLORS["rose-gold"] },
  { title: 'Personal Time', category: 'personal', duration: 45, color: BUBBLE_COLORS.lavender },
];

export function Sidebar() {
  const handleDragStart = (e: DragEvent<HTMLDivElement>, template: typeof templates[0]) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData('application/json', JSON.stringify(template));
  };

  return (
    <aside
      className="p-4 border-r bg-card shrink-0"
      style={{ width: `${SIDEBAR_WIDTH}px` }}
    >
      <h2 className="text-xl font-semibold mb-4 text-center">Templates</h2>
      <Separator className="mb-4" />
      <div className="space-y-3">
        {templates.map((template) => {
          const Icon = categoryIcons[template.category];
          return (
            <div
              key={template.title}
              draggable
              onDragStart={(e) => handleDragStart(e, template)}
              className="p-3 rounded-lg shadow-sm cursor-grab active:cursor-grabbing flex items-center gap-3 transition-shadow hover:shadow-md"
              style={{ backgroundColor: template.color }}
            >
              <Icon className="h-5 w-5 shrink-0 text-black/60" />
              <div>
                <p className="font-medium text-sm text-black/80">{template.title}</p>
                <p className="text-xs text-black/60">{template.duration} min</p>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
