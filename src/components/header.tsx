
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

import { UpgradeBadge } from './upgrade-badge';
import { ProBadge } from './pro-badge';
import { useAuth } from '@/context/auth-context';
import { AtmosphericLights } from './atmospheric-lights';
import { BarChart3 } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenWeeklyAnalysis?: () => void;
}

export function Header({ onToggleSidebar, onOpenWeeklyAnalysis }: HeaderProps) {
  const {
    currentDate,
    setCurrentDate,
    goToToday,
    goToNextDay,
    goToPreviousDay,
  } = useTimeBubbles();
  const isMobile = useIsMobile();
  const { isPro } = useAuth();

  return (
    <header className={cn(
      "relative flex items-center justify-between p-3 md:p-6 border-b border-border/40 shrink-0 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 touch-friendly overflow-hidden isolation",
      isPro && "pro-gradient-background"
    )}>
      {/* Atmospheric floating bubbles behind header content */}
      <AtmosphericLights className="z-0 absolute inset-0" count={8} speed={0.5} size={14} />
      <div className="flex items-center gap-2 md:gap-4 relative z-10">
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
      <div id="date-navigation" className="flex-1 flex justify-center items-center gap-1 md:gap-2 relative z-10">
        <Button 
          variant="outline" 
          size={isMobile ? 'sm' : 'default'} 
          onClick={goToToday}
          className="font-semibold hover:bg-primary/10 hover:border-primary/30 transition-colors shadow-sm border-border/50"
        >
          Today
        </Button>
        <div className="flex items-center gap-1 rounded-2xl border border-border/50 bg-background/80 backdrop-blur-sm p-1.5 shadow-sm hover:shadow-md transition-all">
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("h-9 w-9 rounded-xl hover:bg-primary/10 transition-colors", isMobile && "mobile-friendly-tap h-11 w-11")} 
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
                  'w-[180px] md:w-[240px] justify-center text-center font-bold text-base md:text-lg px-3 rounded-xl hover:bg-primary/5 transition-colors',
                   isMobile && 'w-auto text-sm'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                {currentDate ? format(currentDate, isMobile ? 'MMM d, yy' : 'MMMM do, yyyy') : "Loading..."}
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
            className={cn("h-9 w-9 rounded-xl hover:bg-primary/10 transition-colors", isMobile && "mobile-friendly-tap h-11 w-11")} 
            onClick={goToNextDay}
          >
            <ChevronRight className="h-5 w-5" />
            <span className="sr-only">Next day</span>
          </Button>
        </div>
      </div>
      <div id="header-actions" className="flex items-center gap-2 md:gap-4 relative z-10">
        {isPro && (
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
        )}
          <UpgradeBadge />
        <ThemeToggle />
        <UserProfile />

      </div>
    </header>
  );
}
