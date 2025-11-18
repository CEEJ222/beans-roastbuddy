# Setup Guide for Beans Coffee Catalog Admin

This guide will help you set up the beans.roastbuddy.app admin interface.

## Prerequisites

- Node.js 18+ installed
- Supabase project with database access
- HuggingFace Space API endpoint (for scraping)

## Step 1: Install Dependencies

```bash
cd beans-roastbuddy
npm install
```

## Step 2: Environment Variables

Create a `.env.local` file in the `beans-roastbuddy` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
HF_SPACE_API_URL=https://your-hf-space.hf.space/api/scrape
```

You can find your Supabase credentials in:
- Supabase Dashboard → Settings → API
- `NEXT_PUBLIC_SUPABASE_URL`: Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon public key

## Step 3: Database Migration

Run the migration to create the `vendor_coffee_catalog` table:

### Option A: Using Supabase SQL Editor

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the contents of `backend/migrations/create_vendor_coffee_catalog.sql`
4. Paste and run the SQL

### Option B: Using psql

```bash
psql -h your_db_host -U your_user -d your_database -f backend/migrations/create_vendor_coffee_catalog.sql
```

## Step 4: Configure Admin Access

By default, all authenticated users can access the admin interface. To restrict access:

1. Edit `lib/auth.ts`
2. Uncomment and configure the admin check:

```typescript
// Option 1: Check by email
const adminEmails = ['your-admin-email@example.com']
if (!adminEmails.includes(user.email || '')) {
  redirect('/unauthorized')
}

// Option 2: Check by user metadata
const isAdmin = user.user_metadata?.is_admin === true
if (!isAdmin) {
  redirect('/unauthorized')
}
```

## Step 5: Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

You'll be redirected to `/login` if not authenticated.

## Step 6: Test the Flow

1. **Login**: Sign in with your Supabase credentials
2. **Scrape**: Go to `/beans/scraper` and paste a coffee product URL
3. **Review**: Go to `/beans/review` to see pending profiles
4. **Approve/Reject**: Click on a profile to review and approve or reject

## Troubleshooting

### "Unauthorized" error
- Check that you're logged in
- Verify admin access configuration in `lib/auth.ts`

### Database errors
- Ensure the migration ran successfully
- Check that RLS policies allow authenticated users to read/write

### Scraping fails
- Verify `HF_SPACE_API_URL` is correct
- Check that the HuggingFace Space API is running
- Review API response format matches expected structure

## Next Steps

- Configure your HuggingFace Space API endpoint
- Set up admin email restrictions
- Deploy to production (Vercel, Railway, etc.)
- Configure subdomain routing for `beans.roastbuddy.app`

