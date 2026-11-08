# DivyaIndia Backend Deployment

## Required environment variables

Configure these in the Render Web Service dashboard. Never commit a real `.env` file.

- `NODE_ENV=production`
- `PORT` (Render supplies this automatically)
- `MONGO_URI`
- `JWT_SECRET_KEY` (at least 32 random characters)
- `FRONTEND_URL` (exact frontend origin; comma-separated only if multiple origins are intentionally supported)
- `COOKIE_SAME_SITE` (default `lax`; use `none` only when the frontend/backend are genuinely cross-site and HTTPS is enabled)
- `MONGO_MAX_POOL_SIZE` (optional; defaults to 10)

## Render service

- Build command: `npm ci`
- Start command: `npm start`
- Health check path: `/health`

The process connects to MongoDB before opening the HTTP listener and closes the listener/database connection on SIGTERM.

## Local development

1. Copy `.env.example` to `.env` and fill in local values.
2. Run `npm ci`.
3. Run `npm run start-dev`.

## Cookie and CSRF notes

Authentication uses an HTTP-only cookie. The default SameSite policy is Lax. If your production frontend and API are on different registrable sites, set `COOKIE_SAME_SITE=none` and use HTTPS. Cross-site cookie deployments also need a CSRF protection strategy before accepting state-changing requests. CORS alone is not CSRF protection.

## Rate limiting

The included in-process limiter is bounded and suitable only for a single small instance. If you scale to multiple Render instances, move rate-limit state to a shared store such as Redis.
