-- ============================================
-- Movie Stock Trading System - Database Schema
-- ============================================
-- Run this SQL in Supabase SQL Editor
-- This creates all tables, indexes, functions, and RLS policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for stock status
CREATE TYPE stock_status AS ENUM ('UPCOMING', 'ACTIVE', 'DELISTED');

-- ============================================
-- 1. Market Users Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.market_users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  avatar_url TEXT,
  coins NUMERIC DEFAULT 20000 NOT NULL,
  net_worth NUMERIC DEFAULT 20000 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. Movie Stocks Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.movie_stocks (
  id TEXT PRIMARY KEY, -- TMDB ID as string
  tmdb_id INTEGER UNIQUE NOT NULL,
  title TEXT NOT NULL,
  poster_path TEXT,
  release_date DATE,
  status stock_status DEFAULT 'UPCOMING',
  current_price NUMERIC DEFAULT 100 NOT NULL,
  price_change_24h NUMERIC DEFAULT 0,
  hype_index NUMERIC DEFAULT 0, -- 0-100
  box_office_index NUMERIC DEFAULT 0, -- 0-100
  wom_index NUMERIC DEFAULT 0, -- 0-100 (word of mouth)
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. Portfolios Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.market_users(id) ON DELETE CASCADE NOT NULL,
  movie_id TEXT REFERENCES public.movie_stocks(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 0 NOT NULL,
  avg_buy_price NUMERIC DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

-- ============================================
-- 4. Market History Table (for charts)
-- ============================================
CREATE TABLE IF NOT EXISTS public.market_history (
  id BIGSERIAL PRIMARY KEY,
  movie_id TEXT REFERENCES public.movie_stocks(id) ON DELETE CASCADE NOT NULL,
  price NUMERIC NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. Transactions Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.market_users(id) ON DELETE CASCADE NOT NULL,
  movie_id TEXT REFERENCES public.movie_stocks(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('BUY', 'SELL')),
  price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL,
  total_cost NUMERIC NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON public.portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_movie_id ON public.portfolios(movie_id);
CREATE INDEX IF NOT EXISTS idx_market_history_movie_id ON public.market_history(movie_id);
CREATE INDEX IF NOT EXISTS idx_market_history_recorded_at ON public.market_history(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_movie_id ON public.transactions(movie_id);
CREATE INDEX IF NOT EXISTS idx_movie_stocks_status ON public.movie_stocks(status);
CREATE INDEX IF NOT EXISTS idx_market_users_net_worth ON public.market_users(net_worth DESC);

-- ============================================
-- Helper Functions
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_market_users_updated_at ON public.market_users;
CREATE TRIGGER update_market_users_updated_at 
  BEFORE UPDATE ON public.market_users
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_portfolios_updated_at ON public.portfolios;
CREATE TRIGGER update_portfolios_updated_at 
  BEFORE UPDATE ON public.portfolios
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Chart Data Optimization Function
-- ============================================
-- Function to get chart data (downsamples for performance)
CREATE OR REPLACE FUNCTION get_chart_data(
  target_movie_id TEXT,
  timeframe_hours INTEGER DEFAULT 168 -- 7 days default
)
RETURNS TABLE (
  price NUMERIC,
  recorded_at TIMESTAMPTZ
) AS $$
BEGIN
  IF timeframe_hours <= 168 THEN -- 7 days or less: return all data
    RETURN QUERY
    SELECT mh.price, mh.recorded_at
    FROM market_history mh
    WHERE mh.movie_id = target_movie_id
      AND mh.recorded_at > NOW() - (timeframe_hours || ' hours')::INTERVAL
    ORDER BY mh.recorded_at ASC;
  ELSE -- More than 7 days: downsample to 1 point per day
    RETURN QUERY
    SELECT 
      AVG(mh.price) as price,
      date_trunc('day', mh.recorded_at) as recorded_at
    FROM market_history mh
    WHERE mh.movie_id = target_movie_id
      AND mh.recorded_at > NOW() - (timeframe_hours || ' hours')::INTERVAL
    GROUP BY date_trunc('day', mh.recorded_at)
    ORDER BY recorded_at ASC;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Net Worth Calculation Function
-- ============================================
CREATE OR REPLACE FUNCTION update_user_net_worth(target_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  user_coins NUMERIC;
  portfolio_value NUMERIC;
  calculated_net_worth NUMERIC;
BEGIN
  -- Get user's coins
  SELECT coins INTO user_coins FROM market_users WHERE id = target_user_id;
  
  -- Calculate portfolio value
  SELECT COALESCE(SUM(p.quantity * ms.current_price), 0) INTO portfolio_value
  FROM portfolios p
  JOIN movie_stocks ms ON p.movie_id = ms.id
  WHERE p.user_id = target_user_id;
  
  -- Calculate net worth
  calculated_net_worth := user_coins + portfolio_value;
  
  -- Update user's net worth
  UPDATE market_users 
  SET net_worth = calculated_net_worth
  WHERE id = target_user_id;
  
  RETURN calculated_net_worth;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Transaction RPC Functions (with FOR UPDATE locks)
-- ============================================

-- Buy Stock Function
CREATE OR REPLACE FUNCTION buy_stock(
  target_movie_id TEXT,
  qty INTEGER
)
RETURNS JSON AS $$
DECLARE
  user_balance NUMERIC;
  stock_price NUMERIC;
  total_cost NUMERIC;
  current_qty INTEGER;
  new_avg_price NUMERIC;
  stock_status stock_status;
BEGIN
  -- 1. Get current stock price and status
  SELECT current_price, status INTO stock_price, stock_status 
  FROM movie_stocks WHERE id = target_movie_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Stock not found');
  END IF;
  
  IF stock_status != 'ACTIVE' THEN
    RETURN json_build_object('success', false, 'message', 'Stock is not active for trading');
  END IF;
  
  -- 2. Get user's coin balance AND LOCK THE ROW (CRITICAL: Prevents race conditions)
  SELECT coins INTO user_balance 
  FROM market_users 
  WHERE id = auth.uid()
  FOR UPDATE; -- 🔒 Locks row until transaction completes
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'User not found');
  END IF;
  
  -- 3. Calculate Cost
  total_cost := stock_price * qty;

  -- 4. VALIDATION: Can they afford it?
  IF user_balance < total_cost THEN
    RETURN json_build_object('success', false, 'message', 'Insufficient funds');
  END IF;

  -- 5. EXECUTE: Deduct Coins
  UPDATE market_users 
  SET coins = coins - total_cost 
  WHERE id = auth.uid();

  -- 6. EXECUTE: Update Portfolio (with row lock)
  SELECT quantity INTO current_qty 
  FROM portfolios 
  WHERE user_id = auth.uid() AND movie_id = target_movie_id
  FOR UPDATE; -- 🔒 Lock portfolio row

  IF FOUND THEN
    -- Update existing holding (Weighted Average Price)
    SELECT avg_buy_price INTO new_avg_price
    FROM portfolios
    WHERE user_id = auth.uid() AND movie_id = target_movie_id;
    
    new_avg_price := ((current_qty * new_avg_price) + (qty * stock_price)) / (current_qty + qty);
    UPDATE portfolios 
    SET quantity = quantity + qty,
        avg_buy_price = new_avg_price,
        updated_at = NOW()
    WHERE user_id = auth.uid() AND movie_id = target_movie_id;
  ELSE
    -- New purchase
    INSERT INTO portfolios (user_id, movie_id, quantity, avg_buy_price)
    VALUES (auth.uid(), target_movie_id, qty, stock_price);
  END IF;

  -- 7. Log Transaction
  INSERT INTO transactions (user_id, movie_id, type, price, quantity, total_cost)
  VALUES (auth.uid(), target_movie_id, 'BUY', stock_price, qty, total_cost);

  -- 8. Update net worth
  PERFORM update_user_net_worth(auth.uid());

  RETURN json_build_object(
    'success', true, 
    'new_balance', user_balance - total_cost,
    'total_cost', total_cost
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sell Stock Function
CREATE OR REPLACE FUNCTION sell_stock(
  target_movie_id TEXT,
  qty INTEGER
)
RETURNS JSON AS $$
DECLARE
  user_balance NUMERIC;
  stock_price NUMERIC;
  total_proceeds NUMERIC;
  current_qty INTEGER;
  current_avg_price NUMERIC;
BEGIN
  -- 1. Get current stock price
  SELECT current_price INTO stock_price 
  FROM movie_stocks WHERE id = target_movie_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Stock not found');
  END IF;
  
  -- 2. Check portfolio quantity AND LOCK ROWS
  SELECT quantity, avg_buy_price INTO current_qty, current_avg_price
  FROM portfolios 
  WHERE user_id = auth.uid() AND movie_id = target_movie_id
  FOR UPDATE; -- 🔒 Lock portfolio row
  
  IF NOT FOUND OR current_qty < qty THEN
    RETURN json_build_object('success', false, 'message', 'Insufficient shares');
  END IF;
  
  -- 3. Calculate Proceeds
  total_proceeds := stock_price * qty;

  -- 4. EXECUTE: Add Coins (user row already locked by RPC transaction context)
  UPDATE market_users 
  SET coins = coins + total_proceeds 
  WHERE id = auth.uid();

  -- 5. EXECUTE: Update Portfolio
  IF current_qty = qty THEN
    -- Delete if selling all
    DELETE FROM portfolios 
    WHERE user_id = auth.uid() AND movie_id = target_movie_id;
  ELSE
    -- Reduce quantity
    UPDATE portfolios 
    SET quantity = quantity - qty,
        updated_at = NOW()
    WHERE user_id = auth.uid() AND movie_id = target_movie_id;
  END IF;

  -- 6. Log Transaction
  INSERT INTO transactions (user_id, movie_id, type, price, quantity, total_cost)
  VALUES (auth.uid(), target_movie_id, 'SELL', stock_price, qty, total_proceeds);

  -- 7. Update net worth
  PERFORM update_user_net_worth(auth.uid());

  RETURN json_build_object(
    'success', true, 
    'new_balance', (SELECT coins FROM market_users WHERE id = auth.uid())::NUMERIC,
    'total_proceeds', total_proceeds,
    'profit_loss', (stock_price - current_avg_price) * qty
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- User Initialization Trigger
-- ============================================
-- Auto-create market_user when auth user is created
CREATE OR REPLACE FUNCTION handle_new_market_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.market_users (id, username, avatar_url, coins, net_worth)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email, 'Anonymous'),
    NEW.raw_user_meta_data->>'avatar_url',
    20000,
    20000
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent errors if user already exists
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_market ON auth.users;
CREATE TRIGGER on_auth_user_created_market
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_market_user();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.market_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "market_users_select_all" ON public.market_users;
DROP POLICY IF EXISTS "market_users_update_own" ON public.market_users;
DROP POLICY IF EXISTS "movie_stocks_select_all" ON public.movie_stocks;
DROP POLICY IF EXISTS "portfolios_select_own" ON public.portfolios;
DROP POLICY IF EXISTS "portfolios_insert_own" ON public.portfolios;
DROP POLICY IF EXISTS "portfolios_update_own" ON public.portfolios;
DROP POLICY IF EXISTS "portfolios_delete_own" ON public.portfolios;
DROP POLICY IF EXISTS "market_history_select_all" ON public.market_history;
DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert_own" ON public.transactions;

-- Market Users: Read all, update own
CREATE POLICY "market_users_select_all" ON public.market_users
    FOR SELECT USING (true);

CREATE POLICY "market_users_update_own" ON public.market_users
    FOR UPDATE USING (auth.uid() = id);

-- Movie Stocks: Read all, write only via service role
CREATE POLICY "movie_stocks_select_all" ON public.movie_stocks
    FOR SELECT USING (true);

-- Portfolios: Read own, write own
CREATE POLICY "portfolios_select_own" ON public.portfolios
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "portfolios_insert_own" ON public.portfolios
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "portfolios_update_own" ON public.portfolios
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "portfolios_delete_own" ON public.portfolios
    FOR DELETE USING (auth.uid() = user_id);

-- Market History: Read all, write only via service role
CREATE POLICY "market_history_select_all" ON public.market_history
    FOR SELECT USING (true);

-- Transactions: Read own, insert own
CREATE POLICY "transactions_select_own" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "transactions_insert_own" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

