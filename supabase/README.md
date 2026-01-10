# Supabase Database Setup

This directory contains SQL migration files for the Movie Stock Trading System.

## Setup Instructions

### 1. Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### 2. Set Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Run SQL Migration

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Open `supabase/migrations/001_market_schema.sql`
4. Copy and paste the entire SQL file
5. Click "Run" to execute

This will create:
- All tables (market_users, movie_stocks, portfolios, market_history, transactions)
- All indexes for performance
- RPC functions (buy_stock, sell_stock, update_user_net_worth, get_chart_data)
- Row Level Security (RLS) policies
- Triggers for auto-updating timestamps and creating market users

### 4. Verify Setup

After running the migration, verify:

1. **Tables created**: Check in Supabase Table Editor
2. **Functions created**: Check in Supabase Database > Functions
3. **RLS enabled**: Check in Supabase Authentication > Policies
4. **Trigger works**: Create a test user in Supabase Auth and verify `market_users` entry is created automatically

## Migration File Structure

- `001_market_schema.sql` - Complete database schema with all tables, functions, and policies

## Important Notes

- The `buy_stock` and `sell_stock` functions use `FOR UPDATE` locks to prevent race conditions
- The `get_chart_data` function automatically downsamples old data for performance
- All RLS policies ensure users can only access their own data
- The trigger `on_auth_user_created_market` automatically creates a market_user entry when a new auth user is created

