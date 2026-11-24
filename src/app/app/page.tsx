
'use client';

import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { Timeline } from "@/components/timeline";
import { useEffect, useRef, useState } from "react";
import { useTimeBubbles } from "@/context/time-bubbles-context";
import { HOUR_HEIGHT } from "@/lib/constants";
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


const TUTORIAL_STORAGE_KEY = 'timebubble_tutorial_completed_interactive_v2';


export default function AppPage() {
  const mainRef = useRef<HTMLElement>(null);
  const { 
    isLoaded, 
    zoomLevel, 
    currentDate, 
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
  }, [isLoaded, zoomLevel, currentDate]);

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
      <div className="flex flex-1 overflow-hidden relative">
      <div className="hidden md:block">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      </div>
        <main 
          ref={mainRef} 
          id="timeline-main"
        className={cn("flex-1 overflow-y-auto no-scrollbar pb-24 transition-all duration-300 md:pb-0")}
        >
          <Timeline scrollContainerRef={mainRef} />
        </main>
        <FloatingToolbar />
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
