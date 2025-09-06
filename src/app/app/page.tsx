
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
import { EnhancedProWelcomeModal } from "@/components/enhanced-pro-welcome-modal";
import { ApiKeyModal } from "@/components/api-key-modal";
import { AIOptimizerDrawer } from "@/components/ai-optimizer-drawer";
import { WeeklyAnalysis } from "@/components/weekly-analysis";


const TUTORIAL_STORAGE_KEY = 'timebubble_tutorial_completed_interactive_v2';
const PRO_WELCOME_KEY = 'timebubble_pro_welcome_seen';


export default function AppPage() {
  const mainRef = useRef<HTMLElement>(null);
  const { 
    isLoaded, 
    zoomLevel, 
    currentDate, 
    actionableBlock, 
    setActionableBlock, 
    timeBlocks, 
    updateBlock,
    isBubbleCreateModalOpen,
    setIsBubbleCreateModalOpen,
    newBubbleStartTime
  } = useTimeBubbles();
  
  const { user, isPro } = useAuth();
  useNotifications(); // Initialize notification system
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const [isProWelcomeModalOpen, setIsProWelcomeModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isWeeklyAnalysisOpen, setIsWeeklyAnalysisOpen] = useState(false);

  useEffect(() => {
    // This logic might be redundant if AuthGuard is used, but can be a fallback.
    setIsLoginModalOpen(!user);
  }, [user]);

  useEffect(() => {
    if (isLoaded) {
      const tutorialCompleted = localStorage.getItem(TUTORIAL_STORAGE_KEY);
      if (!tutorialCompleted) {
        setShowTutorial(true);
      }
      
      // Check if user is Pro and hasn't seen the welcome modal yet
      const proWelcomeSeen = localStorage.getItem(PRO_WELCOME_KEY);
      if (isPro && !proWelcomeSeen) {
        setIsProWelcomeModalOpen(true);
      }
    }
  }, [isLoaded, isPro]);

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
    if (!isMobile) {
      setIsSidebarOpen(true);
    } else {
      // For tutorial purposes on mobile, we might want it open initially
      if (!showTutorial) {
        setIsSidebarOpen(false);
      }
    }
  }, [isMobile, showTutorial]);
  
  useEffect(() => {
    if (showTutorial && isMobile) {
      setIsSidebarOpen(true);
    }
  }, [showTutorial, isMobile]);

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

  const handleCloseProWelcome = () => {
    setIsProWelcomeModalOpen(false);
    localStorage.setItem(PRO_WELCOME_KEY, 'true');
    // After closing the welcome modal, open the API key modal
    setIsApiKeyModalOpen(true);
  };


  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-body overflow-hidden">
      <Header 
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenWeeklyAnalysis={() => setIsWeeklyAnalysisOpen(true)}
      />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main 
          ref={mainRef} 
          id="timeline-main"
          className={cn(
            "flex-1 overflow-y-auto no-scrollbar transition-all duration-300",
            isSidebarOpen && isMobile && "opacity-50 pointer-events-none"
          )}
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
              <EnhancedProWelcomeModal
          isOpen={isProWelcomeModalOpen}
          onClose={handleCloseProWelcome}
        />
       <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />
      {isPro && (
        <WeeklyAnalysis
          isOpen={isWeeklyAnalysisOpen}
          onClose={() => setIsWeeklyAnalysisOpen(false)}
        />
      )}
      <AIOptimizerDrawer />
    </div>
  );
}
