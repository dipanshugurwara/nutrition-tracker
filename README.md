# Nutrition Tracker

A MyFitnessPal-like calorie and protein tracking app powered by AI. Simply describe what you ate, and the app uses OpenAI to estimate calories and protein automatically.

> Last updated: Test push to verify GitHub connection

## Features

- **AI-Powered Nutrition Estimation**: Describe your meals in natural language, and the app estimates calories and protein using OpenAI
- **Dual Metric Tracking**: Track both calories and protein against daily targets
- **Daily Dashboard**: View your progress with visual progress bars and summaries
- **Calendar View**: See your nutrition history at a glance with color-coded days
- **Daily Detail Pages**: View and manage entries for any specific day
- **Target Management**: Set and adjust daily calorie and protein targets
- **Mobile-Friendly**: Responsive design that works on all devices

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
   
   Then edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Database

The app uses SQLite for data storage. The database file will be automatically created in the `data/` directory on first run. This directory is gitignored to keep your data private.

## Usage

1. **Add Food Entries**: On the dashboard, describe what you ate (e.g., "Grilled chicken breast with rice and vegetables") and click "Estimate Calories & Protein"
2. **Review Estimates**: The AI will provide calorie and protein estimates. You can adjust them manually if needed
3. **Track Progress**: View your daily progress on the dashboard with visual indicators
4. **Calendar View**: Navigate to the Calendar page to see your nutrition history
5. **Set Targets**: Click on any day to view details and adjust your daily calorie and protein targets

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **SQLite (better-sqlite3)** - Database
- **OpenAI API** - Nutrition estimation

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add your `OPENAI_API_KEY` in the environment variables section
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
