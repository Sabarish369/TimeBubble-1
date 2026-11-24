'use client';

import type { DragEvent } from 'react';
import { Briefcase, BookOpen, Coffee, User, Heart, Plus, Trash2, Pencil, MessageSquare, type LucideIcon, CalendarPlus, History } from 'lucide-react';
import { BUBBLE_COLORS, SIDEBAR_WIDTH } from '@/lib/constants';
import type { BubbleCategory, BubbleTemplate } from '@/types';
import { useTimeBubbles } from '@/context/time-bubbles-context';
import { Button } from './ui/button';
import { TemplateModal } from './template-modal';
import { useState, useEffect, useRef } from 'react';
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
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { GhostBubble } from './ghost-bubble';

const categoryIcons: Record<BubbleCategory, LucideIcon> = {
  work: Briefcase,
  study: BookOpen,
  break: Coffee,
  personal: User,
  health: Heart,
};

export const defaultTemplates: BubbleTemplate[] = [
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
  const { templates, updateTemplate, deleteTemplate, setIsBubbleCreateModalOpen, timeBlocks, addBlock, currentDate } = useTimeBubbles();
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isMissedTasksDrawerOpen, setIsMissedTasksDrawerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BubbleTemplate | undefined>(undefined);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Ghost bubble state for drag preview
  const [ghostBubble, setGhostBubble] = useState<{
    template: BubbleTemplate;
    position: { x: number; y: number };
    isVisible: boolean;
  } | null>(null);
  
  // Store current drag template and position refs for performance
  const currentDragTemplate = useRef<BubbleTemplate | null>(null);
  const ghostPosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animationFrameId = useRef<number | null>(null);

  const allTemplates = [...defaultTemplates.map(t => {
    const userOverride = templates.find(ut => ut.id === t.id);
    return userOverride ? { ...t, ...userOverride, isDefault: true } : t;
  }), ...templates.filter(t => !t.isDefault)];

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

    // Store the template for ghost bubble
    currentDragTemplate.current = template;

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

    // Hide the default drag image by creating a transparent 1x1 pixel image
    const emptyImg = new Image();
    emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    e.dataTransfer.setDragImage(emptyImg, 0, 0);

    // Initialize ghost bubble
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    const x = e.clientX + scrollX;
    const y = e.clientY + scrollY;
    
    setGhostBubble({
      template,
      position: { x, y },
      isVisible: true
    });
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

    // Clean up ghost bubble
    setGhostBubble(null);
    currentDragTemplate.current = null;
  };

  // Optimized position update function
  const updateGhostPosition = useRef((x: number, y: number) => {
    ghostPosition.current = { x, y };
    
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    
    animationFrameId.current = requestAnimationFrame(() => {
      setGhostBubble(prev => {
        if (!prev) return null;
        return { ...prev, position: ghostPosition.current };
      });
    });
  });

  // Global drag tracking for drag operations
  useEffect(() => {
    const handleGlobalDrag = (e: Event) => {
      const dragEvent = e as globalThis.DragEvent;
      if (currentDragTemplate.current && dragEvent.clientX !== 0 && dragEvent.clientY !== 0) {
        dragEvent.preventDefault();
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;
        
        const x = dragEvent.clientX + scrollX;
        const y = dragEvent.clientY + scrollY;
        
        updateGhostPosition.current(x, y);
      }
    };

    const handleGlobalDragOver = (e: Event) => {
      const dragEvent = e as globalThis.DragEvent;
      if (currentDragTemplate.current) {
        dragEvent.preventDefault();
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;
        
        const x = dragEvent.clientX + scrollX;
        const y = dragEvent.clientY + scrollY;
        
        updateGhostPosition.current(x, y);
      }
    };

    if (currentDragTemplate.current) {
      document.addEventListener('drag', handleGlobalDrag, { passive: false });
      document.addEventListener('dragover', handleGlobalDragOver, { passive: false });
    }

    return () => {
      document.removeEventListener('drag', handleGlobalDrag);
      document.removeEventListener('dragover', handleGlobalDragOver);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [ghostBubble]);

  // Track mouse movement for ghost bubble
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (ghostBubble && currentDragTemplate.current) {
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;
      
      const x = e.clientX + scrollX;
      const y = e.clientY + scrollY;
      
      setGhostBubble(prev => prev ? { ...prev, position: { x, y } } : null);
    }
  };

  // Handle mouse leave to hide ghost bubble when leaving sidebar
  const handleMouseLeave = () => {
    if (ghostBubble && currentDragTemplate.current) {
      // Don't hide immediately, let the timeline handle it
      // setGhostBubble(null);
    }
  };

  const handleOpenCreateTemplateModal = () => {
    setEditingTemplate(undefined);
    setIsTemplateModalOpen(true);
  }

  useEffect(() => {
    const handleOpenTemplateModal = () => handleOpenCreateTemplateModal();
    window.addEventListener('openTemplateModal', handleOpenTemplateModal);
    return () => window.removeEventListener('openTemplateModal', handleOpenTemplateModal);
  }, []);

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

  // Apple HIG "Never make drag-and-drop the only way": tap to quickly schedule on mobile
  const handleTemplateClick = (template: BubbleTemplate) => {
    if (!isMobile) return;
    
    const now = new Date();
    const startTime = new Date(currentDate);
    startTime.setHours(now.getHours(), Math.ceil(now.getMinutes() / 15) * 15, 0, 0);

    addBlock({
      title: template.title,
      description: template.description,
      duration: template.duration,
      category: template.category,
      color: template.color,
      startTime,
    });

    toast({
      title: `Added "${template.title}"`,
      description: `Scheduled for ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    });

    if ('vibrate' in navigator) {
      try { navigator.vibrate(10); } catch (_) {}
    }
    
    onClose();
  };

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
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
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
        <Button variant="ghost" size="icon" onClick={handleOpenCreateTemplateModal}>
          <Plus className="h-5 w-5" />
          <span className="sr-only">Create New Template</span>
        </Button>
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
              onClick={() => handleTemplateClick(template)}
              className="p-3 rounded-xl shadow-sm cursor-grab active:cursor-grabbing flex items-center gap-3 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] relative group touch-friendly drag-handle mobile-spacing template-item active:scale-95 select-none"
              style={{ backgroundColor: `hsl(var(--bubble-${template.color}))` }}
            >
              <Icon className="h-5 w-5 shrink-0 text-slate-700 dark:text-white" />
              <div className='flex-1'>
                <p className="font-semibold text-sm text-slate-800 dark:text-white">{template.title}</p>
                <p className="text-xs text-slate-700 dark:text-white/80">{template.duration} min {isMobile && "• Tap to add"}</p>
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
    {/* Ghost Bubble for drag preview */}
    {ghostBubble && (
      <GhostBubble
        template={ghostBubble.template}
        position={ghostBubble.position}
        isVisible={ghostBubble.isVisible}
      />
    )}
    </>
  );
}