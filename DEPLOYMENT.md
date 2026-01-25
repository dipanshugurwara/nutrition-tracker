# Deployment Guide - Share Your Nutrition Tracker

This guide will help you deploy your app so others can use it online.

## Option 1: Vercel (Recommended - Easiest)

Vercel is the easiest way to deploy Next.js apps. It's free and takes just a few minutes.

### Steps:

1. **Push your code to GitHub** (if you haven't already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Sign up for Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign up with your GitHub account (free)

3. **Import your project**:
   - Click "Add New Project"
   - Select your GitHub repository
   - Vercel will auto-detect Next.js settings

4. **Add Environment Variables**:
   - In the project settings, go to "Environment Variables"
   - Add: `OPENAI_API_KEY` = your OpenAI API key
   - Add: `DATABASE_PATH` = `/tmp/nutrition.db` (for serverless)
   
   **Important**: For Vercel's serverless functions, we need to use a different database approach. See the note below.

5. **Deploy**:
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app will be live at `your-app-name.vercel.app`

### Important: Database for Vercel

Vercel uses serverless functions, so SQLite files don't persist. You have two options:

**Option A: Use Vercel KV (Redis) or Vercel Postgres** (Recommended for production)
- Free tier available
- Data persists across deployments
- Requires code changes to use a different database

**Option B: Use a cloud SQLite service** like Turso or Cloudflare D1

**Option C: Quick fix for testing** - Use `/tmp/nutrition.db` but data will reset on each deployment

## Option 2: Netlify

Similar to Vercel:

1. Push code to GitHub
2. Sign up at [netlify.com](https://netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect GitHub and select your repo
5. Add environment variables in Site settings → Environment variables
6. Deploy!

## Option 3: Self-Hosted (Your Own Server)

If you have a VPS or server:

1. **Install Node.js** on your server
2. **Clone your repository**:
   ```bash
   git clone YOUR_REPO_URL
   cd development
   npm install
   ```
3. **Set environment variables**:
   ```bash
   export OPENAI_API_KEY=your_key
   ```
4. **Build and run**:
   ```bash
   npm run build
   npm start
   ```
5. **Use a process manager** like PM2:
   ```bash
   npm install -g pm2
   pm2 start npm --name "nutrition-tracker" -- start
   ```

## Option 4: Docker (For Advanced Users)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Then:
```bash
docker build -t nutrition-tracker .
docker run -p 3000:3000 -e OPENAI_API_KEY=your_key nutrition-tracker
```

## Sharing Your App

Once deployed, you'll get a URL like:
- `https://your-app-name.vercel.app` (Vercel)
- `https://your-app-name.netlify.app` (Netlify)
- `https://your-domain.com` (Custom domain)

Share this URL with anyone! They can:
- Use it on any device (phone, tablet, computer)
- Access it from anywhere with internet
- No installation needed - just open in a browser

## Custom Domain (Optional)

You can add your own domain:
- **Vercel**: Project Settings → Domains → Add your domain
- **Netlify**: Site Settings → Domain Management → Add custom domain

## Important Notes

1. **Database Persistence**: For production, consider upgrading to a proper database (PostgreSQL, MySQL) instead of SQLite
2. **API Key Security**: Never commit your `.env` file to GitHub
3. **Rate Limiting**: Consider adding rate limiting for the OpenAI API to prevent abuse
4. **User Authentication**: For multiple users, you'll need to add authentication

## Quick Start (Vercel - 5 minutes)

1. Push to GitHub
2. Go to vercel.com → Import Project
3. Add `OPENAI_API_KEY` environment variable
4. Deploy
5. Share the URL!

Your app will be live and shareable in minutes! 🚀
