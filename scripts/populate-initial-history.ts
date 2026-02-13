/**
 * Script to populate initial market_history for existing stocks
 * Run with: npx tsx scripts/populate-initial-history.ts
 */

import { createServerClient } from '../lib/supabase/server';

async function populateInitialHistory() {
  const supabase = createServerClient();

  console.log('📊 Fetching all movie stocks...');
  
  // Get all stocks
  const { data: stocks, error: stocksError } = await supabase
    .from('movie_stocks')
    .select('id, current_price, last_updated');

  if (stocksError) {
    console.error('❌ Error fetching stocks:', stocksError);
    process.exit(1);
  }

  if (!stocks || stocks.length === 0) {
    console.log('ℹ️  No stocks found');
    return;
  }

  console.log(`✅ Found ${stocks.length} stocks`);

  // Check which stocks already have history
  const { data: existingHistory, error: historyError } = await supabase
    .from('market_history')
    .select('movie_id');

  const stocksWithHistory = new Set(
    existingHistory?.map((h: any) => h.movie_id) || []
  );

  console.log(`📈 Found ${stocksWithHistory.size} stocks with existing history`);

  // Insert initial history for stocks without history
  let inserted = 0;
  let skipped = 0;

  for (const stock of stocks) {
    if (stocksWithHistory.has(stock.id)) {
      skipped++;
      continue;
    }

    const { error: insertError } = await supabase
      .from('market_history')
      .insert({
        movie_id: stock.id,
        price: stock.current_price,
        recorded_at: stock.last_updated || new Date().toISOString(),
      });

    if (insertError) {
      console.error(`❌ Error inserting history for ${stock.id}:`, insertError);
    } else {
      inserted++;
      console.log(`✅ Added history for ${stock.id} (price: ${stock.current_price})`);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Inserted: ${inserted}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   📈 Total: ${stocks.length}`);
}

populateInitialHistory()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

