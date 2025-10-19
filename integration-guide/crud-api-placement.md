# Placement API Documentation

**Base URL**: `/api/placements`

The Placement API manages ad placement entities that belong to sites. Placements define where and how ads are displayed on publisher websites.

## Table of Contents

1. [Authentication](#authentication)
2. [Response Format](#response-format)
3. [Endpoints](#endpoints)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)

## Authentication

All Placement API endpoints require **API Token Authentication**.

- **Header**: `Authorization: Bearer <API_TOKEN>`

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message",
  "pagination": { // Only for list endpoints
    "total": 100,
    "skip": 0,
    "take": 50,
    "hasMore": true
  }
}
```

## Endpoints

### 1. List Placements

**GET** `/api/placements`

Retrieves paginated list of placements for the authenticated publisher.

**Authentication**: API Token Authentication

**Query Parameters**:

- `skip` (optional): Number of records to skip (default: 0, must be non-negative)
- `take` (optional): Number of records to return (1-100, default: 50)
- `siteId` (optional): Filter placements by site ID (non-empty string)
- `include` (optional): Set to "relations" to include related site info

**Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "id": "clxx...",
      "name": "Placement Name",
      "type": "THANK_YOU_PAGE",
      "isLiveMode": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "site": {
        // Only if include=relations
        "id": "site_id",
        "name": "Site Name"
      }
    }
  ],
  "pagination": {
    "total": 25,
    "skip": 0,
    "take": 50,
    "hasMore": false
  }
}
```

---

### 2. Create Placement

**POST** `/api/placements`

Creates a new placement for the authenticated publisher.

**Authentication**: API Token Authentication

**Request Body**:

```json
{
  "name": "Placement Name",
  "siteId": "site_id",
  "storeName": "Store Name",
  "storeUrl": "https://store.com",
  "shopifyUrl": "https://shop.com",
  "pageType": "THANK_YOU_PAGE",
  "isLiveMode": false,
  "template": 1,
  "data": {}
}
```

**Field Requirements**:

- `name`: **Required**, non-empty string
- `siteId`: Optional, string (if site already exists)
- `storeName`: Optional, string (required if no siteId provided)
- `storeUrl`: Optional, valid URL or domain (required if no siteId provided)
- `shopifyUrl`: Optional, valid URL or domain
- `pageType`: Optional, must be valid PageType enum value
- `isLiveMode`: Optional, boolean (defaults to false)
- `template`: Optional, integer between 1 and 15
- `data`: Optional, custom data object

**Validation Rules**:

- **Either** `siteId` **OR** both `storeName` and `storeUrl` must be provided
- URLs must be valid format (https://example.com) or domain name (example.com)
- Template must be integer between 1 and 15 if provided

**Response** (201):

```json
{
  "success": true,
  "data": {
    "id": "clxx...",
    "name": "Placement Name"
  },
  "message": "Placement created successfully"
}
```

---

### 3. Get Placement by ID

**GET** `/api/placements/{id}`

Retrieves a specific placement by ID. Users can only access placements that belong to their publisher's sites.

**Authentication**: API Token Authentication

**Path Parameters**:

- `id`: Placement ID (required, non-empty string)

**Query Parameters**:

- `include` (optional): Set to "relations" to include related site info

**Response** (200):

```json
{
  "success": true,
  "data": {
    "id": "clxx...",
    "name": "Placement Name",
    "type": "THANK_YOU_PAGE",
    "isLiveMode": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "site": {
      // Only if include=relations
      "id": "site_id",
      "name": "Site Name"
    }
  }
}
```

---

### 4. Update Placement

**PUT** `/api/placements/{id}`

Updates placement information. Users can only update placements that belong to their publisher's sites.

**Authentication**: API Token Authentication

**Path Parameters**:

- `id`: Placement ID (required, non-empty string)

**Request Body** (all fields optional):

```json
{
  "name": "Updated Placement Name",
  "storeName": "Updated Store Name",
  "storeUrl": "https://newstore.com",
  "shopifyUrl": "https://newshop.com",
  "pageType": "ORDER_PAGE",
  "isLiveMode": true
}
```

**Validation Rules**:

- `name`: Optional, non-empty string if provided
- `storeName`: Optional, non-empty string if provided
- `storeUrl`: Optional, valid URL or domain if provided
- `shopifyUrl`: Optional, valid URL or domain if provided
- `pageType`: Optional, must be valid PageType enum value
- `isLiveMode`: Optional, boolean

**Response** (200):

```json
{
  "success": true,
  "data": {
    "id": "clxx...",
    "name": "Updated Placement Name",
    "type": "ORDER_PAGE",
    "isLiveMode": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T01:00:00.000Z",
    "site": {
      "id": "site_id",
      "name": "Site Name"
    }
  },
  "message": "Placement updated successfully"
}
```

---

### 5. Delete Placement

**DELETE** `/api/placements/{id}`

Deletes a placement. Users can only delete placements that belong to their publisher's sites.

**Authentication**: API Token Authentication

**Path Parameters**:

- `id`: Placement ID (required, non-empty string)

**Response** (200):

```json
{
  "success": true,
  "message": "Placement deleted successfully"
}
```

## Data Models

### Placement Response Schema

```typescript
type PlacementResponse = {
  id: string;
  name: string;
  type: "THANK_YOU_PAGE" | "ORDER_PAGE";
  isLiveMode: boolean;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  site?: {
    id: string;
    name: string;
  };
};
```

### Placement Creation Request

```typescript
type CreatePlacementRequest = {
  name: string;
  siteId?: string;
  storeName?: string;
  storeUrl?: string;
  shopifyUrl?: string;
  pageType?: PageType;
  isLiveMode?: boolean;
  template?: number; // 1-15
  data?: any;
};
```

### Placement Update Request

```typescript
type UpdatePlacementRequest = {
  name?: string;
  storeName?: string;
  storeUrl?: string;
  shopifyUrl?: string;
  pageType?: PageType;
  isLiveMode?: boolean;
};
```

### Enum Values

#### PageType

- `THANK_YOU_PAGE`
- `ORDER_PAGE`

## Error Handling

### Common HTTP Status Codes

- **200 OK**: Successful GET, PUT, DELETE operations
- **201 Created**: Successful POST operations
- **400 Bad Request**: Invalid request data or validation errors
- **401 Unauthorized**: Missing or invalid API token
- **403 Forbidden**: Insufficient permissions (trying to access another publisher's placement)
- **404 Not Found**: Placement not found or access denied
- **500 Internal Server Error**: Server-side errors

### Error Response Format

```json
{
  "success": false,
  "error": "Error type",
  "details": "Detailed error message"
}
```

### Common Error Examples

#### Validation Error (400)

```json
{
  "success": false,
  "error": "Validation failed",
  "details": ["name: Name is required"]
}
```

#### Site/Store Validation Error (400)

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "siteId: Either siteId or both storeName and storeUrl are required"
  ]
}
```

#### URL Validation Error (400)

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "storeUrl: Must be a valid URL (e.g., https://example.com) or domain name (e.g., example.com)"
  ]
}
```

#### Template Validation Error (400)

```json
{
  "success": false,
  "error": "Validation failed",
  "details": ["template: Template must be an integer between 1 and 15"]
}
```

#### Pagination Error (400)

```json
{
  "success": false,
  "error": "Invalid field value",
  "details": "siteId must be a non-empty string"
}
```

#### Authentication Error (401)

```json
{
  "success": false,
  "error": "Invalid Authorization token: Bearer invalid_token"
}
```

#### Placement Not Found Error (404)

```json
{
  "success": false,
  "error": "Placement not found"
}
```

#### Site Not Found Error (400)

```json
{
  "success": false,
  "error": "Site not found",
  "details": "Site with ID 'invalid_site_id' not found or does not belong to publisher"
}
```

## Full Request Examples

### 1. List All Placements (Basic)

```bash
curl -X GET "http://localhost:4000/api/placements?skip=0&take=10" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345"
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "cm3c4d5e6f7g8h9i0j1k2l3m",
      "name": "Thank You Page Banner",
      "type": "THANK_YOU_PAGE",
      "isLiveMode": false,
      "createdAt": "2024-01-15T12:30:00.000Z",
      "updatedAt": "2024-01-15T12:30:00.000Z"
    },
    {
      "id": "cm8h9i0j1k2l3m4n5o6p7q8r",
      "name": "Order Confirmation Popup",
      "type": "ORDER_PAGE",
      "isLiveMode": true,
      "createdAt": "2024-01-16T08:45:00.000Z",
      "updatedAt": "2024-01-16T08:45:00.000Z"
    }
  ],
  "pagination": {
    "total": 5,
    "skip": 0,
    "take": 10,
    "hasMore": false
  }
}
```

---

### 2. List Placements with Relations

```bash
curl -X GET "http://localhost:4000/api/placements?include=relations&take=5" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345"
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "cm3c4d5e6f7g8h9i0j1k2l3m",
      "name": "Thank You Page Banner",
      "type": "THANK_YOU_PAGE",
      "isLiveMode": false,
      "createdAt": "2024-01-15T12:30:00.000Z",
      "updatedAt": "2024-01-15T12:30:00.000Z",
      "site": {
        "id": "cm2a3b4c5d6e7f8g9h0i1j2k",
        "name": "Main E-commerce Store"
      }
    },
    {
      "id": "cm8h9i0j1k2l3m4n5o6p7q8r",
      "name": "Order Confirmation Popup",
      "type": "ORDER_PAGE",
      "isLiveMode": true,
      "createdAt": "2024-01-16T08:45:00.000Z",
      "updatedAt": "2024-01-16T08:45:00.000Z",
      "site": {
        "id": "cm5e6f7g8h9i0j1k2l3m4n5o",
        "name": "Mobile E-commerce Store"
      }
    }
  ],
  "pagination": {
    "total": 5,
    "skip": 0,
    "take": 5,
    "hasMore": false
  }
}
```

---

### 3. List Placements for Specific Site

```bash
curl -X GET "http://localhost:4000/api/placements?siteId=cm2a3b4c5d6e7f8g9h0i1j2k&take=10" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345"
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "cm3c4d5e6f7g8h9i0j1k2l3m",
      "name": "Thank You Page Banner",
      "type": "THANK_YOU_PAGE",
      "isLiveMode": false,
      "createdAt": "2024-01-15T12:30:00.000Z",
      "updatedAt": "2024-01-15T12:30:00.000Z"
    },
    {
      "id": "cm9i0j1k2l3m4n5o6p7q8r9s",
      "name": "Checkout Exit Intent",
      "type": "ORDER_PAGE",
      "isLiveMode": true,
      "createdAt": "2024-01-16T14:20:00.000Z",
      "updatedAt": "2024-01-16T14:20:00.000Z"
    }
  ],
  "pagination": {
    "total": 2,
    "skip": 0,
    "take": 10,
    "hasMore": false
  }
}
```

---

### 4. Create Placement with Existing Site

```bash
curl -X POST http://localhost:4000/api/placements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345" \
  -d '{
    "name": "Thank You Page Placement",
    "siteId": "cm2a3b4c5d6e7f8g9h0i1j2k",
    "pageType": "THANK_YOU_PAGE",
    "template": 5,
    "isLiveMode": false,
    "data": {
      "customMessage": "Thanks for your purchase!",
      "showDiscount": true
    }
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "cm0j1k2l3m4n5o6p7q8r9s0t",
    "name": "Thank You Page Placement"
  },
  "message": "Placement created successfully"
}
```

---

### 5. Create Placement with New Store (Full Example)

```bash
curl -X POST http://localhost:4000/api/placements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345" \
  -d '{
    "name": "Order Confirmation Placement",
    "storeName": "Fashion Boutique Online",
    "storeUrl": "https://fashionboutique.com",
    "shopifyUrl": "https://fashionboutique.myshopify.com",
    "pageType": "ORDER_PAGE",
    "template": 3,
    "isLiveMode": true,
    "data": {
      "theme": "modern",
      "animation": "fadeIn",
      "position": "center"
    }
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "cm1k2l3m4n5o6p7q8r9s0t1u",
    "name": "Order Confirmation Placement"
  },
  "message": "Placement created successfully"
}
```

---

### 6. Create Placement (Minimal Example)

```bash
curl -X POST http://localhost:4000/api/placements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345" \
  -d '{
    "name": "Quick Setup Placement",
    "storeName": "Quick Store",
    "storeUrl": "quickstore.com"
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "cm2l3m4n5o6p7q8r9s0t1u2v",
    "name": "Quick Setup Placement"
  },
  "message": "Placement created successfully"
}
```

---

### 7. Get Placement by ID

```bash
curl -X GET "http://localhost:4000/api/placements/cm3c4d5e6f7g8h9i0j1k2l3m?include=relations" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "cm3c4d5e6f7g8h9i0j1k2l3m",
    "name": "Thank You Page Banner",
    "type": "THANK_YOU_PAGE",
    "isLiveMode": false,
    "createdAt": "2024-01-15T12:30:00.000Z",
    "updatedAt": "2024-01-15T12:30:00.000Z",
    "site": {
      "id": "cm2a3b4c5d6e7f8g9h0i1j2k",
      "name": "Main E-commerce Store"
    }
  }
}
```

---

### 8. Update Placement (Full Update)

```bash
curl -X PUT http://localhost:4000/api/placements/cm3c4d5e6f7g8h9i0j1k2l3m \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345" \
  -d '{
    "name": "Enhanced Thank You Banner",
    "storeName": "Premium E-commerce Store",
    "storeUrl": "https://premium.acme-ecommerce.com",
    "shopifyUrl": "https://premium-acme.myshopify.com",
    "pageType": "THANK_YOU_PAGE",
    "isLiveMode": true
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "cm3c4d5e6f7g8h9i0j1k2l3m",
    "name": "Enhanced Thank You Banner",
    "type": "THANK_YOU_PAGE",
    "isLiveMode": true,
    "createdAt": "2024-01-15T12:30:00.000Z",
    "updatedAt": "2024-01-16T18:15:00.000Z",
    "site": {
      "id": "cm2a3b4c5d6e7f8g9h0i1j2k",
      "name": "Main E-commerce Store"
    }
  },
  "message": "Placement updated successfully"
}
```

---

### 9. Update Placement (Switch to Live Mode)

```bash
curl -X PUT http://localhost:4000/api/placements/cm3c4d5e6f7g8h9i0j1k2l3m \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345" \
  -d '{
    "isLiveMode": true,
    "name": "Live Thank You Banner"
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "cm3c4d5e6f7g8h9i0j1k2l3m",
    "name": "Live Thank You Banner",
    "type": "THANK_YOU_PAGE",
    "isLiveMode": true,
    "createdAt": "2024-01-15T12:30:00.000Z",
    "updatedAt": "2024-01-16T19:30:00.000Z",
    "site": {
      "id": "cm2a3b4c5d6e7f8g9h0i1j2k",
      "name": "Main E-commerce Store"
    }
  },
  "message": "Placement updated successfully"
}
```

---

### 10. Delete Placement

```bash
curl -X DELETE http://localhost:4000/api/placements/cm2l3m4n5o6p7q8r9s0t1u2v \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345"
```

**Response:**

```json
{
  "success": true,
  "message": "Placement deleted successfully"
}
```

---

### Error Response Examples

#### Validation Error - Missing Required Field

```bash
curl -X POST http://localhost:4000/api/placements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345" \
  -d '{
    "storeName": "Store without name"
  }'
```

**Response (400):**

```json
{
  "success": false,
  "error": "Validation failed",
  "details": ["name: Name is required"]
}
```

#### Validation Error - Missing Site/Store Requirements

```bash
curl -X POST http://localhost:4000/api/placements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345" \
  -d '{
    "name": "Invalid Placement",
    "storeName": "Store Name"
  }'
```

**Response (400):**

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "siteId: Either siteId or both storeName and storeUrl are required"
  ]
}
```

#### Validation Error - Invalid URL

```bash
curl -X POST http://localhost:4000/api/placements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345" \
  -d '{
    "name": "Test Placement",
    "storeName": "Test Store",
    "storeUrl": "invalid-url",
    "shopifyUrl": "also-invalid"
  }'
