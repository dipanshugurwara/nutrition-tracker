# Nutrition Tracker

A MyFitnessPal-like calorie and protein tracking app powered by AI. Simply describe what you ate, and the app uses OpenAI to estimate calories and protein automatically.

## Features

- **Accounts & auth**: Sign up and sign in. Each user has their own entries and targets.
- **Personalized targets**: On sign-up, enter weight (kg), height (cm), age, gender, and activity level. The app estimates your daily **calorie** (TDEE) and **protein** targets using standard formulas (Mifflin–St Jeor + activity multipliers).
- **AI-powered nutrition**: Describe what you ate in plain language; OpenAI estimates calories and protein.
- **Dual metric tracking**: Track calories and protein vs your targets with progress bars.
- **Daily dashboard**: View today’s totals, add entries, and see recent meals.
- **Calendar view**: Monthly calendar with color-coded days (on track / over).
- **Daily detail**: Per-day entries, edit/delete, and adjust daily targets.
- **Mobile-friendly**: Responsive layout.
- **PWA**: Install on your phone as an app (Add to Home Screen on iOS and Android).

## Install as app (PWA)

- **Android**: Open the app in Chrome → menu (⋮) → “Add to Home screen” or “Install app.”
- **iOS**: Open in Safari → Share → “Add to Home Screen.”

The app will open in its own window without the browser UI.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. Clone or navigate to this directory
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   AUTH_SECRET=your_auth_secret   # run: npx auth secret
   ```
   For local dev, `AUTH_URL` can stay as `http://localhost:3000` (see `.env.example`).

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Database

The app uses SQLite for data storage. The database file will be automatically created in the `data/` directory on first run. This directory is gitignored to keep your data private.

## Usage

1. **Sign up**: Create an account at `/signup`. Enter email, password, weight (kg), height (cm), age, gender, and activity level. The app computes your suggested daily calories and protein.
2. **Sign in**: Log in at `/login`.
3. **Add food**: On the dashboard, describe what you ate (e.g. “Grilled chicken breast with rice and vegetables”) and click “Estimate Calories & Protein”. Adjust if needed, then save.
4. **Track progress**: Use the dashboard and calendar to monitor intake vs your targets.
5. **Adjust targets**: Open any day from the calendar to edit that day’s calorie and protein targets.

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **SQLite (better-sqlite3)** - Database
- **NextAuth (v5)** - Auth (credentials + JWT)
- **OpenAI API** - Nutrition estimation

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Set environment variables: `OPENAI_API_KEY`, `AUTH_SECRET` (run `npx auth secret`), and `AUTH_URL` (e.g. `https://your-app.vercel.app`).
4. Deploy!

The app will work on any device with a browser once deployed.

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS
- Google Cloud
- Your own server

Make sure to set the `OPENAI_API_KEY` environment variable in your deployment platform.

## Project Structure

```
/
├── app/
│   ├── api/              # API routes
│   ├── calendar/          # Calendar view page
│   ├── day/[date]/        # Daily detail pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Dashboard
├── components/            # Reusable React components
├── lib/
│   ├── db.ts             # Database functions
│   └── utils.ts          # Utility functions
└── data/                 # SQLite database (gitignored)
```

## License

MIT
