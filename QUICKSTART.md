# Quick Start Guide

Follow these steps to get your Movie Stock Trading System running in 10 minutes.

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project"
3. Fill in:
   - Name: `indian-movie-db`
   - Database Password: **Save this password!**
   - Region: Choose closest to you
4. Wait 2-3 minutes for project creation

## Step 3: Get Supabase Credentials

1. In Supabase dashboard → **Settings** → **API**
2. Copy these 3 values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
   - **service_role** key (starts with `eyJ...`) ⚠️ **Keep secret!**

## Step 4: Run SQL Migrations

1. In Supabase dashboard → **SQL Editor**
2. Click **New Query**

### Migration 1:
- Open `supabase/migrations/001_market_schema.sql`
- Copy entire file → Paste in SQL Editor → Click **Run** ✅

### Migration 2:
- Open `supabase/migrations/002_market_rpc_with_user_id.sql`
- Copy entire file → Paste in SQL Editor → Click **Run** ✅

## Step 5: Create `.env.local` File

In project root, create `.env.local`:

```bash
touch .env.local
```

Add this content (replace with your actual values):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Replace the values with what you copied in Step 3**

## Step 6: Verify Setup

```bash
npm run check:setup
```

This will check:
- ✅ Environment variables
- ✅ Supabase connection
- ✅ Database tables
- ✅ RPC functions

## Step 7: Seed Movie Stocks

```bash
npm run seed:stocks
```

This adds 5 sample movies to test with.

## Step 8: Start the App

```bash
npm run dev
```

Visit:
- **Market**: http://localhost:3000/market
- **Portfolio**: http://localhost:3000/portfolio
- **Leaderboard**: http://localhost:3000/leaderboard

## Step 9: Set Up Python Service (Optional)

For automatic price updates:

```bash
cd python-service
pip install -r requirements.txt
cp env.example .env
```

Edit `python-service/.env`:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

Run:
```bash
python main.py
```

## That's It! 🎉

Your Movie Stock Trading System is ready!

---

## Troubleshooting

**"Missing Supabase environment variables"**
- Make sure `.env.local` exists in project root
- Restart `npm run dev` after creating `.env.local`

**"Table does not exist"**
- Re-run SQL migrations in Supabase SQL Editor
- Check for error messages

**"No movie stocks found"**
- Run `npm run seed:stocks`

**Need more help?**
- See `SETUP.md` for detailed instructions
- Check browser console for errors
- Check Next.js terminal output




