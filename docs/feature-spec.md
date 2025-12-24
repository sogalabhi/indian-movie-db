# Social & Intelligence Features Plan (Supabase + Next.js)

This document outlines the new social and intelligence features: comments/replies, cinema news with discussions, bucket/wish/watch lists, ratings, creator/actor collections, and publishing reviews/articles. Backend persistence and auth will use Supabase (Postgres + Auth). Data source for movies stays TMDB for now.

## Goals
- Enable user-generated content (comments, reviews, articles) tied to movies and news.
- Track engagement (likes, comments, saves, ratings) to derive preference signals.
- Provide lists: bucket/wishlist, watched with ratings.
- Surface curated collections (filmmakers/actors).
- Keep feed extensible for future recommendation logic.

## Stack & Services
- Frontend: Next.js (existing app), client components for interactivity.
 - UI state: local component state + existing contexts; consider Zustand if shared.
- Backend/API: Next.js route handlers.
- Database/Auth/Storage: Supabase.
- Realtime: Supabase Realtime for live comment threads (optional v1).

## Data Model (Supabase)
Tables (simplified columns):
- profiles
  - id (uuid, pk, auth.uid)
  - username, avatar_url, created_at
- movies
  - id (text, pk) — TMDB movie id (keep as text)
  - title, poster_url, metadata (jsonb), embedding (vector, optional; pgvector)
- news_items
  - id (text pk) — use RSS `<guid>`; fallback to hash(link+pubDate) only if missing
  - title, link, source, image_url, published_at, metadata (jsonb)
  - deleted_at (timestamptz null) — soft delete to avoid orphaned comments
- comments
  - id (uuid pk)
  - user_id (uuid fk profiles)
  - target_type (enum: 'movie' | 'news' | 'article')
  - target_id (text) — movie id, news id, or article id
  - parent_id (uuid nullable) — for replies
  - body (text)
  - likes_count (int, default 0)
  - created_at, updated_at
- comment_likes
  - user_id (uuid fk profiles)
  - comment_id (uuid fk comments)
  - pk (user_id, comment_id)
- wishlists
  - user_id (uuid fk profiles)
  - movie_id (text fk movies)
  - created_at
  - unique (user_id, movie_id)
- watchlist
  - user_id (uuid fk profiles)
  - movie_id (text fk movies)
  - watched (bool default false)
  - rating (int null, 1–10)
  - created_at, updated_at
  - unique (user_id, movie_id)
- reviews
  - id (uuid pk)
  - user_id (uuid fk profiles)
  - movie_id (text fk movies)
  - title (text)
  - body (text)
  - rating (int null, 1–10)
  - likes_count (int default 0)
  - created_at, updated_at
- review_likes
  - user_id, review_id pk
- articles
  - id (uuid pk)
  - user_id (uuid fk profiles)
  - title, body, tags (text[]), cover_image_url, created_at, updated_at
  - deleted_at (timestamptz null) — soft delete to avoid orphaned comments
- article_likes
  - user_id, article_id pk
- creators (filmmakers/actors)
  - id (text pk) — TMDB person id
  - name, role (enum: 'director' | 'actor' | 'writer' | 'other')
  - portrait_url, bio (text), metadata (jsonb)
- creator_collections
  - id (uuid pk)
  - title, description
  - items (jsonb: array of creator ids + role)
  - order_index (int)

Indexes:
- comments (target_type, target_id, created_at)
- wishlists (user_id, created_at)
- watchlist (user_id, watched, created_at)
- reviews (movie_id, created_at)
- movies (id) remains the primary key; use `ON CONFLICT (id)` when lazily upserting to avoid races.

## Auth & RLS (Supabase)
- Enable Supabase Auth (email/password + OAuth providers as needed).
- Profiles auto-population: add trigger on `auth.users` to insert into `public.profiles` with fallback name (metadata name -> email -> Anonymous) to avoid missing FK rows.
- Enable `pgvector` extension early for future embeddings (movies.embedding).
- RLS policies (tighten ownership):
  - profiles: read all; update own row.
  - comments: read all; insert/update/delete only where user_id = auth.uid(); likes tables insert/delete own rows.
  - watchlists/reviews: select/insert/update/delete where user_id = auth.uid().

## Feature Breakdown

### 1) Watchlist (Bucket / Plan-to-Watch)
- API:
  - POST `/api/watchlist` { movie_id }
  - GET `/api/watchlist`
  - DELETE `/api/watchlist/:movie_id`
