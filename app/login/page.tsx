'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { firestoreClient } from '@/lib/firebase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, user, firebaseUser, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Create or update profile when user logs in
  useEffect(() => {
    const createProfile = async () => {
      if (firebaseUser && user) {
        try {
          const profile = await firestoreClient.getDoc('profiles', firebaseUser.uid);
          if (!profile) {
            await firestoreClient.setDoc('profiles', firebaseUser.uid, {
              username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              avatarUrl: firebaseUser.photoURL || null,
              email: firebaseUser.email || user.email || '',
            });
          }
        } catch (err) {
          console.error('Error creating/updating profile:', err);
        }
      }
    };

    createProfile();
  }, [firebaseUser, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(email, password);
      
      // Redirect to home
      router.push('/');
      router.refresh();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 pb-20 md:pb-4">
      <Card className="glass-card w-full max-w-md animate-scale-in">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl md:text-2xl font-bold text-center">Sign In</CardTitle>
          <CardDescription className="text-center text-sm">
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="glass-card animate-fade-in">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 transition-smooth"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 transition-smooth"
                  disabled={loading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full transition-smooth" disabled={loading || authLoading}>
              {loading || authLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-xs md:text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link href="/signup" className="text-primary hover:underline font-medium transition-smooth">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

