
'use client';

import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TimeBubbleLogo } from "@/components/timebubble-logo";
import { Header } from "@/components/header";
import { AuthGuard } from "@/components/auth-guard";

const proFeatures = [
  'Advanced AI Insights & Reports',
  'Proactive AI-Powered Tips',
  'Long-Term Trend Analysis',
  'Unlimited Bubble Templates',
  'Priority Support',
  'Custom Themes (Coming Soon)',
];

function PlanCard({ title, price, description, features, recommended = false }: { title: string, price: string, description: string, features: string[], recommended?: boolean }) {
  return (
    <div className={cn("p-8 rounded-2xl border bg-primary/5 transition-all w-full max-w-sm", recommended ? "border-primary shadow-2xl scale-105 ring-2 ring-primary" : "border-border/50")}>
      {recommended && (
        <div className="text-xs uppercase font-bold text-primary mb-2 text-center">Most Popular</div>
      )}
      <h3 className="text-2xl font-bold text-center mb-4">{title}</h3>
      <p className="text-5xl font-bold text-center mb-2">{price}<span className="text-lg font-normal text-muted-foreground">/mo</span></p>
      <p className="text-muted-foreground text-center mb-8 h-10">{description}</p>
      
      <Button size="lg" className="w-full mb-8" disabled>
        { 'Upgrade Now (Coming Soon)' }
      </Button>

       <div className="space-y-4">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-5 h-5 flex items-center justify-center rounded-full bg-green-500/20 text-green-400">
                <Check className="w-3.5 h-3.5" />
            </div>
            <span className="text-muted-foreground">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


export default function UpgradePage() {
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
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent bg-[size:200%_auto] animate-gradient-move">Unlock Your Full Potential</h1>
                        <p className="text-lg md:text-xl text-muted-foreground mb-12">
                            Go Pro to access powerful AI features, unlimited customization, and long-term insights to truly master your time.
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row justify-center items-center md:items-start gap-8">
                        <PlanCard 
                            title="Monthly"
                            price="$12"
                            description="Perfect for getting started and trying out all the pro features."
                            features={proFeatures}
                        />
                         <PlanCard 
                            title="Yearly"
                            price="$8"
                            description="Save 33% with our annual plan. The best value for long-term growth."
                            features={proFeatures}
                            recommended
                        />
                    </div>

                    <div className="text-center mt-16">
                        <Link href="/app" className="text-sm text-muted-foreground hover:text-primary underline">
                            Continue with the free version
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    </AuthGuard>
    );
}