- UI:
  - “Add to Wishlist” button on cards/detail.
  - Wishlist page/tab listing saved movies.

### 2) Watched History & Ratings (Reviews)
- API:
  - POST `/api/reviews` { movie_id, rating?, body? }
  - PATCH `/api/reviews/:id` { rating?, body? }
  - GET `/api/reviews?movie_id=:id`
- UI:
  - “Mark as Watched / Rate” on movie detail.
  - One review/rating per movie per user; shows in history and on detail page.

### 3) Comments with Replies on Movies
- API routes:
  - GET `/api/comments?target_type=movie&target_id=:id`
  - POST `/api/comments` body: { target_type, target_id, parent_id?, body }
  - POST `/api/comments/:id/like` / DELETE to unlike.
- UI:
  - Comment list with nesting (1 level reply). Optimistic insert.
  - Sort by newest; optionally “most liked”.
  - Show like counts and reply action.
- Data:
  - Store movie metadata lazily (upsert into movies table on first comment) using `upsert(..., { onConflict: 'id', ignoreDuplicates: true })` to avoid races; let the DB handle conflicts.

### 4) Cinema News Sub-tab with Discussion
- Existing news feed: add a “News” tab/route with comment thread per news item.
- API:
  - Persist fetched news into `news_items` using `<guid>`; fallback hash only if missing.
  - Comments target_type = 'news', target_id = news id.
- UI:
  - News detail modal/page with comment thread.

### 5) Collections of Top Filmmakers/Actors
- Seed `creator_collections` (e.g., “Top Directors”, “Fan Favorites”).
- UI:
  - Horizontal carousels; click to open a creator detail (pull from TMDB person endpoint) and list of notable works.
- Data:
  - Cache creator data in `creators` table on first fetch.

### 6) Publish Reviews & Articles
- API:
  - Reviews: CRUD for user’s own; public read; like endpoints.
  - Articles: same pattern; supports tags and cover image (Supabase Storage).
- UI:
  - “Write Review” on movie detail; “New Article” CTA in profile area.
  - List of community reviews/articles; detail pages with like and comments (comments target_type='article').

## Supabase API Layer (Next.js)
Suggested route namespaces:
- `/api/comments` (list/create), `/api/comments/[id]/like`
- `/api/watchlist`, `/api/watchlist/[movie_id]` (bucket list)
- `/api/reviews`, `/api/reviews/[id]`, `/api/reviews/[id]/like` (watched history + rating)
- `/api/articles`, `/api/articles/[id]`, `/api/articles/[id]/like`
- `/api/news/sync` (optional cron/edge to upsert RSS into news_items)

Patterns:
- Use Supabase client with service role (server-side) for mutations; user access via RLS for client-side calls.
- Validate auth: get user from Supabase auth session or JWT.
- Input validation (zod) to keep payloads safe.

## UI/UX Notes
- Keep existing TMDB data source; display images via provided URLs.
- Comment composer: autosize textarea, optimistic add, error fallback.
- Toasts for success/error; disabled states while saving.
- Pagination or “Load more” for threads and lists.
- Accessibility: buttons for like/reply, aria-labels, keyboard focus.

## Preference Signals (future)
- Increment affinity on: comment (+5), like (+2), watchlist add (+3), watched+positive rating (+4), watched+low rating (-2), skip (-1).
- Store per-user aggregates in a `user_preferences` table (jsonb for genre/lang scores). Update via background jobs or triggers.

## Minimal Delivery Order (MVP slices)
1) Auth + profiles trigger (Supabase).
2) Watchlist (plan-to-watch) + Reviews (watched history) APIs + UI.
3) Comments with replies on movies (polymorphic backend).
4) News tab with persisted items (use `<guid>` ids) + comments.
5) Reviews publish/read/like on movie detail.
6) Creator collections carousel (static seed).
7) Articles creation/listing.

## Env Vars
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only for secure mutations if needed)

## Supabase SQL essentials
- Profiles trigger to auto-create profile on signup:
```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email, 'Anonymous'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```
- Comments RLS (owner-only writes):
```sql
create policy "comments_select_public" on public.comments for select using (true);
create policy "comments_insert_self" on public.comments for insert with check (auth.uid() = user_id);
create policy "comments_update_self" on public.comments for update using (auth.uid() = user_id);
create policy "comments_delete_self" on public.comments for delete using (auth.uid() = user_id);
```
- AI readiness and conflict-safe lazy inserts:
```sql
-- Enable vector search now for future recommendations
create extension if not exists vector;
alter table public.movies add column if not exists embedding vector(1536);
```
```ts
// Conflict-safe lazy upsert for movies
supabase.from('movies').upsert(payload, { onConflict: 'id', ignoreDuplicates: true });
```
- Polymorphic FK caveat: comments use `target_type` + `target_id` (no FK). For entities that can be removed (news/articles), prefer soft-delete or add manual cleanup to avoid orphaned comments/likes.

