
'use client';

import { Button } from "@/components/ui/button";
import { Check, X, Star, Loader2, BrainCircuit, Target, BatteryCharging, Sparkles, ShieldCheck, Quote } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TimeBubbleLogo } from "@/components/timebubble-logo";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/context/auth-context";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PremiumBubbleIntro } from "@/components/premium-bubble-intro";
import { auth } from "@/lib/firebase";

const freeFeatures = [
    { text: 'Visual Time-Blocking Timeline', included: true },
    { text: 'Unlimited Time Bubbles', included: true },
    { text: '3 Custom Bubble Templates', included: true },
    { text: 'Basic Daily Summary', included: false },
    { text: 'Advanced AI-Powered Insights', included: false },
    { text: 'Proactive AI Tips & Nudges', included: false },
    { text: 'Habit Stacking Suggestions', included: false },
    { text: 'Energy & Chronotype Analysis', included: false },
    { text: 'Powered by Google Gemini API', included: false },
    { text: 'All Future Pro Features', included: false },
];

const proFeatures = [
    { text: 'Visual Time-Blocking Timeline', included: true },
    { text: 'Unlimited Time Bubbles', included: true },
    { text: 'Unlimited Custom Bubble Templates', included: true },
    { text: 'Basic Daily Summary', included: true },
    { text: 'Advanced AI-Powered Insights', included: true },
    { text: 'Proactive AI Tips & Nudges', included: true },
    { text: 'Habit Stacking Suggestions', included: true },
    { text: 'Energy & Chronotype Analysis', included: true },
    { text: 'Powered by Google Gemini API', included: true },
    { text: 'All Future Pro Features', included: true },
];


