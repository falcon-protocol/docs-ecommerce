## Placements API

### Overview

Placements represent specific ad unit locations where promotional offers are displayed (e.g., thank you page, order status page). Placements define where and how ads are rendered on publisher websites.

### Base Endpoint

```
https://pr-api.falconlabs.us/api/placements
```

**Note:** The endpoint is `/api/placements` (plural), not `/api/placement` (singular).

### **Authentication**

All Placement API endpoints require **PUBLISHER Token Authentication**.

```
Authorization: Bearer <PUBLISHER_TOKEN>
```

### Create Placement

Creates a new placement (ad unit).

### Endpoint

```
POST /api/placements
```

**Authentication:** PUBLISHER Token

### Request Body

```json
{
  "name": "Thank You Page Placement",
  "siteId": "cm2a3b4c5d6e7f8g9h0i1j2k",
  "pageType": "THANK_YOU_PAGE",
  "isLiveMode": false,
  "template": 5,
  "data": {
    "customMessage": "Thanks for your purchase!",
    "showDiscount": true
  }
}
```

**Required Fields:**

- `name`: **Required**, non-empty string
- **EITHER:**
  - `siteId`: Optional, string (if site already exists)
  - **OR:**
  - `storeName`: Optional, string (required if no siteId provided)
  - `storeUrl`: Optional, valid URL or domain (required if no siteId provided)
- `shopifyUrl`: Optional, valid URL or domain
- `pageType`: Optional, must be valid PageType enum value
  - Valid values: `THANK_YOU_PAGE`, `ORDER_PAGE`
- `isLiveMode`: Optional, boolean (defaults to false)
  - `false` (default): Returns non-production mock/test ads for development
  - `true`: Returns real production offers (use only in production)
- `template`: Optional, integer between 1 and 21
- `data`: Optional, custom data object for placement configuration

**Validation Rules:**

