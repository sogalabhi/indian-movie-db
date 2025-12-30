# Watched History & Ratings Feature

## Overview

The Watched History & Ratings feature allows users to track all movies they have watched, rate them on a 1-10 scale, write optional reviews, and view comprehensive statistics about their viewing habits. This feature provides a complete personal movie diary with filtering, sorting, and analytics.

## User Features

### Core Functionality

1. **Mark Movies as Watched**
   - Users can mark any movie as watched from multiple locations
   - Rating (1-10) is required when marking as watched
   - Optional review text can be added
   - Watched date can be set (defaults to today)

2. **Rating System**
   - 10-star rating system (1-10 scale)
   - Visual star interface for easy rating
   - Ratings are displayed across the app on movie cards and detail pages
   - Ratings can be updated at any time

3. **Review Text**
   - Optional text reviews can be added with ratings
   - Reviews are displayed in the watched history page
   - Reviews can be edited or deleted

4. **Watched History Page**
   - Complete list of all watched movies
   - Grid layout with movie posters and ratings
   - Search functionality by movie title
   - Filter by rating ranges (1-3, 4-6, 7-8, 9-10)
   - Sort by date watched, rating, or title (ascending/descending)
   - Statistics dashboard with insights

5. **Statistics Dashboard**
   - Total movies watched count
   - Average rating across all movies
   - Top rated movies count (9-10 stars)
   - Visual rating distribution chart showing percentage of movies in each rating range

6. **Watchlist Integration**
   - When marking a movie as watched, users are prompted to remove it from watchlist
   - Option to keep or remove from watchlist

## User Interface

### Rating Locations

Users can rate movies from multiple locations:

1. **Movie Detail Page** (`/movie/[id]`)
   - "Mark as Watched" button opens rating dialog
   - Quick rating button for existing ratings
   - Rating display card showing current rating with stars

2. **Movie Cards** (Homepage, Genre pages, High-rated sections)
   - Rating button icon on each movie card
   - Rating badge displayed if user has rated the movie
   - Quick access to rate without leaving the page

3. **Watched History Page** (`/watched`)
   - Full rating interface
   - Edit existing ratings
   - Delete reviews to remove from watched history

### Rating Dialog

The rating dialog provides:

- **Star Rating Interface**: 10 clickable stars (1-10 scale)
- **Date Picker**: Select when the movie was watched (defaults to today)
- **Review Text Area**: Optional text field for detailed reviews
- **Watchlist Prompt**: Asks if user wants to remove movie from watchlist
- **Save/Cancel**: Save rating or cancel operation

### Watched History Page

The watched history page (`/watched`) includes:

- **Header**: Title, back button, and total watched count
- **Statistics Cards**: Four cards showing key metrics
  - Total Watched
  - Average Rating
  - Top Rated (9-10) count
  - Rating Distribution (visual chart)
- **Filters & Search**:
  - Search bar for movie titles
  - Rating filter dropdown (All, 9-10, 7-8, 4-6, 1-3)
  - Sort dropdown (Date, Rating, Title with ascending/descending)
- **Movie Grid**: Responsive grid showing all watched movies with:
  - Movie poster
  - Rating badge
  - Watched date
  - Review text preview
  - Action buttons (Watchlist, Rate, Compare, Delete)

## User Flows

### Marking a Movie as Watched

1. User clicks "Mark as Watched" button (detail page) or rating button (card)
2. If not authenticated, redirects to login
3. Rating dialog opens
4. If movie is in watchlist, prompt appears asking to remove
5. User selects rating (required, 1-10 stars)
6. User optionally adds review text
7. User selects watched date (defaults to today)
8. User clicks "Save"
9. Review is saved to database
10. If watchlist removal was chosen, movie is removed from watchlist
11. Success toast notification appears
12. UI updates to show new rating

### Viewing Watched History

1. User navigates to "/watched" page
2. Page fetches all user reviews
3. For each review, movie details are fetched from TMDB
4. Statistics are calculated
5. Movies are displayed in grid with filters and sorting applied
6. User can search, filter, and sort as needed

### Editing a Rating

1. User clicks rating button on a movie they've already rated
2. Rating dialog opens with existing data pre-filled
3. User updates rating, review, or date
4. User clicks "Save"
5. Review is updated in database
6. UI updates to show new rating

### Deleting a Review

