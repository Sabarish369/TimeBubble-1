
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
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const { geminiApiKey, setGeminiApiKey, loading } = useAuth();
  const [apiKey, setApiKey] = useState(geminiApiKey || '');

  const handleSave = async () => {
    await setGeminiApiKey(apiKey);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Your Gemini API Key</DialogTitle>
          <DialogDescription>
            To use the AI-powered features, please enter your Google Gemini API key. You can get one for free from Google AI Studio.
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
                Your key is stored securely and is only used to enable the AI features for your account. You can get a key from {' '}
                <Link href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    Google AI Studio
                </Link>.
            </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading || !apiKey}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
