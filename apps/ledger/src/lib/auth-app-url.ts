/**
 * Base URL of the centralized login app (apps/auth). Defaults to production
 * so deployed builds work without extra config; set VITE_AUTH_APP_URL in
 * .env.local to point at a local `apps/auth` dev server instead.
 */
export const AUTH_APP_URL = import.meta.env.VITE_AUTH_APP_URL ?? "https://auth.hibatillah.com"
