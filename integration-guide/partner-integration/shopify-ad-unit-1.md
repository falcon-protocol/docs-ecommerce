---
title: "Shopify Ad Unit (1.x)"
---

# Shopify Ad Unit (1.x)

## Overview

This guide walks you through integrating the Falcon ad template into your Shopify app using Preact and Shopify's web components (API version 2026-04). The setup is straightforward and requires minimal ongoing maintenance — everything is powered by git submodules, so updates are pulled in with a single command.

## 1. Repository Access

Template files are distributed via a private GitHub repository. Access is managed through SSH deploy keys — no individual GitHub accounts need to be added.

1. Request a **deploy key** from your Falcon contact. You will receive a private key file.
2. Save the file as `falcon_deploy_key` in your project root.
3. Add `falcon_deploy_key` to your `.gitignore`:

   ```text
   falcon_deploy_key
   ```

4. Every developer who needs to pull templates should have this file in their project root.

## 2. Prerequisites

- `preact` and `@preact/signals`
- `@shopify/ui-extensions` 2026.4
- `js-sha256` (used by the Integration Guide code)

## 3. Installation

First, create two helper scripts in your project root and add them to `package.json`.

> **Important:** In both scripts, replace `<your-preferred-path>` with the actual path where you want the templates (e.g., `src/falcon-templates`).

**`falcon-init.sh`:**

```bash
#!/bin/bash
set -e

# Change this to your preferred submodule path
SUBMODULE_PATH="<your-preferred-path>"

DEPLOY_KEY="$(pwd)/falcon_deploy_key"

if [ ! -f "$DEPLOY_KEY" ]; then
  echo "Error: falcon_deploy_key not found in project root"
  exit 1
fi

chmod 600 "$DEPLOY_KEY"
GIT_SSH_COMMAND="ssh -i $DEPLOY_KEY -o IdentitiesOnly=yes -o StrictHostKeyChecking=no" \
  git submodule add git@github.com:falcon-partners/shopify-templates.git "$SUBMODULE_PATH"

echo "Submodule added at $SUBMODULE_PATH"
```

**`falcon-sync.sh`:**

```bash
#!/bin/bash
set -e

# Change this to your preferred submodule path
SUBMODULE_PATH="<your-preferred-path>"

DEPLOY_KEY="$(pwd)/falcon_deploy_key"

if [ ! -f "$DEPLOY_KEY" ]; then
  echo "Error: falcon_deploy_key not found in project root"
  exit 1
fi

chmod 600 "$DEPLOY_KEY"
GIT_SSH_COMMAND="ssh -i $DEPLOY_KEY -o IdentitiesOnly=yes -o StrictHostKeyChecking=no" \
  git submodule update --remote --merge "$SUBMODULE_PATH"

echo "Templates synced"
```

Add to your `package.json`:

```json
{
  "scripts": {
    "falcon:init": "bash ./falcon-init.sh",
    "falcon:sync": "bash ./falcon-sync.sh"
  }
}
```

Then install the submodule:

```bash
npm run falcon:init
```

> **Note:** Do not create the submodule path manually before running the command — the script creates the directory for you. If the directory already exists, the command will fail.

**Recommended:** Add the submodule path to `.prettierignore`:

```text
<your-preferred-path>
```

## 4. File Overview

The `preact/` folder contains:

| File              | Description                               |
| ----------------- | ----------------------------------------- |
| `provider.tsx`    | Feature management provider               |
| `fallback.tsx`    | Template15 — fallback template            |
| `brandcollab.tsx` | Template17 — brand collaboration template |
| `renderer.tsx`    | Template router (selects 17 or 15)        |
| `skeleton.tsx`    | Loading skeleton                          |
| `attributes.tsx`  | Shopper-attributes context (internal)     |
| `configs.tsx`     | Shared constants + translations (int.)    |
| `utils.tsx`       | Shared utils/hooks/ui (internal)          |

`attributes.tsx`, `configs.tsx` and `utils.tsx` are internal plumbing: the other files import them relatively — you never import them yourself, just keep them in the folder when updating (always sync the whole folder, never individual files).

The folder also ships two guides: this page (installing the templates and their props) and the [Integration Guide](./shopify-ad-unit-integration-guide) (everything your extension does around them: shopper data, session id, the offers request, tracking).

---

### `provider.tsx` — FeatureManagementProvider

A Preact context provider that must wrap the template. It handles feature delivery internally — the provider makes a request to our server and manages feature flags, A/B testing, and configuration updates. This means new features and experiments are delivered to your users **without any code changes on your side**.

