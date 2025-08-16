
'use client';

import { TimeBubbleLogo } from "@/components/timebubble-logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { ArrowRight, BarChart, BrainCircuit, GanttChartSquare, Sparkles, Wand2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { LoginModal } from "@/components/login-modal";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/loading-spinner";

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) {
  return (
    <div className="p-6 rounded-lg bg-primary/5 border border-primary/10 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-2 rounded-full bg-primary/10">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-xl font-semibold">{title}</h3>
      </div>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    // If not loading and user is logged in, redirect to the app
    if (!loading && user) {
      router.push('/app');
    }
  }, [user, loading, router]);

  // While loading auth state, or if user is found and we are about to redirect, show a spinner.
  if (loading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoadingSpinner className="h-40 w-40 text-primary" />
      </div>
    );
  }


  return (
    <>
      <div className="flex flex-col min-h-screen bg-background text-foreground font-body antialiased">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
          <div className="container mx-auto flex items-center justify-between p-4">
            <TimeBubbleLogo className="h-6 w-auto" />
            <div className="flex items-center gap-4">
              <Button onClick={() => setIsLoginModalOpen(true)}>Sign In</Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          {/* Hero Section */}
          <section className="py-20 md:py-32 text-center bg-gradient-to-b from-background via-background to-primary/5">
            <div className="container mx-auto px-4">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent bg-[size:200%_auto] animate-gradient-move">
                Transform Your Day into Floating Moments of Intention
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                TimeBubble is a visual time management tool that helps you see your day, plan with clarity, and achieve focus like never before. Stop managing lists and start shaping your time.
              </p>
              <Button size="lg" onClick={() => setIsLoginModalOpen(true)}>
                Get Started for Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </section>

          {/* App Preview Image */}
          <section className="container mx-auto px-4 -mt-16">
             <div className="relative mx-auto border-slate-800 dark:border-slate-800 bg-slate-800 border-[8px] rounded-t-xl w-full h-[auto] max-w-4xl shadow-2xl">
                <div className="rounded-xl overflow-hidden bg-white">
                  <Image src="https://placehold.co/1200x750.png" data-ai-hint="app screenshot" alt="TimeBubble App Preview" width={1200} height={750} className="w-full h-auto" />
                </div>
            </div>
          </section>
          

          {/* Features Section */}
          <section id="features" className="py-20 md:py-28 bg-primary/5">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold">A Better Way to See Your Time</h2>
                <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
                  TimeBubble's unique features are designed to give you clarity and control.
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <FeatureCard 
                  icon={GanttChartSquare}
                  title="Visual Timeline"
                  description="Drag and drop 'bubbles' of time to craft your perfect day. See your schedule unfold visually and find the open spaces."
                />
                <FeatureCard 
                  icon={Sparkles}
                  title="AI-Powered Insights"
                  description="At the end of the day, get personalized insights on your productivity, mood, and focus to plan smarter tomorrow."
                />
                <FeatureCard 
                  icon={Wand2}
                  title="Smart Templates"
                  description="Create reusable templates for your common tasks and routines. Drag, drop, and you're ready to go in seconds."
                />
                 <FeatureCard 
                  icon={BrainCircuit}
                  title="Proactive AI Tips"
                  description="Get gentle, real-time nudges and suggestions throughout your day to help you stay on track and maintain well-being."
                />
                 <FeatureCard 
                  icon={BarChart}
                  title="Reflect and Improve"
                  description="Log your mood and productivity for each bubble. Our AI helps you connect the dots between how you work and how you feel."
                />
                 <FeatureCard 
                  icon={ArrowRight}
                  title="Seamless Flow"
                  description="An intuitive interface that just works. Undo/redo, zoom, and responsive design make managing your time a delight."
                />
              </div>
            </div>
          </section>

          {/* Call to Action Section */}
          <section className="py-20 md:py-28">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-4xl font-bold">Ready to Reshape Your Time?</h2>
              <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto mb-8">
                Start organizing your life with intention. It's free to get started.
              </p>
              <Button size="lg" onClick={() => setIsLoginModalOpen(true)}>
                Start Floating Bubbles Now
              </Button>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t">
          <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <TimeBubbleLogo className="h-5 w-auto" />
            </div>
            <p className="text-sm text-muted-foreground mt-4 md:mt-0">
              © {new Date().getFullYear()} TimeBubble. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
}
