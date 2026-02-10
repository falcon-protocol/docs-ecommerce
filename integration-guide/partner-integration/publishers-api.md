## Publishers API

### Overview

Publishers represent store owners or merchants in Falcon's system. This is the top-level entity that owns all sites and placements. The Publisher API uses **Service Authentication** for creating publishers and **Publisher Token Authentication** for managing existing publisher data.

### Base Endpoint

```
https://pr-api.falconlabs.us/api/v1/publishers
```

### **Authentication Types**

- **Service Authentication**: Required for creating and listing publishers (use platform token)
- **Publisher Token Authentication**: Required for accessing and updating specific publisher data (use PUBLISHER token)

### Create Publisher

Creates a new publisher account and automatically generates API tokens.

### Endpoint

```
POST /api/v1/publishers
```

### Authentication

Service Authentication (Platform Token):

```
Authorization: Bearer plat_1234567890abcdef1234567890abcdef
```

### Request Body

```json
{
  "name": "Store Owner Name",
  "contactName": "Contact Person Name",
  "contactEmail": "contact@example.com",
  "contactPhone": "+1-555-0123"
}
```

**Required Fields:**

- `name` (string, 1-255 characters): Publisher/store owner name
- `contactName` (string): Contact person’s full name
- `contactEmail` (string): Valid email address

**Optional Fields:**

- `contactPhone` (string): Optional, non-empty string if provided, trimmed

### Example Request

```bash
curl -X POST https://pr-api.falconlabs.us/api/v1/publishers \
  -H "Authorization: Bearer <BACKEND_SERVICE_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme E-commerce",
    "contactName": "John Smith",
    "contactEmail": "john.smith@acme-ecommerce.com",
    "contactPhone": "+1-555-123-4567"
  }'
```

### Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "cm1x2y3z4a5b6c7d8e9f0g1h",
    "name": "Acme E-commerce",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "publicKeys": ["falcon_pub_abc123def456ghi789jkl012"],
    "privateKeys": [
      {
        "id": "cm1a2b3c4d5e6f7g8h9i0j1k",
        "name": "Default API Token",
        "bearer": "falcon_sk_xyz789abc123def456ghi789jkl012mno345",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  },
  "message": "Publisher created successfully"
}
```

**Response Fields:**

- `id`: Publisher unique identifier
- `publicKeys[0]`: Public key for OData API (fetching offers)
- `privateKeys[0].bearer`: Private key for management operations (PUBLISHER token)

> **Critical:** Store both `publicKeys[0]` and `privateKeys[0].bearer` securely. The private key (PUBLISHER token) grants full access to manage the publisher's account.

### Error Responses

**400 Bad Request - Validation Failed**

```json
{
  "error": "Request validation failed",
  "code": "VALIDATION_FAILED",
  "details": [
    "name: name must be a non-empty string",
    "contactEmail: contactEmail must be a valid email address"
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**401 Unauthorized - Invalid Platform Token**

```json
{
  "error": "Invalid authentication token",
  "code": "INVALID_TOKEN",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**409 Conflict - Duplicate Publisher Name**

```json
{
  "error": "Publisher with name already exists",
  "code": "RESOURCE_CONFLICT",
  "details": {
    "resourceType": "Publisher",
    "field": "name",
    "value": "Acme E-commerce"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**500 Internal Server Error**

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred. Please try again later."
  }
}
```

### **Get Current Publisher**

Retrieves the publisher associated with the current API token.

### **Endpoint**

```
GET /api/v1/publishers/me
```

**Authentication:** PUBLISHER Token

**Query Parameters:**

• `include` (optional): Set to "relations" to include related sites

### Example Request

```bash
curl -X GET "https://pr-api.falconlabs.us/api/v1/publishers/me?include=relations" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345"
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "cm1x2y3z4a5b6c7d8e9f0g1h",
    "name": "Acme E-commerce",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "sites": [
      {
        "id": "cm2a3b4c5d6e7f8g9h0i1j2k",
        "name": "Main Store",
        "createdAt": "2024-01-15T11:00:00.000Z"
      }
    ]
  }
}
```

### Get Publisher by ID

Retrieves a specific publisher by ID. Users can only access their own publisher data.

### Endpoint

```
GET /api/v1/publishers/:id
```

### Authentication

**Authentication:** PUBLISHER Token:

```
Authorization: Bearer PUBLISHER_PRIVATE_KEY
```

**Path Parameters:**

- `id`: Publisher ID (required, non-empty string)

**Query Parameters:**

- `include` (optional): Set to "relations" to include related sites

### Example Request

```bash
curl -X GET https://pr-api.falconlabs.us/api/v1/publishers/cm1x2y3z4a5b6c7d8e9f0g1h \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345"
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "clx1a2b3c4d5e6f7g8h9i0j1k",
    "name": "Acme Fashion Boutique",
    "contactName": "Jane Smith",
    "contactEmail": "jane@acmefashion.com",
    "contactPhone": "+1-555-0123",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "status": "active"
  }
}
```

### Error Responses

**404 Not Found**

```json
{
  "error": "Publisher not found",
  "code": "RESOURCE_NOT_FOUND",
  "details": {
    "resourceType": "Publisher",
    "id": "cm1x2y3z4a5b6c7d8e9f0g1h"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### List All Publishers

Retrieves paginated list of all publishers (Service Authentication only).

### Endpoint

```
GET /api/v1/publishers
```

### Authentication

Use your **Platform Token**:

```
Authorization: Bearer plat_1234567890abcdef1234567890abcdef
```

### Query Parameters

- `skip` (optional): Number of records to skip (default: 0, must be non-negative integer)
- `take` (optional): Number of records to return (1-100, default: 50)
- `include` (optional): Set to "relations" to include related sites

### Example Request

```bash
curl -X GET "https://pr-api.falconlabs.us/api/v1/publishers?skip=0&take=10&include=relations" \
  -H "Authorization: Bearer plat_1234567890abcdef1234567890abcdef"
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "cm1x2y3z4a5b6c7d8e9f0g1h",
      "name": "Acme E-commerce",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "sites": [
        {
          "id": "cm2a3b4c5d6e7f8g9h0i1j2k",
          "name": "Main Store",
          "createdAt": "2024-01-15T11:00:00.000Z"
        }
      ]
    }
  ],
  "pagination": {
    "total": 1,
    "skip": 0,
    "take": 10,
    "hasMore": false
  }
}
```

### Update Publisher

Updates publisher information. Users can only update their own publisher data.

### Endpoint

```
PUT /api/v1/publishers/:id
```

### Authentication

Use the publisher’s **Private Key**:

```
Authorization: Bearer PUBLISHER_PRIVATE_KEY
```

**Path Parameters:**

- `id`: Publisher ID (required, non-empty string)

### Request Body

All fields are optional. Only include fields you want to update:

```json
{
  "name": "Acme E-commerce Solutions",
  "contactName": "John Smith Jr.",
  "contactEmail": "john.smith@acme-solutions.com",
  "contactPhone": "+1-555-987-6543"
}
```

### **Validation Rules:**

- `name`: Optional, 1-255 characters if provided, trimmed
- `contactName`: Optional, non-empty string if provided, trimmed
- `contactEmail`: Optional, valid email format if provided, trimmed
- `contactPhone`: Optional, non-empty string if provided, trimmed

### Example Request

```bash
curl -X PUT https://pr-api.falconlabs.us/api/v1/publishers/cm1x2y3z4a5b6c7d8e9f0g1h \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345" \
  -d '{
    "contactPhone": "+1-555-987-6543"
  }'
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "cm1x2y3z4a5b6c7d8e9f0g1h",
    "name": "Acme E-commerce",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T14:45:00.000Z"
  },
  "message": "Publisher updated successfully"
}
```

### Error Responses

**400 Bad Request - Invalid Field**

```json
{
  "error": "Request validation failed",
  "code": "VALIDATION_FAILED",
  "details": ["contactEmail: contactEmail must be a valid email address"],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**409 Conflict - Duplicate Email**

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Email already in use by another publisher"
  }
}
```

### **Get Publisher API Tokens**

Retrieves all API tokens for a publisher.

### **Endpoint:**

```
GET /api/v1/publishers/:id/api-tokens
```

**Authentication:** PUBLISHER Token

**Path Parameters:**

- `id`: Publisher ID (required, non-empty string)

### **Example Request:**

```bash
curl -X GET https://pr-api.falconlabs.us/api/v1/publishers/cm1x2y3z4a5b6c7d8e9f0g1h/api-tokens \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345"
```

### **Success Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "cm1a2b3c4d5e6f7g8h9i0j1k",
      "name": "Default API Token",
      "bearer": "falcon_sk_xyz789abc123def456ghi789jkl012mno345",
      "revenueAccess": true,
      "grossAccess": false,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### **Update Publisher Status (Lifecycle Management)**

Updates the operational status of a publisher (active/inactive). Use this endpoint for lifecycle events like app installation/uninstallation or account suspension.

### **Endpoint:**

```
PATCH /api/v1/publishers/:id/status
```

**Authentication:** PUBLISHER, SERVICE, or ADMIN Token

### **Authorization:**

- **PUBLISHER tokens**: Can only update their own publisher
- **SERVICE tokens**: Can update publishers matching their platform
- **ADMIN tokens**: Can update any publisher

**Path Parameters:**

- `id`: Publisher ID (required, non-empty string)

### **Request Body:**

```json
{
  "status": "active",
  "reason": "Publisher activated after verification"
}
```

**Field Requirements:**

- `status`: **Required**, must be "active" or "inactive"
- `reason`: Optional, string describing the reason for the status change

### **Example Request:**

```bash
curl -X PATCH https://pr-api.falconlabs.us/api/v1/publishers/cm1x2y3z4a5b6c7d8e9f0g1h/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345" \
  -d '{
    "status": "active",
    "reason": "Publisher activated after payment verification"
  }'
```

### **Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "cm1x2y3z4a5b6c7d8e9f0g1h",
    "name": "Acme E-commerce",
    "status": "active",
    "adsEnabled": true
  },
  "message": "Publisher status updated to active"
}
```

### **Use Cases:**

- **Store Installation**: Set status to "active" when a store is first installed
- **Store Uninstallation**: Set status to "inactive" when a store is uninstalled
- **Publisher Suspension**: Set status to "inactive" when a publisher violates policies
- **Publisher Reactivation**: Set status to "active" when a suspended publisher is reinstated

**Webhook Logging:** This operation creates a `WebhookEvent` entry for audit purposes with:

- `source`: "publisher:{publisherId}" or "service:{platformId}"
- `eventType`: "publisher_status_change"
- `payload`: { publisherId, status, reason }
- `publisherId`: The affected publisher ID
- `callerIpAddress`: IP address of the caller

---

### **Update Publisher Ads Status (Lifecycle Management)**

Updates the ad serving status for a publisher independently from publisher status.

### **Endpoint:**

```
PATCH /api/v1/publishers/:id/ads
```

**Authentication:** PUBLISHER, SERVICE, or ADMIN Token

**Authorization:**

- **PUBLISHER tokens**: Can only update their own publisher
- **SERVICE tokens**: Can update publishers matching their platform
- **ADMIN tokens**: Can update any publisher

**Path Parameters:**

- `id`: Publisher ID (required, non-empty string)

### **Request Body:**

```json
{
  "adsEnabled": true,
  "reason": "Ads enabled after payment verification"
}
```

**Field Requirements:**

- `adsEnabled`: **Required**, boolean (true to enable ads, false to disable)
- `reason`: Optional, string describing the reason for the change

**Example Request:**

```bash
curl -X PATCH https://pr-api.falconlabs.us/api/v1/publishers/cm1x2y3z4a5b6c7d8e9f0g1h/ads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345" \
  -d '{
    "adsEnabled": true,
    "reason": "Payment verification completed"
  }'
