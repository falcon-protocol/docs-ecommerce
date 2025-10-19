# Site API Documentation

**Base URL**: `/api/site`

The Site API manages site entities that belong to publishers. Sites contain demographic and business information and serve as containers for placements.

## Table of Contents

1. [Authentication](#authentication)
2. [Response Format](#response-format)
3. [Endpoints](#endpoints)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)

## Authentication

All Site API endpoints require **API Token Authentication**.

- **Header**: `Authorization: Bearer <API_TOKEN>`
- **Access Control**: Users can only access sites that belong to their publisher
- **Token Validation**: API tokens are validated against the ApiToken entity in the database

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

### 1. List Sites

**GET** `/api/site`

Retrieves paginated list of sites for the authenticated publisher.

**Authentication**: API Token Authentication

**Query Parameters**:

- `skip` (optional): Number of records to skip (default: 0, must be non-negative)
- `take` (optional): Number of records to return (1-100, default: 50)
- `include` (optional): Set to "relations" to include related placements and publisher info
- `stats` (optional): Set to "true" to include site statistics

**Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "id": "clxx...",
      "name": "Site Name",
      "description": "Site description",
      "orderVolume": 1000,
      "averageOrder": 49.99,
      "ageDemographics": "AGE_25_34",
      "genderDemographics": "MIXED",
      "domain": "example.com",
      "status": "Active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "publisher": {
        // Only if include=relations
        "id": "pub_id",
        "name": "Publisher Name"
      },
      "placements": [
        {
          // Only if include=relations
          "id": "placement_id",
          "name": "Placement Name",
          "createdAt": "2024-01-01T00:00:00.000Z"
        }
      ],
      "category": {
        "id": "cat_id",
        "name": "Category Name",
        "path": "Category > Subcategory",
        "taxonomyId": "taxonomy_id"
      }
    }
  ],
  "pagination": {
    "total": 10,
    "skip": 0,
    "take": 50,
    "hasMore": false
  }
}
```

---

### 2. Create Site

**POST** `/api/site`

Creates a new site for the authenticated publisher.

**Authentication**: API Token Authentication

**Request Body**:

```json
{
  "name": "Site Name",
  "description": "Site description",
  "orderVolume": 1000,
  "averageOrder": 49.99,
  "ageDemographics": "AGE_25_34",
  "genderDemographics": "MIXED",
  "domain": "example.com",
  "status": "Active",
  "createEpomZone": true,
  "categoryName": "Category Name"
}
```

**Field Requirements**:

- `name`: **Required**, non-empty string, trimmed
- `description`: Optional, non-empty string if provided, trimmed
- `orderVolume`: Optional, non-negative integer
- `averageOrder`: Optional, non-negative number
- `ageDemographics`: Optional, must be valid AgeDemo enum value
- `genderDemographics`: Optional, must be valid GenderDemo enum value
- `domain`: Optional, trimmed
- `status`: Optional, must be valid AccountStatus enum (defaults to "Pending")
- `createEpomZone`: Optional, boolean (defaults to true)
- `categoryName`: Optional, must exactly match existing category name (case-sensitive)

**Response** (201):

```json
{
  "success": true,
  "data": {
    "id": "clxx...",
    "name": "Site Name",
    "description": "Site description",
    "orderVolume": 1000,
    "averageOrder": 49.99,
    "ageDemographics": "AGE_25_34",
    "genderDemographics": "MIXED",
    "domain": "example.com",
    "status": "Pending",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "category": {
      "id": "cat_id",
      "name": "Category Name",
      "path": "Category > Subcategory",
      "taxonomyId": "taxonomy_id"
    }
  },
  "message": "Site created successfully"
}
```

---

### 3. Get Site by ID

**GET** `/api/site/{id}`

Retrieves a specific site by ID. Users can only access sites that belong to their publisher.

**Authentication**: API Token Authentication

**Path Parameters**:

- `id`: Site ID (required, non-empty string)

**Query Parameters**:

- `include` (optional): Set to "relations" to include related placements and publisher info

**Response** (200):

```json
{
  "success": true,
  "data": {
    "id": "clxx...",
    "name": "Site Name",
    "description": "Site description",
    "orderVolume": 1000,
    "averageOrder": 49.99,
    "ageDemographics": "AGE_25_34",
    "genderDemographics": "MIXED",
    "domain": "example.com",
    "status": "Active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "publisher": {
      // Only if include=relations
      "id": "pub_id",
      "name": "Publisher Name"
    },
    "placements": [
      {
        // Only if include=relations
        "id": "placement_id",
        "name": "Placement Name",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "category": {
      "id": "cat_id",
      "name": "Category Name",
      "path": "Category > Subcategory",
      "taxonomyId": "taxonomy_id"
    }
  }
}
```

---

### 4. Update Site

**PUT** `/api/site/{id}`

Updates site information. Users can only update sites that belong to their publisher.

**Authentication**: API Token Authentication

**Path Parameters**:

- `id`: Site ID (required, non-empty string)

**Request Body** (all fields optional, at least one required):

```json
{
  "name": "Updated Site Name",
  "description": "Updated description",
  "orderVolume": 1500,
  "averageOrder": 59.99,
  "ageDemographics": "AGE_35_44",
  "genderDemographics": "MALE",
  "domain": "newdomain.com",
  "status": "Active",
  "categoryName": "New Category Name"
}
```

**Validation Rules**:

- `name`: Optional, non-empty string if provided, trimmed
- `description`: Optional, non-empty string if provided, trimmed
- `orderVolume`: Optional, non-negative integer if provided
- `averageOrder`: Optional, non-negative number if provided
- `ageDemographics`: Optional, must be valid AgeDemo enum value
- `genderDemographics`: Optional, must be valid GenderDemo enum value
- `domain`: Optional, trimmed
- `status`: Optional, must be valid AccountStatus enum value
- `categoryName`: Optional, must exactly match existing category name (case-sensitive)
- **At least one field must be provided for update**

**Response** (200):

```json
{
  "success": true,
  "data": {
    "id": "clxx...",
    "name": "Updated Site Name",
    "description": "Updated description",
    "orderVolume": 1500,
    "averageOrder": 59.99,
    "ageDemographics": "AGE_35_44",
    "genderDemographics": "MALE",
    "domain": "newdomain.com",
    "status": "Active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T01:00:00.000Z",
    "category": {
      "id": "cat_id",
      "name": "New Category Name",
      "path": "Category > Subcategory",
      "taxonomyId": "taxonomy_id"
    }
  },
  "message": "Site updated successfully"
}
```

---

### 5. Delete Site

**DELETE** `/api/site/{id}`

Deletes a site and all associated placements. Users can only delete sites that belong to their publisher.

**Authentication**: API Token Authentication

**Path Parameters**:

- `id`: Site ID (required, non-empty string)

**Response** (200):

```json
{
  "success": true,
  "message": "Site deleted successfully"
}
```

⚠️ **Warning**: This operation will also delete all placements associated with this site.

## Data Models

### Site Response Schema

```typescript
type SiteResponsePublic = {
  id: string;
  name: string;
  description?: string;
  orderVolume?: number;
  averageOrder?: number;
  ageDemographics?: AgeDemo;
  genderDemographics?: GenderDemo;
  domain?: string;
  status: AccountStatus;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  publisher?: {
    id: string;
    name: string;
  };
  placements?: {
    id: string;
    name: string;
    createdAt: string;
  }[];
  category?: {
    id: string;
    name: string;
    path: string;
    taxonomyId: string;
  };
};
```

### Enum Values

#### AgeDemo

- `AGE_18_24`
- `AGE_25_34`
- `AGE_35_44`
- `AGE_45_54`
- `AGE_55_64`
- `AGE_65_PLUS`

#### GenderDemo

- `MALE`
- `FEMALE`
- `MIXED`

#### AccountStatus

- `Pending`
- `Active`
- `Inactive`
- `Suspended`

## Error Handling

### Common HTTP Status Codes

- **200 OK**: Successful GET, PUT, DELETE operations
- **201 Created**: Successful POST operations
- **400 Bad Request**: Invalid request data or validation errors
- **401 Unauthorized**: Missing or invalid API token
- **403 Forbidden**: Insufficient permissions (trying to access another publisher's site)
- **404 Not Found**: Site not found or access denied
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
  "details": ["name: name is required and must be a non-empty string"]
}
```

#### Update Validation Error (400)

```json
{
  "success": false,
  "error": "Validation failed",
  "details": ["At least one field must be provided for update"]
}
```

#### Pagination Error (400)

```json
{
  "success": false,
  "error": "Invalid field value",
  "details": "skip must be a non-negative integer"
}
```

#### Authentication Error (401)

```json
{
  "success": false,
  "error": "Invalid Authorization token: Bearer invalid_token"
}
```

#### Site Not Found Error (404)

```json
{
  "success": false,
  "error": "Site not found"
}
```

#### Category Not Found Error (400)

```json
{
  "success": false,
  "error": "Category not found",
  "details": "Category 'Invalid Category' not found"
}
```

## Full Request Examples

### 1. List Sites (Basic)

```bash
curl -X GET "http://localhost:4000/api/site?skip=0&take=10" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345"
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "cm2a3b4c5d6e7f8g9h0i1j2k",
      "name": "Main E-commerce Store",
      "description": "Primary online storefront",
      "orderVolume": 1500,
      "averageOrder": 89.99,
      "ageDemographics": "AGE_25_34",
      "genderDemographics": "MIXED",
      "domain": "store.acme-ecommerce.com",
      "status": "Active",
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 3,
    "skip": 0,
    "take": 10,
    "hasMore": false
  }
}
```

---

### 2. List Sites with Relations

```bash
curl -X GET "http://localhost:4000/api/site?include=relations&take=5" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345"
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "cm2a3b4c5d6e7f8g9h0i1j2k",
      "name": "Main E-commerce Store",
      "description": "Primary online storefront",
      "orderVolume": 1500,
      "averageOrder": 89.99,
      "ageDemographics": "AGE_25_34",
      "genderDemographics": "MIXED",
      "domain": "store.acme-ecommerce.com",
      "status": "Active",
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z",
      "publisher": {
        "id": "cm1x2y3z4a5b6c7d8e9f0g1h",
        "name": "Acme E-commerce"
      },
      "placements": [
        {
          "id": "cm3c4d5e6f7g8h9i0j1k2l3m",
          "name": "Thank You Page Banner",
          "createdAt": "2024-01-15T12:30:00.000Z"
        }
      ],
      "category": {
        "id": "cm4d5e6f7g8h9i0j1k2l3m4n",
        "name": "Electronics",
        "path": "Shopping > Electronics",
        "taxonomyId": "falcon_tax_electronics_001"
      }
    }
  ],
  "pagination": {
    "total": 3,
    "skip": 0,
    "take": 5,
    "hasMore": false
  }
}
```

---

### 3. List Sites with Statistics

```bash
curl -X GET "http://localhost:4000/api/site?stats=true&take=5" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345"
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "cm2a3b4c5d6e7f8g9h0i1j2k",
      "name": "Main E-commerce Store",
      "description": "Primary online storefront",
      "orderVolume": 1500,
      "averageOrder": 89.99,
      "ageDemographics": "AGE_25_34",
      "genderDemographics": "MIXED",
      "domain": "store.acme-ecommerce.com",
      "status": "Active",
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z",
      "stats": {
        "totalImpressions": 15420,
        "totalClicks": 891,
        "clickThroughRate": 5.78,
        "revenue": 2456.78
      }
    }
  ],
  "pagination": {
    "total": 3,
    "skip": 0,
    "take": 5,
    "hasMore": false
  }
}
```

---

### 4. Create Site (Full Example)

```bash
curl -X POST http://localhost:4000/api/site \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345" \
  -d '{
    "name": "Mobile E-commerce Store",
    "description": "Dedicated mobile shopping experience",
    "orderVolume": 800,
    "averageOrder": 65.50,
    "ageDemographics": "AGE_18_24",
    "genderDemographics": "FEMALE",
    "domain": "mobile.acme-ecommerce.com",
    "status": "Active",
    "createEpomZone": true,
    "categoryName": "Fashion & Apparel"
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "cm5e6f7g8h9i0j1k2l3m4n5o",
    "name": "Mobile E-commerce Store",
    "description": "Dedicated mobile shopping experience",
    "orderVolume": 800,
    "averageOrder": 65.5,
    "ageDemographics": "AGE_18_24",
    "genderDemographics": "FEMALE",
    "domain": "mobile.acme-ecommerce.com",
    "status": "Active",
    "createdAt": "2024-01-16T09:15:00.000Z",
    "updatedAt": "2024-01-16T09:15:00.000Z",
    "category": {
      "id": "cm6f7g8h9i0j1k2l3m4n5o6p",
      "name": "Fashion & Apparel",
      "path": "Shopping > Fashion & Apparel",
      "taxonomyId": "falcon_tax_fashion_001"
    }
  },
  "message": "Site created successfully"
}
```

---

### 5. Create Site (Minimal Example)

```bash
curl -X POST http://localhost:4000/api/site \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345" \
  -d '{
    "name": "Quick Setup Store"
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "cm7g8h9i0j1k2l3m4n5o6p7q",
    "name": "Quick Setup Store",
    "status": "Pending",
    "createdAt": "2024-01-16T10:45:00.000Z",
    "updatedAt": "2024-01-16T10:45:00.000Z"
  },
  "message": "Site created successfully"
}
```

---

### 6. Get Site by ID

```bash
curl -X GET "http://localhost:4000/api/site/cm2a3b4c5d6e7f8g9h0i1j2k?include=relations" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "cm2a3b4c5d6e7f8g9h0i1j2k",
    "name": "Main E-commerce Store",
    "description": "Primary online storefront",
    "orderVolume": 1500,
    "averageOrder": 89.99,
    "ageDemographics": "AGE_25_34",
    "genderDemographics": "MIXED",
    "domain": "store.acme-ecommerce.com",
    "status": "Active",
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z",
    "publisher": {
      "id": "cm1x2y3z4a5b6c7d8e9f0g1h",
      "name": "Acme E-commerce"
    },
    "placements": [
      {
        "id": "cm3c4d5e6f7g8h9i0j1k2l3m",
        "name": "Thank You Page Banner",
        "createdAt": "2024-01-15T12:30:00.000Z"
      },
      {
        "id": "cm8h9i0j1k2l3m4n5o6p7q8r",
        "name": "Order Confirmation Popup",
        "createdAt": "2024-01-16T08:45:00.000Z"
      }
    ],
    "category": {
      "id": "cm4d5e6f7g8h9i0j1k2l3m4n",
      "name": "Electronics",
      "path": "Shopping > Electronics",
      "taxonomyId": "falcon_tax_electronics_001"
    }
  }
}
```

---

### 7. Update Site (Full Update)

```bash
curl -X PUT http://localhost:4000/api/site/cm2a3b4c5d6e7f8g9h0i1j2k \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345" \
  -d '{
    "name": "Premium E-commerce Store",
    "description": "Enhanced shopping experience with premium features",
    "orderVolume": 2500,
    "averageOrder": 125.00,
    "ageDemographics": "AGE_35_44",
    "genderDemographics": "MIXED",
    "domain": "premium.acme-ecommerce.com",
    "status": "Active",
    "categoryName": "Premium Electronics"
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "cm2a3b4c5d6e7f8g9h0i1j2k",
    "name": "Premium E-commerce Store",
    "description": "Enhanced shopping experience with premium features",
    "orderVolume": 2500,
    "averageOrder": 125.0,
    "ageDemographics": "AGE_35_44",
    "genderDemographics": "MIXED",
    "domain": "premium.acme-ecommerce.com",
    "status": "Active",
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-16T14:20:00.000Z",
    "category": {
      "id": "cm9i0j1k2l3m4n5o6p7q8r9s",
      "name": "Premium Electronics",
      "path": "Shopping > Electronics > Premium",
      "taxonomyId": "falcon_tax_premium_electronics_001"
    }
  },
  "message": "Site updated successfully"
}
```

---

### 8. Update Site (Partial Update)

```bash
curl -X PUT http://localhost:4000/api/site/cm2a3b4c5d6e7f8g9h0i1j2k \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345" \
  -d '{
    "orderVolume": 3000,
    "status": "Active"
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "cm2a3b4c5d6e7f8g9h0i1j2k",
    "name": "Premium E-commerce Store",
    "description": "Enhanced shopping experience with premium features",
    "orderVolume": 3000,
    "averageOrder": 125.0,
    "ageDemographics": "AGE_35_44",
    "genderDemographics": "MIXED",
    "domain": "premium.acme-ecommerce.com",
    "status": "Active",
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-16T16:45:00.000Z"
  },
  "message": "Site updated successfully"
}
```

---

### 9. Delete Site

```bash
curl -X DELETE http://localhost:4000/api/site/cm7g8h9i0j1k2l3m4n5o6p7q \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345"
```

**Response:**

```json
{
  "success": true,
  "message": "Site deleted successfully"
}
```

---

### Error Response Examples

#### Validation Error - Missing Required Field

```bash
curl -X POST http://localhost:4000/api/site \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345" \
  -d '{
    "description": "Store without name"
  }'
```

**Response (400):**

```json
{
  "success": false,
  "error": "Validation failed",
  "details": ["name: name is required and must be a non-empty string"]
}
```

#### Validation Error - Invalid Enum Value

```bash
curl -X POST http://localhost:4000/api/site \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345" \
  -d '{
    "name": "Test Site",
    "ageDemographics": "INVALID_AGE",
    "orderVolume": -100
  }'
```

**Response (400):**

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "ageDemographics: Invalid enum value. Expected AGE_18_24 | AGE_25_34 | AGE_35_44 | AGE_45_54 | AGE_55_64 | AGE_65_PLUS",
    "orderVolume: orderVolume must be a non-negative integer if provided"
  ]
}
```

#### Update Error - No Fields Provided

```bash
curl -X PUT http://localhost:4000/api/site/cm2a3b4c5d6e7f8g9h0i1j2k \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345" \
  -d '{}'
