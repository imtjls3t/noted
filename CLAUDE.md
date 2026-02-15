# Noted.

Voice-first event logging PWA. Speak it, save it, search it later.

## Stack

- **Svelte 5** (runes: `$state`, `$effect`, `$props`) + **Vite 7** — no SvelteKit
- **Supabase** — auth (email/password) and Postgres (`events` + `profiles` tables)
- **OpenAI Whisper** — speech-to-text via Supabase Edge Function (premium users)
- **Web Speech API** — `SpeechRecognition` for voice input (free fallback)
- **Service worker** — network-first caching strategy (`public/sw.js`), versioned cache (`noted-vN`)
- Deployed via **gh-pages** to `/noted/` base path

## Project structure

```
src/
  main.js              # mount + SW registration
  admin.js             # mount admin app (separate entry point)
  App.svelte           # session gate, tab routing (record | search)
  AdminApp.svelte      # admin panel: auth gate, user list, premium toggle
  app.css              # global reset + dark theme base
  lib/
    supabase.js        # client init + CRUD (addEvent, searchEvents, updateEvent, deleteEvent)
    profiles.js        # profiles CRUD (getMyProfile, listProfiles, togglePremium)
    speech.js          # SpeechRecognition wrapper (createRecognition, isSupported)
    transcribe.js      # Whisper transcription via Supabase Edge Function
  components/
    TabBar.svelte      # bottom nav (Record / Search)
    EventCard.svelte   # event display with inline edit + delete
  views/
    Login.svelte       # email/password sign-in / sign-up
    Record.svelte      # voice recording flow with modal, auto-starts recording on mount
    Search.svelte      # debounced search with ilike, renders EventCard list
admin/
  index.html           # admin panel HTML entry point → /noted/admin
public/
  sw.js                # service worker (bump CACHE_NAME on each deploy)
  manifest.json        # PWA manifest
  icon.svg             # app icon
  logout/
    index.html         # standalone logout page → /noted/logout (3s redirect)
supabase/
  migrations/
    create_profiles.sql # profiles table, RLS, trigger, seed
  functions/
    transcribe/
      index.ts         # Edge Function: auth + premium check → OpenAI Whisper
```

## Dev commands

```sh
npm run dev        # local dev server
npm run build      # production build → dist/
npm run preview    # preview production build
npm run deploy     # build + gh-pages deploy
```

## Conventions

- Dark theme throughout — backgrounds: `#0a0f1e`, `#16213e`; accent: `#e94560`; text: `#e0e0e0`; muted: `#8892b0`
- Mobile-first, uses `dvh` units and `env(safe-area-inset-bottom)`
- Svelte 5 runes only — no legacy `$:` reactive statements or `export let` props
- No TypeScript — plain JS with `checkJs` enabled via jsconfig
- Inline `<style>` in each component (scoped), global styles in `app.css`
- Environment variables prefixed with `VITE_` (see `.env.example`)
- `VITE_SUPABASE_ANON_KEY` must be the JWT-format anon key (not `sb_publishable_`)

## Versioning & deploys

- `APP_VERSION` in `Record.svelte` and `CACHE_NAME` in `public/sw.js` must be bumped together on each deploy
- Record view shows version number + Update button (bottom-right) to nuke SW cache and reload
- Edge Function deployed with `--no-verify-jwt` (auth verified manually in function code)
- Deploy edge function: `SUPABASE_ACCESS_TOKEN=... npx supabase functions deploy transcribe --no-verify-jwt`

## Premium & admin

- Premium status stored in `profiles` table (`is_premium` boolean), managed via admin panel at `/noted/admin`
- Admin email: `usual-polo-uphill@duck.com` (hardcoded in `AdminApp.svelte` and RLS policies)
- `profiles` table: `id` (UUID, FK to auth.users), `email`, `is_premium`, `created_at`
- RLS: admin gets full access, users can read own profile
- Trigger `on_auth_user_created` auto-creates profile row on signup
- Vite multi-page build: `index.html` (main app) + `admin/index.html` (admin panel)

## Whisper transcription

- Premium path: MediaRecorder → audio blob → Edge Function → OpenAI Whisper API
- Free path: Web Speech API via `speech.js`
- Edge function checks `profiles.is_premium` via service role key (no more hardcoded email)
- Supabase secrets needed: `OPENAI_API_KEY` (+ built-in `SUPABASE_SERVICE_ROLE_KEY`)