function PlanColumn({ title, price, originalPrice, discountLabel, priceSubtitle, description, features, onUpgrade, isLoading, isRecommended = false }: { title: string, price: string, originalPrice?: string, discountLabel?: string, priceSubtitle: string, description: string, features: {text: string, included: boolean}[], onUpgrade?: () => void, isLoading?: boolean, isRecommended?: boolean }) {
  return (
    <div className={cn("p-8 rounded-2xl border bg-primary/5 transition-all duration-300 w-full max-w-md relative overflow-hidden hover:-translate-y-1 hover:shadow-2xl", isRecommended ? "border-primary shadow-2xl ring-2 ring-primary premium-plan-card" : "border-border/50")}>
      {/* Premium glow effect for recommended plan */}
      {isRecommended && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 animate-pulse rounded-2xl" />
      )}
      <div className="relative z-10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <h3 className="text-2xl font-bold text-center">{title}</h3>
          {discountLabel && (
            <span className="px-2 py-1 text-xs rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/30">{discountLabel}</span>
          )}
        </div>
        <p className="text-muted-foreground text-center mb-4">{description}</p>
        <div className="text-center mb-2">
          {originalPrice && (
            <span className="text-lg text-muted-foreground line-through mr-2">{originalPrice}</span>
          )}
          <span className="text-5xl font-bold">{price}</span>
        </div>
        <p className="text-muted-foreground text-center mb-8 h-10">{priceSubtitle}</p>
        {isRecommended && (
          <Button size="lg" className="w-full mb-8" onClick={onUpgrade} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Processing...' : 'Upgrade Now'}
          </Button>
        )}
        <div className="space-y-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3 py-1">
              <div className={cn("w-5 h-5 flex items-center justify-center rounded-full", feature.included ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground')}>
                {feature.included ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              </div>
              <span className={cn("text-muted-foreground", feature.included && "text-foreground")}>{feature.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


export default function UpgradePage() {
    const { user, isNewUser } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState<string>("");
    const [deadline] = useState<number>(() => {
        const now = Date.now();
        return now + 1000 * 60 * 60 * 48; // 48 hours from now
    });

    useEffect(() => {
        const format = (ms: number) => {
            if (ms <= 0) return "Ends soon";
            const d = Math.floor(ms / (1000 * 60 * 60 * 24));
            const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
            return `${d > 0 ? d + 'd ' : ''}${h}h ${m}m`;
        };
        const tick = () => setTimeLeft(format(deadline - Date.now()));
        tick();
        const id = setInterval(tick, 60000);
        return () => clearInterval(id);
    }, [deadline]);

    const handleUpgrade = async () => {
        console.log('Upgrade button clicked');
        console.log('User:', user);
        
        if (!user) {
            console.error('No user found');
            alert('Please log in to upgrade');
            return;
        }
        
        setIsLoading(true);
        console.log('Starting upgrade process...');
        
        try {
            console.log('Getting ID token...');
            const idToken = await auth.currentUser?.getIdToken();
            console.log('ID token obtained:', !!idToken);
            
            if (!idToken) {
                throw new Error('Not authenticated - please log in again');
            }

            console.log('Creating PayPal order...');
            // Create PayPal order
            const createRes = await fetch('/api/paypal/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });
            
            console.log('PayPal create response status:', createRes.status);
            
            if (!createRes.ok) {
                const err = await createRes.json().catch(() => ({}));
                console.error('PayPal create error:', err);
                throw new Error(err.error || 'Failed to create PayPal order');
            }
            
            const { orderId, approvalUrl } = await createRes.json();
            console.log('PayPal order created:', { orderId, approvalUrl: !!approvalUrl });
            
            if (!orderId || !approvalUrl) {
                throw new Error('PayPal approval URL not received');
            }

            console.log('Redirecting to PayPal...');
            // Redirect to PayPal for approval
            window.location.href = approvalUrl;

        } catch (error: any) {
            console.error('PayPal upgrade error:', error);
            setIsLoading(false);
            alert(`Payment failed: ${error.message}`);
        }
    };


    return (
    <AuthGuard>
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            {/* Decorative gradient background + floating bubbles */}
            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(45rem_45rem_at_50%_-10%,rgba(99,102,241,0.25),transparent)]" />
              <div className="absolute inset-0 bg-[radial-gradient(35rem_35rem_at_80%_10%,rgba(236,72,153,0.18),transparent)]" />
              <div className="absolute -left-20 top-20 w-72 h-72 rounded-full bg-primary/10 blur-3xl animate-pulse" />
              <div className="absolute right-10 top-1/3 w-64 h-64 rounded-full bg-accent/10 blur-3xl animate-[pulse_6s_ease-in-out_infinite]" />
              <div className="absolute -right-24 bottom-10 w-96 h-96 rounded-full bg-amber-300/10 blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
            </div>
            <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/70 backdrop-blur-xl">
                <div className="container mx-auto flex items-center justify-between p-4">
                    <Link href="/app" className="flex items-center gap-2">
                      <TimeBubbleLogo className="h-6 w-auto" />
                      <span className="hidden md:inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" /> Secure checkout
                      </span>
                    </Link>
                    <Button asChild variant="ghost">
                        <Link href="/app">Back to App</Link>
                    </Button>
                </div>
            </header>
            <main className="flex-1 py-12 md:py-20">
                <div className="container mx-auto px-4">
                    {/* Hero */}
                    <div className="max-w-4xl mx-auto text-center mb-14 md:mb-20">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-background/60 mb-4">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-xs">Launch special • Lifetime access</span>
                      </div>
                      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                        Craft your time beautifully. Unlock <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Pro</span> forever.
                      </h1>
                      <p className="text-base md:text-lg text-muted-foreground">
                        Upgrade once, benefit for life. Smarter planning, energy-aware insights, and a calmer day.
                      </p>
                      <div className="mt-6 flex items-center justify-center gap-4">
                        <Button size="lg" onClick={handleUpgrade} disabled={isLoading} className="relative overflow-hidden">
                          <span className="relative z-10">{isLoading ? 'Processing…' : 'Unlock Pro for Life — $29'}</span>
                          <span className="pointer-events-none absolute inset-0 rounded-md bg-gradient-to-r from-primary/20 to-accent/20 blur-xl animate-pulse" />
                        </Button>
                        {timeLeft && (
                          <div className="text-xs px-3 py-2 rounded-md border bg-background/60">
                            Offer ends in <span className="font-semibold">{timeLeft}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="flex flex-col lg:flex-row justify-center items-stretch lg:items-start gap-8">
                        <PlanColumn 
                            title="Free"
                            price="$0"
                            priceSubtitle="Forever"
                            description="The essentials to get started with visual time management."
                            features={freeFeatures}
                        />
                        <div className="relative">
                          <div className="absolute -top-3 -right-3 rotate-6 px-3 py-1 rounded-md text-xs font-semibold bg-gradient-to-r from-amber-500 to-pink-500 text-white shadow-lg z-20 pointer-events-none">Best Value</div>
                          {/* Gradient aura */}
                          <div className="pointer-events-none absolute -inset-3 -z-10 rounded-3xl bg-gradient-to-br from-primary/30 via-accent/20 to-primary/10 blur-2xl" />
                          <PlanColumn 
                              title="Lifetime Pro"
                              price="$29"
                              originalPrice="$50"
                              discountLabel="42% OFF"
                              priceSubtitle="Limited-time launch price (one-time)"
                              description="Unlock every feature, forever, powered by the Google Gemini API."
                              features={proFeatures}
                              onUpgrade={handleUpgrade}
                              isLoading={isLoading}
                              isRecommended
                          />
                          
                        </div>
                    </div>

                    {/* Feature highlights with icons (no testimonials) */}
                    <div className="max-w-5xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-5 rounded-2xl border backdrop-blur bg-background/50 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-5 w-5 text-primary" />
                          <p className="font-semibold">Visual Timeline</p>
                        </div>
                        <p className="text-sm text-muted-foreground">Plan with bubble blocks that make your day feel tangible and calm.</p>
                      </div>
                      <div className="p-5 rounded-2xl border backdrop-blur bg-background/50 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-2">
                          <BrainCircuit className="h-5 w-5 text-primary" />
                          <p className="font-semibold">AI Insights</p>
                        </div>
                        <p className="text-sm text-muted-foreground">Actionable guidance matched to your energy and focus rhythms.</p>
                      </div>
                      <div className="p-5 rounded-2xl border backdrop-blur bg-background/50 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-2">
                          <BatteryCharging className="h-5 w-5 text-primary" />
                          <p className="font-semibold">Energy Analysis</p>
                        </div>
                        <p className="text-sm text-muted-foreground">Schedule the right work at the right time for consistent flow.</p>
                      </div>
                    </div>
                </div>
            </main>

            {/* Sticky mobile CTA */}
            <div className="md:hidden sticky bottom-0 border-t bg-background/80 backdrop-blur-xl px-4 py-3 flex items-center justify-between gap-3">
              <div className="text-sm">
                <p className="font-semibold leading-none">Lifetime Pro</p>
                <p className="text-muted-foreground">$29 one-time • 42% OFF</p>
              </div>
              <Button size="lg" onClick={handleUpgrade} disabled={isLoading}>
                {isLoading ? 'Processing…' : 'Upgrade'}
              </Button>
            </div>
        </div>
    </AuthGuard>
    );
}
