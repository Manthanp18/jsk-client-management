# Trade Tracker Setup Guide

Welcome to your Trade Tracker application! This guide will help you set up and start using the application.

## Prerequisites Completed ✅

- [x] Next.js 15 with TypeScript
- [x] Tailwind CSS
- [x] Supabase integration
- [x] shadcn/ui components
- [x] All pages and features built

## Step-by-Step Setup

### 1. Database Setup

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Open **SQL Editor** from the left sidebar
3. Click **New Query**
4. Open the file `supabase-schema.sql` in your project root
5. Copy all the SQL and paste it into the Supabase SQL Editor
6. Click **Run** to create all tables, views, and functions

**Tables Created:**
- `clients` - Stores client information and totals
- `daily_pnl` - Daily profit/loss entries
- `withdrawals` - Client withdrawal history
- `commission_payments` - Commission payment tracking
- `weekly_reports` (view) - Automatic weekly PNL calculations

### 2. Environment Variables (Already Set Up ✅)

Your `.env.local` file is already configured with:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase publishable key

### 3. Start the Application

```bash
npm run dev
```

The application will be available at: http://localhost:3000 (or 3001 if 3000 is in use)

## Application Features

### 1. Dashboard (`/`)
**Purpose:** Overview of all clients and their performance

**Features:**
- Total clients count
- Total invested amount
- Total profit across all clients
- Commission due and received
- Complete client list with key metrics

**Metrics Shown:**
- Invested amount
- Total profit/loss
- Current balance (Invested + Profit - Withdrawals)
- Commission percentage
- Commission due
- Total withdrawals
- Profit/Loss status badge

### 2. Clients Page (`/clients`)
**Purpose:** Manage your trading clients

**Features:**
- Add new clients with:
  - Name (required)
  - Email (optional)
  - Invested amount
  - Commission percentage
  - Current profit (for mid-period additions)
- View all clients in a detailed table
- Automatic commission calculation on profit

**Important:** When adding a client mid-period with existing profit, the commission will be automatically calculated based on the commission percentage you set.

### 3. Daily PNL Entry (`/daily-pnl`)
**Purpose:** Record daily profit/loss for each client

**Features:**
- Easy form to add daily PNL entries
- Select client from dropdown
- Enter date (defaults to today)
- Enter PNL amount (positive for profit, negative for loss)
- Optional notes
- Recent entries sidebar showing last 10 entries
- Full table of all recent entries
- Automatic update of client totals and commission due

**How It Works:**
1. Select a client
2. Choose the date
3. Enter the PNL amount (e.g., 5000 for profit, -3000 for loss)
4. Click "Add Entry"
5. The system automatically:
   - Updates the client's total profit
   - Recalculates commission due (only on profit)
   - Updates weekly reports

**Important:** You can only have one entry per client per day. If you try to add a duplicate, you'll be asked if you want to update the existing entry.

### 4. Reports Page (`/reports`)
**Purpose:** View weekly reports, withdrawals, and commission payments

**Three Tabs:**

#### a) Weekly Reports Tab
- Shows week-by-week profit/loss
- Week runs Monday to Friday only
- Displays:
  - Week start date (Monday)
  - Week end date (Friday)
  - Total weekly PNL
  - Number of trading days

#### b) Withdrawals Tab
- Record client withdrawals
- View withdrawal history
- Tracks total withdrawals
- Automatically updates current balance

**How to Record a Withdrawal:**
1. Select a client
2. Click "Record Withdrawal"
3. Enter amount and date
4. Add optional notes
5. Submit

#### c) Commission Tab
- Record commission payments received from clients
- View payment history
- Shows commission due and received
- Automatically updates commission due when payment is recorded

**How to Record a Commission Payment:**
1. Select a client
2. Click "Record Payment"
3. Enter the amount paid
4. Enter the payment date
5. Submit
6. Commission due is automatically reduced

## Business Logic

### Commission Calculation
Commission is calculated based on these rules:

1. **Only on Profit:** Commission is only calculated when the client is in profit
2. **Accumulated Basis:** If a client doesn't pay commission and makes more profit, it accumulates
3. **Loss Recovery:** If a client has a loss, they must recover that loss before new commission accrues
4. **Formula:** `Commission Due = (Total Profit × Commission %) - Commission Received`

**Example:**
- Client makes ₹10,000 profit in Week 1
- Commission % is 25%
- Commission due = ₹2,500
- Client withdraws profit but only pays ₹1,000 commission
- Commission due = ₹1,500 (still owed)
- Week 2: Client makes another ₹5,000 profit
- Total profit = ₹15,000
- New commission due = ₹3,750 - ₹1,000 (already received) = ₹2,750

### Current Balance
`Current Balance = Invested Amount + Total Profit - Total Withdrawals`

### Weekly Reports
- Weeks run Monday to Friday only (5 trading days)
- Weekend days are excluded
- Each week shows the sum of daily PNLs for that week

## Tips for Daily Usage

1. **Morning Routine:**
   - Check Dashboard for overview
   - Review commission due from all clients

2. **End of Trading Day:**
   - Go to Daily PNL page
   - Add PNL entries for each client who traded

3. **Friday Settlement:**
   - Review Weekly Reports for each client
   - Go to Reports → select client
   - Record withdrawals if any
   - Record commission payments received

4. **Adding Historical Data:**
   - You can add daily PNL entries for past dates
   - When adding a new client mid-period, enter their current profit in the "Add Client" form

## Database Schema Reference

### Clients Table
- `id` - Unique identifier
- `name` - Client name
- `email` - Client email (optional)
- `invested_amount` - Initial investment
- `commission_percentage` - Your commission rate (e.g., 25.00 for 25%)
- `total_profit` - Running total of all P&L (auto-calculated)
- `total_withdrawals` - Sum of all withdrawals (auto-calculated)
- `commission_due` - Outstanding commission (auto-calculated)
- `commission_received` - Total commission paid (auto-calculated)

### Daily PNL Table
- `id` - Unique identifier
- `client_id` - Links to client
- `date` - Date of the P&L
- `pnl_amount` - Profit (positive) or Loss (negative)
- `notes` - Optional notes

### Withdrawals Table
- `id` - Unique identifier
- `client_id` - Links to client
- `amount` - Withdrawal amount
- `withdrawal_date` - Date of withdrawal
- `notes` - Optional notes

### Commission Payments Table
- `id` - Unique identifier
- `client_id` - Links to client
- `amount` - Commission amount received
- `payment_date` - Date of payment
- `notes` - Optional notes

## Troubleshooting

### Database Connection Issues
- Verify your Supabase URL and publishable key in `.env.local`
- Check that the Supabase project is active
- Ensure RLS policies are set up (included in schema)

### No Clients Showing
- Add your first client using the "Add Client" button on the Clients page
- Check the Supabase Table Editor to verify data was inserted

### Weekly Reports Not Showing
- Weekly reports are generated automatically from daily PNL entries
- Ensure you've added daily PNL entries for the client
- Only Monday-Friday entries count (weekends excluded)

## Next Steps

1. **Run the schema.sql** in Supabase (if not done already)
2. **Add your first client**
3. **Start adding daily PNL entries**
4. **Review weekly reports each Friday**

## Support

For issues or questions:
- Check the Supabase Dashboard for database errors
- Review the browser console for client-side errors
- Check the Next.js terminal for server-side errors

---

**Happy Trading! 📈**
