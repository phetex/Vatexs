# Vatexs

A mobile marketplace for buying and selling fashion, tech, home goods and more. Built with Expo (React Native + TypeScript) and Supabase.

## Stack

- **App**: Expo SDK 57, Expo Router (file-based navigation), TypeScript
- **Backend**: Supabase — Postgres database, Auth, Storage (listing photos), Realtime (chat)

## Features (MVP)

- Email/password sign up & sign in
- Browse listings by category, search by keyword
- Create a listing with multiple photos, price, condition, category, location
- Listing detail page with favorites
- In-app messaging between buyer and seller, per listing
- Profile page with your own listings and sign out

No payment processing yet — buyers and sellers arrange payment/handover themselves after messaging (contact-to-buy model), same as most classifieds apps at MVP stage.

## Setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project.
2. In **SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and run it. This creates all tables, row-level security policies, the `listing-images` storage bucket, and seeds default categories.
3. In **Settings → API**, copy the **Project URL** and **anon public** key.
4. In **Authentication → Providers**, email/password is enabled by default. For faster local testing, you can turn off "Confirm email" under **Authentication → Settings**.

### 2. Configure the app

```bash
cp .env.example .env
```

Fill in `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env` with the values from step 1.

### 3. Run it

```bash
npm install
npm start
```

Then press `i` for iOS simulator, `a` for Android emulator, `w` for web, or scan the QR code with the Expo Go app on your phone.

## Project layout

```
app/                 Screens (Expo Router file-based routes)
  (auth)/             Welcome, sign in, sign up — shown when signed out
  (tabs)/              Home, Search, Sell, Messages, Profile — shown when signed in
  listing/[id].tsx      Listing detail
  chat/[id].tsx          Conversation thread
  edit-profile.tsx        Modal to edit your profile
src/
  components/          Shared UI (Button, TextField, ListingCard, ...)
  context/AuthContext.tsx  Session + profile state
  hooks/               Data-fetching hooks (listings, messages, favorites, ...)
  lib/                 Supabase client, image upload, formatting helpers
  theme/                Colors, spacing, radius tokens
  types/database.ts       TypeScript types matching the Postgres schema
supabase/schema.sql   Full database schema, RLS policies, storage bucket, seed data
```

## Known limitations / next steps

- No payments yet — add Stripe Connect if you want in-app checkout and seller payouts.
- No push notifications for new messages (Supabase Realtime keeps an open chat screen live, but a backgrounded app won't be notified — add Expo push notifications + a Supabase Edge Function trigger for that).
- No content moderation / report flow.
- No pagination on listing/search grids yet — fine at low listing volume, add infinite scroll before scaling.
