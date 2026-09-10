## OData API - Fetching Promotional Offers

### Overview

The OData API allows you to fetch promotional offers to display to customers. This is the primary endpoint for real-time offer retrieval.

### Endpoint

```
POST https://pr-api.falconlabs.us/api/odata
```

**`POST` is the recommended method.** Send parameters in a JSON body so PII (`at.email`, `at.orderid`, hashed identifiers) and line-item data (`at.lineItems`) stay out of URLs, browser history, proxies, and access logs. The endpoint also accepts `GET` with the same parameters as query-string values — behaviorally identical — for simple browser-side calls; see [Sending Requests Over POST](#sending-requests-over-post) for the mapping rules and the GET fallback.

> **Staging:** Use `https://staging-pr-api.falconlabs.us/api/odata` with your staging public key while testing. See [Staging Environment](/integration-guide/partner-integration/staging-environment) for the full environment reference.

### Authentication

Use the publisher’s **Public Key**:

```
Authorization: Bearer PUBLIC_KEY
```

> Note: This is the only endpoint that uses the public key. All other endpoints use the private key.

### Query Parameters

### Required Parameters

- `placementId` (string): Placement ID from placement creation
- `sessionId` (string): Unique session identifier for the customer (e.g., email or hashed email — distinct from `at.orderid`, which represents a specific order)
- `at.email` or `at.hashedEmail` (string): Customer email address, plain or SHA-256 hashed
- `at.orderid` (string): Order ID
- `at.clientIp` (string): Client IP address (IPv4 or IPv6) — used for geo-targeting
- `at.userAgent` (string): Client user agent string (max 500 chars) — used for device detection

> Note: `placementId` and `sessionId` are the only parameters the API enforces — a request missing them is rejected. Everything else (`at.orderid`, `at.email`/`at.hashedEmail`, and the rest of the customer/order data parameters below) is not blocked if missing or malformed, the request still succeeds and serves offers. But without at least `at.orderid` and `at.email`/`at.hashedEmail`, there's nothing to match the impression back to a specific order or customer, so revenue attribution won't work even though the request itself "succeeds." Treat them as required in practice.

> Proxying through a server: If you call OData from a backend or proxy rather than directly from the end user's browser, the request's source IP and User-Agent header will be your server's, not the customer's. In that case you must read the original client IP from the `X-Forwarded-For` header (typically the first IP in the list) and the original `User-Agent` header from the inbound request, and forward them explicitly via `at.clientIp` and `at.userAgent`. Otherwise every request will appear to come from your server, breaking geo and device targeting for all users.

### Optional Parameters

- `count` (number, default: 4): Number of offers to return
- `at.correlationId` (string): Mediation correlation ID. Required in practice when the API is integrated through Falcon Mediation.

### Customer Data Parameters

Pass customer and order data with the `at.` prefix for better targeting and analytics:

**Customer Information:**

- `at.hashedEmail` (string): Customer email, hashed on your end before sending (SHA-256 hex, lowercase, 64 characters). Takes priority over `at.email` if both are present
- `at.email` (string): Customer email address, plain text, lowercase, trimmed — or a SHA-256 hash (see Email Hashing below)
- `at.hashedPhone` (string): Customer phone, hashed the same way as `at.hashedEmail`
- `at.firstname` or `at.fname` (string): Customer first name
- `at.lastname` or `at.lname` (string): Customer last name
- `at.phone` or `at.mobile` (string): Phone number, plain text (10-15 digits)
- `at.country` (string): Country code (ISO format, e.g., “US”, “GB”)
- `at.language` (string): Language code (e.g., “en”, “es”)
- `at.address` (string): Customer address (max 500 chars)
- `at.zipcode` (string): ZIP/postal code (max 20 chars)

> Email Hashing: Send plain-text `at.email` when you can — it gives the best matching and targeting. If privacy or compliance requirements mean you can't send plaintext email, hash it yourself using SHA-256 (trim → lowercase → hash) and send it via the dedicated `at.hashedEmail` parameter, or pass the hash directly in `at.email` (legacy, still supported — the API detects a valid SHA-256 hex string automatically). Don't send both `at.hashedEmail` and a plaintext `at.email` for the same request.
>
> Example: `email@example.com` → SHA-256 → `a1b2c3d4e5f6...` (64-character hex string)

**Order Information:**

- `at.orderid` or `at.order_id` (string): Order ID (max 100 chars)
- `at.category` (string): Order or product category
- `at.subcategory` (string): Order or product subcategory
- `at.amount` or `at.ordervalue` (number): Order amount (0-1,000,000)
- `at.shippingAmount` (number): Total shipping amount for the order (0-1,000,000)
- `at.currency` (string): Currency code (e.g., “USD”, “EUR”, “GBP”)
- `at.billingaddress1` (string): Billing address (max 500 chars)
- `at.billingzipcode` (string): Billing ZIP code (max 20 chars)
- `at.paymenttype` or `at.payment_type` (string): Payment method
- Valid values: `creditCard`, `debitCard`, `paypal`, `applePay`, `googlePay`, `bankTransfer`, `crypto`, `other`

**Cart / Line Items:**

- `at.lineItems` (JSON string): The order's cart contents — a JSON-encoded array of line items (e.g. SKU, quantity, price, product metadata) used for product-based offer targeting and analytics. Because this is array data that can bloat or leak through the URL query string, prefer sending it in a JSON body over [POST](#sending-requests-over-post).

**Supported Currencies:**
USD, EUR, GBP, CAD, AUD, JPY, CNY, NZD, CHF, SEK, NOK, DKK, PLN, CZK, HUF, RON, BGN, HRK, RUB, TRY, BRL, MXN, ARS, CLP, COP, PEN, UYU, INR, IDR, MYR, PHP, SGD, THB, VND, KRW, HKD, TWD, SAR, AED, ILS, EGP, ZAR, NGN, KES, GHS

### Sending Requests Over POST

**`POST` is the recommended way to call `/api/odata`.** `POST` and `GET` accept the same parameters and return the same offers — the only difference is *where* the parameters travel. With `POST` you send them in a JSON request body instead of the URL query string, which keeps PII and line-item data out of URLs and access logs. Use `GET` only for simple browser-side calls where none of that is a concern (see [Using GET](#using-get) below).

```
POST https://pr-api.falconlabs.us/api/odata
```

**Structuring the body**

- Keep `placementId` and `sessionId` in the URL query string; send everything else in the JSON body.
- Use dotted keys that match the query-parameter names exactly — `{ "at.email": "x", "at.orderid": "y" }`. (A nested `at` object — `{ "at": { "email": "x" } }` — is also accepted if you prefer it.)
- If the same parameter appears in both the query string and the body, the body value takes precedence.

**Rules and traps to watch for**

- **Send every value as a string** — including numbers and booleans. A raw JSON number used for an identifier (e.g. `"orderid": 12345678901234567890`) is silently rounded by `JSON.parse` *before the server ever sees it*, corrupting the value. Wrap identifiers, amounts, and counts in quotes. Booleans are coerced to the strings `"true"` / `"false"`.
- **Keep `placementId` (and `sessionId`) in the query string.** Only PII and line items need to move into the body. Routing/identity params are fine in the URL and keep requests easy to trace.
- **Set `Content-Type: application/json`.** This is the documented contract. (The body is parsed even without it as a safety net, but always send the header.) Malformed JSON returns **400**.
- **32 kb body cap.** A body larger than 32 kb returns **413 Payload Too Large** (not 500).
- **Bot detection returns a silent `204 No Content`.** The endpoint runs bot detection on every request and returns an empty **204** — no error, no body — for bot-like `User-Agent`s. `isbot` flags plain HTTP-client user agents, so **a bare `curl` or a server-side HTTP client gets 204'd with no error.** Server-side integrators **must** either set a browser-style `User-Agent` header or pass the real client UA via `at.userAgent` in the body. See the proxying note under Required Parameters.
- **Auth is unchanged** — same `Authorization: Bearer PUBLIC_KEY`. Invalid/missing token → **401**.

**Example: `POST` with PII and line items in the body (JavaScript)**

```javascript
await fetch(
  "https://pr-api.falconlabs.us/api/odata?placementId=clx4d5e6f7g8h9i0j1k2l3m4n&sessionId=session_abc123",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${publicKey}`,
      "Content-Type": "application/json",
      // Server-side callers only: set a browser-style UA (or pass at.userAgent below),
      // otherwise bot detection returns a silent 204.
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    body: JSON.stringify({
      count: "2", // send scalars as strings
      "at.email": "customer@example.com",
      "at.orderid": "ORDER-12345", // quote identifiers — never a raw JSON number
      "at.amount": "125.50",
      "at.currency": "USD",
      "at.userAgent": "Mozilla/5.0 (...)", // real client UA when proxying server-side
      "at.lineItems": JSON.stringify([
        { sku: "SKU-1", qty: 1, price: "49.99" },
        { sku: "SKU-2", qty: 2, price: "12.50" },
      ]),
    }),
  }
);
```

**Example: `POST` with `curl`** (note the browser-style `User-Agent` — without it the request is 204'd):

```bash
curl -X POST "https://pr-api.falconlabs.us/api/odata?placementId=clx4d5e6f7g8h9i0j1k2l3m4n&sessionId=session_abc123" \
  -H "Authorization: Bearer pub_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
  -d '{
        "count": "2",
        "at.email": "customer@example.com",
        "at.orderid": "ORDER-12345",
        "at.amount": "125.50",
        "at.currency": "USD",
        "at.lineItems": "[{\"sku\":\"SKU-1\",\"qty\":1,\"price\":\"49.99\"}]"
      }'