```

**Response (400):**

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "storeUrl: Must be a valid URL (e.g., https://example.com) or domain name (e.g., example.com)",
    "shopifyUrl: Must be a valid URL (e.g., https://example.com) or domain name (e.g., example.com)"
  ]
}
```

#### Validation Error - Invalid Template Number

```bash
curl -X POST http://localhost:4000/api/placements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345" \
  -d '{
    "name": "Test Placement",
    "storeName": "Test Store",
    "storeUrl": "https://test.com",
    "template": 20
  }'
```

**Response (400):**

```json
{
  "success": false,
  "error": "Validation failed",
  "details": ["template: Template must be an integer between 1 and 15"]
}
```

#### Site Not Found Error

```bash
curl -X POST http://localhost:4000/api/placements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345" \
  -d '{
    "name": "Test Placement",
    "siteId": "invalid_site_id"
  }'
```

**Response (400):**

```json
{
  "success": false,
  "error": "Site not found",
  "details": "Site with ID 'invalid_site_id' not found or does not belong to publisher"
}
```

#### Placement Not Found Error

```bash
curl -X GET http://localhost:4000/api/placements/invalid_placement_id \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345"
```

**Response (404):**

```json
{
  "success": false,
  "error": "Placement not found"
}
```

#### Invalid Site ID Filter

