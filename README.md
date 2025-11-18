# Beans Coffee Catalog Admin

Admin interface for building a curated database of green coffee beans from online vendors.

## Overview

This is a Next.js application that provides an admin interface for:
- Scraping coffee profiles from vendor websites using AI
- Reviewing and approving scraped profiles
- Building a comprehensive catalog of available green coffee beans

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
HF_SPACE_API_URL=your_huggingface_space_api_url
```

### 3. Database Setup

Run the migration to create the `vendor_coffee_catalog` table:

```bash
# From the backend directory
psql -h your_db_host -U your_user -d your_database -f migrations/create_vendor_coffee_catalog.sql
```

Or use the Supabase SQL editor to run the migration.

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Routes

- `/login` - Admin login page
- `/beans/scraper` - Scrape coffee profiles from URLs
- `/beans/review` - Review queue of pending profiles
- `/beans/review/[id]` - Review detail page for a specific profile

## Features

- **Single URL Scraping**: Paste a URL and scrape one profile
- **Bulk URL Scraping**: Paste multiple URLs (one per line) to scrape many profiles
- **Review Queue**: See all pending profiles that need review
- **Approve/Reject**: Review each profile, edit fields, and approve or reject
- **Admin Authentication**: Protected routes requiring admin login

## Architecture

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Supabase for database and authentication
- **Scraping**: HuggingFace Space API for AI-powered web scraping
- **Database**: Isolated `vendor_coffee_catalog` table (separate from main app)

## Development

The app uses:
- Next.js App Router for routing
- Supabase SSR for server-side authentication
- Client components for interactive UI
- Server components for data fetching

## Deployment

This app is designed to be deployed to `beans.roastbuddy.app` as a subdomain.

