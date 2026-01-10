-- ============================================
-- Alternative RPC Functions with user_id parameter
-- ============================================
-- These functions accept user_id as a parameter instead of using auth.uid()
-- Use these if you're not using Supabase Auth yet (e.g., using Firebase Auth)
-- 
-- NOTE: These functions use SECURITY DEFINER and should only be called
-- from authenticated API routes that verify the user_id matches the session

-- Buy Stock Function (with user_id parameter)
CREATE OR REPLACE FUNCTION buy_stock_with_user(
  target_user_id UUID,
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
  WHERE id = target_user_id
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
  WHERE id = target_user_id;

  -- 6. EXECUTE: Update Portfolio (with row lock)
  SELECT quantity INTO current_qty 
  FROM portfolios 
  WHERE user_id = target_user_id AND movie_id = target_movie_id
  FOR UPDATE; -- 🔒 Lock portfolio row

  IF FOUND THEN
    -- Update existing holding (Weighted Average Price)
    SELECT avg_buy_price INTO new_avg_price
    FROM portfolios
    WHERE user_id = target_user_id AND movie_id = target_movie_id;
    
    new_avg_price := ((current_qty * new_avg_price) + (qty * stock_price)) / (current_qty + qty);
    UPDATE portfolios 
    SET quantity = quantity + qty,
        avg_buy_price = new_avg_price,
        updated_at = NOW()
    WHERE user_id = target_user_id AND movie_id = target_movie_id;
  ELSE
    -- New purchase
    INSERT INTO portfolios (user_id, movie_id, quantity, avg_buy_price)
    VALUES (target_user_id, target_movie_id, qty, stock_price);
  END IF;

  -- 7. Log Transaction
  INSERT INTO transactions (user_id, movie_id, type, price, quantity, total_cost)
  VALUES (target_user_id, target_movie_id, 'BUY', stock_price, qty, total_cost);

  -- 8. Update net worth
  PERFORM update_user_net_worth(target_user_id);

  RETURN json_build_object(
    'success', true, 
    'new_balance', user_balance - total_cost,
    'total_cost', total_cost
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sell Stock Function (with user_id parameter)
CREATE OR REPLACE FUNCTION sell_stock_with_user(
  target_user_id UUID,
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
  WHERE user_id = target_user_id AND movie_id = target_movie_id
  FOR UPDATE; -- 🔒 Lock portfolio row
  
  IF NOT FOUND OR current_qty < qty THEN
    RETURN json_build_object('success', false, 'message', 'Insufficient shares');
  END IF;
  
  -- 3. Calculate Proceeds
  total_proceeds := stock_price * qty;

  -- 4. EXECUTE: Add Coins
  UPDATE market_users 
  SET coins = coins + total_proceeds 
  WHERE id = target_user_id;

  -- 5. EXECUTE: Update Portfolio
  IF current_qty = qty THEN
    -- Delete if selling all
    DELETE FROM portfolios 
    WHERE user_id = target_user_id AND movie_id = target_movie_id;
  ELSE
    -- Reduce quantity
    UPDATE portfolios 
    SET quantity = quantity - qty,
        updated_at = NOW()
    WHERE user_id = target_user_id AND movie_id = target_movie_id;
  END IF;

  -- 6. Log Transaction
  INSERT INTO transactions (user_id, movie_id, type, price, quantity, total_cost)
  VALUES (target_user_id, target_movie_id, 'SELL', stock_price, qty, total_proceeds);

  -- 7. Update net worth
  PERFORM update_user_net_worth(target_user_id);

  RETURN json_build_object(
    'success', true, 
    'new_balance', (SELECT coins FROM market_users WHERE id = target_user_id)::NUMERIC,
    'total_proceeds', total_proceeds,
    'profit_loss', (stock_price - current_avg_price) * qty
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

