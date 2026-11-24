
'use client';

import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { Timeline } from "@/components/timeline";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useTimeBubbles } from "@/context/time-bubbles-context";
import { HOUR_HEIGHT, MAX_ZOOM, MIN_ZOOM } from "@/lib/constants";
import { LoadingSpinner } from "@/components/loading-spinner";
import { isToday } from "date-fns";
import { ActionPromptModal } from "@/components/action-prompt-modal";
import { BubbleCreateModal } from "@/components/bubble-create-modal";
import { BubbleEditModal } from "@/components/bubble-edit-modal";
import { cn } from "@/lib/utils";
import { FloatingToolbar } from "@/components/floating-toolbar";
import { LoginModal } from "@/components/login-modal";
import { useAuth } from "@/context/auth-context";
import { InteractiveTutorial } from "@/components/interactive-tutorial";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNotifications } from "@/hooks/use-notifications";
import { AIOptimizerDrawer } from "@/components/ai-optimizer-drawer";
import { WeeklyAnalysis } from "@/components/weekly-analysis";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";


const TUTORIAL_STORAGE_KEY = 'timebubble_tutorial_completed_interactive_v2';


export default function AppPage() {
  const mainRef = useRef<HTMLElement>(null);
  const { 
    isLoaded, 
    zoomLevel, 
    setZoomLevel,
    currentDate, 
    dailyTips,
    actionableBlock, 
    setActionableBlock, 
    isBubbleCreateModalOpen,
    setIsBubbleCreateModalOpen,
    newBubbleStartTime
  } = useTimeBubbles();
  
  const { user } = useAuth();
  useNotifications(); // Initialize notification system
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const [isWeeklyAnalysisOpen, setIsWeeklyAnalysisOpen] = useState(false);
  const [isTipDismissed, setIsTipDismissed] = useState(false);
  const activeTouchPointsRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchStartRef = useRef<{ distance: number; zoom: number; centerY: number; scrollTop: number } | null>(null);
  const lastTipDateRef = useRef(currentDate.getTime());

  useEffect(() => {
    // This logic might be redundant if AuthGuard is used, but can be a fallback.
    setIsLoginModalOpen(!user);
  }, [user]);

  // Use the actionableBlock from context as the source of truth for the modal
  const blockToShow = actionableBlock;

  useEffect(() => {
    if (mainRef.current && isLoaded) {
      if (isToday(currentDate)) {
        const pixelsPerMinute = (HOUR_HEIGHT * zoomLevel) / 60;
        const now = new Date();
        const minutes = now.getHours() * 60 + now.getMinutes();
        const scrollToPosition = minutes * pixelsPerMinute - mainRef.current.clientHeight / 2;
        mainRef.current.scrollTo({
          top: scrollToPosition,
          behavior: 'smooth',
        });
      } else {
        // Scroll to the top for other days
        mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [isLoaded, currentDate]);

  useEffect(() => {
    setIsTipDismissed(false);
  }, [dailyTips]);

  useEffect(() => {
    if (lastTipDateRef.current !== currentDate.getTime()) {
      lastTipDateRef.current = currentDate.getTime();
      setIsTipDismissed(true);
    }
  }, [currentDate]);

  const handleTimelinePointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (!isMobile || e.pointerType !== 'touch' || (e.target as HTMLElement).closest('[data-bubble-id]')) return;

    const touchPoints = activeTouchPointsRef.current;
    touchPoints.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touchPoints.size !== 2 || !mainRef.current) return;

    const [first, second] = Array.from(touchPoints.values());
    pinchStartRef.current = {
      distance: Math.max(1, Math.hypot(first.x - second.x, first.y - second.y)),
      zoom: zoomLevel,
      centerY: (first.y + second.y) / 2,
      scrollTop: mainRef.current.scrollTop,
    };
    for (const pointerId of touchPoints.keys()) {
      try {
        e.currentTarget.setPointerCapture(pointerId);
      } catch {
        // A pointer may already have been canceled by the browser.
      }
    }
    e.preventDefault();
  };

  const handleTimelinePointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const touchPoints = activeTouchPointsRef.current;
    if (!touchPoints.has(e.pointerId)) return;
    touchPoints.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const pinchStart = pinchStartRef.current;
    if (touchPoints.size !== 2 || !pinchStart || !mainRef.current) return;

    const [first, second] = Array.from(touchPoints.values());
    const distance = Math.hypot(first.x - second.x, first.y - second.y);
    const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, pinchStart.zoom * distance / pinchStart.distance));
    const scrollContainer = mainRef.current;
    const localCenterY = pinchStart.centerY - scrollContainer.getBoundingClientRect().top;
    setZoomLevel(nextZoom);
    scrollContainer.scrollTop = (pinchStart.scrollTop + localCenterY) * nextZoom / pinchStart.zoom - localCenterY;
    e.preventDefault();
  };

  const handleTimelinePointerEnd = (e: ReactPointerEvent<HTMLElement>) => {
    const touchPoints = activeTouchPointsRef.current;
    touchPoints.delete(e.pointerId);
    if (touchPoints.size < 2) pinchStartRef.current = null;
  };

  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoadingSpinner className="h-40 w-40 text-primary" />
      </div>
    );
  }

  const handleClosePrompt = () => {
    if (blockToShow) {
      // The modal's internal actions will handle the block state.
      // We just need to clear the actionableBlock from the context to dismiss the modal.
      setActionableBlock(null);
    }
  }

  const handleFinishTutorial = () => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    setShowTutorial(false);
     if (isMobile) {
      setIsSidebarOpen(false);
    }
  }

  return (
    <div className="flex flex-col h-dvh bg-background text-foreground font-body overflow-hidden">
    <Header
        onOpenWeeklyAnalysis={() => setIsWeeklyAnalysisOpen(true)}
      onOpenTutorial={() => setShowTutorial(true)}
      />
      {isMobile && !isTipDismissed && dailyTips?.tips?.[0]?.suggestion && (
        <div className="flex shrink-0 items-center gap-2 border-b border-border/40 bg-primary/10 px-3 py-2">
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <button
            type="button"
            className="min-w-0 flex-1 truncate text-left text-xs font-medium text-foreground"
            onClick={() => window.dispatchEvent(new CustomEvent('openAIOptimizer'))}
          >
            AI Tip: {dailyTips.tips[0].suggestion}
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0"
            aria-label="Dismiss AI tip"
            onClick={() => setIsTipDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden relative">
      <div className="hidden md:block">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      </div>
        <main 
          ref={mainRef} 
          id="timeline-main"
        className={cn("flex-1 overflow-y-auto no-scrollbar pb-24 transition-all duration-300 md:pb-0")}
          style={{ touchAction: 'pan-y' }}
          onPointerDown={handleTimelinePointerDown}
          onPointerMove={handleTimelinePointerMove}
          onPointerUp={handleTimelinePointerEnd}
          onPointerCancel={handleTimelinePointerEnd}
        >
          <Timeline scrollContainerRef={mainRef} />
        </main>
        <FloatingToolbar scrollContainerRef={mainRef} />
      </div>
      <ActionPromptModal
        isOpen={!!blockToShow}
        onClose={handleClosePrompt}
        block={blockToShow}
      />
      <BubbleCreateModal
        isOpen={isBubbleCreateModalOpen}
        onClose={() => setIsBubbleCreateModalOpen(false)}
        startTime={newBubbleStartTime}
      />
      <BubbleEditModal />
      {/* Fallback login modal, though AuthGuard should prevent this view */}
      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
      {showTutorial && <InteractiveTutorial onFinish={handleFinishTutorial} />}
      <WeeklyAnalysis
        isOpen={isWeeklyAnalysisOpen}
        onClose={() => setIsWeeklyAnalysisOpen(false)}
      />
      <AIOptimizerDrawer />
    </div>
  );
}