## Full Supabase bootstrap SQL (run once)
```sql
-- 1. EXTENSIONS & PROFILES
create extension if not exists vector;

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text,
  avatar_url text,
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email, 'Anonymous'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. CONTENT (Movies & News)
create table if not exists public.movies (
  id text primary key, -- TMDB ID
  title text not null,
  poster_url text,
  metadata jsonb default '{}'::jsonb,
  embedding vector(1536)
);

create table if not exists public.news_items (
  id text primary key, -- RSS GUID
  title text not null,
  link text not null,
  source text,
  image_url text,
  published_at timestamptz default now(),
  deleted_at timestamptz,
  metadata jsonb default '{}'::jsonb
);

create table if not exists public.articles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  body text not null,
  tags text[],
  cover_image_url text,
  created_at timestamptz default now(),
  deleted_at timestamptz
);

-- 3. THE "BOTH" LISTS (Watchlist + Watched History)

-- A. Watchlists (Bucket / Plan-to-Watch)
create table if not exists public.watchlists (
  user_id uuid references public.profiles(id) on delete cascade,
  movie_id text references public.movies(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, movie_id)
);

-- B. Watched History & Ratings (Reviews)
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  movie_id text references public.movies(id) on delete cascade,
  rating int check (rating between 1 and 10),
  body text,
  watched_at timestamptz default now(),
  likes_count int default 0,
  created_at timestamptz default now(),
  unique (user_id, movie_id)
);

-- 4. SOCIAL (Comments) & Likes
create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  target_type text check (target_type in ('movie', 'news', 'article')),
  target_id text not null,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null,
  likes_count int default 0,
  created_at timestamptz default now()
);
create index if not exists comments_target_idx on public.comments(target_type, target_id);

create table if not exists public.comment_likes (
  user_id uuid references public.profiles(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  primary key (user_id, comment_id)
);

create table if not exists public.review_likes (
  user_id uuid references public.profiles(id) on delete cascade,
  review_id uuid references public.reviews(id) on delete cascade,
  primary key (user_id, review_id)
);

create table if not exists public.article_likes (
  user_id uuid references public.profiles(id) on delete cascade,
  article_id uuid references public.articles(id) on delete cascade,
  primary key (user_id, article_id)
);

-- 5. RLS (Security)
alter table public.profiles enable row level security;
alter table public.movies enable row level security;
alter table public.news_items enable row level security;
alter table public.articles enable row level security;
alter table public.watchlists enable row level security;
alter table public.reviews enable row level security;
alter table public.comments enable row level security;
alter table public.comment_likes enable row level security;
alter table public.review_likes enable row level security;
alter table public.article_likes enable row level security;

-- Public Reads
create policy "Public Read Profiles" on public.profiles for select using (true);
create policy "Public Read Content" on public.movies for select using (true);
create policy "Public Read News" on public.news_items for select using (true);
create policy "Public Read Articles" on public.articles for select using (true);
create policy "Public Read Reviews" on public.reviews for select using (true);
create policy "Public Read Comments" on public.comments for select using (true);

-- Ownership
create policy "User Write Watchlist" on public.watchlists for all using (auth.uid() = user_id);
create policy "User Write Reviews" on public.reviews for all using (auth.uid() = user_id);
create policy "User Write Articles" on public.articles for all using (auth.uid() = user_id);

create policy "User Write Comments" on public.comments
  for insert with check (auth.uid() = user_id);
create policy "User Modify Comments" on public.comments
  for update using (auth.uid() = user_id);
create policy "User Delete Comments" on public.comments
  for delete using (auth.uid() = user_id);

create policy "User Toggle Comment Likes" on public.comment_likes for all using (auth.uid() = user_id);
create policy "User Toggle Review Likes" on public.review_likes for all using (auth.uid() = user_id);
create policy "User Toggle Article Likes" on public.article_likes for all using (auth.uid() = user_id);
```

## Testing Checklist
- RLS policies enforce user ownership.
- Comment CRUD + like flows.
- Wishlist and watchlist idempotency.
- Ratings saved and editable.
- Reviews/articles creation and like counts.
- News items upserted and comments work.

