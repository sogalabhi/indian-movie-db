-- ============================================
-- Market History Pruning Function
-- ============================================
-- Auto-prune market_history older than 7 days to prevent database bloat
-- This keeps the database size under the free tier limit (500MB)

-- Create function to prune old history data
CREATE OR REPLACE FUNCTION prune_market_history()
RETURNS void AS $$
BEGIN
  DELETE FROM market_history 
  WHERE recorded_at < NOW() - INTERVAL '7 days';
  
  -- Log the operation (optional, for monitoring)
  RAISE NOTICE 'Pruned market_history: Deleted records older than 7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: To schedule this function, you can either:
-- 1. Use pg_cron extension (if available on your Supabase plan):
--    SELECT cron.schedule('prune-market-history', '0 0 * * *', 'SELECT prune_market_history();');
--
-- 2. Use Vercel Cron Jobs (free tier supports cron):
--    Create a cron job that calls: POST /api/market/prune-history
--    Schedule: 0 0 * * * (daily at midnight UTC)

