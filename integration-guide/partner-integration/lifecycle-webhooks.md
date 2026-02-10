## Lifecycle Webhooks

### Overview

Lifecycle webhooks allow partners to notify Falcon about changes to merchant status and ad preferences. These endpoints serve two distinct purposes:

1. **Status Endpoints** - Notify Falcon when a merchant leaves your platform entirely (e.g., uninstalls your app, churns from your service)
2. **Ads Enabled Endpoints** - Notify Falcon when a merchant explicitly opts out of (or back into) ads while remaining on your platform

**Why This Matters:**

When Falcon sees a drop in traffic from a merchant, these notifications help us:

- **Status = inactive**: Understand the merchant has left your platform entirely - no further action needed
- **Ads Enabled = false**: Understand the merchant is still on your platform but chose to disable ads - enables win-back conversations

Without these notifications, Falcon may investigate traffic drops as potential technical issues when they are actually intentional.

### Authentication

**Site-Level Endpoints:**

Use the publisher's **Private Key**:

```
Authorization: Bearer PUBLISHER_PRIVATE_KEY
```

**Publisher-Level Endpoints:**

Use your **Platform Token** (for service-level operations) or **Private Key** (for publisher self-management):

```
Authorization: Bearer plat_1234567890abcdef1234567890abcdef
```

> Note: Platform tokens can only modify publishers created under their platform. Private keys can only modify their own publisher account.

### Rate Limits

Lifecycle endpoints have dedicated rate limits separate from other API operations:

| Token Type      | Requests per Minute | Window Duration |
| --------------- | ------------------- | --------------- |
| Standard Tokens | 50                  | 60 seconds      |
| Elevated Tokens | 150                 | 60 seconds      |

**Rate Limit Headers:**

All lifecycle API responses include rate limit information:

```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 49
X-RateLimit-Reset: 2024-01-15T10:45:00.000Z
```