- **Either** `siteId` **OR** both `storeName` and `storeUrl` must be provided
- URLs must be valid format ([https://example.com](https://example.com/)) or domain name (example.com)
- Template must be integer between 1 and 21 if provided

### Example Request (with existing site)

```bash
curl -X POST https://pr-api.falconlabs.us/api/placements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345" \
  -d '{
    "name": "Thank You Page Placement",
    "siteId": "cm2a3b4c5d6e7f8g9h0i1j2k",
    "pageType": "THANK_YOU_PAGE",
    "template": 5,
    "isLiveMode": false
  }'
```

### **Example Request (with new store):**

```bash
curl -X POST https://pr-api.falconlabs.us/api/placements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345" \
  -d '{
    "name": "Order Confirmation Placement",
    "storeName": "Fashion Boutique Online",
    "storeUrl": "https://fashionboutique.com",
    "shopifyUrl": "https://fashionboutique.myshopify.com",
    "pageType": "ORDER_PAGE",
    "template": 3,
    "isLiveMode": true
  }'
```

### Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "cm0j1k2l3m4n5o6p7q8r9s0t",
    "name": "Thank You Page Placement",
    "site": {
      "id": "cm2a3b4c5d6e7f8g9h0i1j2k",
      "name": "My Store"
    },
    "type": "THANK_YOU_PAGE",
    "pageTarget": "BLOCK",
    "isLiveMode": false,
    "createdAt": "2024-01-15T10:40:00.000Z",
    "updatedAt": "2024-01-15T10:40:00.000Z"
  },
  "message": "Placement created successfully"
}
```

**Key Response Fields:**

- `id`: Placement ID to use in OData requests and SDK initialization

### Error Responses

**400 Bad Request - Validation Error:**

```json
{
  "error": "Request validation failed",
  "code": "VALIDATION_FAILED",
  "details": ["name: Name is required"],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**400 Bad Request - Site/Store Validation:**

```json
{
  "error": "Request validation failed",
  "code": "VALIDATION_FAILED",
  "details": [
    "siteId: Either siteId or both storeName and storeUrl are required"
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**400 Bad Request - URL Validation:**

```json
{
  "error": "Request validation failed",
  "code": "VALIDATION_FAILED",
  "details": [
    "storeUrl: Must be a valid URL (e.g., https://example.com) or domain name (e.g., example.com)"
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**400 Bad Request - Template Validation:**

```json
{
  "error": "Request validation failed",
  "code": "VALIDATION_FAILED",
  "details": ["template: Template must be an integer between 1 and 21"],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**400 Bad Request - Site Not Found:**

```json
{
  "error": "Site not found",
  "code": "RESOURCE_NOT_FOUND",
  "details": {
    "resourceType": "Site",
    "id": "invalid_site_id"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Get Placement by ID

Retrieves a single placement by ID.

### Endpoint

```
GET /api/placements/:id
```

### Authentication

Use the publisher’s **Private Key**:

```
Authorization: Bearer PUBLISHER_PRIVATE_KEY
```

### Example Request

```bash
curl -X GET https://pr-api.falconlabs.us/api/placements/clx4d5e6f7g8h9i0j1k2l3m4n \
  -H "Authorization: Bearer priv_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "cm0j1k2l3m4n5o6p7q8r9s0t",
    "name": "Thank You Page Placement",
    "site": {
      "id": "cm2a3b4c5d6e7f8g9h0i1j2k",
      "name": "My Store"
    },
    "type": "THANK_YOU_PAGE",
    "pageTarget": "BLOCK",
    "isLiveMode": false,
    "createdAt": "2024-01-15T10:40:00.000Z",
    "updatedAt": "2024-01-15T10:40:00.000Z"
  },
  "message": "Placement created successfully"
}
```

### List Placements

Retrieves all placements for a publisher or site.

### Endpoint

```
GET /api/placements
```

### Authentication

Use the publisher’s **Private Key**:

```
Authorization: Bearer PUBLISHER_PRIVATE_KEY
```

### Query Parameters

- `siteId` (string): Filter by specific site
- `skip` (number, default: 0): Number of records to skip
- `take` (number, default: 50, max: 100): Number of records to return
- `pageType` (string): Filter by page type (`THANK_YOU_PAGE`, `ORDER_PAGE`)
- `isLiveMode` (boolean): Filter by mode (`true` or `false`)

### Example Request

```bash
curl -X GET "https://pr-api.falconlabs.us/api/placements?siteId=clx3c4d5e6f7g8h9i0j1k2l3m&isLiveMode=false&skip=0&take=50" \
  -H "Authorization: Bearer priv_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "clx4d5e6f7g8h9i0j1k2l3m4n",
      "name": "Thank You Page Placement",
      "site": {
        "id": "clx3c4d5e6f7g8h9i0j1k2l3m",
        "name": "My Store"
      },
      "type": "THANK_YOU_PAGE",
      "pageTarget": "BLOCK",
      "isLiveMode": false,
      "createdAt": "2024-01-15T10:40:00.000Z",
      "updatedAt": "2024-01-15T10:40:00.000Z"
    },
    {
      "id": "clx5e6f7g8h9i0j1k2l3m4n5o",
      "name": "Order Status Page Placement",
      "site": {
        "id": "clx3c4d5e6f7g8h9i0j1k2l3m",
        "name": "My Store"
      },
      "type": "ORDER_PAGE",
      "pageTarget": "BLOCK",
      "isLiveMode": false,
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 2,
    "skip": 0,
    "take": 50,
    "hasMore": false
  }
}
```

### Update Placement

Updates an existing placement’s configuration.

### Endpoint

```
PUT /api/placements/:id
```

### Authentication

Use the publisher’s **Private Key**:

```
Authorization: Bearer PUBLISHER_PRIVATE_KEY
```

### Request Body

All fields are optional:

```json
{
  "name": "Updated Placement Name",
  "isLiveMode": true,
  "pageType": "ORDER_PAGE",
  "pageTarget": "ANNOUNCEMENT_BAR",
  "data": {
    "brandName": "Updated Brand Name"
  }
}
```

### Example Request

```bash
curl -X PUT https://pr-api.falconlabs.us/api/placements/clx4d5e6f7g8h9i0j1k2l3m4n \
  -H "Authorization: Bearer priv_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" \
  -H "Content-Type: application/json" \
  -d '{
    "isLiveMode": true
  }'
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "clx4d5e6f7g8h9i0j1k2l3m4n",
    "name": "Thank You Page Placement",
    "isLiveMode": true,
    "updatedAt": "2024-01-15T12:00:00.000Z"
  },
  "message": "Placement updated successfully"
}
```

### Delete Placement

Deletes a placement.

### Endpoint

```
DELETE /api/placements/:id
```

### Authentication

Use the publisher’s **Private Key**:

```
Authorization: Bearer PUBLISHER_PRIVATE_KEY
```

### Example Request

```bash
curl -X DELETE https://pr-api.falconlabs.us/api/placements/clx4d5e6f7g8h9i0j1k2l3m4n \
  -H "Authorization: Bearer priv_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
```

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Placement deleted successfully"
}
```
