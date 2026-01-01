/**
 * Seed script to populate Firestore with creator data
 * 
 * This script:
 * 1. Fetches profile_path from TMDB API for each director
 * 2. Generates slugs from names
 * 3. Stores all data in Firestore creators collection
 * 
 * Run with: npm run seed:creators
 * 
 * Make sure .env.local file exists with:
 * - NEXT_PUBLIC_TMDB_API_KEY
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_CLIENT_EMAIL
 * - FIREBASE_PRIVATE_KEY
 */

// CRITICAL: Load environment variables using require() BEFORE any imports
// This executes synchronously before import statements are processed
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Determine .env.local path
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

// Load .env.local file (primary) - MUST happen before Firebase imports
if (fs.existsSync(envLocalPath)) {
  const result = dotenv.config({ path: envLocalPath });
  if (result.error) {
    console.error('❌ Error loading .env.local:', result.error);
  } else {
    console.log('📄 Loading environment variables from .env.local...');
  }
} else {
  console.warn('⚠️  .env.local file not found, trying .env...');
}

// Also try loading regular .env as fallback
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false }); // Don't override .env.local values
}

// Import non-Firebase modules (these don't need env vars)
import { generateSlug } from '../lib/creator-utils';
import { Creator } from '../lib/types/creator';
import axios from 'axios';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

// Directors to seed with their TMDB IDs
const DIRECTORS = [
  { id: '147021', name: 'S. S. Rajamouli', role: 'Director' }, // ✅ Correct ID from https://www.themoviedb.org/person/147021-s-s-rajamouli
  { id: '42804', name: 'Sanjay Leela Bhansali', role: 'Director' }, // ✅ Correct ID from https://www.themoviedb.org/person/42804
  { id: '85675', name: 'Rajkumar Hirani', role: 'Director' }, // ✅ Correct ID from https://www.themoviedb.org/person/85675-rajkumar-hirani
  { id: '2182258', name: 'S. Shankar', role: 'Director' }, // ✅ Correct ID from https://www.themoviedb.org/person/2182258
  { id: '81085', name: 'A.R. Murugadoss', role: 'Director' }, // ✅ Correct ID from https://www.themoviedb.org/person/81085
  { id: '237051', name: 'Sukumar', role: 'Director' }, // ✅ Correct ID from https://www.themoviedb.org/person/237051-sukumar
  { id: '1261324', name: 'Prashanth Neel', role: 'Director' }, // TODO: Verify - currently returns wrong name
  { id: '1752058', name: 'Rishab Shetty', role: 'Director' }, // ✅ Correct ID from https://www.themoviedb.org/person/1752058
];

// Actors to seed with their TMDB IDs
const ACTORS = [
  { id: '116924', name: 'Mahesh Babu', role: 'Actor' }, // ✅ Correct ID from https://www.themoviedb.org/person/116924-mahesh-babu
  { id: '108215', name: 'Allu Arjun', role: 'Actor' }, // ✅ Correct ID from https://www.themoviedb.org/person/108215-allu-arjun
  { id: '237045', name: 'Prabhas', role: 'Actor' }, // ✅ Correct ID from https://www.themoviedb.org/person/237045-prabhas
  { id: '148037', name: 'N.T. Rama Rao Jr.', role: 'Actor' }, // ✅ Correct ID from https://www.themoviedb.org/person/148037-n-t-rama-rao-jr
  { id: '91555', name: 'Rajinikanth', role: 'Actor' }, // ✅ Correct ID from https://www.themoviedb.org/person/91555-rajinikanth
  { id: '91547', name: 'Unknown', role: 'Actor' }, // ID from https://www.themoviedb.org/person/91547 (name will be fetched from TMDB)
  { id: '93193', name: 'Kamal Haasan', role: 'Actor' }, // ✅ Correct ID from https://www.themoviedb.org/person/93193-kamal-haasan
  { id: '148360', name: 'Ajith Kumar', role: 'Actor' }, // ✅ Correct ID from https://www.themoviedb.org/person/148360-ajith-kumar
  { id: '124111', name: 'Mammootty', role: 'Actor' }, // ✅ Correct ID from https://www.themoviedb.org/person/124111-mammootty
  { id: '82732', name: 'Mohanlal', role: 'Actor' }, // ✅ Correct ID from https://www.themoviedb.org/person/82732-mohanlal
  { id: '1115225', name: 'Dulquer Salmaan', role: 'Actor' }, // ✅ Correct ID from https://www.themoviedb.org/person/1115225-dulquer-salmaan
  { id: '1293681', name: 'Yash', role: 'Actor' }, // ✅ Correct ID from https://www.themoviedb.org/person/1293681-yash
  { id: '389604', name: 'Sudeep', role: 'Actor' }, // ✅ Correct ID from https://www.themoviedb.org/person/389604-sudeep
  { id: '1752058', name: 'Rishab Shetty', role: 'Actor' }, // ✅ Correct ID from https://www.themoviedb.org/person/1752058-rishab-shetty
  { id: '35742', name: 'Unknown', role: 'Actor' }, // ID from https://www.themoviedb.org/person/35742 (name will be fetched from TMDB)
  { id: '85034', name: 'Unknown', role: 'Actor' }, // ID from https://www.themoviedb.org/person/85034 (name will be fetched from TMDB)
  { id: '224223', name: 'Ranveer Singh', role: 'Actor' }, // ✅ Correct ID from https://www.themoviedb.org/person/224223-ranveer-singh
  { id: '1469935', name: 'Vicky Kaushal', role: 'Actor' }, // ✅ Correct ID from https://www.themoviedb.org/person/1469935-vicky-kaushal
];

