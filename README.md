# Family Lists 🌸

A shared to-do / to-buy board for the family. Open the URL on any phone or
laptop, enter the family password once, and the lists are there — ticking,
adding, and editing sync live across everyone's devices.

**Live:** https://family-todo-self.vercel.app

## How it works

- **Vite + React** single-page app, deployed static on **Vercel**.
- **Supabase** (Postgres) for storage + **realtime** sync + auth.
- **One shared login.** Everyone signs in with the same account; only the
  password is ever typed. The database is locked down with Row-Level Security,
  so the public key alone reveals nothing — the password is the only way in.
- **Drizzle** defines the schema (`src/db/schema.ts`); the generated SQL lives
  in `drizzle/`.

## Using it

- Tap a checkbox to tick/untick (ticked items stay, struck through).
- Type in "Add an item…" and press Enter to add.
- Click an item's text to rename it; hover (or tap) the ✕ to delete it.
- The "⌄" menu on a list renames it / changes its emoji / deletes it.
- "New list" adds another list.

## Changing the family password

The password is the shared account's password. To change it, update the user
`family@todo.local` in the Supabase dashboard (Authentication → Users), or ask
Claude to rotate it. No code change or redeploy needed.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in the values (already done locally)
npm run dev
```

Environment variables (set in `.env.local` and in Vercel):

| Variable                        | What it is                        |
| ------------------------------- | --------------------------------- |
| `VITE_SUPABASE_URL`             | Supabase project URL              |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (client) key |
| `VITE_FAMILY_EMAIL`             | The shared account's email        |

## Deploying changes

```bash
npm run build      # type-checks and builds
vercel --prod      # deploy
```

## Schema changes

Edit `src/db/schema.ts`, then:

```bash
npx drizzle-kit generate   # writes new SQL to drizzle/
```

Apply the generated SQL to Supabase (SQL editor, the Supabase MCP, or the
Management API). `drizzle-kit push` also works if you put the database
connection string in `DATABASE_URL`.
