/**
 * Check if setup is complete
 * 
 * Usage: npx tsx scripts/check-setup.ts
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
import { createServerClient } from '@/lib/supabase/server';

async function checkSetup() {
  console.log('🔍 Checking setup...\n');

  // Check environment variables
  console.log('1. Checking environment variables...');
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  let envOk = true;
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`   ✅ ${envVar} is set`);
    } else {
      console.log(`   ❌ ${envVar} is missing`);
      envOk = false;
    }
  }

  if (!envOk) {
    console.log('\n⚠️  Please set missing environment variables in .env.local');
    return;
  }

  // Check Supabase connection
  console.log('\n2. Checking Supabase connection...');
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase.from('movie_stocks').select('count').limit(1);
    
    if (error) {
      console.log(`   ❌ Connection failed: ${error.message}`);
      console.log('   💡 Make sure you\'ve run the SQL migrations in Supabase');
      return;
    }
    console.log('   ✅ Connected to Supabase');
  } catch (err) {
    console.log(`   ❌ Connection error: ${err}`);
    return;
  }

  // Check tables exist
  console.log('\n3. Checking database tables...');
  const tables = [
    'market_users',
    'movie_stocks',
    'portfolios',
    'market_history',
    'transactions',
  ];

  const supabase = createServerClient();
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`   ❌ Table "${table}" not found or not accessible`);
        console.log(`      Error: ${error.message}`);
      } else {
        console.log(`   ✅ Table "${table}" exists`);
      }
    } catch (err) {
      console.log(`   ❌ Error checking "${table}": ${err}`);
    }
  }

  // Check RPC functions
  console.log('\n4. Checking RPC functions...');
  const functions = [
    'buy_stock_with_user',
    'sell_stock_with_user',
    'update_user_net_worth',
    'get_chart_data',
  ];

  for (const func of functions) {
    try {
      // Try calling with dummy params to see if function exists
      const { error } = await supabase.rpc(func, {});
      if (error && error.message.includes('function') && error.message.includes('does not exist')) {
        console.log(`   ❌ Function "${func}" not found`);
        console.log('   💡 Make sure you\'ve run migration 002_market_rpc_with_user_id.sql');
      } else {
        // Function exists (we expect an error for wrong params, but not "does not exist")
        console.log(`   ✅ Function "${func}" exists`);
      }
    } catch (err) {
      // If we can't even call it, assume it doesn't exist
      console.log(`   ❌ Function "${func}" check failed`);
    }
  }

  // Check stock count
  console.log('\n5. Checking movie stocks...');
  try {
    const { data, error } = await supabase
      .from('movie_stocks')
      .select('id, title, status', { count: 'exact' });
    
    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
    } else {
      const count = data?.length || 0;
      if (count === 0) {
        console.log('   ⚠️  No movie stocks found');
        console.log('   💡 Run: npx tsx scripts/seed-stocks.ts');
      } else {
        console.log(`   ✅ Found ${count} movie stock(s)`);
        if (data && data.length > 0) {
          console.log('   Sample stocks:');
          data.slice(0, 3).forEach((stock: { title: string; status: string }) => {
            console.log(`      - ${stock.title} (${stock.status})`);
          });
        }
      }
    }
  } catch (err) {
    console.log(`   ❌ Error: ${err}`);
  }

  console.log('\n✨ Setup check complete!');
}

// Run if called directly
if (require.main === module) {
  checkSetup().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export default checkSetup;