interface SeedResult {
  success: boolean;
  creator: Creator | null;
  error?: string;
}

/**
 * Search for a person on TMDB by name
 * Helper function to find correct Person IDs
 */
async function searchTMDBPerson(name: string): Promise<Array<{ id: number; name: string; known_for_department?: string }>> {
  try {
    if (!TMDB_API_KEY) {
      console.error('TMDB API key is not configured');
      return [];
    }

    const response = await axios.get(`${TMDB_BASE_URL}/search/person`, {
      params: {
        api_key: TMDB_API_KEY,
        query: name,
      },
      timeout: 10000,
    });

    return response.data.results || [];
  } catch (error: any) {
    console.error(`Error searching TMDB for "${name}":`, error.message);
    return [];
  }
}

/**
 * Fetch person data from TMDB API
 */
async function fetchTMDBPerson(id: string): Promise<{ name: string; profile_path: string | null } | null> {
  try {
    console.log(`📡 Fetching TMDB data for ID: ${id}...`);
    
    if (!TMDB_API_KEY) {
      throw new Error('TMDB API key is not configured. Set NEXT_PUBLIC_TMDB_API_KEY in .env.local');
    }

    const response = await axios.get(`${TMDB_BASE_URL}/person/${id}`, {
      params: {
        api_key: TMDB_API_KEY,
      },
      timeout: 10000, // 10 second timeout
    });

    console.log(`✅ TMDB response received for ID: ${id}`);
    
    return {
      name: response.data.name,
      profile_path: response.data.profile_path || null,
    };
  } catch (error: any) {
    console.error(`❌ Error fetching TMDB data for ID ${id}:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data?.status_message || 'Unknown error'}`);
    }
    return null;
  }
}

/**
 * Seed a single creator
 */
async function seedCreator(
  director: { id: string; name: string; role: string },
  firestoreDb: any // Firestore instance
): Promise<SeedResult> {
  try {
    console.log(`\n📡 Fetching TMDB data for ${director.name} (ID: ${director.id})...`);
    
    // Fetch from TMDB
    const tmdbData = await fetchTMDBPerson(director.id);
    
    if (!tmdbData) {
      return {
        success: false,
        creator: null,
        error: 'Failed to fetch from TMDB',
      };
    }

    console.log(`✅ TMDB response received for ${director.name}`);
    console.log(`📸 Profile path: ${tmdbData.profile_path || 'NOT FOUND'}`);
    
    // Verify the name matches (case-insensitive partial match)
    const fetchedNameLower = tmdbData.name.toLowerCase();
    const expectedNameLower = director.name.toLowerCase();
    
    // Check for name match - allow partial matches for common name variations
    const nameMatches = fetchedNameLower === expectedNameLower ||
                        fetchedNameLower.includes(expectedNameLower) || 
                        expectedNameLower.includes(fetchedNameLower) ||
                        // Handle cases like "S. S. Rajamouli" vs "SS Rajamouli"
                        fetchedNameLower.replace(/\s+/g, ' ').replace(/\./g, '').includes(expectedNameLower.replace(/\s+/g, ' ').replace(/\./g, ''));
    
    if (!nameMatches) {
      console.warn(`\n⚠️  ⚠️  ⚠️  WARNING: NAME MISMATCH! ⚠️  ⚠️  ⚠️`);
      console.warn(`   Expected: "${director.name}"`);
      console.warn(`   Got from TMDB: "${tmdbData.name}"`);
      console.warn(`   TMDB ID ${director.id} appears to be incorrect!`);
      console.warn(`   Searching for correct ID...`);
      
      // Try to find the correct person
      const searchResults = await searchTMDBPerson(director.name);
      if (searchResults.length > 0) {
        console.warn(`   Found ${searchResults.length} possible matches:`);
        searchResults.slice(0, 5).forEach((result, idx) => {
          console.warn(`   ${idx + 1}. "${result.name}" (ID: ${result.id}, Department: ${result.known_for_department || 'N/A'})`);
        });
        console.warn(`   💡 Suggested correct ID: ${searchResults[0].id}`);
      } else {
        console.warn(`   No results found. Please search manually:`);
        console.warn(`   Visit: https://www.themoviedb.org/search?query=${encodeURIComponent(director.name)}\n`);
      }
    }
    
    // Generate slug
    const slug = generateSlug(tmdbData.name);
    console.log(`🔗 Generated slug: ${slug}`);
    
    // Prepare creator data
    const creatorData: Creator = {
      id: director.id,
      name: tmdbData.name, // Use name from TMDB (might be different)
      role: director.role,
      slug,
      profilePath: tmdbData.profile_path || '', // Store empty string if no profile path
      followersCount: 0,
      lastUpdated: new Date(),
    };
    
    // Store in Firestore (using passed Firestore instance)
    if (!firestoreDb) {
      throw new Error('Firebase Admin DB is not initialized. Check environment variables.');
    }
    
    const docRef = firestoreDb.collection('creators').doc(director.id);
    await docRef.set(creatorData);
    
    console.log(`💾 Stored ${creatorData.name} in Firestore (ID: ${director.id})`);
    
    return {
      success: true,
      creator: creatorData,
    };
  } catch (error: any) {
    console.error(`❌ Error seeding ${director.name}:`, error.message);
    return {
      success: false,
      creator: null,
      error: error.message,
    };
  }
}

