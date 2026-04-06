# DM Toolkit

Creator infrastructure for widgets, connections, and broadcast setup.
Live at **[toolkit.deutschmark.online](https://toolkit.deutschmark.online)**.

## What this repo contains

This is the **frontend only** — a Next.js static export deployed to Cloudflare Pages.

| Directory | Contents |
|---|---|
| `app/` | Next.js App Router pages |
| `components/` | React components used by toolkit pages |
| `lib/` | Hooks and API client utilities |
| `packages/toolkit-client/` | Shared API client + auth types |
| `packages/widget-config/` | Shared widget config types and defaults |

## What is NOT in this repo

| Piece | Where it lives | Notes |
|---|---|---|
| Auth worker | `auth.deutschmark.online` | Cloudflare Worker, closed-source. Handles Twitch OAuth, session cookies, CSRF tokens. |
| Spotify worker | `NEXT_PUBLIC_SPOTIFY_WORKER_URL` | Cloudflare Worker, closed-source. Manages per-user Spotify credentials (AES-GCM encrypted in KV). |
| Main site | Private monorepo | `deutschmark.online` — stream overlays, widget embed pages, etc. |

## How authentication works

1. The browser redirects to `auth.deutschmark.online/twitch/auth` with a `returnTo` param.
2. The auth worker handles the Twitch OAuth flow and sets an `httpOnly` SSO cookie scoped to `.deutschmark.online`.
3. Subsequent requests to `auth.deutschmark.online/*` (e.g. `/session`, `/logout`) include the cookie via `credentials: "include"`.
4. A CSRF token is stored in a readable `dm_csrf` cookie and forwarded as `X-CSRF-Token` on mutating requests.

No tokens or user IDs are ever placed in query parameters.

## What data the frontend sends

- `GET /session` — check session status (cookie only, no body)
- `POST /logout` — end session (CSRF token in header)
- `GET /widget-tokens` — list opaque widget tokens for the authenticated user
- `POST /widget-tokens` — create a new widget token
- `DELETE /widget-tokens/:id` — revoke a widget token
- `GET /widget-config?wid=<token>` — read widget config for a token (public read endpoint)
- `PUT /widget-config?wid=<token>` — update widget config

All data in transit is JSON over HTTPS. No PII beyond Twitch login/display name is stored.

## Environment variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_TOOLKIT_AUTH_URL` | No | `https://auth.deutschmark.online` | Auth worker base URL |
| `NEXT_PUBLIC_WIDGET_HOST_URL` | No | `https://deutschmark.online` | Base URL for widget embed links |

Both are public (`NEXT_PUBLIC_`) — they contain no secrets. The actual secrets (Twitch client ID/secret, KV bindings, Spotify credentials) live in the Cloudflare Worker environment and are never exposed to this frontend.

## Running locally

```bash
npm install
npm run dev
```

The app talks to the live `auth.deutschmark.online` worker by default, so login will work as-is if you have a `.deutschmark.online`-scoped cookie. To point at a local auth worker, set `NEXT_PUBLIC_TOOLKIT_AUTH_URL` in a `.env.local` file.

## Building

```bash
npm run build
```

Output is a static export in `out/`. Deploy to any static host or Cloudflare Pages.

## Tech stack

- **Next.js 16** (static export, `output: "export"`)
- **React 19**
- **Tailwind CSS v4**
- **TypeScript**
