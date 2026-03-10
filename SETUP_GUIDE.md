# DWELL Journal App — Setup Guide

A step-by-step guide for getting your journal app running. No coding experience needed — just follow each step in order.

---

## What You'll Need
- A computer with an internet connection
- About 30 minutes

---

## Step 1 — Install the tools

1. Go to **https://nodejs.org** and download the **LTS** version. Install it.
2. Open **Terminal** (Mac) or **Command Prompt** (Windows).
3. Paste this and press Enter to check it worked:
   ```
   node --version
   ```
   You should see something like `v20.11.0`.

---

## Step 2 — Create your Next.js project

In Terminal, paste these commands one at a time, pressing Enter after each:

```bash
npx create-next-app@latest dwell-journal --typescript --app --no-tailwind --eslint
cd dwell-journal
npm install @supabase/ssr @supabase/supabase-js
```

When `create-next-app` asks questions, just press **Enter** to accept the defaults.

---

## Step 3 — Add the code files

Copy the files from this package into your project:

| File from this package | Where to put it in your project |
|---|---|
| `app/login/page.tsx` | `dwell-journal/app/login/page.tsx` |
| `app/journal/page.tsx` | `dwell-journal/app/journal/page.tsx` |
| `lib/supabase.ts` | `dwell-journal/lib/supabase.ts` |

You may need to **create** the `app/login/`, `app/journal/`, and `lib/` folders if they don't exist.

---

## Step 4 — Create your Supabase project

1. Go to **https://supabase.com** and create a free account.
2. Click **"New project"**. Give it a name like `dwell-journal`. Choose a region close to you. Set a database password and save it somewhere safe.
3. Wait about 2 minutes for the project to be created.

---

## Step 5 — Create the database table

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar.
2. Click **"New query"**.
3. Open the file `supabase_schema.sql` from this package and copy its entire contents.
4. Paste it into the SQL editor and click **"Run"**.
5. You should see "Success. No rows returned."

---

## Step 6 — Get your API keys

1. In Supabase, click **Settings** (gear icon) → **API**.
2. You'll see two values you need:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **anon public** key — a long string of letters

---

## Step 7 — Add your keys to the project

1. In your `dwell-journal` folder, create a new file called **`.env.local`** (note the dot at the start).
2. Paste this into it, replacing the placeholder values with your real ones:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

---

## Step 8 — Enable Email Auth in Supabase

1. In Supabase, go to **Authentication** → **Providers**.
2. Make sure **Email** is enabled (it is by default).
3. Optional: Under **Authentication → Settings**, turn off "Confirm email" if you want users to log in immediately without email verification.

---

## Step 9 — Run the app!

In Terminal, make sure you're in the `dwell-journal` folder and run:

```bash
npm run dev
```

Open your browser and go to **http://localhost:3000/login**

You should see the DWELL Journal login page. Create an account and start journaling!

---

## Step 10 — Deploy to the internet (optional)

To share the app or access it from your phone:

1. Create a free account at **https://vercel.com**
2. Install Vercel: `npm install -g vercel`
3. In your project folder run: `vercel`
4. Follow the prompts. When asked about environment variables, add your two Supabase keys.

Your app will be live at a URL like `https://dwell-journal.vercel.app`.

---

## Troubleshooting

**"Module not found" error** — Make sure you ran `npm install @supabase/ssr @supabase/supabase-js`

**"Invalid API key" error** — Double-check your `.env.local` file has the correct values with no extra spaces.

**Can't log in** — In Supabase → Authentication → Settings, try turning off email confirmation temporarily.

**Page shows a blank screen** — Open browser DevTools (F12) → Console tab to see the error message.

---

## Questions?

This app was built to match the PCBC DWELL Journal format. The reading plan covers January–March 2026. A new edition can be created for each quarter by updating the `READING_PLAN` object in `app/journal/page.tsx`.
