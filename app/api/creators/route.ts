import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';

/**
 * GET /api/creators
 * Fetch all creators from Firestore ONLY (no TMDB calls)
 * Used by homepage carousel - fast, no external API calls
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📋 GET /api/creators - Fetching from Firestore...');

    if (!adminDb) {
      console.error('❌ GET /api/creators - Database not initialized');
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      );
    }

    const creatorsRef = adminDb.collection('creators');
    const snapshot = await creatorsRef.get();

    const creators = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore Timestamps to ISO strings for JSON serialization
        lastUpdated: data.lastUpdated?.toDate?.()?.toISOString() || data.lastUpdated,
      };
    });

    console.log(`✅ Found ${creators.length} creators in Firestore`);
    console.log('📤 Returning creators list');

    return NextResponse.json({ creators }, { status: 200 });
  } catch (error: any) {
    console.error('❌ GET /api/creators - Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch creators', details: error.message },
      { status: 500 }
    );
  }
}

