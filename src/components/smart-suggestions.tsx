'use client';

import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTimeBubbles } from '@/context/time-bubbles-context';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Skeleton } from './ui/skeleton';

export function SmartSuggestions() {
  const { getAiSuggestions, suggestions, isLoadingSuggestions, clearSuggestions } = useTimeBubbles();

  return (
    <Popover onOpenChange={(open) => !open && clearSuggestions()}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" onClick={getAiSuggestions}>
          <Sparkles className="h-5 w-5 text-amber-500" />
          <span className="sr-only">Smart Suggestions</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Smart Suggestions</h4>
            <p className="text-sm text-muted-foreground">
              AI-powered tips to optimize your day.
            </p>
          </div>
          <div className="grid gap-2">
            {isLoadingSuggestions && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
              </div>
            )}
            {suggestions.length > 0 && (
              <ul className="space-y-2 list-disc list-inside text-sm">
                {suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            )}
            {!isLoadingSuggestions && suggestions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Click the button to get new suggestions!</p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
