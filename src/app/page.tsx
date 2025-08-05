import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { Timeline } from "@/components/timeline";
import { TimeBubblesProvider } from "@/context/time-bubbles-context";

export default function Home() {
  return (
    <TimeBubblesProvider>
      <div className="flex flex-col h-screen bg-background text-foreground font-body overflow-hidden">
        <Header />
        <main className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex-1 overflow-y-auto">
            <Timeline />
          </div>
        </main>
      </div>
    </TimeBubblesProvider>
  );
}