1. User goes to watched history page
2. User hovers over a movie card
3. User clicks delete button
4. Confirmation dialog appears
5. User confirms deletion
6. Review is removed from database
7. Movie is removed from watched history
8. Success toast notification appears

## Statistics Explained

### Total Watched
- Count of all movies the user has marked as watched

### Average Rating
- Calculated by summing all ratings and dividing by total count
- Shows overall rating preference

### Top Rated Count
- Number of movies rated 9 or 10 stars
- Indicates how many excellent movies the user has watched

### Rating Distribution
- Visual bar chart showing percentage of movies in each rating range:
  - **Yellow bar (9-10)**: Excellent movies
  - **Primary color bar (7-8)**: Good movies
  - **Blue bar (4-6)**: Average movies
  - **Red bar (1-3)**: Poor movies
- Helps users understand their rating patterns

## Design & User Experience

### Visual Design
- **Glassmorphism**: Cards and dialogs use glassmorphic design
- **Primary Colors**: Used in borders, gradients, and accents
- **Star Icons**: Visual star rating with yellow fill for selected ratings
- **Rating Badges**: Yellow color scheme for rating displays
- **Smooth Animations**: Transitions and scale effects for better UX

### Responsive Design
- **Mobile-First**: Optimized for mobile devices
- **Breakpoints**: Proper responsive breakpoints for tablet and desktop
- **Touch-Friendly**: Large touch targets for mobile users

### Accessibility
- Keyboard navigation support
- Screen reader friendly
- Clear visual feedback
- Error messages and validation

## Navigation

### Desktop Navigation
- "Watched History" link in the main navigation bar (visible when logged in)

### Mobile Navigation
- "Watched" link in the bottom navigation bar (visible when logged in)
- Eye icon for easy recognition

## Future Enhancements

Potential improvements planned for the future:

1. **Review Likes**: Allow users to like reviews (schema already supports this)
2. **Review Comments**: Add comments to reviews
3. **Export History**: Export watched history as CSV or JSON
4. **Import from Other Services**: Import from Letterboxd, IMDb, etc.
5. **Rating Trends**: Show rating trends over time
6. **Genre Statistics**: More detailed genre-based statistics
7. **Year Statistics**: Statistics by year watched
8. **Review Sharing**: Share reviews with friends
9. **Review Templates**: Pre-defined review templates
10. **Rating Reminders**: Remind users to rate movies they've watched

---

## Technical Implementation

### Database Structure

#### Reviews Collection (`reviews`)

```typescript
{
  userId: string;           // Firebase user ID
  movieId: string;          // TMDB movie ID
  rating: number;            // 1-10 (required)
  body?: string;             // Optional review text
  watchedAt: Timestamp;      // When the movie was watched
  likesCount: number;        // Denormalized (default: 0)
  createdAt: Timestamp;     // When review was created
  updatedAt: Timestamp;      // When review was last updated
}
```

**Constraints:**
- One review per user per movie (enforced in application logic)
- Rating must be between 1 and 10

### API Routes

#### `/api/reviews` (GET, POST)

**GET** - Get user's reviews/watched history
- Query params: Optional `movieId` to filter by specific movie
- Returns: Array of reviews with movie details
- Authentication: Required

**POST** - Create or update review
- Body: `{ movieId: string, rating: number, body?: string, watchedAt?: Date }`
- Returns: Created/updated review
- Validation: Rating must be 1-10
- Authentication: Required

#### `/api/reviews/[movieId]` (GET, PUT, DELETE)

**GET** - Get review for specific movie (current user)
- Returns: Review object or null
- Authentication: Optional (returns null if not authenticated)

**PUT** - Update review
- Body: `{ rating?: number, body?: string, watchedAt?: Date }`
- Returns: Updated review
- Authentication: Required

**DELETE** - Delete review (mark as unwatched)
- Returns: Success status
- Authentication: Required

### Components

#### RatingDialog (`app/components/RatingDialog.tsx`)

Main dialog component for rating movies.

**Props:**
```typescript
interface RatingDialogProps {
  movieId: string | number;
  movieTitle: string;
  existingReview?: Review;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
}
```

**Features:**
- Star rating interface (1-10)
- Date picker for watched date
- Optional review text area
- Watchlist removal prompt
- Error handling and validation
- Toast notifications for success/error

#### MarkWatchedButton (`app/components/MarkWatchedButton.tsx`)

Button component that opens rating dialog for marking movies as watched.

