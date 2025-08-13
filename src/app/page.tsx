
'use client';

import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { Timeline } from "@/components/timeline";
import { TimeBubblesProvider } from "@/context/time-bubbles-context";
import { useEffect, useRef } from "react";
import { useTimeBubbles } from "@/context/time-bubbles-context";
import { HOUR_HEIGHT } from "@/lib/constants";
import { LoadingSpinner } from "@/components/loading-spinner";
import { isToday } from "date-fns";
import { ActionPromptModal } from "@/components/action-prompt-modal";
import { BubbleCreateModal } from "@/components/bubble-create-modal";
import { cn } from "@/lib/utils";

function AppContent() {
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

  // Find the first actionable block to show in the modal
  const blockToShow = actionableBlock ?? timeBlocks.find(b => b.actionable);

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

  if (!isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoadingSpinner className="h-40 w-40 text-primary" />
      </div>
    );
  }

  const handleClosePrompt = () => {
    if (blockToShow) {
      // Mark it as not actionable anymore so it doesn't pop up again
      updateBlock(blockToShow.id, { actionable: false });
    }
    setActionableBlock(null);
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-body overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <main ref={mainRef} className={cn("flex-1 overflow-y-auto bg-gradient-to-b from-primary/5 via-background to-accent/5 no-scrollbar")}>
          <Timeline scrollContainerRef={mainRef} />
        </main>
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
    </div>
  );
}


export default function Home() {
  return (
    <TimeBubblesProvider>
      <AppContent />
    </TimeBubblesProvider>
  );
}
