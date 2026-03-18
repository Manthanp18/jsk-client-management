# Database Setup Guide

## Step 1: Create Tables in Supabase

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase-schema.sql`
5. Paste it into the SQL editor
6. Click **Run** to execute the schema

## Step 2: Verify Tables Created

After running the SQL, verify these tables exist in **Table Editor**:
- `clients`
- `daily_pnl`
- `withdrawals`
- `commission_payments`

## Step 3: Generate TypeScript Types

Run this command to generate TypeScript types from your database:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
```

Get your project ID from your Supabase project URL:
`https://app.supabase.com/project/YOUR_PROJECT_ID`

## Database Schema Overview

### Tables

**clients**
- Stores client information, investment amount, commission %, and running totals
- Key fields: `invested_amount`, `commission_percentage`, `total_profit`, `total_withdrawals`, `commission_due`, `commission_received`

**daily_pnl**
- Daily profit/loss entries for each client
- Constraint: One entry per client per day
- PNL can be positive (profit) or negative (loss)

**withdrawals**
- Tracks all client withdrawals
- Links to client and includes amount and date

**commission_payments**
- Tracks commission payments received from clients
- Links to client and includes amount and date

### Views

**weekly_reports**
- Automatically calculated weekly PNL per client
- Week runs Monday to Friday
- Groups by week and shows total weekly PNL

## Row Level Security (RLS)

The schema includes RLS policies that allow all operations for authenticated users. You can customize these policies based on your security requirements.

## Next Steps

After setting up the database:
1. Generate TypeScript types (see Step 3 above)
2. The app will automatically connect using your environment variables
3. Start adding clients and daily PNL entries through the UI
