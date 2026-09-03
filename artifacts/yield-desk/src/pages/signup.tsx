import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useSignup } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

type SignupError = {
  status?: number;
  data?: {
    message?: string;
    error?: string;
  } | null;
};

function getSignupErrorMessage(error: unknown): string {
  const apiError = error as SignupError;

  if (apiError.status === 409) {
    return "An account with this email already exists. Try signing in instead.";
  }

  if (apiError.status === 400) {
    return apiError.data?.message ?? apiError.data?.error ?? "Please check your email and password.";
  }

  if (error instanceof TypeError) {
    return "Could not reach YieldDesk. Please check your connection and try again.";
  }

  return "We could not create your account. Please try again.";
}

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const signupMutation = useSignup();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signupMutation.mutate(
      { data: { email: email.trim().toLowerCase(), password } },
      {
        onSuccess: (data) => {
          login(data.token);
          setLocation("/");
        },
        onError: (error) => {
          toast({
            title: "Signup failed",
            description: getSignupErrorMessage(error),
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background" data-testid="signup-page">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tighter text-primary">YieldDesk</CardTitle>
          <CardDescription>Create your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="input-email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} data-testid="input-password" />
            </div>
            <Button type="submit" className="w-full" disabled={signupMutation.isPending} data-testid="button-signup">
              {signupMutation.isPending ? "Creating account..." : "Create account"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline" data-testid="link-login">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
