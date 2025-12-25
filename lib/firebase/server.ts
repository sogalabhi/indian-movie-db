import { initializeApp, getApps, cert, ServiceAccount, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (for server-side operations)
let adminApp: App | undefined;
let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;

try {
  if (getApps().length === 0) {
    // Validate required environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      console.error('Firebase Admin SDK configuration is missing!');
      console.error('Required environment variables:');
      console.error('- FIREBASE_PROJECT_ID:', projectId ? '✓' : '✗ Missing');
      console.error('- FIREBASE_CLIENT_EMAIL:', clientEmail ? '✓' : '✗ Missing');
      console.error('- FIREBASE_PRIVATE_KEY:', privateKey ? '✓' : '✗ Missing');
      console.error('\nPlease see docs/env-setup.md for setup instructions.');
      throw new Error('Firebase Admin SDK environment variables are missing');
    }

    const serviceAccount: ServiceAccount = {
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    };

    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId,
    });
  } else {
    adminApp = getApps()[0];
  }

  if (adminApp) {
    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error);
  console.error('Authentication features will not work until environment variables are configured.');
}

export { adminAuth, adminDb };
export default adminApp;