#### Props (provider.tsx)

```typescript
interface FeatureManagementProviderProps {
  // Required
  publicKey: string; // Falcon API public key
  apiEndpoint: string; // `{BASE_URL}/api/features/evaluate`, see the Integration Guide
  userContext: FeatureManagementUserContext; // User targeting context (see below)
  extensionTarget: string; // Shopify extension target (see below)
  storage: Storage; // Shopify storage object from useStorage()
  children: JSX.Element; // Child components

  // Optional
  loadingElement?: JSX.Element; // Component shown during loading
  disableClientImpressions?: boolean; // Disable automatic impression beacon firing (default: false)
}
```

#### FeatureManagementUserContext

```typescript
interface FeatureManagementUserContext {
  // Required
  placementId: string; // The placement ID for this extension

  // Optional — User identification
  sessionId?: string; // The same session id you send to the offers API (see Integration Guide §2)
  hashedCustomerShopifyId?: string; // Hashed* Shopify customer ID (trimmed, e.g. "1" from "gid://shopify/Customer/1")
  hashedPhone?: string; // Hashed* phone number
  hashedEmail?: string; // Hashed* email address

  // Optional — Targeting attributes
  templateId?: number; // from Falcon API
  timezone?: string; // User timezone
  language?: string; // Shopper language, lowercase, e.g. 'de' or 'de-de' — REQUIRED for localized template labels
  amount?: number; // Order amount
  orderId?: string; // Order ID
  paymentType?: string; // Payment type
  age?: number; // User age
  gender?: string; // User gender
  billingZipCode?: string; // Billing zip code
  referrer?: string; // Referrer URL
  screenWidth?: number; // Screen width in pixels
  screenHeight?: number; // Screen height in pixels
}

// *Hashed = trim → toLowerCase → SHA-256
```

> **Privacy note:** We do not store any of this data. It is used exclusively at runtime for feature management and A/B testing.

If you have questions about where to obtain any of these values, reach out to the Falcon Labs technical team.

---

### Template props

Every template takes the same props. The Renderer passes them through, so this
is the only prop list you need to satisfy.

#### Props

```typescript
interface TemplateProps {
  templateData: TemplateData; // Template configuration, from Falcon API
  activeOffer: Offer; // Current active offer, from Falcon API
  offers: Offer[]; // Full array of offers, from Falcon API
  activeOfferIndex: number; // Index of the current offer in the offers array
  reachedEndOfOffers: boolean; // Your carousel ran out; the Renderer ends the unit itself (see §6)
  clickOffer: () => void; // Handler for offer click (primary CTA)
  handleNoThanks: () => void; // Handler for declining an offer
  extensionTarget: ExtensionTarget; // Shopify extension target
  firstName?: string; // Customer first name, from Shopify API
  email?: string; // Customer email, from Shopify API
  language?: string; // Shopper language, lowercase, e.g. 'de' or 'de-de', from Shopify API
}
```

**Where data comes from:**

- `templateData`, `activeOffer`, `offers` — from the Falcon offers API response.
- `extensionTarget`, `firstName`, `email`, `language` — obtained from Shopify APIs on your side.
- `activeOfferIndex`, `reachedEndOfOffers`, `clickOffer`, `handleNoThanks` — handled by your application logic.

The [Integration Guide](./shopify-ad-unit-integration-guide) shows how to obtain every one of these: reading shopper data from Shopify, creating the session id, making the offers request, and turning the response into the props above.

**Prop details:**

