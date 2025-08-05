
'use client';

import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { Timeline } from "@/components/timeline";
import { TimeBubblesProvider } from "@/context/time-bubbles-context";
import { useEffect, useRef } from "react";
import { useTimeBubbles } from "@/context/time-bubbles-context";
import { PIXELS_PER_MINUTE } from "@/lib/constants";

function AppContent() {
  const mainRef = useRef<HTMLElement>(null);
  const { isLoaded } = useTimeBubbles();

  useEffect(() => {
    if (mainRef.current && isLoaded) {
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes();
      const scrollToPosition = minutes * PIXELS_PER_MINUTE - mainRef.current.clientHeight / 2;
      mainRef.current.scrollTo({
        top: scrollToPosition,
        behavior: 'smooth',
      });
    }
  }, [isLoaded]);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-body overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main ref={mainRef} className="flex-1 overflow-y-auto">
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
