# Complete Setup Guide - Movie Stock Trading System

This guide will help you set up the entire Movie Stock Trading System from scratch.

## Prerequisites

- Node.js 18+ installed
- Python 3.9+ installed
- A Supabase account (free tier works)
- A Firebase project (for existing auth features)

---

## Step 1: Install Node.js Dependencies

```bash
npm install
```

**Note**: If you get an error about `@supabase/ssr`, install it:
```bash
npm install @supabase/ssr
```

---

## Step 2: Set Up Supabase

### 2.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: `indian-movie-db` (or your choice)
   - **Database Password**: Save this password securely
   - **Region**: Choose closest to you
5. Wait for project to be created (2-3 minutes)

### 2.2 Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - **⚠️ Keep this secret!**

### 2.3 Run SQL Migrations

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**

#### Migration 1: Core Schema

1. Open `supabase/migrations/001_market_schema.sql` in your editor
2. Copy the **entire file** content
3. Paste into Supabase SQL Editor
4. Click **Run** (or press `Ctrl+Enter`)
5. Wait for success message ✅

This creates:
- All tables (`market_users`, `movie_stocks`, `portfolios`, `market_history`, `transactions`)
- All indexes
- RPC functions (`buy_stock`, `sell_stock`, `update_user_net_worth`, `get_chart_data`)
- Row Level Security (RLS) policies
- Triggers

#### Migration 2: Firebase Auth Compatible Functions

1. Open `supabase/migrations/002_market_rpc_with_user_id.sql` in your editor
2. Copy the **entire file** content
3. Paste into Supabase SQL Editor
4. Click **Run**
5. Wait for success message ✅

This creates:
- `buy_stock_with_user()` - Works with Firebase Auth
- `sell_stock_with_user()` - Works with Firebase Auth

### 2.4 Verify Database Setup

1. Go to **Table Editor** in Supabase dashboard
2. You should see these tables:
   - `market_users`
   - `movie_stocks`
   - `portfolios`
   - `market_history`
   - `transactions`
3. Go to **Database** → **Functions**
4. You should see:
   - `buy_stock`
   - `buy_stock_with_user`
   - `sell_stock`
   - `sell_stock_with_user`
   - `update_user_net_worth`
   - `get_chart_data`

---

## Step 3: Configure Environment Variables

### 3.1 Create `.env.local` File

In the project root, create a file named `.env.local`:

```bash
touch .env.local
```

### 3.2 Add Supabase Variables

Open `.env.local` and add:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Replace with your actual values from Step 2.2**

### 3.3 Add Firebase Variables (if not already present)

If you don't have Firebase variables yet, add:

```env
# Firebase Configuration (for existing auth features)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

**Note**: You may already have these in your Firebase config file. Check `lib/firebase/config.ts`.

---

## Step 4: Set Up Python Service

### 4.1 Install Python Dependencies

```bash
cd python-service
pip install -r requirements.txt
```

**If you get permission errors**, use:
```bash
pip install --user -r requirements.txt
```

### 4.2 Configure Python Environment Variables

1. Copy the example env file:
```bash
cp env.example .env
```

2. Open `python-service/.env` and update:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
PORT=8000
```

**Use the same Supabase credentials from Step 2.2**

### 4.3 Test Python Service Locally

```bash
# From python-service directory
python main.py
```

Or with uvicorn:
```bash
uvicorn main:app --reload --port 8000
```

Test it:
```bash
# In another terminal
curl http://localhost:8000/health
```

You should see: `{"status":"ok"}`

---

## Step 5: Seed Initial Movie Stocks (Optional)

To test the system, you'll need some movie stocks in the database.

### Option A: Manual Insert via Supabase Dashboard

1. Go to Supabase **Table Editor** → `movie_stocks`
2. Click **Insert** → **Insert row**
3. Add a test stock:
   - `id`: `"550"` (or any TMDB ID)
   - `tmdb_id`: `550`
   - `title`: `"Fight Club"`
   - `status`: `"ACTIVE"`
   - `current_price`: `100`
   - `poster_path`: `"/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg"` (optional)

### Option B: Create a Seed Script (Recommended)

Create `scripts/seed-stocks.ts`:

