
'use client';

import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Menu, Sparkles } from 'lucide-react';
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
import { useIsMobile } from '@/hooks/use-mobile';
import { AIOptimizerDrawer } from './ai-optimizer-drawer';
import { AiQuotaIndicator } from './ai-quota-indicator';
import { UpgradeBadge } from './upgrade-badge';
import { ProBadge } from './pro-badge';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const {
    currentDate,
    setCurrentDate,
    goToToday,
    goToNextDay,
    goToPreviousDay,
  } = useTimeBubbles();
  const isMobile = useIsMobile();

  return (
    <header className="flex items-center justify-between p-2 md:p-4 border-b shrink-0 bg-gradient-to-r from-primary/10 via-background to-accent/10 touch-friendly">
      <div className="flex items-center gap-2 md:gap-4">
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="mobile-friendly-tap">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        )}
        <div className="flex items-center gap-2">
          <TimeBubbleLogo className="h-6 w-auto" />
          <ProBadge />
        </div>
      </div>
      <div id="date-navigation" className="flex-1 flex justify-center items-center gap-1 md:gap-2">
        <Button variant="outline" size={isMobile ? 'sm' : 'default'} onClick={goToToday}>
          Today
        </Button>
        <div className="flex items-center gap-1 rounded-md border p-1">
          <Button variant="ghost" size="icon" className={cn("h-7 w-7", isMobile && "mobile-friendly-tap h-9 w-9")} onClick={goToPreviousDay}>
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">Previous day</span>
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'ghost'}
                className={cn(
                  'w-[150px] md:w-[200px] justify-center text-center font-semibold text-base md:text-lg px-1',
                   isMobile && 'w-auto text-sm'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                {format(currentDate, isMobile ? 'MMM d, yy' : 'MMMM do, yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(date) => date && setCurrentDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="icon" className={cn("h-7 w-7", isMobile && "mobile-friendly-tap h-9 w-9")} onClick={goToNextDay}>
            <ChevronRight className="h-5 w-5" />
            <span className="sr-only">Next day</span>
          </Button>
        </div>
      </div>
      <div id="header-actions" className="flex items-center gap-2 md:gap-4">
        <AiQuotaIndicator />
          <UpgradeBadge />
        <ThemeToggle />
        <UserProfile />
        <AIOptimizerDrawer />
      </div>
    </header>
  );
}
