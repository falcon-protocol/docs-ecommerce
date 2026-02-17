# Shopify Configurable Ad Unit

## Overview

This guide walks you through integrating the Falcon configurable ad template into your Shopify app. The setup is straightforward and requires minimal ongoing maintenance — everything is powered by git submodules, so updates are pulled in with a single command.

---

## 1. Repository Access

Before starting, every developer on your team who will work with this repository must be granted access.

1. Collect **GitHub usernames** of all developers who will clone, pull, or build the project (including CI/CD service accounts if applicable).
2. Send the list to your **Falcon contact** — we will grant read access to each person.
3. Let us know which Falcon team members should have access to **your** repository (for support and debugging).

---

## 2. Prerequisites

- `react` ^18.0.0
- `@shopify/ui-extensions-react` 2025.7.x

---

## 3. Installation

Add the templates as a git submodule:

```bash
git submodule add https://github.com/falcon-partners/shopify-templates.git <your-preferred-path>
```

> **Note:** Do not create `<your-preferred-path>` manually before running the command — `git submodule add` creates the directory for you. If the directory already exists, the command will fail.

**Recommended:** Add the submodule path to `.prettierignore`:

```text
<your-preferred-path>
```

This prevents Prettier from reformatting submodule files. If you accidentally modified files inside the submodule, discard the changes — the submodule does not need to be pushed separately.

---

## 4. File Overview

The submodule contains the following files:

| File | Description |
| --- | --- |
| `provider.tsx` | Feature management provider |
| `index.tsx` | Template21 — configurable ad template |
| `fallback.tsx` | Template15 — fallback template |
| `renderer.tsx` | Template router (selects 21 or 15) |
| `skeleton.tsx` | Loading skeleton |

### `provider.tsx` — FeatureManagementProvider

A React context provider that must wrap the template. It handles feature delivery internally — the provider makes a request to our server and manages feature flags, A/B testing, and configuration updates. This means new features and experiments are delivered to your users **without any code changes on your side**.

### Props (FeatureManagementProvider)

```tsx
interface FeatureManagementProviderProps {
  // Required
  publicKey: string;           // Falcon API public key
  apiEndpoint: string;         // API endpoint URL (default: https://pr-api.falconlabs.us/api/features/evaluate)
  userContext: FeatureManagementUserContext; // User targeting context (see below)
  extensionTarget: string;     // Shopify extension target (see below)
  storage: Storage;            // Shopify storage object from useStorage()
  children: ReactNode;         // Child components

  // Optional
  loadingElement?: JSX.Element; // Component shown during loading
}
```

### FeatureManagementUserContext

```tsx
interface FeatureManagementUserContext {
  // Required
  placementId: string; // The placement ID for this extension

  // Optional — User identification
  sessionId?: string;                // One-time generated session ID (uuid, format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx, 36 characters)
  hashedCustomerShopifyId?: string;  // Hashed* Shopify customer ID (trimmed, e.g. "1" from "gid://shopify/Customer/1")
  hashedPhone?: string;              // Hashed* phone number
  hashedEmail?: string;              // Hashed* email address

  // Optional — Targeting attributes
  templateId?: number;      // from Falcon API
  timezone?: string;        // User timezone
  amount?: number;          // Order amount, from useApi()
  orderId?: string;         // Order ID, from useApi()
  paymentType?: string;     // Payment type, from useApi()
  age?: number;             // User age
  gender?: string;          // User gender
  billingZipCode?: string;  // Billing zip code, from useApi()
  referrer?: string;        // Referrer URL
  screenWidth?: number;     // Screen width in pixels
  screenHeight?: number;    // Screen height in pixels
}

// *Hashed = trim → toLowerCase → SHA-256
```

> **Privacy note:** We do not store any of this data. It is used exclusively at runtime for feature management and A/B testing.

If you have questions about where to obtain any of these values, reach out to the Falcon Labs technical team.

---

### `index.tsx` — Template21 (Configurable Template)

The primary configurable ad template. Its layout, element parameters, and positioning are all controlled remotely through our proxy — changes take effect without pulling updates from GitHub.

### Props (Template21)

```tsx
interface TemplateProps {
  showIcon: boolean;                // Show icon flag, from Falcon API
  templateData: TemplateData;       // Template configuration (84 parameters), from Falcon API
  activeOffer: Offer;               // Current active offer, from Falcon API
  reachedEndOfOffers: boolean;      // Whether all offers have been shown
  clickOffer: () => void;           // Handler for offer click (primary CTA)
  handleNoThanks: () => void;       // Handler for declining an offer
  extensionTarget: ExtensionTarget; // Shopify extension target
  firstName?: string;               // Customer first name, from Shopify API
}
```

