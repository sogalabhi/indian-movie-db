# Indian Movie Database

A comprehensive movie database and social platform for Indian cinema enthusiasts. Browse movies, manage your watchlist, compare films, read news, and engage with the community.

## Features

| Feature | Status | Description |
|---------|--------|-------------|
| ✅ **Personal Profile** | ⬜ | A dedicated profile page displaying your avatar, username, and activity |
| ✅ **Watchlist** | ✅ | A simple "Bookmark" button to save movies you want to watch later |
| ✅ **Watched History & Ratings** | ⬜ | A personal log of every movie you have seen, along with your 1-10 rating |
| ✅ **Movie Discussions** | ⬜ | A comment section on every movie page to reply to others and start threads |
| ✅ **Cinema News Feed** | ✅ | A "News" tab that shows the latest industry updates (comments feature pending) |
| ✅ **User Reviews** | ⬜ | A place to write and publish detailed reviews for the community to read |
| ✅ **Write Articles** | ⬜ | A feature allowing you to write and publish your own blog posts or essays about cinema |
| ✅ **Creator Collections** | ⬜ | Curated lists highlighting top directors and actors to help you discover their best work |
| ✅ **Likes & Engagement** | ⬜ | The ability to "Like" comments, reviews, and articles to show what you enjoy |
| ✅ **Movie Comparator** | ✅ | A tool to compare movies side-by-side, showing ratings, awards, and a custom "Match Score" based on your unique tastes |
| ✅ **IMDB and Rotten Tomatoes Ratings** | ✅ | Add IMDB and Rotten Tomatoes ratings in comparator |
| ✅ **IMDB 8+ and RT 80%+ Sections** | ⬜ | Make a separate section of IMDB 8+ and Rotten Tomatoes 80%+ |
| ✅ **Genre Based Sections** | ✅ | Genre based sections in the home page to scroll and check |

## Tech Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Movie Data**: The Movie Database (TMDB) API
- **Ratings Data**: OMDb API (IMDb & Rotten Tomatoes)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Firebase project setup
- TMDB API key
- OMDb API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd indian-movie-db
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key

# TMDB API
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key

# OMDb API
OMDB_API_KEY=your_omdb_api_key
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
indian-movie-db/
├── app/
│   ├── api/              # API routes
│   ├── components/        # React components
│   ├── contexts/          # React contexts
│   ├── movie/            # Movie detail pages
│   ├── watchlist/        # Watchlist page
│   ├── news/             # News feed page
│   ├── compare/           # Movie comparison page
│   └── page.tsx          # Home page
├── lib/
│   ├── firebase/         # Firebase configuration
│   └── auth/             # Authentication utilities
├── components/
│   └── ui/               # Shadcn UI components
└── docs/                  # Documentation
```

## Key Features Implementation

### ✅ Watchlist
- Add/remove movies to watchlist
- View all saved movies in dedicated page
- Bookmark button on movie cards and detail pages

### ✅ Movie Comparator
- Compare up to 4 movies side-by-side
- Shows ratings (TMDB, IMDb, Rotten Tomatoes)
- Displays runtime, budget, revenue, genres
- Awards information
- Match score calculation

### ✅ Cinema News Feed
- RSS feed aggregation from multiple sources
- Latest industry updates
- News cards with images and descriptions

### ✅ Genre Sections
- Horizontal scrollable sections for each genre
- Genre-based movie discovery
- "View All" links for each genre

### ✅ IMDB & Rotten Tomatoes Ratings
- Ratings displayed in movie detail pages
- Ratings shown in comparator tool
- OMDb API integration for rating data

## Development

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Linting

```bash
npm run lint
```

## Deployment

The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables
4. Deploy

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Acknowledgments

- [The Movie Database (TMDB)](https://www.themoviedb.org/) for movie data
- [OMDb API](http://www.omdbapi.com/) for ratings data
- [Firebase](https://firebase.google.com/) for authentication and database
- [Next.js](https://nextjs.org/) for the framework
- [Shadcn UI](https://ui.shadcn.com/) for UI components
