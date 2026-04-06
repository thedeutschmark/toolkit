# DM Toolkit

Dashboard for [toolkit.deutschmark.online](https://toolkit.deutschmark.online). Requires a Twitch login via the auth worker at `auth.deutschmark.online`.

## Tools

### Stream Music
Configure the Spotify now-playing widget for stream and player embeds. Manage widget tokens, set the stream playlist, configure chat command permissions (!sr, !skip, !queue, etc.), and exclude songs from requests.

### Player
Configure the appearance of the Spotify now-playing widget — skin, cover shape, animation in/out, font, idle state, and display timing. Generates an embed URL for OBS or any browser source.

### Command Profiles
Save and load named permission profiles for stream music chat commands. Useful for switching between open-request and mod-only modes without reconfiguring each permission individually.

### Clip Play
Configure the `!play` chat command, which triggers a clip overlay in OBS from a URL posted in chat. Settings include OBS scene/source targeting, volume normalization, max duration, and per-permission-level access control.

### Video Shout-Out
Configure the `!vso` chat command, which pulls the latest Twitch clip for a username and displays it as an overlay in OBS. Supports custom users with pinned embed URLs and per-clip duration overrides.

### Starting Screen
Configure the starting and ending stream scene — countdown prefix, hero text, title card hold time, and idle text for both the starting and ending states.

### Emoji Maker
Browser-based animated GIF generator. Upload an image, pick an animation preset, adjust size and frame rate, and export at Twitch- or Discord-compatible dimensions.

### Setup Doctor
Runs a set of checks against your connected services (Spotify, OBS, auth) and surfaces configuration issues with links to the relevant settings pages.

### Alert! Alert! Handoff
Queue visibility panel for the Alert! Alert! desktop app. Displays the current editor summary and lets you push chat-highlight bookmarks into the shared editor feed without opening the desktop app.

### Support Wall
Admin view for the supporter wall. Shows pending and approved claims with timestamps and amounts.

---

## Auth and data

Authentication uses Twitch OAuth handled by a Cloudflare Worker at `auth.deutschmark.online`. The worker sets an `httpOnly` SSO cookie scoped to `.deutschmark.online`. All API calls go to that same worker with the cookie attached via `credentials: "include"`. Mutating requests include a CSRF token read from a `dm_csrf` cookie and forwarded as `X-CSRF-Token`.

The Spotify integration is managed by a separate Cloudflare Worker. Per-user credentials are stored AES-GCM encrypted in Cloudflare KV. Neither worker is in this repo.

No tokens or user IDs appear in query parameters. Widget embed URLs use opaque read-only tokens (`?wid=<token>`).

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_TOOLKIT_AUTH_URL` | `https://auth.deutschmark.online` | Auth and API worker base URL |
| `NEXT_PUBLIC_WIDGET_HOST_URL` | `https://deutschmark.online` | Base URL for widget embed links |

Both are public — no secrets are required to build or run this frontend.

## Running locally

```bash
npm install
npm run dev
```

The app connects to the live auth worker by default. To use a local worker, set `NEXT_PUBLIC_TOOLKIT_AUTH_URL` in `.env.local`.

## Building

```bash
npm run build
```

Outputs a static export to `out/`. Compatible with Cloudflare Pages or any static host.

## Stack

- Next.js 16 (`output: "export"`)
- React 19
- Tailwind CSS v4
- TypeScript
