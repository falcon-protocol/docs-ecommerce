# Shopify Ad Unit (Preact)

## Overview

This guide walks you through integrating the Falcon ad template into your Shopify app using Preact and Shopify's web components (API version 2025-10+). The setup is straightforward and requires minimal ongoing maintenance — everything is powered by git submodules, so updates are pulled in with a single command.

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

- `preact`
- `@shopify/ui-extensions`

## 3. Installation

First, create two helper scripts in your project root and add them to `package.json`.

> **Important:** In both scripts and in `package.json`, replace `<your-preferred-path>` with the actual path where you want the templates (e.g., `src/falcon-templates`).

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

| File           | Description                 |
| -------------- | --------------------------- |
| `provider.tsx` | Feature management provider |
| `index.tsx`    | Ad template                 |
| `skeleton.tsx` | Loading skeleton            |

---

### `provider.tsx` — FeatureManagementProvider

A Preact context provider that must wrap the template. It handles feature delivery internally — the provider makes a request to our server and manages feature flags, A/B testing, and configuration updates. This means new features and experiments are delivered to your users **without any code changes on your side**.

#### Props (provider.tsx)

```typescript
interface FeatureManagementProviderProps {
  // Required
  publicKey: string; // Falcon API public key
  apiEndpoint: string; // API endpoint URL (default: https://pr-api.falconlabs.us/api/features/evaluate)
  userContext: FeatureManagementUserContext; // User targeting context (see below)
  extensionTarget: string; // Shopify extension target (see below)
  storage: Storage; // Shopify storage object from useStorage()
  children: ComponentChildren; // Child components

  // Optional
  loadingElement?: JSX.Element; // Component shown during loading
  preventEvaluateRequest?: boolean; // Skip API call (default: false)
}
```

#### FeatureManagementUserContext

```typescript
interface FeatureManagementUserContext {
  // Required
  placementId: string; // The placement ID for this extension

  // Optional — User identification
  sessionId?: string; // One-time generated session ID (uuid, format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx, 36 characters)
  hashedCustomerShopifyId?: string; // Hashed* Shopify customer ID (trimmed, e.g. "1" from "gid://shopify/Customer/1")
  hashedPhone?: string; // Hashed* phone number
  hashedEmail?: string; // Hashed* email address

  // Optional — Targeting attributes
  templateId?: number; // from Falcon API
  timezone?: string; // User timezone
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

### `index.tsx` — Template

The ad template built with Preact and Shopify web components (`s-box`, `s-text`, `s-button`, etc.).

#### Props (index.tsx)

```typescript
interface TemplateProps {
  showIcon: boolean; // Show icon flag, from Falcon API
  templateData: TemplateData; // Template configuration, from Falcon API
  activeOffer: Offer; // Current active offer, from Falcon API
  reachedEndOfOffers: boolean; // Whether all offers have been shown
  clickOffer: () => void; // Handler for offer click (primary CTA)
  handleNoThanks: () => void; // Handler for declining an offer
  extensionTarget: ExtensionTarget; // Shopify extension target
  firstName?: string; // Customer first name, from Shopify API
}
```

**Where data comes from:**

- `showIcon`, `templateData`, `activeOffer` — provided by the Falcon proxy API (we will supply the endpoint).
- `extensionTarget`, `firstName` — obtained from Shopify APIs on your side.
- `reachedEndOfOffers`, `clickOffer`, `handleNoThanks` — handled by your application logic.

**Prop details:**

- **`activeOffer`** — The current offer object to display.
- **`templateData`** — Configuration object including template styling and content settings.
- **`extensionTarget`** — Identifies the extension point:
  - `"purchase.thank-you.block.render"` — Thank you page
  - `"customer-account.order-status.block.render"` — Order status page
- **`clickOffer`** — Called when the primary CTA button is clicked.
- **`handleNoThanks`** — Called when the decline button is clicked.
- **`firstName`** — Used for personalization (e.g., _"John, thank you for your purchase"_).
- **`reachedEndOfOffers`** — Set to `true` to hide the component when no more offers are available.

If you have questions about any of these props, reach out to the Falcon Labs technical team.

---

### `skeleton.tsx` — TemplateSimpleSkeleton

A loading skeleton component. No props required. Shows a card with a spinner while the provider loads.

Use it in two ways:

1. Pass it to `FeatureManagementProvider` via the `loadingElement` prop — shown while the provider fetches feature configuration.
2. Use it directly in your code during your own internal loading states.

## 5. Usage Example

```tsx
import '@shopify/ui-extensions/preact';
import { render } from 'preact';
import { useState } from 'preact/hooks';
import { useStorage } from '@shopify/ui-extensions/checkout/preact';

import { FeatureManagementProvider } from '<your-preferred-path>/preact/provider';
import { Template15 } from '<your-preferred-path>/preact/index';
import { TemplateSimpleSkeleton } from '<your-preferred-path>/preact/skeleton';

export default function extension() {
  render(<App />, document.body);
}

function App() {
  const publicKey = 'your-public-key';
  const apiEndpoint = 'https://pr-api.falconlabs.us/api/features/evaluate';

  const [sessionId] = useState(generateUUID());
  const { hashedCustomerShopifyId, hashedPhone, hashedEmail, firstName } =
    useShopifyApi();
  const { templateId, showIcon, templateData, activeOffer } = useFalconApi();

  const { reachedEndOfOffers, handleClick, handleDecline } = useFalconFlow();

  const storage = useStorage();

  const userContext = {
    placementId: 'extension-placement-id',
    sessionId: sessionId,
    hashedCustomerShopifyId: hashedCustomerShopifyId,
    hashedPhone: hashedPhone,
    hashedEmail: hashedEmail,
    templateId: templateId,
  };

  const extensionTarget = 'purchase.thank-you.block.render';

  return (
    <FeatureManagementProvider
      publicKey={publicKey}
      apiEndpoint={apiEndpoint}
      userContext={userContext}
      loadingElement={<TemplateSimpleSkeleton />}
      storage={storage}
      extensionTarget={extensionTarget}
    >
      <Template15
        showIcon={showIcon}
        templateData={templateData}
        activeOffer={activeOffer}
        reachedEndOfOffers={reachedEndOfOffers}
        clickOffer={handleClick}
        handleNoThanks={handleDecline}
        extensionTarget={extensionTarget}
        firstName={firstName}
      />
    </FeatureManagementProvider>
  );
}
```

## 6. Updating Templates

Run the sync script (set up in step 3):

```bash
npm run falcon:sync
```

This pulls the latest templates from the Falcon repository using your deploy key.

## 7. CI/CD Setup

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