**Rate Limit Exceeded Response (HTTP 429):**

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later",
    "retryAfter": 45
  }
}
```

> Important: Contact the Falcon integration team if you require elevated rate limits for high-volume operations.

---

### Site Status Endpoint

Notify Falcon when a site is removed from your platform entirely.

### Endpoint

```
PATCH /api/site/:id/status
```

### Authentication

Use the publisher's **Private Key**:

```
Authorization: Bearer PUBLISHER_PRIVATE_KEY
```

### Request Body

```json
{
  "status": "inactive",
  "reason": "Store removed from platform"
}
```

**Required Fields:**

- `status` (string): Must be `"active"` or `"inactive"`

**Optional Fields:**

- `reason` (string): Human-readable explanation for the status change

### Example Request

```bash
curl -X PATCH [https://pr-api.falconlabs.us/api/site/clx3c4d5e6f7g8h9i0j1k2l3m/status](https://pr-api.falconlabs.us/api/site/clx3c4d5e6f7g8h9i0j1k2l3m/status) \
  -H "Authorization: Bearer priv_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "inactive",
    "reason": "Store removed from platform"
  }'
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "clx3c4d5e6f7g8h9i0j1k2l3m",
    "name": "Fashion Boutique Store",
    "status": "inactive",
    "adsEnabled": true
  },
  "message": "Site status updated to inactive"
}
```

### Error Responses

**400 Bad Request - Invalid Status Value**

```json
{
  "error": "Invalid field value for 'status': expected '\"active\" or \"inactive\"' but got 'pending'"
}
```

**404 Not Found - Site Not Found**

```json
{
  "error": "Site not found: clx3c4d5e6f7g8h9i0j1k2l3m"
}
```

---

### Site Ads Enabled Endpoint

Notify Falcon when a merchant explicitly disables or enables ads for a specific site while remaining on your platform.

> Important: Use this endpoint when a merchant toggles ad preferences in your platform's settings. This tells Falcon the traffic drop is a deliberate merchant choice (not a technical issue) and enables win-back conversations.

### Endpoint

```
PATCH /api/site/:id/ads
```

### Authentication

Use the publisher's **Private Key**:

```
Authorization: Bearer PUBLISHER_PRIVATE_KEY
```

### Request Body

```json
{
  "adsEnabled": false,
  "reason": "Merchant disabled ads in store settings"
}
```

**Required Fields:**

- `adsEnabled` (boolean): `true` when merchant enables ads, `false` when merchant disables ads

**Optional Fields:**

- `reason` (string): Context about why the merchant made this choice (helps with win-back conversations)

### Example Request

```bash
curl -X PATCH [https://pr-api.falconlabs.us/api/site/clx3c4d5e6f7g8h9i0j1k2l3m/ads](https://pr-api.falconlabs.us/api/site/clx3c4d5e6f7g8h9i0j1k2l3m/ads) \
  -H "Authorization: Bearer priv_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" \
  -H "Content-Type: application/json" \
  -d '{
    "adsEnabled": false,
    "reason": "Merchant disabled ads in store settings"
  }'
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "clx3c4d5e6f7g8h9i0j1k2l3m",
    "name": "Fashion Boutique Store",
    "status": "active",
    "adsEnabled": false
  },
  "message": "Site ads disabled"
}
```

### Error Responses

**400 Bad Request - Invalid Value**

```json
{
  "error": "Invalid field value for 'adsEnabled': expected boolean but got string"
}
```

---

### Publisher Status Endpoint

Notify Falcon when a merchant leaves your platform entirely (e.g., uninstalls your app, cancels subscription, churns).

### Endpoint

```
PATCH /api/v1/publishers/:id/status
```

### Authentication

Use your **Platform Token** or the publisher's **Private Key**:

```
Authorization: Bearer plat_1234567890abcdef1234567890abcdef
```

**Access Rules:**

- **Platform Token**: Can only modify publishers created under your platform
- **Private Key**: Can only modify the publisher's own account

### Request Body

```json
{
  "status": "inactive",
  "reason": "Merchant uninstalled application"
}
```

**Required Fields:**

- `status` (string): Must be `"active"` or `"inactive"`

**Optional Fields:**

- `reason` (string): Human-readable explanation (e.g., "app uninstalled", "subscription cancelled")

### Example Request

```bash
curl -X PATCH [https://pr-api.falconlabs.us/api/v1/publishers/clx1a2b3c4d5e6f7g8h9i0j1k/status](https://pr-api.falconlabs.us/api/v1/publishers/clx1a2b3c4d5e6f7g8h9i0j1k/status) \
  -H "Authorization: Bearer plat_1234567890abcdef1234567890abcdef" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "inactive",
    "reason": "Merchant uninstalled application"
  }'
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "clx1a2b3c4d5e6f7g8h9i0j1k",
    "name": "Acme Fashion Boutique",
    "status": "inactive",
    "adsEnabled": true
  },
  "message": "Publisher status updated to inactive"
}
```

### Error Responses

**400 Bad Request - Invalid Status Value**

```json
{
  "error": "Invalid field value for 'status': expected '\"active\" or \"inactive\"' but got 'pending'"
}
```

**401 Unauthorized - Invalid Token**

```json
{
  "error": "Invalid Authorization token: token not found or expired"
}
```

**403 Forbidden - Access Denied**

```json
{
  "error": "Access denied: publisher does not belong to your platform"
}
```

**404 Not Found - Publisher Not Found**

```json
{
  "error": "Publisher not found: clx1a2b3c4d5e6f7g8h9i0j1k"
}
```

---

### Publisher Ads Enabled Endpoint

Notify Falcon when a merchant explicitly disables or enables ads at the publisher level while remaining on your platform.

> Important: Use this endpoint when a merchant toggles ad preferences in your platform's account settings. This tells Falcon the traffic drop is a deliberate merchant choice (not a technical issue) and enables win-back conversations.

### Endpoint

```
PATCH /api/v1/publishers/:id/ads
```

### Authentication

Use your **Platform Token** or the publisher's **Private Key**:

```
Authorization: Bearer plat_1234567890abcdef1234567890abcdef
```

### Request Body

```json
{
  "adsEnabled": false,
  "reason": "Merchant opted out via account settings"
}
```

**Required Fields:**

- `adsEnabled` (boolean): `true` when merchant enables ads, `false` when merchant disables ads

**Optional Fields:**

- `reason` (string): Context about why the merchant made this choice

### Example Request

```bash
curl -X PATCH [https://pr-api.falconlabs.us/api/v1/publishers/clx1a2b3c4d5e6f7g8h9i0j1k/ads](https://pr-api.falconlabs.us/api/v1/publishers/clx1a2b3c4d5e6f7g8h9i0j1k/ads) \
  -H "Authorization: Bearer plat_1234567890abcdef1234567890abcdef" \
  -H "Content-Type: application/json" \
  -d '{
    "adsEnabled": false,
    "reason": "Merchant opted out via account settings"
  }'
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "clx1a2b3c4d5e6f7g8h9i0j1k",
    "name": "Acme Fashion Boutique",
    "status": "active",
    "adsEnabled": false
  },
  "message": "Publisher ads disabled"
}
```

### Error Responses

**400 Bad Request - Invalid Value**

```json
{
  "error": "Invalid field value for 'adsEnabled': expected boolean but got string"
}
```

---

### Lifecycle Webhooks Summary

| Endpoint                        | Method | When to Use                              | Auth Required                 |
| ------------------------------- | ------ | ---------------------------------------- | ----------------------------- |
| `/api/site/:id/status`          | PATCH  | Site removed from platform               | Private Key                   |
| `/api/site/:id/ads`             | PATCH  | Merchant toggled ads for site            | Private Key                   |
| `/api/v1/publishers/:id/status` | PATCH  | Merchant left platform (uninstall/churn) | Platform Token or Private Key |
| `/api/v1/publishers/:id/ads`    | PATCH  | Merchant toggled ads for account         | Platform Token or Private Key |

### Best Practices

1. **Call Promptly**: Notify Falcon as soon as a merchant changes status or ad preferences
2. **Include Reasons**: The `reason` field helps Falcon understand context and craft effective win-back messaging
3. **Use the Right Endpoint**:
   - **Status**: Merchant left your platform entirely (uninstall, churn, cancellation)
   - **Ads Enabled**: Merchant is still on your platform but toggled ad preferences
4. **Handle Rate Limits**: Implement exponential backoff for retries
5. **Don't Forget Re-enablement**: Call with `"active"` or `true` when merchants return or re-enable ads