**Where data comes from:**

- `showIcon`, `templateData`, `activeOffer` — provided by the Falcon proxy API (we will supply the endpoint).
- `extensionTarget`, `firstName` — obtained from Shopify APIs on your side.
- `reachedEndOfOffers`, `clickOffer`, `handleNoThanks` — handled by your application logic.

**Prop details:**

- **`activeOffer`** — The current offer object to display.
- **`templateData`** — Configuration object including `templateConfig` (84 parameters) that control the template layout and styling.
- **`extensionTarget`** — Identifies the extension point:
  - `"purchase.thank-you.block.render"` — Thank you page
  - `"customer-account.order-status.block.render"` — Order status page
- **`clickOffer`** — Called when the primary CTA button is clicked.
- **`handleNoThanks`** — Called when the decline button is clicked.
- **`firstName`** — Used for personalization (e.g., *"John, thank you for your purchase"*).
- **`reachedEndOfOffers`** — Set to `true` to hide the component when no more offers are available.

If you have questions about any of these props, reach out to the Falcon Labs technical team.

---

### `fallback.tsx` — Template15 (Fallback Template)

A simplified fallback template with a predefined layout. It accepts the same props as Template21. The Renderer component (below) handles switching between templates automatically.

---

### `renderer.tsx` — Renderer

Handles template routing — automatically selects Template21 or Template15 based on the `templateId` from the Falcon proxy API. You don't need to implement any switching logic yourself.

The Renderer accepts the same props as the templates, plus one additional prop:

```tsx
interface RendererProps extends TemplateProps {
  templateId: number; // Template ID from Falcon API
}
```

`templateId` is provided by the Falcon proxy API alongside `templateData` and `activeOffer`.

| `templateId` | Template |
| --- | --- |
| `21` | Template21 |
| `15` | Template15 |
| any other | Template15 (fallback) |

---

### `skeleton.tsx` — TemplateDefaultSkeleton

A loading skeleton component. No props required.

Use it in two ways:

1. Pass it to `FeatureManagementProvider` via the `loadingElement` prop — shown while the provider fetches feature configuration.
2. Use it directly in your code during your own internal loading states.

---

## 5. Usage Example

```jsx
import { FeatureManagementProvider } from '<your-preferred-path>/provider';
import { Renderer } from '<your-preferred-path>/renderer';
import { TemplateDefaultSkeleton } from '<your-preferred-path>/skeleton';

function App() {
  const publicKey = 'your-public-key'; // The same public key you use for requesting odata
  const apiEndpoint = 'https://pr-api.falconlabs.us/api/features/evaluate';

  const [sessionId] = useState(generateUUID());
  const { hashedCustomerShopifyId, hashedPhone, hashedEmail, firstName } =
    useShopifyApi();
  const { templateId, showIcon, templateData, activeOffer } = useFalconApi();
  const { reachedEndOfOffers, handleClick, handleDecline } = useFalconFlow();

  // You can use handleClick and handleDecline for your own custom logic.
  // reachedEndOfOffers should be true when offers are ended
  // (offers can be found within the odata response).

  const storage = useStorage();
  // Import from Shopify extension storage API depending on your target:
  //   thank you page:   '@shopify/ui-extensions-react/checkout'
  //   order status page: '@shopify/ui-extensions-react/customer-account'

  const userContext = {
    placementId: 'extension-placement-id',
    sessionId: sessionId,
    hashedCustomerShopifyId: hashedCustomerShopifyId,
    hashedPhone: hashedPhone,
    hashedEmail: hashedEmail,
    templateId: templateId,
  };

  const extensionTarget = 'purchase.thank-you.block.render';
  // Or 'customer-account.order-status.block.render' for order status page

  return (
    <FeatureManagementProvider
      publicKey={publicKey}
      apiEndpoint={apiEndpoint}
      userContext={userContext}
      loadingElement={<TemplateDefaultSkeleton />}
      storage={storage}
      extensionTarget={extensionTarget}
    >
      <Renderer
        templateId={templateId}
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

---

## 6. Updating Templates

**Manual:**

```bash
cd <your-preferred-path>
git pull origin main
```

**npm script (recommended):**

Add to your `package.json`:

```json
{
  "scripts": {
    "falcon:sync": "git submodule update --remote --merge ./<your-preferred-path>"
  }
}
```

Then run:

```bash
npm run falcon:sync
```

> **Tip:** Add `falcon:sync` to your pre-commit hook (e.g., via Husky) to keep templates up to date automatically.

---

## Support

For questions or issues, contact **Falcon Labs**.
