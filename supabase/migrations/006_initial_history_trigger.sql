-- ============================================
-- Trigger to create initial market_history entry
-- ============================================
-- This ensures that when a stock is created or updated, it has history data for charts

-- Function to insert initial history when stock is created/updated
CREATE OR REPLACE FUNCTION handle_stock_price_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert history point when price is updated
  -- Only insert if this is a price change (not just metadata update)
  IF OLD.current_price IS DISTINCT FROM NEW.current_price THEN
    INSERT INTO public.market_history (movie_id, price, recorded_at)
    VALUES (NEW.id, NEW.current_price, NEW.last_updated)
    ON CONFLICT DO NOTHING; -- Prevent duplicates
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_stock_price_update ON public.movie_stocks;

-- Create trigger to auto-insert history on price update
CREATE TRIGGER on_stock_price_update
  AFTER UPDATE OF current_price ON public.movie_stocks
  FOR EACH ROW
  WHEN (OLD.current_price IS DISTINCT FROM NEW.current_price)
  EXECUTE FUNCTION handle_stock_price_update();

-- Also create initial history for new stocks
CREATE OR REPLACE FUNCTION handle_new_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert initial history point when stock is created
  INSERT INTO public.market_history (movie_id, price, recorded_at)
  VALUES (NEW.id, NEW.current_price, COALESCE(NEW.last_updated, NOW()))
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_new_stock ON public.movie_stocks;

-- Create trigger to auto-insert history on stock creation
CREATE TRIGGER on_new_stock
  AFTER INSERT ON public.movie_stocks
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_stock();

