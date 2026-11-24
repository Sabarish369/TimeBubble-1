
'use client';

import { TimeBubbleLogo } from "@/components/timebubble-logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { ArrowRight, BarChart, BrainCircuit, GanttChartSquare, Sparkles, Wand2, Clock, Zap, Target, Star, CheckCircle, Users } from "lucide-react";
import Link from "next/link";
import { LoginModal } from "@/components/login-modal";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/loading-spinner";
import TextPressure from "@/components/text-pressure";
import ClickSpark from "@/components/click-spark";
import FloatingBubbles from "@/components/floating-bubbles";
import { useIsMobile } from "@/hooks/use-mobile";

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) {
  return (
    <div className="group relative">
      <div className="card-modern p-8 h-full hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-border/50 hover:border-primary/30 bg-gradient-to-br from-background via-background to-muted/20">
        <div className="flex flex-col space-y-6">
          <div className="flex items-center space-x-4">
            <div className="relative p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20 transition-all duration-500 overflow-hidden">
              <Icon className="w-8 h-8 text-primary group-hover:scale-125 group-hover:rotate-6 transition-all duration-500 relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
              {title}
            </h3>
          </div>
          <p className="text-muted-foreground leading-relaxed font-medium group-hover:text-foreground/80 transition-colors duration-300">
            {description}
          </p>
        </div>
        
        {/* Enhanced hover effect overlay */}
        <div className="absolute inset-0 rounded-[calc(var(--radius)+2px)] bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 rounded-[calc(var(--radius)+2px)] opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();
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
        <header className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-4xl px-4">
          <div className="bg-background/20 backdrop-blur-2xl border border-white/20 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 supports-[backdrop-filter]:bg-background/10">
            <div className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center space-x-3">
                <TimeBubbleLogo className="h-6 w-auto" />
              </div>
              <div className="flex items-center gap-6">
                <nav className="hidden md:flex items-center space-x-6">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                  >
                    Home
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                  >
                    Features
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                  >
                    Docs
                  </Button>
                </nav>
                <Button 
                  onClick={() => setIsLoginModalOpen(true)}
                  className="button-primary shadow-md hover:shadow-lg px-6"
                  size="sm"
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 text-center overflow-hidden">
            {/* Floating Bubbles Background */}
            <FloatingBubbles count={isMobile ? 6 : 20} />
            
            {/* Enhanced animated background with gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-accent/8">
              {/* Background Elements */}
              <div className="absolute inset-0">
                {/* Gradient Orbs */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse hidden md:block" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse hidden md:block" style={{ animationDelay: '2s' }} />
              </div>
            </div>  
            <div className="container mx-auto px-4 relative z-10 max-w-6xl">
              <div className="space-y-8">
                <div className="relative text-center">
                  {/* Main TimeBubble Interactive Text with Click Sparks */}
                  <div style={{ height: '140px', width: '100%', position: 'relative', marginBottom: '6rem', overflow: 'visible' }}>
                    {isMobile ? (
                      <TextPressure
                        text="TimeBubble"
                        flex={false}
                        alpha={false}
                        stroke={false}
                        width={true}
                        weight={true}
                        italic={false}
                        textColor="currentColor"
                        strokeColor="hsl(var(--accent))"
                        minFontSize={24}
                        fontFamily="system-ui, -apple-system, sans-serif"
                        fontUrl=""
                        className=""
                      />
                    ) : <ClickSpark
                      sparkColor="#3b82f6"
                      sparkSize={15}
                      sparkRadius={30}
                      sparkCount={12}
                      duration={800}
                      easing="ease-out"
                      extraScale={1.5}
                    >
                      <TextPressure
                        text="TimeBubble"
                        flex={false}
                        alpha={false}
                        stroke={false}
                        width={true}
                        weight={true}
                        italic={false}
                        textColor="currentColor"
                        strokeColor="hsl(var(--accent))"
                        minFontSize={24}
                        fontFamily="system-ui, -apple-system, sans-serif"
                        fontUrl=""
                        className=""
                      />
                    </ClickSpark>}
                  </div>
                  
                  {/* TimeBubble Screenshot */}
                  <div className="flex justify-center mb-8 mt-8">
                    <div className="relative max-w-4xl w-full">
                      <img 
                        src="/timebubbleshot.png" 
                        alt="TimeBubble App Screenshot" 
                        className="w-full h-auto rounded-2xl shadow-2xl border border-border/20 hover:shadow-3xl transition-all duration-500 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/10 to-transparent rounded-2xl pointer-events-none" />
                    </div>
                  </div>
                  
                  {/* Transform Your Day - Complete Text - Way Down */}
                  <div className="space-y-4 mb-12 mt-16">
                    <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gradient leading-tight">
                      Transform Your Day
                    </h2>
                    <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-muted-foreground leading-relaxed">
                      into Floating Moments of Intention
                    </h3>
                  </div>
                  
                  {/* Decorative elements */}
                  <div className="absolute -top-12 -right-12 w-20 h-20 bg-gradient-to-br from-primary/15 to-accent/15 rounded-full blur-3xl animate-pulse hidden md:block" />
                  <div className="absolute -bottom-8 -left-8 w-16 h-16 bg-gradient-to-br from-accent/15 to-primary/15 rounded-full blur-2xl animate-pulse hidden md:block" style={{ animationDelay: '1.5s' }} />
                  <div className="absolute top-1/2 -right-6 w-12 h-12 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-xl animate-pulse hidden md:block" style={{ animationDelay: '3s' }} />
                </div>
                
                <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                  TimeBubble is a <span className="text-foreground font-semibold">visual time management tool</span> that helps you see your day, 
                  plan with clarity, and achieve focus like never before.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                  <Button 
                    size="lg" 
                    onClick={() => setIsLoginModalOpen(true)} 
                    className="button-primary px-8 py-4 text-lg font-medium shadow-xl hover:shadow-2xl group relative overflow-hidden"
                  >
                    <span className="relative z-10">Get Started for Free</span>
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="px-8 py-4 text-lg font-medium border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all group relative overflow-hidden"
                  >
                    <span className="relative z-10">Watch Demo</span>
                    <Sparkles className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Button>
                </div>
                
                {/* Trust indicators */}
                <div className="pt-12 space-y-4">
                  <p className="text-sm text-muted-foreground/70 uppercase tracking-wider font-medium">
                    Start your productivity journey
                  </p>
                  <div className="flex justify-center items-center space-x-8 opacity-60">
                    <div className="text-sm font-medium">Free to Start</div>
                    <div className="w-px h-6 bg-border" />
                    <div className="text-sm font-medium">No Credit Card</div>
                    <div className="w-px h-6 bg-border" />
                    <div className="text-sm font-medium">2 Min Setup</div>
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
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 mb-6">
                  <Sparkles className="w-4 h-4 text-primary mr-2" />
                  <span className="text-sm font-medium text-primary">Powerful Features</span>
                </div>
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
            {/* Enhanced background effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-accent/8" />
            <div className="absolute inset-0">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-primary/15 to-primary/5 rounded-full blur-3xl opacity-60 animate-pulse" />
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-accent/15 to-accent/5 rounded-full blur-3xl opacity-60 animate-pulse" style={{ animationDelay: '1s' }} />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-2xl opacity-40 animate-pulse" style={{ animationDelay: '2s' }} />
            </div>
            
            <div className="container mx-auto px-4 text-center relative z-10">
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 mb-6">
                  <CheckCircle className="w-4 h-4 text-primary mr-2" />
                  <span className="text-sm font-medium text-primary">Start Your Journey Today</span>
                </div>
                
                <h2 className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
                  Ready to 
                  <span className="text-gradient bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]"> Reshape Your Time?</span>
                </h2>
                
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
                  Start organizing your life with intention. Experience the power of 
                  <span className="text-foreground font-semibold">visual time management</span>.
                </p>
                
                <div className="pt-6 space-y-4">
                  <Button 
                    size="lg" 
                    onClick={() => setIsLoginModalOpen(true)}
                    className="button-primary px-10 py-4 text-lg font-medium shadow-xl hover:shadow-2xl group relative overflow-hidden"
                  >
                    <span className="relative z-10">Start Floating Bubbles Now</span>
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Button>
                  
                  <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground/80">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span>No credit card required</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span>Free to start</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span>Upgrade anytime</span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-8 flex items-center justify-center space-x-8 opacity-70">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-muted-foreground">Free forever</span>
                  </div>
                  <div className="w-px h-6 bg-border" />
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">2 min setup</span>
                  </div>
                  <div className="w-px h-6 bg-border" />
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">No credit card</span>
                  </div>
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
