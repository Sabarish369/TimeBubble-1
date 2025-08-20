
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MessageSquare, Star, Send, Heart, ThumbsUp, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';

const feedbackTypes = [
    { id: 'feature', icon: Lightbulb, label: 'Feature Request', color: 'text-yellow-500' },
    { id: 'bug', icon: MessageSquare, label: 'Bug Report', color: 'text-red-500' },
    { id: 'praise', icon: Heart, label: 'Love It!', color: 'text-pink-500' },
    { id: 'general', icon: ThumbsUp, label: 'General', color: 'text-blue-500' },
];

export function FeedbackSection() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();

    const handleSubmit = async () => {
        if (!user) {
            toast({
                title: "Authentication required",
                description: "You must be signed in to submit feedback.",
                variant: "destructive",
            });
            return;
        }

        if (!feedback.trim() || !selectedType) {
            toast({
                title: "Please fill in all fields",
                description: "Select a feedback type and write your message.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        
        try {
            const response = await fetch('/api/submit-feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    feedbackType: selectedType,
                    message: feedback,
                    userId: user.uid,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit feedback');
            }

            toast({
                title: "Thank you for your feedback! 🎉",
                description: "Your input helps us make TimeBubble better for everyone.",
            });
            
            setFeedback('');
            setSelectedType(null);
            setIsExpanded(false);

        } catch (error) {
             toast({
                title: "Something went wrong",
                description: "Could not submit your feedback. Please try again later.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="mt-6 bg-gradient-to-br from-secondary/50 to-primary/5 border-primary/20" id="feedback-section">
            <CardHeader 
                className="cursor-pointer hover:bg-primary/5 transition-colors rounded-t-lg" 
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Share Feedback
                    <div className={cn("ml-auto transition-transform duration-300", isExpanded && "rotate-180")}>
                        ⌄
                    </div>
                </CardTitle>
            </CardHeader>
            
            {isExpanded && (
                <CardContent className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                    {/* Feedback Type Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">What kind of feedback?</label>
                        <div className="grid grid-cols-2 gap-2">
                            {feedbackTypes.map((type) => {
                                const Icon = type.icon;
                                return (
                                    <button
                                        key={type.id}
                                        onClick={() => setSelectedType(type.id)}
                                        className={cn(
                                            "flex items-center gap-2 p-2 rounded-lg border text-sm transition-all duration-200 hover:scale-105",
                                            selectedType === type.id 
                                                ? "border-primary bg-primary/10 text-primary" 
                                                : "border-border hover:border-primary/50 hover:bg-primary/5"
                                        )}
                                    >
                                        <Icon className={cn("h-4 w-4", selectedType === type.id ? "text-primary" : type.color)} />
                                        {type.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Feedback Text */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Your message</label>
                        <Textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Tell us what's on your mind... 💭"
                            className="min-h-20 border-primary/20 focus:border-primary/50 transition-colors"
                        />
                    </div>

                    {/* Submit Button */}
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !feedback.trim() || !selectedType}
                        className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-medium py-2 transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Send Feedback
                            </>
                        )}
                    </Button>

                    {/* Encouragement */}
                    <p className="text-xs text-muted-foreground text-center">
                        Every piece of feedback makes TimeBubble better! 🚀
                    </p>
                </CardContent>
            )}
        </Card>
    );
}
