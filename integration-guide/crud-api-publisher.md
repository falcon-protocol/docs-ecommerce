# Publisher API Documentation

**Base URL**: `/api/v1/publishers`

The Publisher API manages publisher entities with their contact information and API tokens. Publishers are the top-level entities that own sites and placements.

## Table of Contents

1. [Authentication](#authentication)
2. [Response Format](#response-format)
3. [Endpoints](#endpoints)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)

## Authentication

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

### 1. Create Publisher

**POST** `/api/v1/publishers`

Creates a new publisher with contact information and automatically generates API tokens.

**Authentication**: Service Authentication

**Request Body**:

```json
{
  "name": "Publisher Name",
  "contactName": "John Doe",
  "contactEmail": "john@example.com",
  "contactPhone": "+1-555-0123"
}
```

**Validation Rules**:

- `name`: Required, 1-255 characters, trimmed
- `contactName`: Required, non-empty string, trimmed
- `contactEmail`: Required, valid email format, trimmed
- `contactPhone`: Optional, non-empty string if provided, trimmed

**Response** (201):

```json
{
  "success": true,
  "data": {
    "id": "clxx...",
    "name": "Publisher Name",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "publicKeys": ["pub_key_123..."],
    "privateKeys": [
      {
        "id": "token_id",
        "name": "Default Token",
        "bearer": "falcon_xxx...",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  },
  "message": "Publisher created successfully"
}
```

---

### 2. List Publishers

**GET** `/api/v1/publishers`

Retrieves paginated list of all publishers.

**Authentication**: Service Authentication

**Query Parameters**:

- `skip` (optional): Number of records to skip (default: 0, must be non-negative)
- `take` (optional): Number of records to return (1-100, default: 50)
- `include` (optional): Set to "relations" to include related sites

**Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "id": "clxx...",
      "name": "Publisher Name",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "sites": [
        {
          // Only if include=relations
          "id": "site_id",
          "name": "Site Name",
          "createdAt": "2024-01-01T00:00:00.000Z"
        }
      ]
    }
  ],
  "pagination": {
    "total": 100,
    "skip": 0,
    "take": 50,
    "hasMore": true
  }
}
```

---

### 3. Get Current Publisher

**GET** `/api/v1/publishers/me`

Retrieves the publisher associated with the current API token.

**Authentication**: API Token Authentication

**Query Parameters**:

- `include` (optional): Set to "relations" to include related sites

**Response** (200):

```json
{
  "success": true,
  "data": {
    "id": "clxx...",
    "name": "Publisher Name",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "sites": [
      {
        // Only if include=relations
        "id": "site_id",
        "name": "Site Name",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 4. Get Publisher by ID

**GET** `/api/v1/publishers/{id}`

Retrieves a specific publisher by ID. Users can only access their own publisher data.

**Authentication**: API Token Authentication

**Path Parameters**:

- `id`: Publisher ID (required, non-empty string)

**Query Parameters**:

- `include` (optional): Set to "relations" to include related sites

**Response** (200):

```json
{
  "success": true,
  "data": {
    "id": "clxx...",
    "name": "Publisher Name",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "sites": [
      {
        // Only if include=relations
        "id": "site_id",
        "name": "Site Name",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 5. Update Publisher

**PUT** `/api/v1/publishers/{id}`

Updates publisher information. Users can only update their own publisher data.

**Authentication**: API Token Authentication

**Path Parameters**:

- `id`: Publisher ID (required, non-empty string)

**Request Body** (all fields optional):

```json
{
  "name": "Updated Publisher Name",
  "contactName": "Jane Doe",
  "contactEmail": "jane@example.com",
  "contactPhone": "+1-555-0456"
}
```

**Validation Rules**:

- `name`: Optional, 1-255 characters if provided, trimmed
- `contactName`: Optional, non-empty string if provided, trimmed
- `contactEmail`: Optional, valid email format if provided, trimmed
- `contactPhone`: Optional, non-empty string if provided, trimmed

**Response** (200):

```json
{
  "success": true,
  "data": {
    "id": "clxx...",
    "name": "Updated Publisher Name",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T01:00:00.000Z"
  },
  "message": "Publisher updated successfully"
}
```

---

### 6. Get Publisher API Tokens

**GET** `/api/v1/publishers/{id}/api-tokens`

Retrieves all API tokens for a publisher. Users can only access tokens for their own publisher.

**Authentication**: API Token Authentication

**Path Parameters**:

- `id`: Publisher ID (required, non-empty string)

**Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "id": "token_id",
      "name": "Token Name",
      "bearer": "falcon_xxx...",
      "revenueAccess": true,
      "grossAccess": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Data Models

### Publisher Response Schema

```typescript
type PublisherResponse = {
  id: string;
  name: string;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  sites?: {
    id: string;
    name: string;
    createdAt: string;
  }[];
  // Only included in creation response
  publicKeys?: string[];
  privateKeys?: {
    id: string;
    name: string;
    bearer: string;
    createdAt: string;
  }[];
};
```

### API Token Response Schema

```typescript
type PublisherApiTokenResponse = {
  id: string;
  name: string;
  bearer: string;
  revenueAccess: boolean;
  grossAccess: boolean;
  createdAt: string; // ISO 8601 timestamp
};
```

## Error Handling

### Common HTTP Status Codes

- **200 OK**: Successful GET, PUT, DELETE operations
- **201 Created**: Successful POST operations
- **400 Bad Request**: Invalid request data or validation errors
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions (trying to access another publisher's data)
- **404 Not Found**: Publisher not found or access denied
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
  "details": [
    "name: name must be a non-empty string",
    "contactEmail: contactEmail must be a valid email address"
  ]
}
```

#### Authentication Error (401)

```json
{
  "success": false,
  "error": "Invalid Authorization header",
  "details": "Expected format: Authorization: Bearer <token>"
}
```

#### Service Authentication Error (401)

```json
{
  "success": false,
  "error": "Invalid service authentication token"
}
```

#### Permission Error (403)

```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

#### Publisher Access Error (403)

```json
{
  "success": false,
  "error": "Insufficient permissions",
  "details": "Cannot access publisher data for different publisher"
}
```

#### Not Found Error (404)

```json
{
  "success": false,
  "error": "Publisher not found"
}
```

## Security Notes

1. **Service Authentication**: Only backend services with the correct `BACKEND_SERVICE_SECRET` can create and list publishers
2. **Publisher Isolation**: API token holders can only access their own publisher data
3. **Timing-Safe Comparisons**: All token comparisons use timing-safe algorithms to prevent timing attacks
4. **Access Control**: Middleware validates publisher ownership before allowing access to resources

## Full Request Examples

### 1. Create Publisher (Service Authentication)

```bash
curl -X POST http://localhost:4000/api/v1/publishers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <BACKEND_SERVICE_SECRET>" \
  -d '{
    "name": "Acme E-commerce",
    "contactName": "John Smith",
    "contactEmail": "john.smith@acme-ecommerce.com",
    "contactPhone": "+1-555-123-4567"
  }'
```

**Response:**

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

---

### 2. List Publishers (Service Authentication)

```bash
curl -X GET "http://localhost:4000/api/v1/publishers?skip=0&take=10&include=relations" \
  -H "Authorization: Bearer <BACKEND_SERVICE_SECRET>"
```

**Response:**

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

---

### 3. Get Current Publisher (API Token Authentication)

```bash
curl -X GET "http://localhost:4000/api/v1/publishers/me?include=relations" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345"
```

**Response:**

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
      },
      {
        "id": "cm3b4c5d6e7f8g9h0i1j2k3l",
        "name": "Mobile Store",
        "createdAt": "2024-01-16T09:15:00.000Z"
      }
    ]
  }
}
```

---

### 4. Get Publisher by ID (API Token Authentication)

```bash
curl -X GET "http://localhost:4000/api/v1/publishers/cm1x2y3z4a5b6c7d8e9f0g1h" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "cm1x2y3z4a5b6c7d8e9f0g1h",
    "name": "Acme E-commerce",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 5. Update Publisher (API Token Authentication)

```bash
curl -X PUT http://localhost:4000/api/v1/publishers/cm1x2y3z4a5b6c7d8e9f0g1h \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345" \
  -d '{
    "name": "Acme E-commerce Solutions",
    "contactName": "John Smith Jr.",
    "contactEmail": "john.smith@acme-solutions.com",
    "contactPhone": "+1-555-987-6543"
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "cm1x2y3z4a5b6c7d8e9f0g1h",
    "name": "Acme E-commerce Solutions",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T14:45:00.000Z"
  },
  "message": "Publisher updated successfully"
}
```

---

### 6. Get Publisher API Tokens (API Token Authentication)

```bash
curl -X GET http://localhost:4000/api/v1/publishers/cm1x2y3z4a5b6c7d8e9f0g1h/api-tokens \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345"
```

**Response:**

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
    },
    {
      "id": "cm4c5d6e7f8g9h0i1j2k3l4m",
      "name": "Analytics Token",
      "bearer": "falcon_sk_def456ghi789jkl012mno345pqr678stu901",
      "revenueAccess": true,
      "grossAccess": true,
      "createdAt": "2024-01-16T08:20:00.000Z"
    }
  ]
}
```

---

### Error Response Examples

#### Invalid Service Authentication

```bash
curl -X POST http://localhost:4000/api/v1/publishers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid_service_token" \
  -d '{"name": "Test Publisher"}'
```

**Response (401):**

```json
{
  "success": false,
  "error": "Invalid service authentication token"
}
```

#### Validation Error

```bash
curl -X POST http://localhost:4000/api/v1/publishers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <BACKEND_SERVICE_SECRET>" \
  -d '{
    "name": "",
    "contactEmail": "invalid-email"
  }'
```

**Response (400):**

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "name: name must be a non-empty string",
    "contactName: contactName must be a non-empty string",
    "contactEmail: contactEmail must be a valid email address"
  ]
}
```

#### Access Control Error

```bash
curl -X GET http://localhost:4000/api/v1/publishers/different_publisher_id \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345"
```

**Response (403):**

```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```
