'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '@/context/auth-context';
import { Loader2, Star, CheckCircle, Copy } from 'lucide-react';
import Link from 'next/link';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  error?: string | null;
}

export function ApiKeyModal({ isOpen, onClose, error }: ApiKeyModalProps) {
  const { geminiApiKey, setGeminiApiKey, loading, isPro } = useAuth();
  const [apiKey, setApiKey] = useState(geminiApiKey || '');

  const handleSave = async () => {
    await setGeminiApiKey(apiKey);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        {!isPro ? (
          <>
            <DialogHeader className="text-center items-center">
              <div className='p-3 rounded-full bg-primary/10 mb-4'>
                <Star className="h-8 w-8 text-amber-500" />
              </div>
              <DialogTitle>Pro Feature: Custom API Key</DialogTitle>
              <DialogDescription>
                Using your own Gemini API key is a Pro feature. Upgrade to TimeBubble Pro to bring your own free API key and enjoy unlimited AI-powered insights!
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted/50 rounded-lg border">
                <h4 className="font-semibold mb-2">Why bring your own API key?</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Complete control over your AI usage</li>
                  <li>Direct access to Google's generous free tier</li>
                  <li>No usage limits from TimeBubble</li>
                  <li>Your data stays between you and Google</li>
                </ul>
              </div>
            </div>

            <DialogFooter className="flex-col gap-2">
              <Button size="lg" className="w-full" asChild>
                <Link href="/upgrade">Upgrade to Pro</Link>
              </Button>
              <Button size="lg" variant="ghost" onClick={onClose}>Maybe Later</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Get Your Free Gemini API Key</DialogTitle>
              {error && (
                 <DialogDescription className="text-destructive font-semibold">
                    It looks like your API key is invalid or has an issue. Please create a new one.
                </DialogDescription>
              )}
               <DialogDescription>
                To use the AI-powered features, you'll need a free Google Gemini API key. Follow the steps below—it takes just a minute!
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
                <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
                    <h4 className="font-semibold text-foreground">How to get your key:</h4>
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
                        <p className="text-sm text-muted-foreground">
                            Go to <Link href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline font-medium">Google AI Studio</Link>.
                        </p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</div>
                        <p className="text-sm text-muted-foreground">
                            Click <span className="font-semibold text-foreground">"Create API key in new project"</span>. No payment info is needed.
                        </p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</div>
                        <p className="text-sm text-muted-foreground">
                            Click the <Copy className="inline h-3 w-3" /> icon to copy your new key.
                        </p>
                    </div>
                     <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">4</div>
                        <p className="text-sm text-muted-foreground">
                           Paste it in the input field below and save.
                        </p>
                    </div>
                </div>

                <div className="space-y-2 pt-2">
                    <Label htmlFor="api-key">Your Gemini API Key</Label>
                    <Input
                        id="api-key"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Paste your API key here"
                    />
                </div>
                
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSave} disabled={loading || !apiKey}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Saving...' : 'Save & Continue'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