```typescript
import { createServerClient } from '@/lib/supabase/server';

const stocks = [
  {
    id: '550',
    tmdb_id: 550,
    title: 'Fight Club',
    status: 'ACTIVE',
    current_price: 100,
    poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  },
  // Add more movies...
];

async function seed() {
  const supabase = createServerClient();
  
  for (const stock of stocks) {
    const { error } = await supabase
      .from('movie_stocks')
      .upsert(stock, { onConflict: 'id' });
    
    if (error) {
      console.error(`Error seeding ${stock.title}:`, error);
    } else {
      console.log(`✅ Seeded: ${stock.title}`);
    }
  }
}

seed();
```

Run it:
```bash
npx tsx scripts/seed-stocks.ts
```

---

## Step 6: Test the Application

### 6.1 Start Next.js Dev Server

```bash
npm run dev
```

### 6.2 Test Pages

1. **Market Page**: `http://localhost:3000/market`
   - Should show list of movie stocks
   - If empty, you need to seed stocks (Step 5)

2. **Portfolio Page**: `http://localhost:3000/portfolio`
   - Should show your portfolio (empty if you haven't traded)
   - Requires authentication

3. **Leaderboard**: `http://localhost:3000/leaderboard`
   - Should show leaderboard (empty if no users)

### 6.3 Test Trading

1. Go to a movie stock page: `http://localhost:3000/market/550`
2. Click "Buy" or "Sell"
3. Enter quantity
4. Confirm transaction
5. Check your portfolio

---

## Step 7: Deploy Python Service (Optional - For Production)

### 7.1 Deploy to Render.com (Free Tier)

1. Go to [render.com](https://render.com)
2. Sign up/login
3. Click **New** → **Web Service**
4. Connect your GitHub repository
5. Configure:
   - **Name**: `movie-stock-price-service`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: `python-service`
6. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `PORT` (optional)
7. Deploy

### 7.2 Set Up Cron Job (Keep Service Alive)

**CRITICAL**: Render free tier spins down after 15 minutes of inactivity.

1. Go to [cron-job.org](https://cron-job.org)
2. Create account
3. Create new cron job:
   - **URL**: `https://your-render-app.onrender.com/update-prices-batch?batch_size=5`
   - **Schedule**: Every 5 minutes
   - **Method**: POST
4. This will:
   - Keep your service alive
   - Update 5 stocks every 5 minutes (round-robin)
   - Prevent Google Trends IP bans

---

## Step 8: Verify Everything Works

### Checklist

- [ ] Supabase project created
- [ ] SQL migrations run successfully
- [ ] Environment variables set in `.env.local`
- [ ] Python service runs locally
- [ ] Next.js app runs without errors
- [ ] Market page loads
- [ ] Can view a stock detail page
- [ ] Can buy/sell stocks (if authenticated)
- [ ] Portfolio page shows holdings
- [ ] Real-time price updates work (if Python service is running)

---

## Troubleshooting

### "Missing Supabase environment variables"

- Check `.env.local` exists in project root
- Verify variable names are correct (no typos)
- Restart Next.js dev server after adding env vars

### "Cannot find module '@supabase/ssr'"

```bash
npm install @supabase/ssr
```

### "Table does not exist" or "Function does not exist"

- Re-run SQL migrations in Supabase SQL Editor
- Check for error messages in migration output

### Python service can't connect to Supabase

- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `python-service/.env`
- Check Supabase project is active
- Verify service role key has proper permissions

### "Insufficient funds" when buying

- New users start with 20,000 coins
- Check `market_users` table has your user entry
- Verify `coins` column value

### Real-time updates not working

- Ensure Supabase Realtime is enabled (Settings → API → Realtime)
- Check browser console for WebSocket errors
- Verify you're subscribed to the correct channel

---

## Next Steps

1. **Add More Movies**: Seed more movie stocks
2. **Configure Price Updates**: Set up cron job for automatic price updates
3. **Customize UI**: Adjust colors, layouts in `globals.css`
4. **Add Features**: Implement mobile gestures, advanced charts, etc.

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Check Next.js terminal for server errors
3. Check Supabase logs (Dashboard → Logs)
4. Verify all environment variables are set correctly





