# Online Chat Room

A private, two-person chat room. No accounts, no chat history — the moment
the chat ends, every message is permanently deleted from the database.

Built with **React (Vite) + Tailwind CSS + Framer Motion** on the frontend
and **Supabase (Postgres + Auth + Realtime)** on the backend.

## What it does

- Landing page → "Get started" → create a room
- You get a private link to send to exactly one other person
- The room locks the moment the second person joins (enforced in the
  database, not just the UI — see `supabase/schema.sql`)
- Realtime chat: text, emoji, and GIFs (via Giphy)
- "End chat" deletes the room, its messages, and its participant records for
  **both** people, instantly, via a realtime event

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project.
2. Once it's ready, go to **Authentication → Sign In / Up** and enable
   **"Allow anonymous sign-ins"**. This app uses anonymous auth so every
   visitor gets a stable, unguessable identity without needing to sign up —
   this is what the security rules use to enforce "only 2 people per room."
3. Go to **SQL Editor**, paste in the contents of `supabase/schema.sql`, and
   run it. This creates the tables, the trigger that hard-enforces the
   2-person cap, the row-level security policies, and enables realtime.
4. Go to **Settings → API** and copy your **Project URL** and **anon public
   key**.

## 2. Configure the app

```bash
cp .env.example .env
```

Fill in `.env`:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_GIPHY_API_KEY=your-giphy-key   # optional, see below
```

GIFs need a free Giphy key from
[developers.giphy.com/dashboard](https://developers.giphy.com/dashboard)
(Create an app → Settings → API key). If you skip this, everything else
works fine — the GIF tab just shows a short message instead.

## 3. Run it

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`).

## 4. Build for production

```bash
npm run build
```

Deploy the `dist/` folder to Vercel, Netlify, Cloudflare Pages, or any
static host. No server component is needed — Supabase is the backend.

## How the 2-person limit is actually enforced

It's tempting to check "are there already 2 people?" in the React code, but
two browser tabs could both pass that check at the same instant. So the real
enforcement lives in `supabase/schema.sql`:

- A Postgres trigger (`enforce_room_capacity`) runs **before every insert**
  into `room_participants` and rejects the insert if the room already has 2
  rows — atomically, inside the database transaction.
- Row Level Security policies make sure people can only read/write messages
  in rooms they've actually joined, and only delete a room (end the chat) if
  they're a participant in it.

## How "end chat" deletes everything

Ending a chat deletes the room's row in the `rooms` table. Because
`room_participants` and `messages` both reference `room_id` with
`on delete cascade`, that single delete wipes every message and participant
record with it. The other person's browser is subscribed to that room via
Supabase Realtime, so the deletion is what ends the chat on their screen too
— there's no separate "notify the other person" step to keep in sync.

## Project structure

```
src/
  lib/             Supabase client, Giphy API helper
  hooks/           anonymous-auth + realtime-presence hooks
  utils/           short room-code generator
  components/      reusable UI: message bubbles, pickers, modals
  pages/
    Landing.jsx     hero + "Get started"
    CreateRoom.jsx  generates the room + link
    RoomGate.jsx    looks up a room by code, handles waiting/full/ended states
    ChatRoom.jsx    the live chat itself
supabase/
  schema.sql       tables, capacity trigger, RLS policies, realtime setup
```
