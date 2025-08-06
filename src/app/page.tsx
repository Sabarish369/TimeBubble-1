
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

function AppContent() {
  const mainRef = useRef<HTMLElement>(null);
  const { isLoaded, zoomLevel, currentDate } = useTimeBubbles();

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

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-body overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main ref={mainRef} className="flex-1 overflow-y-auto bg-gradient-to-b from-primary/5 via-background to-accent/5">
          <Timeline />
        </main>
      </div>
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