- **`activeOffer`** — The current offer object to display.
- **`templateData`** — Configuration object from the Falcon API. Pass it straight through; new fields (e.g. `privacyLabelOverride`, which replaces the footer's "Privacy Policy" link text when present) take effect automatically, so do not whitelist or strip its fields.
- **`extensionTarget`** — Identifies the extension point:
  - `"purchase.thank-you.block.render"` — Thank you page
  - `"customer-account.order-status.block.render"` — Order status page
- **`offers`** — The full array of offers from the Falcon API response. Used internally by the template for the Inspired tease bar feature.
- **`activeOfferIndex`** — The index of the currently displayed offer within the `offers` array.
- **`clickOffer`** — Called when the primary CTA button is clicked. See [Offer Navigation](#_6-offer-navigation) for advancement, and [Inspired Offer Behavior](#_7-inspired-offer-behavior) for the Inspired special case.
- **`handleNoThanks`** — Called when the decline button is clicked. See [Offer Navigation](#_6-offer-navigation).
- **`firstName`** — Used for personalization (e.g., _"John, thank you for your purchase"_).
- **`email`** — Customer email address, displayed in the template when email feature is enabled.
- **`language`** — The shopper language, lowercase (e.g. `'de'` or `'de-de'`). Static template labels are resolved from `userContext.language` on the provider; pass the same value here and as `at.language` to the offers API so the banner copy and the labels match. Unknown or missing languages render the English defaults. Offer-provided copy (`ctaText`, `declineButtonText`) is never modified.
- **`reachedEndOfOffers`** — Your end-of-offers flag: `true` once the shopper declined the last offer. Keep rendering `<Renderer>` with it set; the SDK ends the unit itself — inside the countdown experiment it shows a redeem card that brings the offers back (through `onRestartOffers`), outside it renders nothing (see [§6. Offer Navigation](#_6-offer-navigation)).

If you have questions about any of these props, reach out to the Falcon Labs technical team.

---

### `fallback.tsx` — Template15 (Fallback Template)

A simplified template with a predefined layout, and the template the Renderer falls back to. Accepts the props listed above. The Renderer handles switching between templates automatically.

---

### `brandcollab.tsx` — Template17 (Brand Collaboration Template)

A brand collaboration template with a landscape banner image on top of the offer content. Accepts the props listed above, plus one additional prop used to resolve the banner image:

```typescript
interface Template17Props extends TemplateProps {
  siteImages?: ImageInstance[]; // Site-level images, from the offers API response
}
```

The banner image resolves through a cascade: offer-level image (`activeOffer.images`) → site-level image (`siteImages`) → generic Falcon fallback banner. If the proxy API response includes `siteImages`, forward it — otherwise the template still renders with the fallback source.

Template17 additionally gates itself on the `shopify_brand_collab_template_gate` server gate, evaluated by the bundled `provider.tsx` (a device filter — the banner is sized for mobile). When the gate is off for the session (or gate evaluation fails), the Renderer falls back to Template15 even for `templateId: 17`.

---

### `renderer.tsx` — Renderer

Handles template routing — automatically selects Template17 or Template15 based on the `templateId` from the Falcon proxy API. You don't need to implement any switching logic yourself. Templates that define a render gate (currently Template17, see above) fall back to Template15 when their gate doesn't pass.

The Renderer accepts the same props as the templates, plus:

```typescript
interface RendererProps extends TemplateProps {
  templateId: number; // `template` from the offers API response
  siteImages?: ImageInstance[]; // `siteImages` from the offers API response (Template17 banner)
  withOverlayTrigger?: boolean; // `withOverlayTrigger` from the offers API response
  onOverlayDismissed?: () => void; // Called when the shopper closes the offer overlay; set your end-of-offers flag
  onRestartOffers?: () => void; // Called when the shopper taps the redeem card; put your carousel back on the first offer
}
```

Some placements open the remaining offers in an overlay when the shopper declines. The Renderer handles the overlay itself when `withOverlayTrigger` is `true`. When the shopper closes it, `onOverlayDismissed` fires: set `reachedEndOfOffers` to `true` and keep rendering `<Renderer>` — it ends the unit the same way it does when your carousel runs out (see [§6. Offer Navigation](#_6-offer-navigation)).

Inside the countdown experiment the unit does not simply disappear at the end: a redeem card takes its place, and a tap on it calls `onRestartOffers`. Set `activeOfferIndex` back to `0` and `reachedEndOfOffers` to `false` there; the Renderer shows the offers again.

| `templateId` | Template                                            |
| ------------ | --------------------------------------------------- |
| `17`         | Template17 (Template15 when its render gate is off) |
| `15`         | Template15                                          |
| any other    | Template15 (fallback)                               |

---

### `skeleton.tsx` — TemplateDefaultLoader

A loading skeleton component. No props required. Shows a card with a spinner while the provider loads.

Use it in two ways:

1. Pass it to `FeatureManagementProvider` via the `loadingElement` prop — shown while the provider fetches feature configuration.
2. Use it directly in your code during your own internal loading states.

## 5. Usage Example

The [Integration Guide](./shopify-ad-unit-integration-guide) walks through a complete extension, in the order you build it: reading shopper data from Shopify, the session id, hashed identifiers, the offers request, and a reference component that wires the response into `FeatureManagementProvider` and `<Renderer>`. Start there; the sections below cover the carousel rules and tracking that component relies on.

## 6. Offer Navigation

> **Important:** Advancing offers is your responsibility — the SDK renders the current offer but never changes the index for you. Getting this wrong is the most common cause of a stuck carousel or a missing final-offer impression.

The SDK renders **one offer at a time**. Your application owns the `activeOfferIndex` state and the two handlers that change it — `clickOffer` (primary CTA) and `handleNoThanks` (decline). The SDK reads `activeOffer` / `activeOfferIndex` and renders the current offer; it never mutates the index itself.

**Why this matters:** impression beacons fire automatically each time `activeOffer` changes (see [Impression Tracking](#_8-impression-tracking)). An offer is therefore only counted once your code advances the index to it. If your advance logic stops one short of the end, the final offer is never displayed **and never impressed**.

### State you own

Keep the index and the end-of-offers flag in a single object so one functional update stays correct even if you later memoize the handlers (no stale-closure reads):

```typescript
const [nav, setNav] = useState({
  activeOfferIndex: 0,
  reachedEndOfOffers: false,
});

const activeOffer = offers[nav.activeOfferIndex];

// `activeOffer` is a non-optional prop that the templates dereference, so never
// render <Renderer> without one. Do NOT guard on `reachedEndOfOffers` here:
// the index stays on the last offer, and the Renderer ends the unit itself.
if (!offers.length || !activeOffer) return null;
```

In addition to the props documented in [§4. File Overview](#_4-file-overview), pass `activeOffer`, `activeOfferIndex={nav.activeOfferIndex}` and `reachedEndOfOffers={nav.reachedEndOfOffers}` to `<Renderer>`, along with the handlers below.

### Decline — `handleNoThanks`

Advance **sequentially, by exactly one**. On the last offer, end the carousel — do not wrap back to the start:

```typescript
function handleNoThanks() {
  setNav((prev) =>
    prev.activeOfferIndex >= offers.length - 1
      ? { ...prev, reachedEndOfOffers: true } // last offer declined → end
      : { ...prev, activeOfferIndex: prev.activeOfferIndex + 1 },
  );
}
```

### CTA — `clickOffer`

Same sequential advance, with one exception: when the response contains an Inspired offer, the CTA jumps straight to it (see [Inspired Offer Behavior](#_7-inspired-offer-behavior)):

```typescript
function clickOffer() {
  setNav((prev) => {
    const lastIndex = offers.length - 1;
    if (prev.activeOfferIndex >= lastIndex) {
      return { ...prev, reachedEndOfOffers: true }; // already on the last offer → end
    }
    if (templateData.hasInspired) {
      return { ...prev, activeOfferIndex: lastIndex }; // jump to the Inspired offer
    }
    return { ...prev, activeOfferIndex: prev.activeOfferIndex + 1 };
  });
}
```

### Restart — `onRestartOffers`

Inside the countdown experiment the Renderer replaces a finished unit with a redeem card. A tap on it calls `onRestartOffers`; put the carousel back on the first offer:

```typescript
function restartOffers() {
  setNav({ activeOfferIndex: 0, reachedEndOfOffers: false });
}
```

Pass it as `onRestartOffers={restartOffers}`. Without it the card would have nothing to bring back, so a finished unit renders nothing instead. Wire `onOverlayDismissed` to the same end-of-offers state (`reachedEndOfOffers: true`), so the overlay closing ends the unit the same way declining the last offer does.

### Rules

- **Always guard the last offer.** Advancing past `offers.length - 1` leaves `activeOffer` `undefined`; because it is a non-optional prop that the templates dereference, that **throws inside the template** and drops the final offer's impression.
- **`handleNoThanks` never jumps.** Only `clickOffer` may jump (the Inspired case); declining always moves forward exactly one step.
- **Keep rendering `<Renderer>` at the end — the SDK ends the unit for you.** Pass `reachedEndOfOffers={true}` and leave `activeOffer` on the last offer; the Renderer renders nothing, or the redeem card inside the countdown experiment. Dropping `<Renderer>` yourself skips that card. Render nothing only when `activeOffer` is missing, as the guard above does.
- **Don't `await` anything before the state update.** Impressions and clicks are tracked by the SDK; if you do your own work on click or decline, do not block `setNav` on it, or the carousel flickers.

## 7. Inspired Offer Behavior

Some Falcon API responses include an "Inspired" offer — a special final offer in the carousel. When this feature is active, the API response will contain:

- `templateData.hasInspired: true` — indicates the last offer in the array is an Inspired offer
- `templateData.teaseMessage` — a tease message displayed as a bar above the footer (e.g., "See what's next!")

The template handles the **tease bar rendering** automatically — it shows the bar when `teaseMessage` exists, hides it on non-block targets, and hides it when the user reaches the last (Inspired) offer.

However, the **offer navigation logic** is your responsibility: the `clickOffer` handler in [Offer Navigation](#_6-offer-navigation) already implements the jump to the last offer when `templateData.hasInspired` is `true`.

**Key points:**

- When `hasInspired` is true, clicking the CTA should skip intermediate offers and jump directly to the last offer
- The tease bar and offer index update should happen in the same state update to avoid visual flicker
- `handleNoThanks` should always advance to the next offer sequentially (no jumping)

## 8. Impression Tracking

The SDK fires impression beacons automatically — no action required on your side. Each time the active offer changes, the Renderer sends a request to `activeOffer.beaconUrl` to register that the offer was seen, whichever template renders it.

### Server-side impressions (opt-out)

If you fire impressions yourself via a server-side proxy (e.g. to forward the real end-user IP and User-Agent), pass `disableClientImpressions` to the provider to prevent double-counting:

```tsx
<FeatureManagementProvider
  publicKey={publicKey}
  apiEndpoint={apiEndpoint}
  userContext={userContext}
  storage={storage}
  extensionTarget={extensionTarget}
  disableClientImpressions
>
  ...
</FeatureManagementProvider>
```

When firing the beacon server-side, you must forward the real end-user IP and User-Agent as query parameters — otherwise the backend records your server's IP and UA instead:

| Query param    | Value                    |
| -------------- | ------------------------ |
| `at.clientIp`  | Real end-user IP address |
| `at.userAgent` | Real end-user User-Agent |

Example server-side beacon call:

```http
GET {activeOffer.beaconUrl}&at.clientIp=1.2.3.4&at.userAgent=Mozilla%2F5.0...
```

> **Important:** Use exactly `at.clientIp` and `at.userAgent` as the parameter names. Other names (e.g. `userIp`, `userAgent`) are not recognized and will be silently ignored.

## 9. Updating Templates

Run the sync script (set up in step 3):

```bash
npm run falcon:sync
```

This pulls the latest templates from the Falcon repository using your deploy key.

> **Tip:** Add `falcon:sync` to your pre-commit hook (e.g., via Husky) to keep templates up to date automatically.

## 10. CI/CD Setup

Your CI/CD environment (CodeBuild, GitHub Actions, etc.) does not have access to the private template repository by default. When your pipeline clones your repo, it won't be able to fetch the submodule — you need to configure the same deploy key on the server.

The idea is simple: before your build runs `git submodule update`, the deploy key must be available as an SSH identity. How you do this depends on your CI/CD provider — store the key in your provider's secrets manager, write it to a file at build time, and point SSH to it.

### Example: AWS CodeBuild

**1. Store the key in Secrets Manager:**

```bash
aws secretsmanager create-secret \
  --name "falcon-deploy-key" \
  --secret-string file://falcon_deploy_key
```

**2. Add to your `buildspec.yml`:**

```yaml
env:
  secrets-manager:
    DEPLOY_KEY: 'falcon-deploy-key'

phases:
  install:
    commands:
      - mkdir -p ~/.ssh
      - echo "$DEPLOY_KEY" > ~/.ssh/falcon_deploy
      - chmod 600 ~/.ssh/falcon_deploy
      - export GIT_SSH_COMMAND="ssh -i ~/.ssh/falcon_deploy -o IdentitiesOnly=yes -o StrictHostKeyChecking=no"
      - git submodule update --init --recursive
```

### Example: GitHub Actions

**1. Store the key as a repository secret:**

Go to your repo → Settings → Secrets and variables → Actions → **New repository secret**:

- **Name:** `FALCON_DEPLOY_KEY`
- **Value:** paste the full contents of `falcon_deploy_key`

**2. Add to your workflow** (e.g., `.github/workflows/deploy.yml`):

```yaml
steps:
  - name: Setup deploy key
    run: |
      mkdir -p ~/.ssh
      echo "${{ secrets.FALCON_DEPLOY_KEY }}" > ~/.ssh/falcon_deploy
      chmod 600 ~/.ssh/falcon_deploy

  - name: Checkout
    uses: actions/checkout@v4

  - name: Fetch submodules
    run: |
      GIT_SSH_COMMAND="ssh -i ~/.ssh/falcon_deploy -o IdentitiesOnly=yes -o StrictHostKeyChecking=no" \
        git submodule update --init --recursive
```

> **Note:** Do not use `submodules: recursive` in `actions/checkout` — it overrides SSH with its own HTTPS authentication, which does not have access to the private template repository.

## Support

For questions or issues, contact **Falcon Labs**.