```

### **Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "cm1x2y3z4a5b6c7d8e9f0g1h",
    "name": "Acme E-commerce",
    "status": "active",
    "adsEnabled": true
  },
  "message": "Publisher ads enabled"
}
```

### **Use Cases:**

- **Payment Verification**: Enable ads after publisher completes payment setup
- **Contract Expiration**: Disable ads when publisher's contract expires
- **Policy Violation**: Temporarily disable ads while investigating violations
- **Trial Period**: Enable/disable ads based on trial status

**Webhook Logging:** This operation creates a `WebhookEvent` entry for audit purposes.

### Delete Publisher

Deletes a publisher and all associated sites and placements.

> Warning: This action is irreversible. All sites, placements, and historical data will be permanently deleted.

### Endpoint

```
DELETE /api/v1/publishers/:id
```

### Authentication

Use the publisher’s **Private Key**:

```
Authorization: Bearer PUBLISHER_PRIVATE_KEY
```

### Example Request

```bash
curl -X DELETE https://pr-api.falconlabs.us/api/v1/publishers/clx1a2b3c4d5e6f7g8h9i0j1k \
  -H "Authorization: Bearer priv_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
```

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Publisher deleted successfully"
}
```

### Error Responses

**403 Forbidden - Active Placements**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Cannot delete publisher with active placements",
    "details": {
      "activePlacements": 3
    }
  }
}
```