```

#### Using GET

`GET` is supported for simple browser-side calls and is behaviorally identical to `POST` — but every parameter, including PII and line items, travels in the URL query string, where it can end up in browser history, proxy logs, and access logs. Prefer `POST` for anything server-side or anything carrying customer data.

```bash
curl -X GET "https://pr-api.falconlabs.us/api/odata?placementId=clx4d5e6f7g8h9i0j1k2l3m4n&sessionId=session_abc123&count=4&at.email=customer@example.com&at.firstname=John&at.lastname=Doe&at.orderid=ORDER-12345&at.category=Apparel&at.subcategory=Shoes&at.amount=125.50&at.currency=USD&at.country=US" \
  -H "Authorization: Bearer pub_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
```

### Success Response (200 OK)

```json
{
  "offers": [
    {
      "bannerId": "12345",
      "title": "15% off your next order",
      "header": "Limited-time thank you",
      "description": "Save on your next purchase.\nUse code THANKS15",
      "ctaText": "REDEEM",
      "declineButtonText": "No thanks",
      "clickUrl": "https://pr-api.falconlabs.us/click?...",
      "beaconUrl": "https://pr-api.falconlabs.us/vdata?...",
      "closeUrl": "https://pr-api.falconlabs.us/close?...",
      "termsUrl": "https://brand.com/terms",
      "images": [
          {
              "publicUrl": "https://images.falconlabs.us/demand/...",
              "width": 2000,
              "height": 390,
              "aspectRatio": 5.128205,
              "type": "icon",
              "tags": []
          }
      ]
    },
    {
      "bannerId": "12346",
      "title": "Get 20% off at Nike",
      "header": "Shop athletic wear",
      "description": "Premium sportswear at great prices",
      "ctaText": "SHOP NOW",
      "declineButtonText": "No thanks",
      "clickUrl": "https://pr-api.falconlabs.us/click?...",
      "beaconUrl": "https://pr-api.falconlabs.us/vdata?...",
      "closeUrl": "https://pr-api.falconlabs.us/close?...",
      "images": []
    }
  ],
  "template": 21,
  "adDisplayDelay": 0,
  "isTestMode": true,
  "siteStatus": "active",
  "templateData": {
    "brandName": "Fashion Boutique",
    "privacyUrl": "https://fashionboutique.com/privacy",
    "brandTemplateImageUrl": "https://cdn.example.com/brand-logo.png",
    "toggleCloseButtonDelay": 5000,
    "showFirstOfferIcon": true,
    "showPartnership": true,
    "templateConfig": {
      "iconConfig": {
        "mobilePosition": "below-subtitle-above-description",
        "showIcon": true
      },
      "textConfig": {
        "titleSize": "large",
        "subtitleSize": "medium",
        "descriptionSize": "medium",
        "titleTransform": "uppercase"
      },
      "layoutConfig": {
        "gridColumnsDesktop": ["60%", "fill"],
        "gridColumnsMobile": "100%",
        "gridGap": "large"
      },
      "buttonConfig": {
        "primaryButtonKind": "primary",
        "primaryButtonAppearance": "accent",
        "buttonLayoutMobile": "vertical"
      },
      "linksConfig": {
        "showTermsLink": true,
        "showDisclaimerLink": false
      },
      "footerConfig": {
        "showPartnership": true,
        "privacyLinkLabel": "Privacy Policy"
      }
    }
  }
}
```

**Response Fields:**

- `offers`: Array of promotional offers to display
  - `clickUrl`: URL to redirect to when customer clicks the offer — see [Click API](./click-api) for how to fire this event
  - `beaconUrl`: URL to call when offer is displayed — see [Impression API](./impression-api) for how to fire this event
  - `closeUrl`: URL to call when customer closes the ad
- `template`: Numeric ID of the template assigned to this placement (e.g. `21`, `15`). Used to select which template component to render.
- `isTestMode`: Whether the placement is in test mode
- `templateData`: Configuration data for customizing the ad display
  - `templateConfig`: Display configuration parameters (see Adjustable Template section)

### Error Responses

**400 Bad Request - Missing Parameters**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Missing required parameters",
    "details": {
      "missingFields": ["placementId", "sessionId"]
    }
  }
}
```

> **204 No Content (bot detection):** When the request's `User-Agent` (header on `GET`, or `at.userAgent` on `POST`) looks like a bot or a plain HTTP client, the endpoint returns an empty **204** with no error body. This is expected behavior, not a failure — but it means a bare `curl` or server-side HTTP client with a default UA receives no offers and no error. Set a browser-style `User-Agent` or pass `at.userAgent` (see [Sending Requests Over POST](#sending-requests-over-post)).

> **413 Payload Too Large (POST only):** A `POST` body larger than the 32 kb cap is rejected with **413**.

**401 Unauthorized - Invalid Public Key**

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing public key"
  }
}
```

**404 Not Found - Invalid Placement**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Placement not found",
    "details": {
      "placementId": "invalid_placement_id"
    }
  }
}
```

**500 Internal Server Error**

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred while fetching offers"
  }
}
```
