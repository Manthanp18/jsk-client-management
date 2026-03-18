# Deploy Trade Tracker to Railway

This guide will help you deploy your Trade Tracker application to Railway.

## Prerequisites

1. A [Railway account](https://railway.app/) (sign up free with GitHub)
2. Supabase database already set up (with tables created)
3. Your Supabase URL and Publishable Key ready

## Step-by-Step Deployment

### 1. Push Code to GitHub (if not already done)

```bash
# Initialize git (already done)
git add .
git commit -m "Ready for Railway deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/trade-tracker.git
git push -u origin main
```

### 2. Deploy to Railway

#### Option A: Deploy from GitHub (Recommended)

1. Go to [railway.app](https://railway.app/) and sign in with GitHub
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `trade-tracker` repository
5. Railway will automatically detect it's a Next.js project

#### Option B: Deploy with Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

### 3. Configure Environment Variables

After deployment, add your environment variables:

1. In Railway dashboard, go to your project
2. Click on **Variables** tab
3. Add these environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://ikhbykcdivmbnyqkydtf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_YOUR_KEY_HERE
```

**Replace** `YOUR_KEY_HERE` with your actual Supabase publishable key from `.env.local`

### 4. Deploy Settings (Automatic)

Railway automatically detects Next.js and uses these settings:

- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Node Version:** Detected from `package.json`

You don't need to configure these manually!

### 5. Custom Domain (Optional)

1. In Railway dashboard, go to **Settings**
2. Scroll to **Domains**
3. Click **Generate Domain** for a free `.railway.app` domain
4. Or add your custom domain

### 6. Verify Deployment

1. Railway will provide a URL like: `https://your-app.railway.app`
2. Open the URL and check:
   - ✅ Dashboard loads
   - ✅ Can add clients
   - ✅ Can enter daily PNL
   - ✅ Weekly settlement works

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable key | `sb_publishable_xxx` |

## Troubleshooting

### Build Fails

**Issue:** Build fails with dependency errors

**Solution:**
```bash
# Locally test the build
npm run build

# If successful, commit and push
git add .
git commit -m "Fix build"
git push
```

### App Shows Blank Page

**Issue:** App loads but shows blank page

**Solution:**
- Check Railway logs in the dashboard
- Verify environment variables are set correctly
- Make sure Supabase URL and key are correct

### Database Connection Errors

**Issue:** "Failed to load clients" or similar errors

**Solution:**
- Verify Supabase credentials in Railway environment variables
- Check that database tables are created (run `supabase-schema.sql`)
- Verify RLS policies allow access with publishable key

### Port Already in Use (Local)

**Issue:** Railway uses different ports

**Solution:**
Railway automatically assigns ports. Your app will work with the default Next.js config. No changes needed!

## Updating Your Deployment

After making changes:

```bash
git add .
git commit -m "Your update message"
git push
```

Railway automatically redeploys when you push to `main` branch!

## Railway Project Structure

```
Your Railway Project
├── Service: trade-tracker (Next.js app)
│   ├── Environment Variables
│   ├── Deployments (auto-deploy on push)
│   └── Logs
└── Domain: your-app.railway.app
```

## Cost

- **Free Tier:** $5 credit per month, enough for small apps
- **Pro Plan:** $20/month for unlimited usage
- Your Trade Tracker app should fit comfortably in the free tier!

## Post-Deployment Checklist

- [ ] App loads successfully
- [ ] Environment variables set
- [ ] Can add clients
- [ ] Daily PNL entry works
- [ ] Weekly settlement shows data
- [ ] Reports page accessible
- [ ] Custom domain configured (optional)

## Support

If you encounter issues:
1. Check Railway logs in dashboard
2. Verify environment variables
3. Test locally with `npm run build && npm start`
4. Check Supabase connection

Your app is now live and accessible from anywhere! 🚀
