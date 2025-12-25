'use client';

import { auth, db } from './config';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import {
  collection as firestoreCollection,
  doc as firestoreDoc,
  getDoc as firestoreGetDoc,
  getDocs as firestoreGetDocs,
  setDoc as firestoreSetDoc,
  updateDoc as firestoreUpdateDoc,
  deleteDoc as firestoreDeleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';

// Auth functions
export const authClient = {
  signIn: (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password),
  
  signUp: (email: string, password: string) =>
    createUserWithEmailAndPassword(auth, email, password),
  
  signOut: () => signOut(auth),
  
  onAuthStateChanged: (callback: (user: User | null) => void) =>
    onAuthStateChanged(auth, callback),
  
  resetPassword: (email: string) =>
    sendPasswordResetEmail(auth, email),
  
  updateProfile: (user: User, profile: { displayName?: string; photoURL?: string }) =>
    updateProfile(user, profile),
  
  getCurrentUser: () => auth.currentUser,
};

// Firestore helper functions
export const firestoreClient = {
  // Generic CRUD operations
  getDoc: async (collectionName: string, docId: string) => {
    const docRef = firestoreDoc(db, collectionName, docId);
    const docSnap = await firestoreGetDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  },
  
  getDocs: async (collectionName: string, constraints?: any[]) => {
    let q = query(firestoreCollection(db, collectionName));
    if (constraints) {
      constraints.forEach((constraint) => {
        q = query(q, ...constraint);
      });
    }
    const querySnapshot = await firestoreGetDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  },
  
  setDoc: async (collectionName: string, docId: string, data: any) => {
    const docRef = firestoreDoc(db, collectionName, docId);
    await firestoreSetDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  },
  
  createDoc: async (collectionName: string, data: any) => {
    const docRef = firestoreDoc(firestoreCollection(db, collectionName));
    await firestoreSetDoc(docRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },
  
  updateDoc: async (collectionName: string, docId: string, data: any) => {
    const docRef = firestoreDoc(db, collectionName, docId);
    await firestoreUpdateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },
  
  deleteDoc: async (collectionName: string, docId: string) => {
    const docRef = firestoreDoc(db, collectionName, docId);
    await firestoreDeleteDoc(docRef);
  },
  
  // Collection reference helper
  collection: (collectionName: string) => firestoreCollection(db, collectionName),
  
  // Document reference helper
  doc: (collectionName: string, docId: string) => firestoreDoc(db, collectionName, docId),
  
  // Query helpers
  where: (field: string, operator: any, value: any) => where(field, operator, value),
  orderBy: (field: string, direction?: 'asc' | 'desc') => orderBy(field, direction),
  limit: (count: number) => limit(count),
};

export { Timestamp, serverTimestamp };

