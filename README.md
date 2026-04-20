# Falcon protocol documentation site

This is a vitepress project

## Installing vitepress
```
npm i vitepress
```

## Local development server
```
npm run docs:dev
```

## Content reuse (`_shared/` partials)

Some API reference content is displayed from multiple places in the sidebar. For example, the OData, Click, and Impression APIs each appear under both **Publisher Integration** and **Partner Integration**, and the Reporting API appears both as a standalone guide and as part of **Partner Integration**.

To keep a single source of truth, the canonical markdown for these shared blocks lives in `integration-guide/_shared/`. Consumer pages are thin wrappers that pull the partial in via VitePress's native include directive:

```md
<!--@include: ../_shared/odata-api.md-->
```

The `_shared/` directory is excluded from the build via `srcExclude: ["**/_shared/**"]` in `.vitepress/config.mjs`, so partials do not appear as standalone routes.

### Current partials and their consumers

| Partial | Consumed by |
|---|---|
| `_shared/odata-api.md` | `publisher-integration/odata-api.md`, `partner-integration/odata-api.md` |
| `_shared/click-api.md` | `publisher-integration/click-api.md`, `partner-integration/click-api.md` |
| `_shared/impression-api.md` | `publisher-integration/impression-api.md`, `partner-integration/impression-api.md` |
| `_shared/reporting-api.md` | `reporting-api.md` (standalone guide), `partner-integration/reporting-api.md` |
| `_shared/private-key-note.md` | `reporting-api.md` (standalone guide) |

### Rule

**If you're editing content that appears in more than one section, edit the file in `_shared/` — never duplicate it across consumer pages.** Consumer pages should contain only page-specific framing (intros, prerequisites, cross-links) plus the `@include` directive.

Relative links inside a partial are resolved against the *including* page, so `[Click API](./click-api)` works correctly from both `partner-integration/` and `publisher-integration/`. When a partial must link somewhere that doesn't exist in every consumer folder, use an absolute path (e.g., `/integration-guide/partner-integration/authentication-and-platform-tokens`).
