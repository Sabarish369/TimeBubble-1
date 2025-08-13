
'use client';

import { useState } from "react";
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimeBubbleLogo } from "@/components/timebubble-logo";
import { GoogleIcon } from "@/components/icons/google-icon";
import { useAuth } from "@/context/auth-context";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertCircle } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const signInSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

const signUpSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type SignInValues = z.infer<typeof signInSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [activeTab, setActiveTab] = useState("sign-in");
  const { signIn, signUp, signInWithGoogle, error, loading } = useAuth();

  const signInForm = useForm<SignInValues>({ resolver: zodResolver(signInSchema) });
  const signUpForm = useForm<SignUpValues>({ resolver: zodResolver(signUpSchema) });

  const onSignIn: SubmitHandler<SignInValues> = async (data) => {
    await signIn(data.email, data.password);
  };

  const onSignUp: SubmitHandler<SignUpValues> = async (data) => {
    await signUp(data.email, data.password, data.name);
  };
  
  // Don't close the modal on outside click
  const handleInteractOutside = (e: Event) => {
    e.preventDefault();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0" onInteractOutside={handleInteractOutside}>
        <div className="p-6">
          <div className="flex justify-center mb-6">
            <TimeBubbleLogo className="h-8 w-auto" />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sign-in">Sign In</TabsTrigger>
              <TabsTrigger value="create-account">Create Account</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sign-in" className="mt-4">
              <DialogHeader className="mb-4">
                <DialogTitle>Welcome Back</DialogTitle>
                <DialogDescription>
                  Enter your credentials to access your timeline.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-signin">Email</Label>
                  <Input id="email-signin" type="email" placeholder="m@example.com" {...signInForm.register('email')} />
                  {signInForm.formState.errors.email && <p className="text-sm text-destructive">{signInForm.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signin">Password</Label>
                  <Input id="password-signin" type="password" {...signInForm.register('password')} />
                  {signInForm.formState.errors.password && <p className="text-sm text-destructive">{signInForm.formState.errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={signInWithGoogle} disabled={loading}>
                  <GoogleIcon className="mr-2 h-4 w-4" />
                  Sign in with Google
                </Button>
                 <div className="mt-4 text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("create-account")}
                    className="underline text-primary"
                  >
                    Sign up
                  </button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="create-account" className="mt-4">
              <DialogHeader className="mb-4">
                <DialogTitle>Create an Account</DialogTitle>
                <DialogDescription>
                  Enter your details below to create your account.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-4">
                 <div className="space-y-2">
                  <Label htmlFor="name-signup">Name</Label>
                  <Input id="name-signup" type="text" placeholder="Your Name" {...signUpForm.register('name')} />
                  {signUpForm.formState.errors.name && <p className="text-sm text-destructive">{signUpForm.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input id="email-signup" type="email" placeholder="m@example.com" {...signUpForm.register('email')} />
                   {signUpForm.formState.errors.email && <p className="text-sm text-destructive">{signUpForm.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Password</Label>
                  <Input id="password-signup" type="password" {...signUpForm.register('password')} />
                   {signUpForm.formState.errors.password && <p className="text-sm text-destructive">{signUpForm.formState.errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                   {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
                 <div className="mt-4 text-center text-sm">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("sign-in")}
                    className="underline text-primary"
                  >
                    Sign in
                  </button>
                </div>
              </form>
            </TabsContent>
          </Tabs>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
