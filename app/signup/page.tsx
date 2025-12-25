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
import { AlertCircle, Loader2, Mail, Lock, User } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { signUp, user, firebaseUser, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Create profile in Firestore when user signs up
  useEffect(() => {
    const createProfile = async () => {
      // Only need firebaseUser for Firestore write (user from context is optional)
      if (!firebaseUser) {
        return;
      }

      try {
        console.log('🔍 Checking profile for user:', firebaseUser.uid);
        
        // Check if profile already exists
        const existingProfile = await firestoreClient.getDoc('profiles', firebaseUser.uid);
        
        if (!existingProfile) {
          // Create new profile
          const profileData = {
            username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            avatarUrl: firebaseUser.photoURL || null,
            email: firebaseUser.email || '',
          };
          
          console.log('📝 Creating profile with data:', profileData);
          
          // Use setDoc to create the profile (merge: true will create if doesn't exist)
          await firestoreClient.setDoc('profiles', firebaseUser.uid, profileData);
          
          console.log('✅ Profile created successfully in Firestore!');
          console.log('   UID:', firebaseUser.uid);
          console.log('   Username:', profileData.username);
          console.log('   Email:', profileData.email);
        } else {
          console.log('ℹ️ Profile already exists for user:', firebaseUser.uid);
        }
      } catch (err: any) {
        console.error('❌ Error creating profile in Firestore:', err);
        console.error('   Error code:', err?.code);
        console.error('   Error message:', err?.message);
        console.error('   User UID:', firebaseUser.uid);
        
        // Check for common Firestore errors
        if (err?.code === 'permission-denied') {
          console.error('');
          console.error('⚠️ PERMISSION DENIED!');
          console.error('   Your Firestore security rules are blocking the write.');
          console.error('   Go to Firebase Console → Firestore Database → Rules');
          console.error('   Make sure you have:');
          console.error('   match /profiles/{userId} {');
          console.error('     allow write: if request.auth != null && request.auth.uid == userId;');
          console.error('   }');
          console.error('');
        } else if (err?.code === 'unavailable') {
          console.error('⚠️ Firestore is unavailable. Check your internet connection.');
        } else if (err?.code === 'failed-precondition') {
          console.error('⚠️ Firestore operation failed. The database might not be initialized.');
        }
      }
    };

    // Small delay to ensure auth state is fully propagated
    const timer = setTimeout(() => {
      createProfile();
    }, 500);

    return () => clearTimeout(timer);
  }, [firebaseUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Create user account (AuthContext handles cookie sync)
      await signUp(email, password, username);

      // Wait a moment for the auth state to update and profile to be created
      // The useEffect above will handle profile creation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect to home
      router.push('/');
      router.refresh();
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            Enter your information to create a new account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Password must be at least 6 characters
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading || authLoading}>
              {loading || authLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

