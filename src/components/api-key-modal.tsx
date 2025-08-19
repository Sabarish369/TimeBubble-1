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
import { Loader2, Star } from 'lucide-react';
import Link from 'next/link';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const { geminiApiKey, setGeminiApiKey, loading, isPro } = useAuth();
  const [apiKey, setApiKey] = useState(geminiApiKey || '');

  const handleSave = async () => {
    await setGeminiApiKey(apiKey);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
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
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Complete control over your AI usage</li>
                  <li>• Direct access to Google's generous free tier</li>
                  <li>• No usage limits from TimeBubble</li>
                  <li>• Your data stays between you and Google</li>
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
              <DialogDescription>
                To use the AI-powered features, you'll need a free Google Gemini API key. Don't worry - it's completely free and takes just a minute to set up!
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="api-key">Your Gemini API Key</Label>
                    <Input
                        id="api-key"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your API key"
                    />
                </div>
                <p className='text-sm text-muted-foreground'>
                    Your key is stored securely and is only used to enable the AI features for your account. Get your free API key from {' '}
                    <Link href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                        Google AI Studio
                    </Link> - no payment method required, generous free tier included!
                </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSave} disabled={loading || !apiKey}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Saving...' : 'Save Free API Key'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}