'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Mail, CheckCircle } from 'lucide-react';

export default function TestEmailVerificationPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const { sendEmailVerification } = useAuth();

  const handleTestVerification = async () => {
    if (!email) {
      setMessage('Please enter an email address');
      setStatus('error');
      return;
    }

    setStatus('sending');
    try {
      await sendEmailVerification(email);
      setMessage('Verification email sent successfully! Check your inbox and spam folder.');
      setStatus('success');
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Test Email Verification</h1>
          <p className="text-muted-foreground">
            Test if email verification is working properly
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="test@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleTestVerification} 
            disabled={status === 'sending'}
            className="w-full"
          >
            {status === 'sending' ? 'Sending...' : 'Send Test Verification Email'}
          </Button>

          {status !== 'idle' && (
            <Alert variant={status === 'success' ? 'default' : 'destructive'}>
              {status === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>Troubleshooting Tips:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Check your spam/junk folder</li>
            <li>Verify Firebase configuration is correct</li>
            <li>Ensure environment variables are set</li>
            <li>Check Firebase Console Authentication settings</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

