
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimeBubbleLogo } from "@/components/timebubble-logo";
import { GoogleIcon } from "@/components/icons/google-icon";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <TimeBubbleLogo className="h-8 w-auto" />
        </div>
        <Tabs defaultValue="sign-in" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sign-in">Sign In</TabsTrigger>
            <TabsTrigger value="create-account">Create Account</TabsTrigger>
          </TabsList>
          <TabsContent value="sign-in">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>
                  Enter your credentials to access your timeline.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-signin">Email</Label>
                  <Input id="email-signin" type="email" placeholder="m@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signin">Password</Label>
                  <Input id="password-signin" type="password" required />
                </div>
                <Button type="submit" className="w-full">
                  Sign In
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
                <Button variant="outline" className="w-full">
                  <GoogleIcon className="mr-2 h-4 w-4" />
                  Sign in with Google
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="create-account">
            <Card>
              <CardHeader>
                <CardTitle>Create an Account</CardTitle>
                <CardDescription>
                  Enter your email below to create your account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input id="email-signup" type="email" placeholder="m@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Password</Label>
                  <Input id="password-signup" type="password" required />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="password-confirm">Confirm Password</Label>
                  <Input id="password-confirm" type="password" required />
                </div>
                <Button type="submit" className="w-full">
                  Create Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
