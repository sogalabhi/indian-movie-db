/**
 * Seed initial movie stocks into Supabase
 * 
 * Usage: npx tsx scripts/seed-stocks.ts
 */

// Load environment variables FIRST, before any other imports
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Try .env.local first, then .env
const envLocalPath = resolve(process.cwd(), '.env.local');
const envPath = resolve(process.cwd(), '.env');

if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
} else if (existsSync(envPath)) {
  config({ path: envPath });
} else {
  config(); // Try default .env
}

// Now import after env vars are loaded
import { createServiceClient } from '@/lib/supabase/server';

// Sample movie stocks to seed
// You can add more movies here or fetch from TMDB API
const stocks = [
  {
    id: '550',
    tmdb_id: 550,
    title: 'Fight Club',
    status: 'ACTIVE' as const,
    current_price: 100,
    poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    release_date: '1999-10-15',
  },
  {
    id: '278',
    tmdb_id: 278,
    title: 'The Shawshank Redemption',
    status: 'ACTIVE' as const,
    current_price: 150,
    poster_path: '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
    release_date: '1994-09-23',
  },
  {
    id: '238',
    tmdb_id: 238,
    title: 'The Godfather',
    status: 'ACTIVE' as const,
    current_price: 200,
    poster_path: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
    release_date: '1972-03-24',
  },
  {
    id: '424',
    tmdb_id: 424,
    title: 'Schindler\'s List',
    status: 'ACTIVE' as const,
    current_price: 180,
    poster_path: '/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg',
    release_date: '1993-12-15',
  },
  {
    id: '240',
    tmdb_id: 240,
    title: 'The Godfather Part II',
    status: 'ACTIVE' as const,
    current_price: 175,
    poster_path: '/hek3koDUyRQk7FIhPXsa6mT2Zc3.jpg',
    release_date: '1974-12-20',
  },
];

async function seed() {
  console.log('🌱 Starting to seed movie stocks...\n');

  // Use service client to bypass RLS for seeding
  const supabase = createServiceClient();
  
  let successCount = 0;
  let errorCount = 0;

  for (const stock of stocks) {
    try {
      const { error } = await supabase
        .from('movie_stocks')
        .upsert(stock, { onConflict: 'id' });
      
      if (error) {
        console.error(`❌ Error seeding "${stock.title}":`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Seeded: ${stock.title} (₹${stock.current_price})`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Unexpected error seeding "${stock.title}":`, err);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`\n✨ Done! Visit http://localhost:3000/market to see your stocks.`);
}

// Run if called directly
if (require.main === module) {
  seed().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export default seed;

