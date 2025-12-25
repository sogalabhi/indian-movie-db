'use client';

import { useState } from 'react';
import { testFirebaseConnection } from '@/lib/firebase/test-connection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2, Database } from 'lucide-react';

export default function TestFirebasePage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    config: boolean;
    auth: boolean;
    firestore: boolean;
    errors: string[];
  } | null>(null);

  const handleTest = async () => {
    setLoading(true);
    setResults(null);
    
    try {
      const testResults = await testFirebaseConnection();
      setResults(testResults);
    } catch (error: any) {
      setResults({
        config: false,
        auth: false,
        firestore: false,
        errors: [error.message || 'Test failed'],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-6 h-6" />
              Firebase Connection Test
            </CardTitle>
            <CardDescription>
              Test if Firebase is properly configured and connected
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button onClick={handleTest} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>

            {results && (
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <span className="font-medium">Configuration</span>
                    {results.config ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <span className="font-medium">Authentication</span>
                    {results.auth ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <span className="font-medium">Firestore</span>
                    {results.firestore ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>

                {results.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1">
                        {results.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {results.config && results.auth && results.firestore && (
                  <Alert>
                    <CheckCircle2 className="w-4 h-4" />
                    <AlertDescription>
                      All tests passed! Firebase is properly configured.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">Next Steps:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Make sure you've set all Firebase environment variables in .env.local</li>
                <li>Enable Email/Password authentication in Firebase Console</li>
                <li>Create a Firestore database in test mode (for now)</li>
                <li>Visit /login or /signup to test authentication</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

