import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';

/**
 * GET /api/creators/[id]
 * Fetch creator by ID (TMDB numeric ID) or slug from Firestore
 * Automatically detects if the id parameter is numeric (TMDB ID) or a slug
 * Returns 404 if not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`🔍 GET /api/creators/${id} - Searching Firestore...`);

    if (!adminDb) {
      console.error('❌ GET /api/creators/[id] - Database not initialized');
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      );
    }

    const creatorsRef = adminDb.collection('creators');
    
    // Check if id is numeric (TMDB ID) or a slug
    const isNumeric = /^\d+$/.test(id);
    
    let doc: FirebaseFirestore.DocumentSnapshot | null = null;
    
    if (isNumeric) {
      // Search by TMDB ID (document ID)
      console.log(`   Searching by TMDB ID: ${id}`);
      doc = await creatorsRef.doc(id).get();
      
      if (!doc.exists) {
        console.log(`❌ Creator not found by ID: ${id}`);
        return NextResponse.json(
          { error: 'Creator not found' },
          { status: 404 }
        );
      }
    } else {
      // Search by slug
      console.log(`   Searching by slug: ${id}`);
      const snapshot = await creatorsRef.where('slug', '==', id).limit(1).get();

    if (snapshot.empty) {
        console.log(`❌ Creator not found by slug: ${id}`);
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

      doc = snapshot.docs[0];
    }

    const data = doc.data()!;
    const creator = {
      id: isNumeric ? id : doc.id,
      ...data,
      // Convert Firestore Timestamps to ISO strings for JSON serialization
      lastUpdated: data.lastUpdated?.toDate?.()?.toISOString() || data.lastUpdated,
    };

    console.log(`✅ Found creator: ${data.name || 'Unknown'} (ID: ${creator.id})`);

    return NextResponse.json({ creator }, { status: 200 });
  } catch (error: any) {
    console.error(`❌ GET /api/creators/[id] - Error:`, error.message);
    return NextResponse.json(
      { error: 'Failed to fetch creator', details: error.message },
      { status: 500 }
    );
  }
}
