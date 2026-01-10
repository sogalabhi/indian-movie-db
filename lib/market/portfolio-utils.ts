/**
 * Portfolio utility functions
 */

import { createServerClient } from '@/lib/supabase/server';
import type { Portfolio, MovieStock, MarketUser } from './types';

/**
 * Fetch user's portfolio with movie details
 */
export async function getUserPortfolio(userId: string): Promise<Portfolio[]> {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching portfolio:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Fetch user's portfolio with movie stock details
 */
export async function getUserPortfolioWithStocks(userId: string) {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('portfolios')
    .select(`
      *,
      movie_stocks (
        id,
        title,
        poster_path,
        current_price,
        price_change_24h,
        status
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching portfolio with stocks:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Calculate total portfolio value
 */
export async function calculatePortfolioValue(userId: string): Promise<number> {
  const portfolios = await getUserPortfolioWithStocks(userId);
  
  return portfolios.reduce((total, portfolio) => {
    const stock = portfolio.movie_stocks as MovieStock;
    if (stock && stock.current_price) {
      return total + (portfolio.quantity * stock.current_price);
    }
    return total;
  }, 0);
}

/**
 * Get user's market data (coins, net worth, portfolio)
 */
export async function getUserMarketData(userId: string) {
  const supabase = createServerClient();
  
  // Get user data
  const { data: userData, error: userError } = await supabase
    .from('market_users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (userError) {
    console.error('Error fetching user market data:', userError);
    throw userError;
  }
  
  // Get portfolio
  const portfolio = await getUserPortfolioWithStocks(userId);
  
  // Calculate portfolio value
  const portfolioValue = await calculatePortfolioValue(userId);
  
  return {
    user: userData as MarketUser,
    portfolio,
    portfolioValue,
  };
}

/**
 * Format profit/loss for display
 */
export function formatProfitLoss(
  currentPrice: number,
  avgBuyPrice: number,
  quantity: number
): {
  absolute: number;
  percentage: number;
  isProfit: boolean;
} {
  const absolute = (currentPrice - avgBuyPrice) * quantity;
  const percentage = avgBuyPrice > 0 
    ? ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100 
    : 0;
  const isProfit = absolute >= 0;
  
  return {
    absolute: Math.abs(absolute),
    percentage: Math.abs(percentage),
    isProfit,
  };
}