**Props:**
```typescript
interface MarkWatchedButtonProps {
  movieId: string | number;
  movieTitle: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  onSave?: () => void;
}
```

**Features:**
- Shows checkmark if already watched
- Opens RatingDialog on click
- Handles authentication (redirects to login if needed)
- Refreshes watched status after save

#### RatingButton (`app/components/RatingButton.tsx`)

Quick rating button for movie cards.

**Props:**
```typescript
interface RatingButtonProps {
  movieId: string | number;
  movieTitle: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showBadge?: boolean;
  onSave?: () => void;
}
```

**Features:**
- Shows current rating if exists
- Opens RatingDialog on click
- Can display as badge or button
- Rating badge shows star icon with rating number

#### Watched Page (`app/watched/page.tsx`)

Complete watched history page with filtering, sorting, and statistics.

**Features:**
- Fetches all user reviews
- Fetches movie details for each review
- Real-time filtering and sorting
- Statistics calculation
- Delete reviews functionality
- Empty states and error handling
- Responsive grid layout

### Integration Points

#### Movie Detail Page

- `MarkWatchedButton` component added
- Rating display card showing user's rating
- Quick rating button for updates
- Fetches and displays existing rating on load

#### Movie Cards

- `RatingButton` added to all movie cards:
  - Homepage main grid
  - Genre section cards
  - IMDb 8+ section cards
  - RT 80%+ section cards
  - Genre page cards
- Rating badges displayed when user has rated

#### Navigation

- "Watched History" link added to desktop navigation
- "Watched" link added to mobile bottom navigation
- Both links require authentication

### Statistics Calculation

#### Total Watched
- Count of all reviews in database for the user

#### Average Rating
- Sum of all ratings divided by total count
- Formula: `sum(ratings) / count(reviews)`

#### Rating Distribution
- Counts movies in each rating range:
  - 1-3: Low ratings
  - 4-6: Medium ratings
  - 7-8: Good ratings
  - 9-10: Excellent ratings
- Visual representation as percentage bars

#### Top Rated Count
- Count of movies rated 9 or 10

### Error Handling

#### Authentication Errors
- User redirected to login if not authenticated
- Clear error messages for authentication failures

#### API Errors
- Toast notifications for API failures
- Graceful fallbacks for missing movie data
- Error states displayed in UI

#### Date Handling
- Safe conversion of Firestore Timestamps to JavaScript Dates
- Fallback to current date for invalid dates
- Proper handling of different date formats

#### Validation
- Rating must be between 1 and 10
- Movie ID must be provided
- Date validation for watched date

## Testing Checklist

- [x] Create review via rating dialog
- [x] Update existing review
- [x] Delete review
- [x] Rate from movie detail page
- [x] Rate from movie cards
- [x] Rate from watched history page
- [x] Watchlist removal prompt works
- [x] Watched history page displays correctly
- [x] Filtering works (by rating range)
- [x] Sorting works (by date, rating, title)
- [x] Statistics calculate correctly
- [x] Search functionality works
- [x] Rating badges display on cards
- [x] Rating display on detail page
- [x] Authentication required for all actions
- [x] Error handling works
- [x] Loading states display correctly
- [x] Empty states display correctly
- [x] Mobile responsive design works

## Files Created/Modified

### New Files
- `app/api/reviews/route.ts` - Reviews API endpoint
- `app/api/reviews/[movieId]/route.ts` - Single review API endpoint
- `app/components/RatingDialog.tsx` - Rating dialog component
- `app/components/RatingButton.tsx` - Quick rating button
- `app/components/MarkWatchedButton.tsx` - Mark as watched button
- `app/watched/page.tsx` - Watched history page

### Modified Files
- `app/movie/[id]/page.tsx` - Added rating buttons and display
- `app/page.tsx` - Added rating buttons to movie cards
- `app/genre/[id]/page.tsx` - Added rating buttons to movie cards
- `app/imdb-8-plus/page.tsx` - Added rating buttons to movie cards
- `app/rt-80-plus/page.tsx` - Added rating buttons to movie cards
- `app/components/BottomNav.tsx` - Added "Watched" navigation link
- `app/page.tsx` (header) - Added "Watched History" link in desktop nav

## Related Documentation

- [Watchlist & Ratings Plan](./watchlist-ratings-plan.md) - Initial planning document
- [Feature Specification](./feature-spec.md) - Overall feature specifications
