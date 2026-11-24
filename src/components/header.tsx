
'use client';

import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, MoreHorizontal, Undo2, Redo2, ZoomIn, ZoomOut, BarChart3, HelpCircle, KeyRound, MessageSquare, SunMoon, LogOut, Trash2, AlertTriangle } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { TimeBubbleLogo } from '@/components/timebubble-logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTimeBubbles } from '@/context/time-bubbles-context';
import { cn } from '@/lib/utils';
import { UserProfile } from './user-profile';

import { AtmosphericLights } from './atmospheric-lights';
import { FeedbackModal } from './feedback-modal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/auth-context';
import { MIN_ZOOM, MAX_ZOOM } from '@/lib/constants';
import { useState } from 'react';
import { DeleteAllBubblesModal } from './delete-all-bubbles-modal';
import { QuickDeleteConfirmModal } from './quick-delete-confirm-modal';

interface HeaderProps {
  onOpenWeeklyAnalysis?: () => void;
  onOpenTutorial?: () => void;
}

export function Header({ onOpenWeeklyAnalysis, onOpenTutorial }: HeaderProps) {
  const {
    currentDate,
    setCurrentDate,
    goToToday,
    goToNextDay,
    goToPreviousDay,
    undo,
    redo,
    canUndo,
    canRedo,
    zoomLevel,
    setZoomLevel,
    theme,
    setTheme,
    clearAllBlocks,
  } = useTimeBubbles();
  const { user, signOut } = useAuth();
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isQuickDeleteModalOpen, setIsQuickDeleteModalOpen] = useState(false);

  return (
    <>
    <header className={cn(
      "relative flex items-center justify-between p-2 md:p-6 border-b border-border/40 shrink-0 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 touch-friendly overflow-hidden isolation",
      "pro-header-gradient"
    )}>
      {/* Atmospheric floating bubbles behind header content */}
      <AtmosphericLights className="z-0 absolute inset-0 hidden md:block" count={8} speed={0.5} size={14} />
      <div className="hidden md:flex items-center gap-2 md:gap-4 relative z-10">
        <div className="flex items-center gap-2">
          <TimeBubbleLogo className="h-6 w-auto" />
        </div>
      </div>
      <div id="date-navigation" className="hidden md:flex flex-1 justify-center items-center gap-1 md:gap-2 relative z-10">
        <Button 
          variant="outline" 
          size="default"
          onClick={goToToday}
          className="font-semibold hover:bg-primary/10 hover:border-primary/30 transition-colors shadow-sm border-border/50"
        >
          Today
        </Button>
        <div className="flex items-center gap-1 rounded-2xl border border-border/50 bg-background/80 backdrop-blur-sm p-1.5 shadow-sm hover:shadow-md transition-all">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-xl hover:bg-primary/10 transition-colors"
            onClick={goToPreviousDay}
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">Previous day</span>
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'ghost'}
                className={cn(
                  'w-[180px] md:w-[240px] justify-center text-center font-bold text-base md:text-lg px-3 rounded-xl hover:bg-primary/5 transition-colors'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                {currentDate ? format(currentDate, 'MMMM do, yyyy') : "Loading..."}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-0 shadow-xl rounded-2xl">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(date) => date && setCurrentDate(date)}
                initialFocus
                className="rounded-2xl border-0"
              />
            </PopoverContent>
          </Popover>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-xl hover:bg-primary/10 transition-colors"
            onClick={goToNextDay}
          >
            <ChevronRight className="h-5 w-5" />
            <span className="sr-only">Next day</span>
          </Button>
        </div>
      </div>
      <div className="flex md:hidden w-full items-center gap-1 relative z-10">
        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={goToPreviousDay} aria-label="Previous day">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="h-10 min-w-0 flex-1 justify-center px-1 text-sm font-bold"
              aria-label="Choose date"
            >
              <CalendarIcon className="mr-1 h-4 w-4 shrink-0" />
              <span className="truncate">{currentDate ? format(currentDate, 'EEE, MMM d') : 'Loading...'}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-0 shadow-xl rounded-2xl">
            <Calendar mode="single" selected={currentDate} onSelect={date => date && setCurrentDate(date)} initialFocus className="rounded-2xl border-0" />
          </PopoverContent>
        </Popover>
        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={goToNextDay} aria-label="Next day">
          <ChevronRight className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={undo} disabled={!canUndo} aria-label="Undo">
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={redo} disabled={!canRedo} aria-label="Redo">
          <Redo2 className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" aria-label="More app actions">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-[80dvh] w-64 overflow-y-auto">
            <DropdownMenuLabel>{user?.displayName || user?.email || 'TimeBubble'}</DropdownMenuLabel>
            <DropdownMenuItem className="min-h-11" onSelect={goToToday}>
              <CalendarIcon /> Today
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-11" disabled={!canUndo} onSelect={undo}>
              <Undo2 /> Undo
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-11" disabled={!canRedo} onSelect={redo}>
              <Redo2 /> Redo
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="min-h-11" onSelect={() => setZoomLevel(Math.max(MIN_ZOOM, zoomLevel - 0.2))}>
              <ZoomOut /> Zoom out <span className="ml-auto text-xs text-muted-foreground">{Math.round(zoomLevel * 100)}%</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-11" onSelect={() => setZoomLevel(Math.min(MAX_ZOOM, zoomLevel + 0.2))}>
              <ZoomIn /> Zoom in
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="min-h-11" onSelect={onOpenWeeklyAnalysis}>
              <BarChart3 /> Weekly analysis
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-11" onSelect={onOpenTutorial}>
              <HelpCircle /> Interactive tour
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-11" onSelect={() => window.dispatchEvent(new CustomEvent('openApiKeyModal'))}>
              <KeyRound /> Manage API key
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-11" onSelect={() => window.dispatchEvent(new CustomEvent('openFeedbackModal'))}>
              <MessageSquare /> Feedback
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-11" onSelect={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              <SunMoon /> Switch to {theme === 'dark' ? 'light' : 'dark'} theme
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-11 text-destructive focus:text-destructive" onSelect={() => setIsQuickDeleteModalOpen(true)}>
              <Trash2 /> Delete current day
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-11 text-destructive focus:text-destructive" onSelect={() => setIsDeleteAllModalOpen(true)}>
              <AlertTriangle /> Delete all time
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="min-h-11" onSelect={() => signOut()}>
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div id="header-actions" className="hidden md:flex items-center gap-2 md:gap-4 relative z-10">
        {/* Weekly Analysis button - available for everyone */}
        <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary/40"
              onClick={onOpenWeeklyAnalysis}
            >
              <BarChart3 className="h-5 w-5 text-primary" />
              <span className="sr-only">Open Weekly Analysis</span>
            </Button>
            <span className="absolute -top-0.5 -right-0.5 text-[8px] px-1 py-0.5 rounded-full bg-primary/20 text-primary font-medium border border-primary/30 shadow-sm">Beta</span>
          </div>
        <FeedbackModal />
        <ThemeToggle />
        <UserProfile />

      </div>
    </header>
    <DeleteAllBubblesModal isOpen={isDeleteAllModalOpen} onClose={() => setIsDeleteAllModalOpen(false)} />
    <QuickDeleteConfirmModal isOpen={isQuickDeleteModalOpen} onClose={() => setIsQuickDeleteModalOpen(false)} onConfirm={clearAllBlocks} />
    </>
  );
}
