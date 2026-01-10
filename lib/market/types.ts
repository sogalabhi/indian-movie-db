/**
 * TypeScript types for the Movie Stock Trading System
 */

export type StockStatus = 'UPCOMING' | 'ACTIVE' | 'DELISTED';

export interface MarketUser {
  id: string; // UUID from auth.users
  username: string | null;
  avatar_url: string | null;
  coins: number;
  net_worth: number;
  created_at: string;
  updated_at: string;
}

export interface MovieStock {
  id: string; // TMDB ID as string
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  status: StockStatus;
  current_price: number;
  price_change_24h: number;
  hype_index: number; // 0-100
  box_office_index: number; // 0-100
  wom_index: number; // 0-100 (word of mouth)
  last_updated: string;
  created_at: string;
}

export interface Portfolio {
  id: string;
  user_id: string;
  movie_id: string;
  quantity: number;
  avg_buy_price: number;
  created_at: string;
  updated_at: string;
}

export interface MarketHistory {
  id: number;
  movie_id: string;
  price: number;
  recorded_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  movie_id: string;
  type: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  total_cost: number;
  timestamp: string;
}

export interface BuyStockResponse {
  success: boolean;
  message?: string;
  new_balance?: number;
  total_cost?: number;
}

export interface SellStockResponse {
  success: boolean;
  message?: string;
  new_balance?: number;
  total_proceeds?: number;
  profit_loss?: number;
}

export interface ChartDataPoint {
  price: number;
  recorded_at: string;
}