```bash
curl -X GET "http://localhost:4000/api/placements?siteId=" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345"
```

**Response (400):**

```json
{
  "success": false,
  "error": "Invalid field value",
  "details": "siteId must be a non-empty string"
}
```

#### Pagination Error

```bash
curl -X GET "http://localhost:4000/api/placements?skip=-10&take=150" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345"
```

**Response (400):**

```json
{
  "success": false,
  "error": "Invalid field value",
  "details": "skip must be a non-negative integer"
}
```

#### Invalid API Token

```bash
curl -X GET http://localhost:4000/api/placements \
  -H "Authorization: Bearer invalid_token_here"
```

**Response (401):**

```json
{
  "success": false,
  "error": "Invalid Authorization token: Bearer invalid_token_here"
}
```

#### Invalid Page Type

```bash
curl -X POST http://localhost:4000/api/placements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345" \
  -d '{
    "name": "Test Placement",
    "storeName": "Test Store",
    "storeUrl": "https://test.com",
    "pageType": "INVALID_PAGE_TYPE"
  }'
```

**Response (400):**

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "pageType: Invalid enum value. Expected THANK_YOU_PAGE | ORDER_PAGE"
  ]
}
```

## Security Notes

1. **Publisher Isolation**: API token holders can only access placements that belong to their publisher's sites
2. **Input Validation**: All inputs are validated using Zod schemas with proper URL validation
3. **Access Control**: Middleware validates placement ownership through site-publisher relationships
4. **URL Sanitization**: URLs are validated to prevent injection attacks

## Integration with Other APIs

- **Site Relationship**: Placements belong to sites (many-to-one)
- **Publisher Relationship**: Placements are accessible through publisher ownership of sites
- **Template System**: Placements use integer-based templates (1-15) for UI configuration
- **Epom Integration**: Placements integrate with Epom ad network for ad serving
- **Test Mode**: `isLiveMode` determines whether placement serves live or test ads

## Special Notes

1. **Template Range**: Templates are numbered 1-15, each representing different UI configurations
2. **Test vs Live Mode**: `isLiveMode` flag controls whether placement serves live ads or test content
3. **Flexible Site Creation**: Placements can be created with existing sites or trigger new site creation
4. **URL Flexibility**: Both full URLs (https://example.com) and domain names (example.com) are accepted
5. **Custom Data**: The `data` field allows storing custom configuration as JSON objects
