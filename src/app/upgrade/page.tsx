
'use client';

import { Button } from "@/components/ui/button";
import { Check, X, Star, Loader2, BrainCircuit, Target, BatteryCharging } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TimeBubbleLogo } from "@/components/timebubble-logo";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/context/auth-context";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
    { text: 'Priority Support', included: false },
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
    { text: 'Priority Support & All Future Pro Features', included: true },
];


function PlanColumn({ title, price, priceSubtitle, description, features, onUpgrade, isLoading, isRecommended = false }: { title: string, price: string, priceSubtitle: string, description: string, features: {text: string, included: boolean}[], onUpgrade?: () => void, isLoading?: boolean, isRecommended?: boolean }) {
  return (
    <div className={cn("p-8 rounded-2xl border bg-primary/5 transition-all w-full max-w-md", isRecommended ? "border-primary shadow-2xl ring-2 ring-primary" : "border-border/50")}>
      <h3 className="text-2xl font-bold text-center mb-2">{title}</h3>
       <p className="text-muted-foreground text-center mb-4">{description}</p>
      
      <p className="text-5xl font-bold text-center mb-2">{price}</p>
      <p className="text-muted-foreground text-center mb-8 h-10">{priceSubtitle}</p>
      
      {isRecommended && (
        <Button size="lg" className="w-full mb-8" onClick={onUpgrade} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Processing...' : 'Upgrade Now'}
        </Button>
      )}

       <div className="space-y-4">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className={cn("w-5 h-5 flex items-center justify-center rounded-full", feature.included ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground')}>
                {feature.included ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
            </div>
            <span className={cn("text-muted-foreground", feature.included && "text-foreground")}>{feature.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


export default function UpgradePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleUpgrade = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: user.uid }),
            });

            if (!res.ok) {
                throw new Error('Failed to create checkout session');
            }

            const { sessionId } = await res.json();
            // This is a Stripe checkout session ID. In a real app, you would redirect to Stripe.
            // For this simulation, we'll go to the success page.
             router.push('/upgrade/success?session_id=' + sessionId);
        } catch (error) {
            console.error(error);
            setIsLoading(false);
            // You might want to show an error toast here
        }
    };


    return (
    <AuthGuard>
        <div className="flex flex-col min-h-screen bg-background text-foreground">
             <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
                <div className="container mx-auto flex items-center justify-between p-4">
                    <Link href="/app"><TimeBubbleLogo className="h-6 w-auto" /></Link>
                    <Button asChild variant="ghost">
                        <Link href="/app">Back to App</Link>
                    </Button>
                </div>
            </header>
            <main className="flex-1 py-16 md:py-24">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent bg-[size:200%_auto] animate-gradient-move">Seize Our Limited-Time Lifetime Deal</h1>
                        <p className="text-lg md:text-xl text-muted-foreground mb-12">
                            Become an Early Bird supporter and get TimeBubble Pro forever for a single payment. 
                            <br/>
                            <span className="font-semibold">This offer won't last long.</span>
                        </p>
                    </div>

                    <div className="flex flex-col lg:flex-row justify-center items-center lg:items-start gap-8">
                        <PlanColumn 
                            title="Free"
                            price="$0"
                            priceSubtitle="Forever"
                            description="The essentials to get started with visual time management."
                            features={freeFeatures}
                        />
                         <PlanColumn 
                            title="Lifetime Pro"
                            price="$49"
                            priceSubtitle="One-time payment"
                            description="Unlock every feature, forever, powered by the Google Gemini API."
                            features={proFeatures}
                            onUpgrade={handleUpgrade}
                            isLoading={isLoading}
                            isRecommended
                        />
                    </div>
                </div>
            </main>
        </div>
    </AuthGuard>
    );
}
