# Sveltia CMS

A Git-backed CMS that lets non-developers edit this docs site without touching Git.
Editors go to **https://docs.falconlabs.us/admin/**, sign in with GitHub, and edit
content through a form UI.

There is **no PR/review flow** — this is straight-to-`main` by design. See "Publishing
model" below for how Save vs. Publish works.

## Files

- `index.html` — loads Sveltia CMS from the CDN (pinned to a version).
- `config.yml` — backend + collections.
- `README.md` — this file.
- `../../sidebar.json` (repo root) — the left-sidebar navigation data, edited via the
  **Navigation** collection and loaded by `.vitepress/config.mjs`. It lives at the repo
  root (not in `.vitepress/`) because the CMS file scanner skips hidden dot-directories.

## Publishing model (skip_ci + manual publish)

`backend.skip_ci: true`. Consequences:

- **Save** commits the change to `main` with a `[skip ci]` prefix, so GitHub Actions does
  NOT deploy. Edits accumulate invisibly on the live site.
- **Publish Changes** (button in the CMS header) fires a `repository_dispatch`
  (`sveltia-cms-publish`) event, which `.github/workflows/deploy.yml` listens for and
  deploys. Editors publish on demand; batched edits go live together.
- **Deletions are the exception** — Sveltia commits deletes WITHOUT `[skip ci]`, so a
  delete triggers the normal push deploy and goes live immediately (no Publish needed).
- Every save/delete is a commit on `main`: full history, revertable. Tracked in Git, not PRs.

## Collections & content model

- **Home Page / Overview / Terms & Legal** — plain prose; visual (WYSIWYG) markdown editor.
- **Getting Started, Integration Guide, Partner Integration, Custom Publisher Integration,
  Mobile, iOS, Android, Shopify, Partner Integration: Advanced** — technical docs, edited as **raw
  Markdown** (`modes: [raw]`) so custom VitePress syntax (`:::` containers, raw HTML,
  `<!--@include-->`) is preserved verbatim on save.
- **Shared Snippets** (`integration-guide/_shared/`) — reusable blocks pulled into pages via
  `<!--@include-->`. Editing a snippet updates every page that embeds it. They carry no
  frontmatter (VitePress `@include` would leak it), so they're body-only and filename-labeled.
- **Navigation** — edits `sidebar.json` (see above).

Why so many integration-guide collections: **Sveltia does not support recursive/nested
folder collections**, so a folder collection only lists files directly in its folder. Each
subfolder therefore needs its own collection to be editable. Pages whose body is only an
`<!--@include-->` are content-less wrappers — edit the matching **Shared Snippet** instead.

## Auth architecture

Login uses a GitHub OAuth proxy — a Cloudflare Worker (`falcon-cms-auth`) in the
`falcon-protocol/promo-ad-unit` repo under `cloudflare-worker/cms-auth/`, deployed by that
repo's CI. GitHub only talks to the worker; the token returns to `/admin/` via `postMessage`.

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
- Local testing: add `local_backend: true` to `config.yml` (do NOT commit it), run
  `npx decap-server` + `npm run docs:preview`, open `/admin/index.html`, and use "Work with
  Local Repository". Note the File System Access API requires a real `.git` **directory**, so
  it won't work from a git *worktree* (where `.git` is a file).
