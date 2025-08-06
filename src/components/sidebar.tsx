
'use client';

import type { DragEvent } from 'react';
import { Briefcase, BookOpen, Coffee, User, Heart, Plus, Trash2, type LucideIcon } from 'lucide-react';
import { BUBBLE_COLORS, SIDEBAR_WIDTH } from '@/lib/constants';
import type { BubbleCategory, BubbleTemplate } from '@/types';
import { useTimeBubbles } from '@/context/time-bubbles-context';
import { Button } from './ui/button';
import { TemplateModal } from './template-modal';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const categoryIcons: Record<BubbleCategory, LucideIcon> = {
  work: Briefcase,
  study: BookOpen,
  break: Coffee,
  personal: User,
  health: Heart,
};

const defaultTemplates: BubbleTemplate[] = [
  { id: 'default-1', title: 'Focus Work', description: 'Deep work session on a key project.', category: 'work', duration: 90, color: 'mint', isDefault: true },
  { id: 'default-2', title: 'Study Session', description: 'Review notes and practice problems.', category: 'study', duration: 120, color: 'sky-blue', isDefault: true },
  { id: 'default-3', title: 'Short Break', description: 'Step away from the screen, stretch, or meditate.', category: 'break', duration: 15, color: 'peach', isDefault: true },
  { id: 'default-4', title: 'Workout', description: 'Go for a run, lift weights, or do yoga.', category: 'health', duration: 60, color: 'rose-gold', isDefault: true },
  { id: 'default-5', title: 'Personal Time', description: 'Read a book, work on a hobby, or relax.', category: 'personal', duration: 45, color: 'lavender', isDefault: true },
];

export function Sidebar() {
  const { templates, deleteTemplate } = useTimeBubbles();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const allTemplates = [...defaultTemplates, ...templates];

  const handleDragStart = (e: DragEvent<HTMLDivElement>, template: BubbleTemplate) => {
    e.dataTransfer.effectAllowed = "copy";
    const templateData = {
      title: template.title,
      category: template.category,
      duration: template.duration,
      color: template.color,
      description: template.description
    };
    e.dataTransfer.setData('application/json', JSON.stringify(templateData));
  };

  return (
    <aside
      className="p-4 border-r bg-card shrink-0 flex flex-col"
      style={{ width: `${SIDEBAR_WIDTH}px` }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-center">Templates</h2>
        <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-5 w-5" />
          <span className="sr-only">Create New Template</span>
        </Button>
      </div>
      
      <div className="space-y-3 overflow-y-auto flex-1">
        {allTemplates.map((template) => {
          const Icon = categoryIcons[template.category];
          return (
            <div
              key={template.id}
              draggable
              onDragStart={(e) => handleDragStart(e, template)}
              className="p-3 rounded-lg shadow-sm cursor-grab active:cursor-grabbing flex items-center gap-3 transition-shadow hover:shadow-md relative group"
              style={{ backgroundColor: `hsl(var(--bubble-${template.color}))` }}
            >
              <Icon className="h-5 w-5 shrink-0 text-slate-700 dark:text-white" />
              <div className='flex-1'>
                <p className="font-medium text-sm text-slate-800 dark:text-white">{template.title}</p>
                <p className="text-xs text-slate-700 dark:text-white/80">{template.duration} min</p>
              </div>
              {!template.isDefault && (
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 right-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="h-4 w-4 text-slate-700 dark:text-white/80" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the "{template.title}" template. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteTemplate(template.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          );
        })}
      </div>
      <TemplateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </aside>
  );
}
