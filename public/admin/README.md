# Sveltia CMS

A Git-backed CMS that lets non-developers edit this docs site without touching Git.
Editors go to **https://docs.falconlabs.us/admin/**, sign in with GitHub, and edit
content through a form UI. Saving commits Markdown straight to `main`, which triggers
the normal GitHub Pages deploy (`.github/workflows/deploy.yml`).

## Files

- `index.html` — loads Sveltia CMS from the CDN (pinned to a version).
- `config.yml` — backend + collections. Committing straight to `main` (no PR flow).

## Auth architecture

Login uses a GitHub OAuth proxy — a Cloudflare Worker (`falcon-cms-auth`) that lives in
the `falcon-protocol/promo-ad-unit` repo under `cloudflare-worker/cms-auth/` and is
deployed by that repo's CI. GitHub only ever talks to the worker; the token is handed
back to this site's `/admin/` page via `postMessage`.

- Worker origin (`base_url` in `config.yml`): `https://cms-auth.falconlabs.us`
- OAuth App callback URL: `https://cms-auth.falconlabs.us/callback`

## One-time setup checklist

These live OUTSIDE this repo and must be done once before login works:

1. **Register a GitHub OAuth App** (org: `falcon-protocol`)
   - Homepage URL: `https://docs.falconlabs.us`
   - Authorization callback URL: `https://cms-auth.falconlabs.us/callback`
2. **Set the worker secrets** (in the `promo-ad-unit` repo, `cloudflare-worker/cms-auth/`):
   - `npx wrangler secret put GITHUB_CLIENT_ID --env production`
   - `npx wrangler secret put GITHUB_CLIENT_SECRET --env production`
3. **Give each editor write access** to `falcon-protocol/docs-ecommerce`.

## Notes

- The site is served via GitHub Pages, which cannot set custom response headers. This is
  fine: OAuth popups need a permissive `Cross-Origin-Opener-Policy`, and Pages sends none
  (default `unsafe-none`), so the popup → opener handoff works. Only a *strict* `same-origin`
  COOP would break it — don't add one.
- New CMS image uploads go to `public/uploads/`. Existing `/images/` are untouched.
