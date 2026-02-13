# Event Log

Voice-first event logging PWA. Speak an event, save it, search it later.

## Stack

- **Svelte 5** (runes: `$state`, `$effect`, `$props`) + **Vite 7** — no SvelteKit
- **Supabase** — auth (email/password) and Postgres (`events` table with `id`, `keywords`, `user_id`, `timestamp`)
- **Web Speech API** — `SpeechRecognition` for voice input
- **Service worker** — network-first caching strategy (`public/sw.js`)
- Deployed via **gh-pages** to `/event-log/` base path

## Project structure

```
src/
  main.js              # mount + SW registration
  App.svelte           # session gate, tab routing (record | search)
  app.css              # global reset + dark theme base
  lib/
    supabase.js        # client init + CRUD (addEvent, searchEvents, updateEvent, deleteEvent)
    speech.js          # SpeechRecognition wrapper (createRecognition, isSupported)
  components/
    TabBar.svelte      # bottom nav (Record / Search)
    EventCard.svelte   # event display with inline edit + delete
  views/
    Login.svelte       # email/password sign-in / sign-up
    Record.svelte      # voice recording flow: idle → listening → editing → saved
    Search.svelte      # debounced search with ilike, renders EventCard list
public/
  sw.js                # service worker
  manifest.json        # PWA manifest
  icon.svg             # app icon
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