/**
 * Main seeding function
 */
async function seedCreators() {
  console.log('🚀 Starting seed script...\n');
  
  // Check environment variables
  const missingVars: string[] = [];
  
  if (!TMDB_API_KEY) {
    missingVars.push('NEXT_PUBLIC_TMDB_API_KEY');
  }
  
  if (!process.env.FIREBASE_PROJECT_ID) {
    missingVars.push('FIREBASE_PROJECT_ID');
  }
  
  if (!process.env.FIREBASE_CLIENT_EMAIL) {
    missingVars.push('FIREBASE_CLIENT_EMAIL');
  }
  
  if (!process.env.FIREBASE_PRIVATE_KEY) {
    missingVars.push('FIREBASE_PRIVATE_KEY');
  }
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n   Please ensure these are set in your .env.local file');
    console.error('   Location: /home/sogalabhi/websites/indian-movie-db/.env.local\n');
    process.exit(1);
  }
  
  // Dynamically import Firebase Admin after env vars are loaded
  const { adminDb: firestoreDb } = await import('../lib/firebase/server');
  
  if (!firestoreDb) {
    console.error('❌ Firebase Admin DB is not initialized!');
    console.error('   This should not happen if env vars are set correctly.');
    console.error('   Please check your Firebase Admin SDK configuration.');
    process.exit(1);
  }
  
  console.log('✅ Environment variables loaded successfully');
  console.log(`   TMDB API Key: ${TMDB_API_KEY ? '✓ Set' : '✗ Missing'}`);
  console.log(`   Firebase Project: ${process.env.FIREBASE_PROJECT_ID || '✗ Missing'}`);
  console.log(`   Firebase Client Email: ${process.env.FIREBASE_CLIENT_EMAIL ? '✓ Set' : '✗ Missing'}`);
  console.log(`   Firebase Private Key: ${process.env.FIREBASE_PRIVATE_KEY ? '✓ Set' : '✗ Missing'}\n`);
  
  const results: SeedResult[] = [];
  
  // Combine directors and actors
  // const ALL_CREATORS = [...DIRECTORS, ...ACTORS];
  
  // Seed each creator
  for (const creator of ACTORS) {
    const result = await seedCreator(creator, firestoreDb);
    results.push(result);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ Seed complete!');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Successfully seeded: ${successful.length} creators`);
  console.log(`   ❌ Failed: ${failed.length} creators`);
  
  if (successful.length > 0) {
    console.log(`\n✅ Successfully seeded creators:`);
    successful.forEach((result, index) => {
      if (result.creator) {
        console.log(`   ${index + 1}. ${result.creator.name} (ID: ${result.creator.id}, Slug: ${result.creator.slug})`);
      }
    });
  }
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed to seed:`);
    failed.forEach((result, index) => {
      const creator = ACTORS[results.indexOf(result)];
      console.log(`   ${index + 1}. ${creator.name} (ID: ${creator.id})`);
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    });
  }
  
  console.log('\n🎉 Seed script finished!\n');
}

// Run the script
if (require.main === module) {
  seedCreators()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

export { seedCreators };

