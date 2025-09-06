'use client';

import type { DragEvent } from 'react';
import { Briefcase, BookOpen, Coffee, User, Heart, Plus, Trash2, Pencil, MessageSquare, type LucideIcon, CalendarPlus, History } from 'lucide-react';
import { BUBBLE_COLORS, SIDEBAR_WIDTH } from '@/lib/constants';
import type { BubbleCategory, BubbleTemplate } from '@/types';
import { useTimeBubbles } from '@/context/time-bubbles-context';
import { Button } from './ui/button';
import { TemplateModal } from './template-modal';
import { useState, useEffect } from 'react';
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
import { MissedTasksDrawer } from './missed-tasks-drawer';
import { DailySidebarTip } from './daily-sidebar-tip';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { ProModal } from './pro-modal';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';

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

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { templates, updateTemplate, deleteTemplate, setIsBubbleCreateModalOpen, timeBlocks } = useTimeBubbles();
  const { user, isPro, isAdmin } = useAuth();
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isMissedTasksDrawerOpen, setIsMissedTasksDrawerOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BubbleTemplate | undefined>(undefined);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const allTemplates = [...defaultTemplates.map(t => {
    const userOverride = templates.find(ut => ut.id === t.id);
    return userOverride ? { ...t, ...userOverride, isDefault: true } : t;
  }), ...templates.filter(t => !t.isDefault)];

  const userCreatedTemplatesCount = templates.filter(t => !t.isDefault).length;
  const templateLimitReached = !isPro && userCreatedTemplatesCount >= 3;

  useEffect(() => {
    if (isMobile && isOpen) {
      // No automatic closing on mobile based on screen size change, only user action.
    } else if (!isMobile) {
      // Logic for desktop if needed
    }
  }, [isMobile, isOpen, onClose]);


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

    // Close sidebar on mobile when drag starts
    if (isMobile) {
      onClose();
    }

    const target = e.currentTarget;

    // Add drag start animation to original element
    target.style.transform = 'scale(0.95) rotate(-2deg)';
    target.style.opacity = '0.6';
    target.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    target.classList.add('dragging-source');

    // Create a simpler, more compatible drag image
    const dragImage = document.createElement('div');
    dragImage.style.cssText = `
      position: absolute;
      top: -1000px;
      left: -1000px;
      width: 280px;
      height: ${Math.max(60, template.duration)}px;
      background: linear-gradient(135deg, 
        hsl(var(--bubble-${template.color}) / 0.3) 0%, 
        hsl(var(--bubble-${template.color}) / 0.2) 50%, 
        hsl(var(--bubble-${template.color}) / 0.25) 100%);
      border: 2px dashed hsl(var(--bubble-${template.color}) / 0.6);
      border-radius: 12px;
      box-shadow: 0 0 20px hsl(var(--bubble-${template.color}) / 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 500;
      font-size: 14px;
      text-align: center;
      padding: 10px;
      z-index: 10000;
      pointer-events: none;
    `;
    
    dragImage.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div>${template.title}</div>
        <div style="font-size: 12px; opacity: 0.8; margin-top: 4px;">${template.duration} min</div>
      </div>
    `;
    
    document.body.appendChild(dragImage);
    
    // For better cross-browser compatibility, we'll use the element itself as the drag image
    // but with a fallback for browsers that don't support custom drag images properly
    try {
      e.dataTransfer.setDragImage(dragImage, dragImage.offsetWidth / 2, dragImage.offsetHeight / 2);
    } catch (error) {
      // Fallback: Some browsers (like Brave) might not support custom drag images properly
      // In this case, we'll rely on the browser's default ghost image
      console.warn('Custom drag image not supported, using browser default');
    }

    // Clean up the drag image after a short delay
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage);
      }
    }, 100);
  };

  const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    target.classList.remove('dragging-source');

    // Enhanced bounce-back animation
    target.style.transform = 'scale(1.05)';
    target.style.opacity = '1';
    target.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

    setTimeout(() => {
      target.style.transform = 'scale(1.02)';
    }, 100);

    setTimeout(() => {
      target.style.transform = '';
      target.style.opacity = '';
      target.style.transition = '';
    }, 400);
  };

  const handleOpenCreateTemplateModal = () => {
    if (templateLimitReached) {
      setIsProModalOpen(true);
      return;
    }
    setEditingTemplate(undefined);
    setIsTemplateModalOpen(true);
  }

  const handleOpenEditModal = (template: BubbleTemplate) => {
    setEditingTemplate(template);
    setIsTemplateModalOpen(true);
  }

  const handleCloseTemplateModal = () => {
    setIsTemplateModalOpen(false);
    setEditingTemplate(undefined);
  }

  const handleOpenCreateBubbleModal = () => {
    setIsBubbleCreateModalOpen(true);
    if(isMobile) onClose();
  }

  return (
    <>
    <aside
      id="sidebar"
      className={cn(
        "p-4 border-r bg-gradient-to-br from-primary/10 via-background to-accent/10 shrink-0 flex flex-col space-y-4 transition-transform duration-300 ease-in-out z-50",
        isMobile ? "absolute top-0 left-0 h-full bg-background" : "relative",
        isOpen ? "translate-x-0" : "-translate-x-full",
        !isMobile && "translate-x-0" // Always show on desktop
      )}
      style={{ width: `${SIDEBAR_WIDTH}px` }}
    >
      <DailySidebarTip />

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Button className='flex-grow' onClick={handleOpenCreateBubbleModal}>
          <CalendarPlus className="mr-2 h-5 w-5" />
          Add Bubble
        </Button>
        <Button id="missed-tasks-button" variant="outline" size="icon" onClick={() => setIsMissedTasksDrawerOpen(true)}>
            <History className="h-5 w-5" />
            <span className="sr-only">Show missed tasks</span>
        </Button>
      </div>

      <div className="flex items-center justify-between" id="templates-header">
        <h2 className="text-xl font-semibold text-center">Templates</h2>
        <TooltipProvider>
            <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                    <div className={cn(templateLimitReached && 'cursor-not-allowed')}>
                        <Button variant="ghost" size="icon" onClick={handleOpenCreateTemplateModal} disabled={templateLimitReached}>
                            <Plus className="h-5 w-5" />
                            <span className="sr-only">Create New Template</span>
                        </Button>
                    </div>
                </TooltipTrigger>
                {templateLimitReached && (
                    <TooltipContent side="bottom">
                        <p>Upgrade to Pro for unlimited templates.</p>
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
      </div>

      <div id="templates-list" className={cn("space-y-3 overflow-y-auto flex-1 no-scrollbar px-1")}>
        {allTemplates.map((template, index) => {
          const Icon = categoryIcons[template.category];
          const isUserCreated = !template.isDefault || templates.some(t => t.id === template.id && !t.isDefault);

          return (
            <div
              key={template.id}
              id={index === 0 ? 'first-template-item' : undefined}
              draggable
              onDragStart={(e) => handleDragStart(e, template)}
              onDragEnd={(e) => handleDragEnd(e)}
              className="p-3 rounded-lg shadow-sm cursor-grab active:cursor-grabbing flex items-center gap-3 transition-all duration-300 hover:shadow-lg hover:scale-105 hover:-translate-y-1 relative group touch-friendly drag-handle mobile-spacing template-item"
              style={{ backgroundColor: `hsl(var(--bubble-${template.color}))` }}
            >
              <Icon className="h-5 w-5 shrink-0 text-slate-700 dark:text-white" />
              <div className='flex-1'>
                <p className="font-medium text-sm text-slate-800 dark:text-white">{template.title}</p>
                <p className="text-xs text-slate-700 dark:text-white/80">{template.duration} min</p>
              </div>
              <div className={cn("absolute top-1 right-1 transition-opacity flex gap-1", isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-7 w-7", isMobile && "mobile-friendly-tap h-9 w-9")}
                    onClick={() => handleOpenEditModal(template)}
                  >
                    <Pencil className="h-4 w-4 text-slate-700 dark:text-white/80" />
                </Button>
                {!template.isDefault && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-7 w-7", isMobile && "mobile-friendly-tap h-9 w-9")}
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
            </div>
          );
        })}
      </div>


    </aside>
    {isMobile && isOpen && (
      <div 
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />
    )}
    <TemplateModal 
      isOpen={isTemplateModalOpen} 
      onClose={handleCloseTemplateModal}
      template={editingTemplate}
    />
    <MissedTasksDrawer
      isOpen={isMissedTasksDrawerOpen}
      onClose={() => setIsMissedTasksDrawerOpen(false)}
    />
    <ProModal isOpen={isProModalOpen} onClose={() => setIsProModalOpen(false)} />
    </>
  );
}