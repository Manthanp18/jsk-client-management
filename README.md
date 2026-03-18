# Trade Tracker

A modern trade tracking application built with Next.js and Supabase.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database & Auth:** Supabase
- **Deployment:** Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 20+ installed
- A Supabase account and project

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up your environment variables:

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Get your Supabase URL and Publishable Key (`sb_publishable_...`) from your [Supabase project settings](https://app.supabase.com/project/_/settings/api). The legacy anon key is being phased out in favor of the new Publishable Key format.

3. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── lib/              # Utility functions and configurations
│   │   └── supabase/     # Supabase client configurations
│   └── types/            # TypeScript type definitions
├── public/               # Static assets
└── ...config files
```

## Supabase Setup

This project uses Supabase for:
- **Authentication:** User management and auth
- **Database:** PostgreSQL database
- **Real-time:** Real-time subscriptions (optional)
- **Storage:** File storage (optional)

### Setting up your Supabase project

1. Create a new project at [supabase.com](https://supabase.com)
2. Get your project URL and Publishable Key (`sb_publishable_...`) from the API settings
3. Add them to your `.env.local` file

**Note:** Supabase has introduced new API keys:
- **Publishable Key** (`sb_publishable_...`) - Replaces the legacy anon key, safe for client-side use
- **Secret Key** (`sb_secret_...`) - Replaces the legacy service_role key, for server-side operations only

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
