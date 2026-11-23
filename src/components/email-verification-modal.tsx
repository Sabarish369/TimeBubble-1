'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TimeBubbleLogo } from "@/components/timebubble-logo";
import { useAuth } from "@/context/auth-context";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle, Mail, CheckCircle, Loader2 } from "lucide-react";

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

export function EmailVerificationModal({ isOpen, onClose, email }: EmailVerificationModalProps) {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const { sendEmailVerification, error } = useAuth();

  const handleResendVerification = async () => {
    setIsResending(true);
    setResendSuccess(false);
    try {
      await sendEmailVerification();
      setResendSuccess(true);
    } catch (error) {
      console.error('Error resending verification email:', error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0">
        <div className="p-6">
          <div className="flex justify-center mb-6">
            <TimeBubbleLogo className="h-8 w-auto" />
          </div>

          <DialogHeader className="mb-4">
            <DialogTitle className="text-center text-xl font-semibold">
              Verify Your Email
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              We've sent a verification email to
            </DialogDescription>
            <div className="text-center font-medium text-foreground mt-1">
              {email}
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
              <Mail className="h-8 w-8 text-primary mr-3" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">Check your inbox</p>
                <p>Click the verification link in the email</p>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {resendSuccess && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Verification email sent successfully! Please check your inbox.
                </AlertDescription>
              </Alert>
            )}

            <div className="text-center text-sm text-muted-foreground">
              <p>Didn't receive the email?</p>
              <Button
                variant="link"
                className="p-0 h-auto text-primary"
                onClick={handleResendVerification}
                disabled={isResending}
              >
                {isResending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Resend verification email'
                )}
              </Button>
            </div>

            <div className="pt-4">
              <Button
                onClick={onClose}
                className="w-full"
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

