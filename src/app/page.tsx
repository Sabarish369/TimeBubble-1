
'use client';

import { TimeBubbleLogo } from "@/components/timebubble-logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { ArrowRight, BarChart, BrainCircuit, GanttChartSquare, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";
import { LoginModal } from "@/components/login-modal";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/loading-spinner";

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) {
  return (
    <div className="group relative">
      <div className="card-modern p-8 h-full hover:shadow-xl transition-all duration-300">
        <div className="flex flex-col space-y-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20 transition-all duration-300">
              <Icon className="w-7 h-7 text-primary group-hover:scale-110 transition-transform duration-300" />
            </div>
            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
              {title}
            </h3>
          </div>
          <p className="text-muted-foreground leading-relaxed font-medium">
            {description}
          </p>
        </div>
        
        {/* Hover effect overlay */}
        <div className="absolute inset-0 rounded-[calc(var(--radius)+2px)] bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>
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
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex items-center justify-between p-4 lg:px-8">
            <div className="flex items-center space-x-3">
              <TimeBubbleLogo className="h-7 w-auto" />
              <div className="hidden sm:flex items-center space-x-2">
                <span className="text-sm font-medium text-muted-foreground">by</span>
                <span className="text-sm font-semibold text-gradient">TimeBubble Team</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="hidden sm:inline-flex text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </Button>
              <Button 
                onClick={() => setIsLoginModalOpen(true)}
                className="button-primary shadow-lg hover:shadow-xl"
                size="sm"
              >
                Get Started
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative py-24 md:py-32 text-center overflow-hidden">
            {/* Animated background with gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5">
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background opacity-60" />
            </div>
            
            {/* Floating background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
              <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>
            
            <div className="container mx-auto px-4 relative z-10 max-w-6xl">
              <div className="space-y-8">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
                  <span className="block text-gradient mb-2">
                    Transform Your Day
                  </span>
                  <span className="block text-foreground/90">
                    into Floating Moments
                  </span>
                  <span className="block text-2xl md:text-4xl lg:text-5xl font-semibold text-muted-foreground mt-4">
                    of Intention
                  </span>
                </h1>
                
                <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                  TimeBubble is a <span className="text-foreground font-semibold">visual time management tool</span> that helps you see your day, 
                  plan with clarity, and achieve focus like never before.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
                  <Button 
                    size="lg" 
                    onClick={() => setIsLoginModalOpen(true)} 
                    className="button-primary px-8 py-4 text-lg font-medium shadow-xl hover:shadow-2xl group"
                  >
                    <span>Get Started for Free</span>
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="px-8 py-4 text-lg font-medium border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all"
                  >
                    <span>Watch Demo</span>
                    <Sparkles className="ml-2 h-5 w-5" />
                  </Button>
                </div>
                
                {/* Trust indicators */}
                <div className="pt-12 space-y-4">
                  <p className="text-sm text-muted-foreground/70 uppercase tracking-wider font-medium">
                    Trusted by productivity enthusiasts
                  </p>
                  <div className="flex justify-center items-center space-x-8 opacity-60">
                    <div className="text-2xl font-bold text-primary">4.9/5</div>
                    <div className="w-px h-6 bg-border" />
                    <div className="text-sm font-medium">1000+ Users</div>
                    <div className="w-px h-6 bg-border" />
                    <div className="text-sm font-medium">Free to Start</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="py-24 md:py-32 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
            
            <div className="container mx-auto px-4 relative z-10">
              <div className="text-center mb-20 max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground">
                  A Better Way to 
                  <span className="text-gradient"> See Your Time</span>
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed font-medium">
                  TimeBubble's unique features are designed to give you 
                  <span className="text-foreground font-semibold"> clarity and control</span> over your daily schedule.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 max-w-7xl mx-auto">
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
          <section className="py-24 md:py-32 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
            <div className="absolute inset-0">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-60" />
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl opacity-60" />
            </div>
            
            <div className="container mx-auto px-4 text-center relative z-10">
              <div className="max-w-4xl mx-auto space-y-8">
                <h2 className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
                  Ready to 
                  <span className="text-gradient"> Reshape Your Time?</span>
                </h2>
                
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
                  Start organizing your life with intention. Join thousands who've transformed their productivity.
                </p>
                
                <div className="pt-6">
                  <Button 
                    size="lg" 
                    onClick={() => setIsLoginModalOpen(true)}
                    className="button-primary px-10 py-4 text-lg font-medium shadow-xl hover:shadow-2xl group"
                  >
                    <span>Start Floating Bubbles Now</span>
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
                
                <div className="pt-8 text-sm text-muted-foreground/70">
                  <span>✨ No credit card required • Free to start • Upgrade anytime</span>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/40 bg-muted/30">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-3">
                <TimeBubbleLogo className="h-6 w-auto" />
                <div className="text-sm text-muted-foreground">
                  © {new Date().getFullYear()} TimeBubble. All rights reserved.
                </div>
              </div>
              
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                <a href="#" className="hover:text-foreground transition-colors">Terms</a>
                <a href="#" className="hover:text-foreground transition-colors">Support</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
}
