# Movie Stock Price Update Service

Python FastAPI service for updating movie stock prices based on real-world trends.

## Features

- Fetches Google Trends data for movie titles
- Calculates box office performance scores
- Updates stock prices in Supabase database
- Rate limiting to prevent Google Trends IP bans
- Batch processing for efficient updates

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (bypasses RLS)

### 3. Run Locally

```bash
python main.py
```

Or with uvicorn directly:

```bash
uvicorn main:app --reload --port 8000
```

The service will be available at `http://localhost:8000`

## API Endpoints

### Health Check
```
GET /health
```

### Get Trend Score
```
GET /trend?keyword=Movie Title
```

### Get Box Office Score
```
GET /box-office?movie_title=Movie Title
```

### Update All Prices (Full Batch)
```
POST /update-prices
```
⚠️ **Warning**: This updates all active stocks at once. Use with caution as it may trigger Google Trends rate limiting.

### Update Prices (Batch - Recommended)
```
POST /update-prices-batch?batch_size=5
```
Updates a small batch of stocks. Recommended for production.

## Deployment

### Render.com (Free Tier)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `PORT` (optional, defaults to 8000)

### Cron Job Setup

**CRITICAL**: Render's free tier spins down after 15 minutes of inactivity.

Set up an external cron job at [cron-job.org](https://cron-job.org):

1. Create account
2. Create new cron job:
   - **URL**: `https://your-render-app.onrender.com/update-prices-batch?batch_size=5`
   - **Schedule**: Every 5 minutes
   - **Method**: POST
   - **Headers**: (Optional) Add authentication header if you add auth later

This will:
- Keep your Render service alive
- Update 5 stocks every 5 minutes (round-robin)
- Prevent Google Trends IP bans

## Rate Limiting

The service includes built-in rate limiting:
- Sleeps 5-10 seconds between Google Trends requests
- Processes stocks sequentially to avoid bans
- Batch endpoint limits updates to prevent overload

## Price Calculation

Prices are calculated using:

```
new_price = (old_price * 0.8) + (trend_score * 0.5)
```

Where `trend_score` is a weighted average:
- 40% Google Trends (hype_index)
- 40% Box Office (box_office_index)
- 20% Word of Mouth (wom_index)

Prices are clamped between ₹10 and ₹1000.

## Development

### Testing Locally

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test trend endpoint
curl "http://localhost:8000/trend?keyword=RRR"

# Test batch update (updates 2 stocks)
curl -X POST "http://localhost:8000/update-prices-batch?batch_size=2"
```

### Adding New Data Sources

1. Add fetcher function in `trend_fetcher.py`
2. Update `main.py` to call new fetcher
3. Adjust weights in `price_engine.py` if needed

## Troubleshooting

### Google Trends Rate Limiting

If you get rate limited:
- Increase sleep time between requests
- Use batch endpoint instead of full update
- Reduce batch size

### Supabase Connection Errors

- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
- Check Supabase project is active
- Verify service role key has proper permissions

### Service Not Updating

- Check cron job is running
- Verify Render service is not sleeping
- Check logs for errors

