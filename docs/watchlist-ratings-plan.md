# Watchlist & Watched History Implementation Plan

## Overview
Implement two user features that require authentication:
1. **Watchlist** - Bookmark movies to watch later
2. **Watched History & Ratings** - Log watched movies with 1-10 ratings

## Database Structure

### Watchlist Collection (`watchlists`)
Already defined in schema:
- **Document ID**: `${userId}_${movieId}` (composite key for uniqueness)
- **Fields**:
  ```typescript
  {
    userId: string;
    movieId: string;
    createdAt: Timestamp;
  }
  ```

### Reviews Collection (`reviews`)
Already defined in schema:
- **Document ID**: Auto-generated
- **Fields**:
  ```typescript
  {
    userId: string;
    movieId: string;
    rating?: number; // 1-10
    body?: string; // Optional review text
    watchedAt: Timestamp;
    likesCount: number; // Denormalized (default: 0)
    createdAt: Timestamp;
    updatedAt: Timestamp;
  }
  ```
- **Constraint**: One review per user per movie (enforced in application logic)

## Implementation Components

### 1. API Routes

#### `/app/api/watchlist/route.ts`
- **GET**: Get user's watchlist
  - Query params: `userId` (from auth)
  - Returns: Array of watchlist items with movie details
- **POST**: Add movie to watchlist
  - Body: `{ movieId: string }`
  - Returns: Created watchlist item
- **DELETE**: Remove movie from watchlist
  - Query params: `movieId`
  - Returns: Success status

#### `/app/api/watchlist/[movieId]/route.ts`
- **GET**: Check if movie is in watchlist
  - Returns: `{ inWatchlist: boolean }`
- **DELETE**: Remove specific movie from watchlist

#### `/app/api/reviews/route.ts`
- **GET**: Get user's reviews/watched history
  - Query params: `userId` (from auth), optional `movieId`
  - Returns: Array of reviews
- **POST**: Create/update review
  - Body: `{ movieId: string, rating: number, body?: string, watchedAt: Date }`
  - Returns: Created/updated review

#### `/app/api/reviews/[movieId]/route.ts`
- **GET**: Get review for specific movie
  - Returns: Review object or null
- **PUT**: Update review
  - Body: `{ rating?: number, body?: string, watchedAt?: Date }`
- **DELETE**: Delete review

### 2. UI Components

#### `/app/components/WatchlistButton.tsx`
- Bookmark/Unbookmark button
- Shows on movie cards and movie detail page
- Requires authentication (shows login prompt if not logged in)
- Props: `movieId: string | number`

#### `/app/components/RatingDialog.tsx`
- Dialog/modal for rating a movie
- Includes:
  - Star rating (1-10)
  - Optional review text
  - "Mark as Watched" button
- Props: `movieId: string | number`, `movieTitle: string`, `existingReview?: Review`

#### `/app/components/UserWatchlist.tsx`
- Page component showing user's watchlist
- Displays movies in a grid/list
- Allows removing from watchlist
- Route: `/watchlist`

#### `/app/components/WatchedHistory.tsx`
- Page component showing user's watched movies
- Displays movies with ratings
- Allows editing/deleting reviews
- Route: `/watched`

### 3. Integration Points

#### Movie Detail Page (`/app/movie/[id]/page.tsx`)
- Add WatchlistButton component
- Add RatingDialog component
- Show current watchlist status
- Show current rating if reviewed

#### Movie Cards (Homepage, Genre pages)
- Add WatchlistButton to each movie card
- Show watchlist icon if in watchlist

#### Navigation
- Add "My Watchlist" link (if logged in)
- Add "Watched History" link (if logged in)

### 4. Authentication Checks

All API routes should:
1. Verify user is authenticated (using `getCurrentUserFromRequest`)
2. Return 401 if not authenticated
3. Use `userId` from authenticated user (never trust client-provided userId)

Client components should:
1. Use `useAuth()` to check authentication
2. Show login prompt/modal if not authenticated
3. Redirect to login page for protected actions

## Implementation Order

### Phase 1: Watchlist Feature
1. ✅ Create API routes for watchlist
2. ✅ Create WatchlistButton component
3. ✅ Add to movie detail page
4. ✅ Add to movie cards
5. ✅ Create watchlist page
6. ✅ Add navigation link

### Phase 2: Watched History & Ratings
1. ✅ Create API routes for reviews
2. ✅ Create RatingDialog component
3. ✅ Add to movie detail page
4. ✅ Create watched history page
5. ✅ Add navigation link
6. ✅ Add rating display to movie cards

### Phase 3: Polish & Enhancements
1. ✅ Add loading states
2. ✅ Add error handling
3. ✅ Add success notifications
4. ✅ Add empty states
5. ✅ Add filtering/sorting options

## API Route Structure

### Watchlist API Example

```typescript
// GET /api/watchlist
// Returns user's watchlist with movie details
{
  watchlist: [
    {
      id: "userId_movieId",
      userId: "user123",
      movieId: "123",
      createdAt: "2024-01-01T00:00:00Z",
      movie: {
        // Full movie details from TMDB
        title: "Movie Title",
        poster_path: "/path.jpg",
        // ... other movie fields
      }
    }
  ]
}

// POST /api/watchlist
// Body: { movieId: "123" }
// Returns: { success: true, watchlistItem: {...} }

// DELETE /api/watchlist?movieId=123
// Returns: { success: true }
```

### Reviews API Example

```typescript
// GET /api/reviews
// Returns user's reviews
{
  reviews: [
    {
      id: "reviewId",
      userId: "user123",
      movieId: "123",
      rating: 8,
      body: "Great movie!",
      watchedAt: "2024-01-01T00:00:00Z",
      createdAt: "2024-01-01T00:00:00Z",
      movie: {
        // Full movie details
      }
    }
  ]
}

// POST /api/reviews
// Body: { movieId: "123", rating: 8, body: "Great!", watchedAt: "2024-01-01" }
// Returns: { success: true, review: {...} }
```

## UI/UX Considerations

### Watchlist Button
- Icon: Bookmark (filled when in watchlist, outline when not)
- Tooltip: "Add to watchlist" / "Remove from watchlist"
- Loading state while adding/removing
- Success notification

### Rating Dialog
- Star rating component (1-10 stars)
- Text area for review (optional)
- Date picker for watched date (default: today)
- "Save" and "Cancel" buttons
- Show existing rating if updating

### Pages
- Responsive grid layout
- Search/filter functionality
- Sort by date, rating, title
- Pagination if needed
- Empty states with helpful messages

## Security Considerations

1. **Authentication Required**: All operations require valid session
2. **User Isolation**: Users can only access their own data
3. **Input Validation**: Validate movieId, rating (1-10), dates
4. **Rate Limiting**: Prevent abuse (optional, for future)
5. **Firestore Rules**: Already defined in schema.md

## Testing Checklist

- [x] Add movie to watchlist (authenticated)
- [x] Remove movie from watchlist
- [x] Try to add to watchlist when not logged in (should prompt login)
- [x] View watchlist page
- [ ] Add rating to movie
- [ ] Update existing rating
- [ ] Delete review
- [ ] View watched history page
- [ ] Test on movie detail page
- [ ] Test on movie cards
- [ ] Test empty states
- [ ] Test error handling

## Future Enhancements

- Share watchlist with friends
- Watchlist notes/tags
- Watchlist sorting/filtering
- Review likes (already in schema)
- Review comments
- Watchlist statistics
- Export watchlist
- Import from other services