```

**Response (400):**

```json
{
  "success": false,
  "error": "Validation failed",
  "details": ["At least one field must be provided for update"]
}
```

#### Category Not Found Error

```bash
curl -X POST http://localhost:4000/api/site \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345" \
  -d '{
    "name": "Test Site",
    "categoryName": "Nonexistent Category"
  }'
```

**Response (400):**

```json
{
  "success": false,
  "error": "Category not found",
  "details": "Category 'Nonexistent Category' not found"
}
```

#### Site Not Found Error

```bash
curl -X GET http://localhost:4000/api/site/invalid_site_id \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345"
```

**Response (404):**

```json
{
  "success": false,
  "error": "Site not found"
}
```

#### Invalid API Token

```bash
curl -X GET http://localhost:4000/api/site \
  -H "Authorization: Bearer invalid_token_here"
```

**Response (401):**

```json
{
  "success": false,
  "error": "Invalid Authorization token: Bearer invalid_token_here"
}
```

#### Pagination Error

```bash
curl -X GET "http://localhost:4000/api/site?skip=-5&take=200" \
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

## Security Notes

1. **Publisher Isolation**: API token holders can only access sites that belong to their publisher
2. **Input Validation**: All inputs are validated using Zod schemas with proper sanitization
3. **Access Control**: Middleware validates site ownership before allowing access
4. **Category Validation**: Category names must exactly match existing categories in the system

## Integration with Other APIs

- **Publisher Relationship**: Sites belong to publishers (one-to-many)
- **Placement Relationship**: Sites can have multiple placements (one-to-many)
- **Category System**: Sites can be associated with categories from the taxonomy system
- **Epom Integration**: Sites can automatically create corresponding Epom zones when `createEpomZone` is true
