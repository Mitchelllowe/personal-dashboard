# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

A personal analytics dashboard for surfacing patterns in physical, emotional, and spiritual life. It ingests data from external sources (Oura Ring, weather, markets), collects daily manual check-ins, and over time identifies correlations — what precedes low mood, what improves resilience, what inputs most affect emotional baseline.

This is a personal clarity tool, not a product.

## Long-Term Vision

- Rolling correlation analysis (7/30/90-day windows) across all data sources
- Simple trend detection and anomaly flagging
- Daily reflection summaries
- Lightweight AI-assisted pattern summarization
- Predictive estimates: given today's inputs, how might I feel?

## Tech Stack

- **React + Vite** — frontend framework and build tool
- **React Router** — client-side routing
- **Tailwind CSS** — styling
- **Supabase** — database, authentication, and row-level security
- **GitHub OAuth** — login provider (configured in Supabase)
- **Supabase CLI** — database migrations (linked to the project)

Environment variables use the `VITE_` prefix. See `.env`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## Architecture

Four distinct layers — keep them cleanly separated:

1. **Data ingestion** — Oura Ring API, weather API, market data (VIX, S&P, etc.). Fetch and normalize into a consistent schema. Store results in Supabase.
2. **User input** — Daily check-ins: wake-up rating (1–10), bedtime rating (1–10), Bible reading (yes/no + if yes, what passage).
3. **Analysis** — Correlation and trend logic. Modular functions operating on stored data. Keep this layer independent of UI so it can evolve.
4. **Visualization** — React components consuming analyzed data. Prefer graphs for time-series, minimal prose for summaries.

## Design Philosophy

- **Calm and minimal** — the UI should feel reflective, not corporate.
- **Data-forward** — prioritize readability of data over visual decoration.
- **Graphs over tables** — use time-series charts for trends; include relevant visualizations.
- **No clutter** — only surface what is actionable or illuminating.

## Development Rules

1. No unnecessary dependencies — keep the bundle small and fast.
2. Semantic HTML throughout — accessibility is not optional.
3. Every view must be responsive and mobile-friendly.
4. Small, composable components — avoid monolithic files.
5. Minimal, explicit state management — no global state libraries unless clearly warranted.
6. Analysis logic lives outside components — pure functions, easy to test and extend.

## Security Rules

These apply to every feature without exception:

- Every database table must have Row Level Security (RLS) enabled.
- Every protected page must verify an active Supabase session before rendering.
- Never write queries that could expose one user's data to another.
- All database changes must be written as SQL migration files in `supabase/migrations/` and applied with `npx supabase db execute` — never ask the user to paste SQL into the Supabase dashboard manually.

## Non-Goals

- Multi-user support (though auth exists for personal access control)
- Native mobile app
- Real-time streaming data
- Complex backend infrastructure
- Feature parity with commercial wellness apps

## Commands

```bash
npm run dev      # start local dev server
npm run build    # production build
npm run preview  # preview production build locally
npm run lint     # run ESLint
```

Database migrations:
```bash
npx supabase db execute --file supabase/migrations/<filename>.sql
```

Edge functions (local):
```bash
npx supabase functions serve fetch-market-data --env-file supabase/functions/.env
```

## Project Structure

```
src/
  lib/supabase.js          # Supabase client (imported everywhere)
  components/
    ProtectedRoute.jsx     # Checks session; redirects to /login if unauthenticated
  pages/
    Login.jsx              # GitHub OAuth sign-in
    Dashboard.jsx          # Main authenticated view
supabase/
  functions/               # Edge Functions (server-side, Deno runtime)
  migrations/              # SQL migration files — all schema changes go here
```
