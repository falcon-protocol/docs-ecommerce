# Falcon Partner Integration Guide

## Overview

This guide provides comprehensive instructions for integrating Falcon’s promotional ad unit system into your platform. Falcon enables partners to display targeted promotional offers to customers at key moments in their journey (thank you pages, order status pages, etc.).

The integration follows a three-step process:

1. **Create a Publisher** - Represents a store owner/merchant in Falcon’s system
2. **Create a Site** - Represents an individual store/website
3. **Create a Placement** - Represents the specific ad unit location (e.g., thank you page)

---

## Prerequisites

### Required Credentials

- **Platform Token**: A unique authentication token for your platform. Contact Falcon directly to obtain your platform-specific token.
- **Production API URL**: `https://pr-api.falconlabs.us`
- **Staging API URL**: `https://staging-pr-api.falconlabs.us`

> Important: Platform tokens are partner-specific and must be obtained from Falcon. Each integration partner receives a unique token that grants access to create and manage publishers on behalf of their merchants.

---

## Staging Environment

### Environment URLs

- **Staging**: `https://staging-pr-api.falconlabs.us`
- **Production**: `https://pr-api.falconlabs.us`

> Critical: All development and testing MUST happen on the staging environment to avoid polluting production metrics. Never test with production URLs during development.

### Service API Keys

- **Staging Service API Key**: Provided separately by Falcon integration team
- **Production Service API Key**: Provided after successful staging integration review

Contact the Falcon integration team to receive your staging credentials before beginning development.

### Technical Requirements

- HTTPS-capable server for API calls
- Ability to securely store authentication tokens
- Support for making REST API requests with JSON payloads

---

## Authentication & Platform Tokens

### Platform Token Overview

Platform tokens are used **ONLY** to create publisher accounts on behalf of merchants. They are not used to fetch promotional offers.

**Authentication Flow:**

1. **Use Platform Token** → Create a new publisher account
2. **Receive Two Keys** from publisher creation:
   - **Public Key** - Used ONLY for fetching promotional offers (OData API)
   - **Private Key** - Used for ALL management operations (creating sites, placements, accessing reports)

> Critical: Platform tokens create publishers. Public keys fetch offers. Private keys manage everything else. Do not confuse these three distinct authentication tokens.

### Using Authentication Tokens

**Platform Token** (Publisher creation only):

```
Authorization: Bearer plat_1234567890abcdef1234567890abcdef
```

**Public Key** (Fetching offers only):

```
Authorization: Bearer pub_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

**Private Key** (Sites, placements, reporting):

```
Authorization: Bearer priv_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

---

## Rate Limits

### API Rate Limiting Policy

Falcon implements rate limiting to ensure service stability and fair usage across all partners.

### Rate Limit Tiers

| Endpoint Type                                   | Requests per Minute | Requests per Hour |
| ----------------------------------------------- | ------------------- | ----------------- |
| Management APIs (Publishers, Sites, Placements) | 60                  | 1,000             |
| OData API (Offer Fetching)                      | 300                 | 10,000            |
| Reporting API                                   | 30                  | 500               |

### Rate Limit Headers

All API responses include rate limit information in headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 2024-01-15T10:45:00.000Z
```

- `X-RateLimit-Limit`: Maximum requests allowed in the current window
- `X-RateLimit-Remaining`: Requests remaining in the current window
- `X-RateLimit-Reset`: ISO 8601 timestamp when the rate limit resets

### Rate Limit Exceeded Response

When you exceed rate limits, the API returns HTTP 429:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later",
    "retryAfter": 45
  }
}
```

### Best Practices for Rate Limits

- Implement exponential backoff for retries
- Cache publisher, site, and placement IDs to reduce API calls
- Use batch operations when available
- Monitor rate limit headers and adjust request frequency
- Distribute requests evenly throughout the time window

---

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

---

## Sites API

### Overview

Sites represent individual stores or websites within a publisher's account. Each site contains demographic and business information and serves as a container for placements (ad units).

### Base Endpoint

```
https://pr-api.falconlabs.us/api/site
```

### **Authentication**

All Site API endpoints require **PUBLISHER Token Authentication**.

```
Authorization: Bearer <PUBLISHER_TOKEN>
```

### Create Site

Creates a new site under a publisher account.

### Endpoint

```
POST /api/site
```

### Request Body

```json
{
  "name": "Mobile E-commerce Store",
  "description": "Dedicated mobile shopping experience",
  "orderVolume": 800,
  "averageOrder": 65.5,
  "ageDemographics": "AGE_25_34",
  "genderDemographics": "MIXED",
  "domain": "mobile.acme-ecommerce.com",
  "status": "active",
  "createEpomZone": true,
  "categoryName": "Fashion & Apparel"
}
```

**Required Fields:**

- `name`: **Required**, non-empty string, trimmed
- `description`: Optional, non-empty string if provided, trimmed
- `orderVolume`: Optional, non-negative integer (monthly order volume)
- `averageOrder`: Optional, non-negative number (average order value in USD)
- `ageDemographics`: Optional, must be valid AgeDemo enum value
  - Valid values: `AGE_18_24`, `AGE_25_34`, `AGE_35_44`, `AGE_45_54`, `AGE_55_64`, `AGE_65_PLUS`
- `genderDemographics`: Optional, must be valid GenderDemo enum value
  - Valid values: `MALE`, `FEMALE`, `MIXED`
- `domain`: Optional, trimmed (use actual domain, avoid myshopify.com when possible)
- `status`: Optional, must be "active" or "inactive" (defaults to "pending")
- `createEpomZone`: Optional, boolean (defaults to true)
- `categoryName`: Optional, must exactly match existing category name (case-sensitive)

> **Important for Ad Optimization:** Providing accurate demographic and business data (`orderVolume`, `averageOrder`, `ageDemographics`, `genderDemographics`, `categoryName`) is critical for delivering relevant offers and maximizing revenue.

### Category Name Options (153 Categories)

Category matching is case-sensitive and must use exact format `Major Vertical > Sub-Vertical`:

### Category

Apparel and Fashion > Clothing and Apparel

Apparel and Fashion > Footwear

Apparel and Fashion > Handbags, Purses and Other Accessories

Apparel and Fashion > Jewelry

Apparel and Fashion > Luxury Fashion

Apparel and Fashion > Sports and Fitness Apparel

Apparel and Fashion > Sports Fan Gear and Merchandise

Apparel and Fashion > Undergarments and Lingerie

Automotive > Automotive Brands

Automotive > Auto Parts and Accessories

Automotive > Dealerships

Automotive > Vehicle Repair and Maintenance

B2B > B2B

B2B > Consulting, Insurance, Accounting and Legal Services

B2B > CRM

B2B > Enterprise Telecoms and Telephony

B2B > IT, Software and Systems

B2B > Shipping and Logistics

B2B > Marketing and Advertising

B2B > Office Hardware

B2B > Office Supplies

B2B > Payments

B2B > Recruiting, Payroll and HR

B2B > Website Hosting and Services

Beauty and Personal Care > Hygiene and Toiletries

Beauty and Personal Care > Makeup, Cosmetics and Fragrances

Beauty and Personal Care > Shaving and Grooming

Beauty and Personal Care > Skin Care

Computer and Consumer Electronics > Computer and Accessories

Computer and Consumer Electronics > Consumer Electronics

Computer and Consumer Electronics > Department Stores

Computer and Consumer Electronics > Home Audio and Video

Computer and Consumer Electronics > Security Equipment and Services

Computer and Consumer Electronics > Software

Computer and Consumer Electronics > Telephone and Accessories

Finance > Banking

Finance > Buy Now Pay Later

Finance > Cash Advance

Finance > Credit Cards

Finance > Credit History and Checks

Finance > Cryptocurrency and Blockchain

Finance > Digital Payments and Wallets

Finance > Gift Cards

Finance > Home Loans

Finance > Money Transfer and Wire Services

Finance > Peer to Peer Finance

Finance > Personal Loans

Finance > Retirement and Investment

Food and Beverage > Alcohol Subscriptions

Food and Beverage > Alcohol and Wine Sellers

Food and Beverage > Food Delivery Service

Food and Beverage > Groceries and CPG

Food and Beverage > Non-alcoholic Beverages

Food and Beverage > Prepared Meals and Meal Kits

Food and Beverage > Restaurants

Food and Beverage > Quick Service Restaurants (QSR)

General Merchandise > Deals and Discounts

General Merchandise > Department Stores

General Merchandise > Wholesale

Gifts and Occasions > Cards and Greetings

Gifts and Occasions > Flower Arrangements

Gifts and Occasions > Gifts and Personalized Gifts

Gifts and Occasions > Holidays and Seasonal Events

Health and Medical > Ancestry and Genealogy

Health and Medical > Biotech and Pharmaceutical Manufacturer

Health and Medical > Health and Wellbeing Services

Health and Medical > Medical Devices, Equipment and Supplies

Health and Medical > Medical and Cosmetic Services

Health and Medical > Nutrition and Dieting

Health and Medical > OTC Vitamins and Supplements

Health and Medical > Pharmacy Retail and Wellness Stores

Health and Medical > Pharmacy (Prescription)

Health and Medical > THC and CBD

Hobbies and Leisure > Camping and Outdoor Recreation

Hobbies and Leisure > Casino

Hobbies and Leisure > Dating

Hobbies and Leisure > Fantasy Sports

Hobbies and Leisure > Fitness and Exercise

Hobbies and Leisure > Lottery

Hobbies and Leisure > Nightclubs, Bars and Music Clubs

Hobbies and Leisure > Photography

Hobbies and Leisure > Sports Betting

Hobbies and Leisure > Sweepstakes

Hobbies and Leisure > Video Games

Home and Decor > Crafts and Party Supplies

Home and Decor > Home Appliances and Furnishings

Home and Decor > Home Improvement and Maintenance

Insurance and Warranty > General Insurance

Insurance and Warranty > Health Insurance

Insurance and Warranty > Home and Property Insurance

Insurance and Warranty > Life and Income Insurance

Insurance and Warranty > Pet Insurance

Insurance and Warranty > Retail Insurance

Insurance and Warranty > Ticketing Insurance

Insurance and Warranty > Travel Insurance

Insurance and Warranty > Vehicle Insurance

Jobs and Education > Certificate and Vocational Programs

Jobs and Education > College or University

Jobs and Education > Driving Instruction and Education

Jobs and Education > Jobs and Recruitment

Jobs and Education > K-12 Learning

Jobs and Education > Online Education

Jobs and Education > Tutoring

Loyalty and Affiliates > Free Cashback and Rewards Programs

Loyalty and Affiliates > Comparison

Loyalty and Affiliates > Market Research

Loyalty and Affiliates > Paid Cashback and Rewards Programs

Loyalty and Affiliates > Samples

Marketplace and Consignment > Classifieds

Marketplace and Consignment > Consignment

Marketplace and Consignment > Marketplace

Media and Entertainment > Adult Entertainment

Media and Entertainment > Cable TV and Pay-Per-View

Media and Entertainment > Music and Audio

Media and Entertainment > News, Magazines, and Newspapers

Media and Entertainment > Video

Non-Profits and Public Sector > Charities and Non-Profits

Non-Profits and Public Sector > Government

Non-Profits and Public Sector > Military

Non-Profits and Public Sector > Political Campaigns

Professional Services > Attorneys and Law Firms

Professional Services > Consulting and Professional Advice

Professional Services > Tax Preparation and Auditing Services

Real Estate > Real Estate and Property

Real Estate > Real Estate Agents and Brokerages

Services and Utilities > Internet

Services and Utilities > Local and Local Business

Services and Utilities > Telecoms

Services and Utilities > Utilities

Specialty Retail > Baby, Parenting and Family

Specialty Retail > Books and Literature

Specialty Retail > Eyewear

Specialty Retail > Hazardous or Dangerous Products

Specialty Retail > Pet Goods and Supplies

Specialty Retail > Sexual Wellness

Specialty Retail > Sports and Outdoor Equipment

Specialty Retail > Travel Goods

Ticketing and Events > Attractions and Parks

Ticketing and Events > Event Tickets

Ticketing and Events > Local Events

Ticketing and Events > Movie Tickets

Travel, Tourism, and Transport > Accommodation

Travel, Tourism, and Transport > Airlines

Travel, Tourism, and Transport > Car Rental and Sharing

Travel, Tourism, and Transport > Cruises

Travel, Tourism, and Transport > Destination Promoters

Travel, Tourism, and Transport > Online Travel Agency (OTA)

Travel, Tourism, and Transport > Parking

Travel, Tourism, and Transport > Public and Mass Transit

Travel, Tourism, and Transport > Rideshare

Travel, Tourism, and Transport > Timeshare

Travel, Tourism, and Transport > Tours and Local Experiences

### Example Request

```bash
curl -X POST https://pr-api.falconlabs.us/api/site \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345" \
  -d '{
    "name": "Mobile E-commerce Store",
    "description": "Dedicated mobile shopping experience",
    "orderVolume": 800,
    "averageOrder": 65.50,
    "ageDemographics": "AGE_25_34",
    "genderDemographics": "MIXED",
    "domain": "mobile.acme-ecommerce.com",
    "status": "active",
    "createEpomZone": true,
    "categoryName": "Fashion & Apparel"
  }'
```

### Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "cm5e6f7g8h9i0j1k2l3m4n5o",
    "name": "Mobile E-commerce Store",
    "description": "Dedicated mobile shopping experience",
    "orderVolume": 800,
    "averageOrder": 65.5,
    "ageDemographics": "AGE_25_34",
    "genderDemographics": "MIXED",
    "domain": "mobile.acme-ecommerce.com",
    "status": "active",
    "adsEnabled": true,
    "createdAt": "2024-01-16T09:15:00.000Z",
    "updatedAt": "2024-01-16T09:15:00.000Z",
    "category": {
      "id": "cm6f7g8h9i0j1k2l3m4n5o6p",
      "name": "Apparel and Fashion > Clothing and Apparel",
      "path": "Apparel and Fashion > Clothing and Apparel",
      "taxonomyId": "falcon_tax_fashion_001"
    }
  },
  "message": "Site created successfully"
}
```

### **Idempotent Behavior - Existing Site Returned**

**Important Behavioral Note:** If a site with the same name already exists for this publisher, the API returns the existing site (200 OK) instead of throwing a conflict error. This is intentional to support idempotent site creation.

```json
{
  "success": true,
  "data": {
    "id": "cm5e6f7g8h9i0j1k2l3m4n5o",
    "name": "Mobile E-commerce Store",
    "description": "Dedicated mobile shopping experience",
    "orderVolume": 800,
    "averageOrder": 65.5,
    "ageDemographics": "AGE_25_34",
    "genderDemographics": "MIXED",
    "domain": "mobile.acme-ecommerce.com",
    "status": "active",
    "adsEnabled": true,
    "createdAt": "2024-01-15T09:15:00.000Z",
    "updatedAt": "2024-01-15T09:15:00.000Z",
    "category": {
      "id": "cm6f7g8h9i0j1k2l3m4n5o6p",
      "name": "Apparel and Fashion > Clothing and Apparel",
      "path": "Apparel and Fashion > Clothing and Apparel",
      "taxonomyId": "falcon_tax_fashion_001"
    }
  },
  "message": "Site created successfully"
}
```

**Note:** You can distinguish between a newly created site and an existing site by comparing the `createdAt` timestamp. If the site was just created, `createdAt` will be very recent. For existing sites, `createdAt` may be older.

### Error Responses

**400 Bad Request - Validation Failed**

```json
{
  "error": "Request validation failed",
  "code": "VALIDATION_FAILED",
  "details": ["name: name is required and must be a non-empty string"],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**400 Bad Request - Category Not Found:**

```json
{
  "error": "Invalid value for field: categoryName",
  "code": "INVALID_FIELD_VALUE",
  "details": {
    "field": "categoryName",
    "value": "Invalid Category",
    "expectedType": "valid category name from list"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**401 Unauthorized**

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing authentication token"
  }
}
```

### Get Site by ID

Retrieves a single site by ID.

### Endpoint

```
GET /api/site/:id
```

### Authentication

Use the publisher’s **Private Key**:

```
Authorization: Bearer PUBLISHER_PRIVATE_KEY
```

### Example Request

```bash
curl -X GET https://pr-api.falconlabs.us/api/site/clx3c4d5e6f7g8h9i0j1k2l3m \
  -H "Authorization: Bearer priv_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "cm5e6f7g8h9i0j1k2l3m4n5o",
    "name": "Fashion Boutique Store",
    "description": "Premium women's fashion",
    "domain": "fashionboutique.com",
    "orderVolume": 500,
    "averageOrder": 75.5,
    "ageDemographics": "AGE_25_34",
    "genderDemographics": "FEMALE",
    "status": "active",
    "adsEnabled": true,
    "createdAt": "2024-01-15T10:35:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z",
    "category": {
      "id": "cm6f7g8h9i0j1k2l3m4n5o6p",
      "name": "Apparel and Fashion > Clothing and Apparel",
      "path": "Apparel and Fashion > Clothing and Apparel",
      "taxonomyId": "falcon_tax_fashion_001"
    }
  }
}
```

### Error Responses

**404 Not Found**

```json
{
  "error": "Site not found",
  "code": "RESOURCE_NOT_FOUND",
  "details": {
    "resourceType": "Site",
    "id": "clx3c4d5e6f7g8h9i0j1k2l3m"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### List Sites

Retrieves all sites for a publisher.

### Endpoint

```
GET /api/site
```

### Authentication

Use the publisher’s **Private Key**:

```
Authorization: Bearer PUBLISHER_PRIVATE_KEY
```

### Query Parameters

- `skip` (number, default: 0): Number of records to skip
- `take` (number, default: 50, max: 100): Number of records to return
- `include` (string): Set to "relations" to include related data
- `stats` (boolean): Set to true to include site statistics

### Example Request

```bash
curl -X GET "https://pr-api.falconlabs.us/api/site?skip=0&take=20" \
  -H "Authorization: Bearer priv_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "clx3c4d5e6f7g8h9i0j1k2l3m",
      "name": "Fashion Boutique Store",
      "domain": "fashionboutique.com",
      "status": "active",
      "createdAt": "2024-01-15T10:35:00.000Z"
    },
    {
      "id": "clx4d5e6f7g8h9i0j1k2l3m4n",
      "name": "Tech Gadgets Shop",
      "domain": "techgadgets.com",
      "status": "active",
      "createdAt": "2024-01-14T09:20:00.000Z"
    }
  ],
  "pagination": {
    "total": 12,
    "skip": 0,
    "take": 20,
    "hasMore": false
  }
}
```

### Update Site

Updates an existing site’s information.

### Endpoint

```
PUT /api/site/:id
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
  "name": "Updated Store Name",
  "description": "Updated description",
  "domain": "newdomain.com",
  "orderVolume": 750,
  "averageOrder": 85.0,
  "status": "active"
}
```

### Example Request

```bash
curl -X PUT https://pr-api.falconlabs.us/api/site/clx3c4d5e6f7g8h9i0j1k2l3m \
  -H "Authorization: Bearer priv_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" \
  -H "Content-Type: application/json" \
  -d '{
    "orderVolume": 750,
    "averageOrder": 85.00
  }'
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "clx3c4d5e6f7g8h9i0j1k2l3m",
    "name": "Fashion Boutique Store",
    "orderVolume": 750,
    "averageOrder": 85.0,
    "updatedAt": "2024-01-15T12:00:00.000Z"
  },
  "message": "Site updated successfully"
}
```

### **Update Site Status (Lifecycle Management)**

Updates the operational status of a site (active/inactive). Use this endpoint to activate or deactivate sites based on store lifecycle events.

**Endpoint:**

```
PATCH /api/site/:id/status
```

**Authentication:** PUBLISHER Token

**Rate Limit:** 50 req/min (elevated: 150 req/min)

**Path Parameters:**

- `id`: Site ID (required, non-empty string)

**Request Body:**

```json
{
  "status": "active",
  "reason": "Store activated after verification"
}
```

**Field Requirements:**

- `status`: **Required**, must be "active" or "inactive"
- `reason`: Optional, string describing the reason for the status change

**Example Request:**

```bash
curl -X PATCH https://pr-api.falconlabs.us/api/site/cm2a3b4c5d6e7f8g9h0i1j2k/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345" \
  -d '{
    "status": "active",
    "reason": "Store activated after verification"
  }'
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "cm2a3b4c5d6e7f8g9h0i1j2k",
    "name": "Main E-commerce Store",
    "status": "active",
    "adsEnabled": true
  },
  "message": "Site status updated to active"
}
```

**Use Cases:**

- **Store Installation**: Set status to "active" when a store is first installed
- **Store Uninstallation**: Set status to "inactive" when a store is uninstalled
- **Store Suspension**: Set status to "inactive" when a store violates policies
- **Store Reactivation**: Set status to "active" when a suspended store is reinstated

**Webhook Logging:** This operation creates a `WebhookLog` entry with:

- `source`: "publisher:{publisherId}"
- `eventType`: "site_status_change"
- `payload`: { siteId, status, reason }
- `siteId`: The affected site ID
- `publisherId`: The publisher making the change
- `callerIpAddress`: IP address of the caller

**Error Response (400 Bad Request):**

```json
{
  "error": "Invalid value for field: status",
  "code": "INVALID_FIELD_VALUE",
  "details": {
    "field": "status",
    "value": "invalid_value",
    "expectedType": "\"active\" or \"inactive\""
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### **Update Site Ads Status (Lifecycle Management)**

Updates the ad serving status for a site independently from site status.

**Endpoint:**

```
PATCH /api/site/:id/ads
```

**Authentication:** PUBLISHER Token

**Rate Limit:** 50 req/min (elevated: 150 req/min)

**Path Parameters:**

- `id`: Site ID (required, non-empty string)

**Request Body:**

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
curl -X PATCH https://pr-api.falconlabs.us/api/site/cm2a3b4c5d6e7f8g9h0i1j2k/ads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer falcon_sk_xyz789abc123def456ghi789jkl012mno345" \
  -d '{
    "adsEnabled": true,
    "reason": "Subscription payment confirmed"
  }'
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "cm2a3b4c5d6e7f8g9h0i1j2k",
    "name": "Main E-commerce Store",
    "status": "active",
    "adsEnabled": true
  },
  "message": "Site ads enabled"
}
```

**Use Cases:**

- **Free Trial**: Disable ads during free trial period, enable after subscription
- **Payment Failure**: Temporarily disable ads when payment fails
- **Publisher Request**: Enable/disable ads based on publisher preferences
- **Policy Violation**: Disable ads temporarily during investigation
- **Testing**: Disable ads during site testing or maintenance

**Webhook Logging:** This operation creates a `WebhookLog` entry with:

- `source`: "publisher:{publisherId}"
- `eventType`: "site_ads_toggle"
- `payload`: { siteId, adsEnabled, reason }
- `siteId`: The affected site ID
- `publisherId`: The publisher making the change
- `callerIpAddress`: IP address of the caller

**Error Response (400 Bad Request):**

```json
{
  "error": "Invalid value for field: adsEnabled",
  "code": "INVALID_FIELD_VALUE",
  "details": {
    "field": "adsEnabled",
    "value": "invalid_value",
    "expectedType": "boolean"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### **Site Lifecycle Management Notes**

**Status vs Ads Enabled:**

- `status` controls overall site activation
- `adsEnabled` specifically controls ad serving
- Both must be `active`/`true` for ads to display

**Lifecycle Endpoints Features:**

- Separate rate limits (50 req/min standard, 150 elevated)
- Automatic webhook logging for audit trail
- IP address tracking for security
- Optional `reason` field for documentation

**Integration Benefits:**

- Automated store lifecycle management
- Audit trail for compliance
- Fine-grained control over ad serving
- Support for free trials and payment workflows

### Delete Site

Deletes a site and all associated placements.

> Warning: This action is irreversible. All placements and historical data will be permanently deleted.

### Endpoint

```
DELETE /api/site/:id
```

### Authentication

Use the publisher’s **Private Key**:

```
Authorization: Bearer PUBLISHER_PRIVATE_KEY
```

### Example Request

```bash
curl -X DELETE https://pr-api.falconlabs.us/api/site/clx3c4d5e6f7g8h9i0j1k2l3m \
  -H "Authorization: Bearer priv_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
```

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Site deleted successfully"
}
```

### Error Responses

**403 Forbidden - Active Placements**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Cannot delete site with active placements",
    "details": {
      "activePlacements": 2
    }
  }
}
```

---

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

---

## OData API - Fetching Promotional Offers

### Overview

The OData API allows you to fetch promotional offers to display to customers. This is the primary endpoint for real-time offer retrieval.

### Endpoint

```
GET https://pr-api.falconlabs.us/api/odata
```

### Authentication

Use the publisher’s **Public Key**:

```
Authorization: Bearer PUBLIC_KEY
```

> Note: This is the only endpoint that uses the public key. All other endpoints use the private key.

### Query Parameters

### Required Parameters

- `placementId` (string): Placement ID from placement creation
- `sessionId` (string): Unique session identifier for the customer (can use email, hashed email, or orderId)
- `at.email` (string): Customer email address (plain or SHA-256 hashed)
- `at.orderid` (string): Order ID

> Note: At minimum, you must provide placementId, sessionId, and either at.email or at.orderid for proper tracking.

### Optional Parameters

- `count` (number, default: 4): Number of offers to return

### Customer Data Parameters

Pass customer and order data with the `at.` prefix for better targeting and analytics:

**Customer Information:**

- `at.email` (string): Customer email address (lowercase, trimmed, or SHA-256 hashed)
- `at.firstname` or `at.fname` (string): Customer first name
- `at.lastname` or `at.lname` (string): Customer last name
- `at.phone` or `at.mobile` (string): Phone number (10-15 digits)
- `at.country` (string): Country code (ISO format, e.g., “US”, “GB”)
- `at.language` (string): Language code (e.g., “en”, “es”)
- `at.address` (string): Customer address (max 500 chars)
- `at.zipcode` (string): ZIP/postal code (max 20 chars)

> Email Hashing: For privacy compliance, you can hash the email using SHA-256 before sending. Pass the hashed value in at.email parameter. Only SHA-256 hashing is supported.
>
> Example: `email@example.com` → SHA-256 → `a1b2c3d4e5f6...` (64-character hex string)

**Order Information:**

- `at.orderid` or `at.order_id` (string): Order ID (max 100 chars)
- `at.amount` or `at.ordervalue` (number): Order amount (0-1,000,000)
- `at.currency` (string): Currency code (e.g., “USD”, “EUR”, “GBP”)
- `at.billingaddress1` (string): Billing address (max 500 chars)
- `at.billingzipcode` (string): Billing ZIP code (max 20 chars)
- `at.paymenttype` or `at.payment_type` (string): Payment method
- Valid values: `creditCard`, `debitCard`, `paypal`, `applePay`, `googlePay`, `bankTransfer`, `crypto`, `other`

**Supported Currencies:**
USD, EUR, GBP, CAD, AUD, JPY, CNY, NZD, CHF, SEK, NOK, DKK, PLN, CZK, HUF, RON, BGN, HRK, RUB, TRY, BRL, MXN, ARS, CLP, COP, PEN, UYU, INR, IDR, MYR, PHP, SGD, THB, VND, KRW, HKD, TWD, SAR, AED, ILS, EGP, ZAR, NGN, KES, GHS

### Example Request

```bash
curl -X GET "https://pr-api.falconlabs.us/api/odata?placementId=clx4d5e6f7g8h9i0j1k2l3m4n&sessionId=session_abc123&count=4&at.email=customer@example.com&at.firstname=John&at.lastname=Doe&at.orderid=ORDER-12345&at.amount=125.50&at.currency=USD&at.country=US" \
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
      "icon": {
        "url": "https://cdn.example.com/icon.png",
        "width": 120,
        "height": 120
      }
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
      "closeUrl": "https://pr-api.falconlabs.us/close?..."
    }
  ],
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
  - `clickUrl`: URL to redirect to when customer clicks the offer
  - `beaconUrl`: URL to call when offer is displayed (impression tracking)
  - `closeUrl`: URL to call when customer closes the ad
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

---

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

---

## Reporting API

### Overview

The Reporting API provides analytics and performance data for your placements and sites.

### Base Endpoint

```
https://pr-api.falconlabs.us/api/report
```

### Authentication

Use the publisher’s **Private Key**:

```
Authorization: Bearer PUBLISHER_PRIVATE_KEY
```

### Get Performance Report

Retrieves performance metrics for placements or sites.

### Endpoint

```
GET /api/report
```

### Query Parameters

**Date Range (Required):**

- `dateStart` (string): Start date in YYYYMMDD format (e.g., “20240101”)
- `dateEnd` (string): End date in YYYYMMDD format (e.g., “20240131”)
- Cannot be more than 180 days in the past
- Cannot be in the future

**Report Type:**

- `reportType` (string): Type of report
- `PLACEMENT` (default): Report by placement
- `SITE`: Report by site

**Filters:**

- `placementId` (string or array): Filter by specific placement ID(s)
- Single: `placementId=clx4d5e6f7g8h9i0j1k2l3m4n`
- Multiple: `placementId=id1,id2,id3` or multiple params
- `siteId` (string or array): Filter by specific site ID(s) (when `reportType=SITE`)

**Grouping and Breakdown:**

- `groupBy` (string or array): Group results by dimension(s)
- `PLACEMENT`: Group by placement (cannot use with `reportType=SITE`)
- `SITE`: Group by site (cannot use with `reportType=PLACEMENT`)
- `COUNTRY`: Group by country
- Multiple: `groupBy=PLACEMENT&groupBy=COUNTRY`
- `breakdownBy` (string): Time-based breakdown
- `DAY`: Daily breakdown
- `WEEK`: Weekly breakdown
- `MONTH`: Monthly breakdown
- `NONE` (default): No time breakdown

### Report Metrics

The response includes the following metrics:

- `requests`: Total number of ad impression requests (how many times the ad unit was loaded/shown)
- `transactions`: Number of requests that resulted in postback/conversion tracking (subset of requests with conversion data)
- `clicks`: Number of clicks on offers
- `conversions`: Number of conversions
- `revenue`: Revenue generated (requires `revenueAccess` permission)
- `gross`: Gross revenue (requires `grossAccess` permission)
- `profit`: Profit amount
- `ctr`: Click-through rate (clicks / requests)

> Note: requests and transactions are event counts, not currency values. requests tracks all impressions, while transactions tracks only those with postback/conversion data.

### Example Requests

### Get Daily Report for All Placements

```bash
curl -X GET "https://pr-api.falconlabs.us/api/report?dateStart=20240101&dateEnd=20240131&reportType=PLACEMENT&breakdownBy=DAY" \
  -H "Authorization: Bearer priv_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
```

### Get Report for Specific Placement Grouped by Country

```bash
curl -X GET "https://pr-api.falconlabs.us/api/report?dateStart=20240101&dateEnd=20240131&placementId=clx4d5e6f7g8h9i0j1k2l3m4n&groupBy=COUNTRY" \
  -H "Authorization: Bearer priv_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
```

### Get Monthly Report by Site

```bash
curl -X GET "https://pr-api.falconlabs.us/api/report?dateStart=20240101&dateEnd=20240630&reportType=SITE&breakdownBy=MONTH" \
  -H "Authorization: Bearer priv_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
```

### Success Response (200 OK)

```json
{
  "data": [
    {
      "date": "2024-01-15",
      "transactions": 1250,
      "clicks": 85,
      "conversions": 12,
      "revenue": 450.5,
      "ctr": 6.8,
      "placementId": "clx4d5e6f7g8h9i0j1k2l3m4n",
      "placement": "Thank You Page Placement",
      "country": "US"
    },
    {
      "date": "2024-01-16",
      "transactions": 1420,
      "clicks": 96,
      "conversions": 15,
      "revenue": 562.75,
      "ctr": 6.76,
      "placementId": "clx4d5e6f7g8h9i0j1k2l3m4n",
      "placement": "Thank You Page Placement",
      "country": "US"
    }
  ],
  "summary": {
    "totalTransactions": 2670,
    "totalClicks": 181,
    "totalConversions": 27,
    "totalRevenue": 1013.25,
    "averageCtr": 6.78
  }
}
```

## Adjustable Template for Shopify

### Overview

The Falcon Adjustable Template is a highly customizable JavaScript component designed for Shopify checkout extensions. It provides 84 configurable parameters that allow partners to customize every aspect of the offer display, from layout and typography to button styles and icon positioning.

> Note: We can provide a TypeScript version of this component upon request. Contact our integration team for TypeScript support.

### Key Features

- **84 Configuration Parameters**: Full control over visual appearance
- **Responsive Design**: Separate configurations for mobile and desktop
- **Pure Component**: No data fetching or tracking logic inside
- **Shopify Native**: Built with Shopify UI Extensions components
- **Zero Dependencies**: Self-contained with minimal overhead

### Architecture

The component follows a clear separation of concerns:

```
┌─────────────────────────────────────────┐
│ Your Extension (Partner Code)           │
│ - Fetch data from API                   │
│ - Manage offer carousel state           │
│ - Handle tracking/analytics             │
│ - Use Shopify hooks                     │
└──────────────┬──────────────────────────┘
               │ props
               ▼
┌─────────────────────────────────────────┐
│ FalconAdjustableTemplate (JS)           │
│ - Render UI with configuration          │
│ - Apply styling parameters              │
│ - Handle responsive layouts             │
│ - Text transformations                  │
└─────────────────────────────────────────┘
```

**Your extension handles:**

- API calls to fetch offers
- Offer carousel management
- User interaction tracking
- Shopify context access (email, order data)

**The template handles:**

- Visual rendering based on configuration
- Responsive behavior
- Text transformations
- Layout calculations

### Installation

Copy the component into your Shopify extension project and import:

```jsx
import {
  FalconAdjustableTemplate,
  DEFAULT_TEMPLATE_CONFIG,
} from "./falcon-adjustable-template-js";
```

### Component API

### Props

```jsx
<FalconAdjustableTemplate
  activeOffer={object}           // Required: Current offer to display
  templateData={object}          // Required: Configuration and branding
  extensionTarget={string}       // Required: Shopify extension target
  clickOffer={function}          // Required: Callback for primary CTA click
  handleNoThanks={function}      // Required: Callback for decline click
  firstName={string}             // Optional: Customer first name
  reachedEndOfOffers={boolean}  // Required: Hide when no more offers
/>
```

**Prop Details:**

- `activeOffer`: The current offer object to display (see structure below)
- `templateData`: Configuration object including `templateConfig` (84 parameters)
- `extensionTarget`: Identifies extension point
  - `"purchase.thank-you.block.render"` - Thank you page
  - `"customer-account.order-status.block.render"` - Order status page
- `clickOffer`: Function called when primary CTA is clicked
- `handleNoThanks`: Function called when decline button is clicked
- `firstName`: Used for personalization on thank you page (e.g., “John, thank you for your purchase”)
- `reachedEndOfOffers`: Set to `true` to hide component when no more offers

### Offer Object Structure

The `activeOffer` prop must follow this shape:

```jsx
{
  title: string,              // Main offer title (e.g., "15% off your next order")
  header: string,             // Header/subtitle text (e.g., "Limited-time thank you")
  description: string,        // Offer details. Use \n for line breaks
  ctaText: string,            // Primary button label (e.g., "REDEEM")
  declineButtonText: string,  // Secondary button label (e.g., "No thanks")
  clickUrl: string,           // Destination URL when CTA is clicked
  termsUrl?: string,          // Optional: Terms & conditions URL
  disclaimerUrl?: string,     // Optional: Disclaimer URL
  icon?: {                    // Optional: Offer icon/image
    url: string,              // Image URL
    width: number,            // Image width in pixels
    height: number            // Image height in pixels
  },
  iconSvg?: string           // Optional: SVG image URL (takes precedence)
}
```

### Template Data Structure

The `templateData` object returned from the OData API contains:

```jsx
{
  brandName?: string,        // Optional: Brand name for partnership footer
  privacyUrl?: string,       // Optional: Privacy policy URL
  templateConfig: {          // Required: Visual configuration (84 parameters)
    iconConfig: { ... },
    textConfig: { ... },
    layoutConfig: { ... },
    buttonConfig: { ... },
    linksConfig: { ... },
    footerConfig: { ... }
  }
}
```

> Important: The OData API returns templateData with a complete templateConfig object. You typically don’t need to modify this - just pass it directly to the component.

### Configuration Structure (84 Parameters)

### Icon Configuration (15 parameters)

Controls icon display, positioning, and sizing:

```jsx
iconConfig: {
  mobilePosition: "below-subtitle-above-description",  // Icon position on mobile
  showIcon: true,                                      // Show/hide icon
  desktopIconBlockAlignment: "center",                 // Vertical alignment (desktop)
  desktopIconInlineAlignment: "center",                 // Horizontal alignment (desktop)
  iconMaxWidth: "150px",                                // Maximum icon width
  mobileIconPaddingTop: "base",                        // Mobile padding
  mobileIconPaddingRight: "base",
  mobileIconPaddingBottom: "base",
  mobileIconPaddingLeft: "base",
  desktopIconPaddingTop: "base",                       // Desktop padding
  desktopIconPaddingRight: "base",
  desktopIconPaddingBottom: "base",
  desktopIconPaddingLeft: "base",
  mobileIconBlockAlignment: "center",                  // Mobile vertical alignment
  mobileIconInlineAlignment: "center"                  // Mobile horizontal alignment
}
```

**Mobile Icon Position Options:**

- `"above-title"`
- `"below-title-above-subtitle"`
- `"below-subtitle-above-description"`
- `"below-description"`
- `"hidden"`

### Text Configuration (24 parameters)

Controls typography, sizing, emphasis, and text transformation:

```jsx
textConfig: {
  titleSize: "extraLarge",                  // Title font size
  subtitleSize: "medium",              // Subtitle font size
  descriptionSize: "medium",           // Description font size
  titleBold: true,                     // Title bold
  titleItalic: false,                  // Title italic
  subtitleBold: true,                  // Subtitle bold
  subtitleItalic: false,               // Subtitle italic
  descriptionBold: false,              // Description bold
  descriptionItalic: false,            // Description italic
  titlePaddingTop: "none",             // Title padding
  titlePaddingRight: "none",
  titlePaddingBottom: "none",
  titlePaddingLeft: "none",
  subtitlePaddingTop: "none",          // Subtitle padding
  subtitlePaddingRight: "none",
  subtitlePaddingBottom: "none",
  subtitlePaddingLeft: "none",
  descriptionPaddingTop: "tight",       // Description padding
  descriptionPaddingRight: "none",
  descriptionPaddingBottom: "tight",
  descriptionPaddingLeft: "none",
  titleTransform: "uppercase",         // Text transformation
  subtitleTransform: "none",
  descriptionTransform: "none",
  ctaTransform: "none",                // Button text transformation
  negativeCtaTransform: "none"
}
```

**Text Size Options:** `extraSmall`, `small`, `base`, `medium`, `large`, `extraLarge`

**Text Transform Options:** `none`, `uppercase`, `lowercase`, `capitalize`

**Padding Options:** `none`, `extraTight`, `tight`, `base`, `loose`, `extraLoose`

### Layout Configuration (11 parameters)

Controls spacing, grid layout, and container styling:

```jsx
layoutConfig: {
  containerPaddingTop: "loose",        // Container padding
  containerPaddingRight: "loose",
  containerPaddingBottom: "loose",
  containerPaddingLeft: "loose",
  spacingAfterHeader: "base",          // Section spacing
  spacingBeforeLinks: "none",
  spacingAfterDescription: "none",
  spacingBeforeButtons: "base",
  gridGap: "base",                    // Grid gap between columns
  gridColumnsDesktop: ["60%", "fill"], // Desktop grid columns
  gridColumnsMobile: "100%",           // Mobile grid columns
  containerBorder: "base",             // Border style
  containerBorderWidth: "base",        // Border width
  containerCornerRadius: "base"        // Corner radius
}
```

**Grid Column Options:**

- Desktop: Array like `["60%", "fill"]`, `["50%", "50%"]`, `["fill", "fill"]`
- Mobile: String like `"100%"`

**Spacing Options:** `none`, `extraTight`, `tight`, `base`, `loose`, `extraLoose`

**Border Options:** `none`, `base`, `dotted`, `dashed`

### Button Configuration (15 parameters)

Controls button appearance, sizing, layout, and spacing:

```jsx
buttonConfig: {
  primaryButtonKind: "primary",             // Primary button type
  primaryButtonAppearance: "accent",        // Primary button appearance
  primaryButtonCornerRadius: "base",        // Primary button border radius
  primaryButtonTextSize: "medium",            // Primary button text size
  primaryButtonPaddingTop: "none",          // Primary button padding
  primaryButtonPaddingRight: "loose",
  primaryButtonPaddingBottom: "none",
  primaryButtonPaddingLeft: "loose",
  secondaryButtonKind: "plain",             // Secondary button type
  secondaryButtonSize: "base",              // Secondary button size
  secondaryButtonAppearance: "monochrome",  // Secondary button appearance
  secondaryButtonTextSizeDesktop: "base",   // Secondary button text (desktop)
  secondaryButtonTextSizeMobile: "small",   // Secondary button text (mobile)
  buttonLayoutDesktop: "horizontal",        // Button layout (desktop)
  buttonLayoutMobile: "vertical",           // Button layout (mobile)
  buttonAlignmentDesktop: "start",          // Button alignment (desktop)
  buttonAlignmentMobile: "center",          // Button alignment (mobile)
  buttonGap: "base"                         // Gap between buttons
}
```

**Button Kind Options:** `primary`, `secondary`, `plain`

**Button Appearance Options:** `accent`, `critical`, `interactive`, `monochrome`

**Button Layout Options:** `horizontal`, `vertical`

**Button Alignment Options:** `start`, `center`, `end`

### Links Configuration (8 parameters)

Controls link visibility and styling:

```jsx
linksConfig: {
  showTermsLink: true,                      // Show terms link
  showDisclaimerLink: true,                 // Show disclaimer link
  showAdditionalTermsLink: true,            // Show additional terms link
  linkTextSize: "small",                    // Link text size
  linkAppearance: "base",                 // Link appearance
  termsLinkLabel: "Terms & Conditions",     // Terms link label
  disclaimerLinkLabel: "Disclaimer",        // Disclaimer link label
  additionalTermsLinkLabel: "Additional terms apply"  // Additional terms label
}
```

### Footer Configuration (6 parameters)

Controls partnership footer display:

```jsx
footerConfig: {
  showPartnership: true,                    // Show partnership footer
  privacyLinkLabel: "Privacy Policy",       // Privacy link label
  footerSeparator: " · ",                   // Separator between footer items
  footerTextSize: "small",                  // Footer text size
  footerAlignment: "end",                   // Footer alignment
  footerPadding: "tight"                     // Footer padding
}
```

### Integration Example

### Minimal Example

Basic integration with minimal setup:

```jsx
import React, { useState, useEffect } from "react";
import { extension } from "@shopify/ui-extensions-react/checkout";
import { FalconAdjustableTemplate } from "./falcon-adjustable-template-js";

extension("purchase.thank-you.block.render", (root) => {
  function App() {
    const [offers, setOffers] = useState([]);
    const [idx, setIdx] = useState(0);
    const [templateData, setTemplateData] = useState(null);

    useEffect(() => {
      // Fetch from Falcon OData API
      fetch("/api/odata")
        .then((r) => r.json())
        .then(({ offers, templateData }) => {
          setOffers(offers);
          setTemplateData(templateData);
        });
    }, []);

    if (!offers.length || !templateData) return null;

    return (
      <FalconAdjustableTemplate
        activeOffer={offers[idx]}
        templateData={templateData}
        extensionTarget="purchase.thank-you.block.render"
        clickOffer={() => console.log("Offer clicked")}
        handleNoThanks={() => setIdx((prev) => prev + 1)}
        reachedEndOfOffers={idx >= offers.length}
      />
    );
  }

  root.appendChild(<App />);
});
```

### Complete Implementation Example

Full-featured integration with tracking and error handling:

```jsx
import React, { useState, useEffect } from "react";
import {
  extension,
  useEmail,
  useExtensionCapability,
} from "@shopify/ui-extensions-react/checkout";
import {
  FalconAdjustableTemplate,
  DEFAULT_TEMPLATE_CONFIG,
} from "./falcon-adjustable-template-js";

extension("purchase.thank-you.block.render", (root, api) => {
  function App() {
    const [offers, setOffers] = useState([]);
    const [idx, setIdx] = useState(0);
    const [templateData, setTemplateData] = useState({
      templateConfig: DEFAULT_TEMPLATE_CONFIG,
    });

    // Extract customer email from Shopify checkout session
    const email = useEmail();
    const canTrack = useExtensionCapability("network_access");

    // Extract first name from email (or use Shopify's buyer identity)
    const firstName = email?.split("@")[0] || "";

    useEffect(() => {
      if (!email) return;

      // Fetch offers from Falcon OData API
      fetch(
        `/api/odata?placementId=YOUR_PLACEMENT_ID&sessionId=SESSION_ID&at.email=${email}`,
      )
        .then((r) => r.json())
        .then((data) => {
          setOffers(data.offers || []);
          setTemplateData(
            data.templateData || { templateConfig: DEFAULT_TEMPLATE_CONFIG },
          );
        })
        .catch((error) => {
          console.error("Failed to fetch offers:", error);
        });
    }, [email]);

    // Track when user clicks the primary CTA
    const handleClickOffer = () => {
      if (canTrack && offers[idx]) {
        // Send tracking event
        fetch("https://your-tracking-api.com/click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            offerId: offers[idx].bannerId,
            offerTitle: offers[idx].title,
          }),
        }).catch((e) => console.error("Tracking failed:", e));
      }
    };

    // Track when user declines and advance to next offer
    const handleDecline = () => {
      if (canTrack && offers[idx]) {
        // Send tracking event
        fetch("https://your-tracking-api.com/decline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            offerId: offers[idx].bannerId,
          }),
        }).catch((e) => console.error("Tracking failed:", e));
      }

      // Move to next offer
      setIdx((prev) => prev + 1);
    };

    // Don't render if no offers available
    if (!offers.length) return null;

    return (
      <FalconAdjustableTemplate
        activeOffer={offers[idx]}
        templateData={templateData}
        extensionTarget="purchase.thank-you.block.render"
        clickOffer={handleClickOffer}
        handleNoThanks={handleDecline}
        firstName={firstName}
        reachedEndOfOffers={idx >= offers.length}
      />
    );
  }

  root.appendChild(<App />);
});
```

### Customizing Configuration

You can override specific configuration parameters while keeping defaults:

```jsx
const customTemplateData = {
  brandName: "My Brand",
  privacyUrl: "https://mybrand.com/privacy",
  templateConfig: {
    ...DEFAULT_TEMPLATE_CONFIG,
    iconConfig: {
      ...DEFAULT_TEMPLATE_CONFIG.iconConfig,
      mobilePosition: "above-title",
      showIcon: true,
    },
    buttonConfig: {
      ...DEFAULT_TEMPLATE_CONFIG.buttonConfig,
      primaryButtonAppearance: "critical",
      buttonLayoutMobile: "horizontal",
    },
  },
};
```

> Best Practice: In most cases, use the templateData returned from the OData API as-is. Falcon configures the display optimally based on your account settings.

### Integration Flow

1. **Shopify loads your extension** (thank you or order status page)
2. **Extension mounts** and reads Shopify context (email, order ID, etc.)
3. **Extension calls OData API** with context parameters
4. **API returns** `offers` array and `templateData` (including `templateConfig`)
5. **Extension stores** offers in state and tracks `activeIndex`
6. **Extension passes** `activeOffer` + `templateData` to `FalconAdjustableTemplate`
7. **Template renders** using the 84 parameters from `templateConfig`
8. **User clicks primary CTA** → your `clickOffer` callback fires (track + navigate)
9. **User clicks “No thanks”** → your `handleNoThanks` callback advances to next offer
10. **When all offers shown** → set `reachedEndOfOffers={true}` to hide component

### Testing Recommendations

Test the following scenarios:

- **Mobile vs Desktop**: Verify icon positions, button layouts, and grid columns
- **Text Transforms**: Test uppercase, lowercase, and capitalize
- **Button Layouts**: Verify horizontal and vertical button arrangements
- **Link Visibility**: Test with links enabled and disabled
- **Partial Overrides**: Override specific config values, ensure defaults apply
- **Full Overrides**: Test with completely custom configuration
- **No Offers**: Verify graceful handling when no offers available
- **Multiple Offers**: Test carousel advancement through multiple offers

### TypeScript Version

> Note: We can provide a TypeScript version of this component with full type definitions for all 84 configuration parameters. Contact our integration team to request the TypeScript version.

---

## Fallback Template for Shopify

### Overview

The Fallback Template is a simpler alternative to the Adjustable Template with minimal configuration requirements. It provides essential functionality with a clean, reliable design.

**When to Use:**

- Simple integration needs
- Don’t require extensive visual customization
- Want reliable, tested template
- Faster implementation time

**Key Features:**

- Automatic responsive layout (mobile/desktop)
- Built-in thank you message on thank-you pages
- Footer with privacy policy link
- Clean, minimal styling
- Minimal configuration overhead

### Component API

```jsx
<PartnerFallback
  extensionTarget={string}       // Required: Shopify extension target
  activeOffer={object}           // Required: Current offer to display
  clickOffer={function}          // Required: Click callback
  handleNoThanks={function}      // Required: Decline callback
  firstName={string}             // Optional: Customer first name
  reachedEndOfOffers={boolean}  // Required: Hide when no offers left
  templateData={object}          // Required: Brand data (privacyUrl)
/>
```

**Prop Details:**

- `extensionTarget`: Identifies extension point
  - `"purchase.thank-you.block.render"` - Thank you page
  - `"customer-account.order-status.block.render"` - Order status page
- `activeOffer`: The current offer object to display (see structure below)
- `clickOffer`: Function called when primary CTA is clicked
- `handleNoThanks`: Function called when decline button is clicked
- `firstName`: Customer first name for personalization (optional)
- `reachedEndOfOffers`: Set to `true` to hide component when no more offers
- `templateData`: Configuration object with brand information

### Offer Object Structure

The `activeOffer` prop must follow this shape:

```jsx
{
  title: string,              // Main offer title (e.g., "15% off your next order")
  header: string,             // Header/subtitle text (e.g., "Limited-time thank you")
  description: string,        // Offer details. Use \n for line breaks
  ctaText: string,            // Primary button label (e.g., "REDEEM")
  declineButtonText: string,  // Secondary button label (e.g., "No thanks")
  clickUrl: string,           // Destination URL when CTA is clicked
  termsUrl?: string,          // Optional: Terms & conditions URL
  disclaimerUrl?: string,     // Optional: Disclaimer URL
  icon?: {                    // Optional: Offer icon/image
    url: string,              // Image URL
    width: number,            // Image width in pixels
    height: number            // Image height in pixels
  },
  iconSvg?: string           // Optional: SVG image URL (takes precedence)
}
```

### Template Data Structure

```jsx
{
  privacyUrl: string; // Required: Privacy policy URL for footer
}
```

### Integration Example

### Minimal Integration

```jsx
import React, { useState, useEffect } from "react";
import { extension } from "@shopify/ui-extensions-react/checkout";
import { PartnerFallback } from "./fallback";

extension("purchase.thank-you.block.render", (root) => {
  function App() {
    const [offers, setOffers] = useState([]);
    const [idx, setIdx] = useState(0);

    useEffect(() => {
      // Fetch from Falcon OData API
      fetch("/api/odata")
        .then((r) => r.json())
        .then(({ offers }) => {
          setOffers(offers);
        });
    }, []);

    if (!offers.length) return null;

    return (
      <PartnerFallback
        extensionTarget="purchase.thank-you.block.render"
        activeOffer={offers[idx]}
        clickOffer={() => console.log("Offer clicked")}
        handleNoThanks={() => setIdx((prev) => prev + 1)}
        reachedEndOfOffers={idx >= offers.length}
        templateData={{ privacyUrl: "https://brand.com/privacy" }}
      />
    );
  }

  root.appendChild(<App />);
});
```

### Complete Implementation

```jsx
import React, { useState, useEffect } from "react";
import {
  extension,
  useEmail,
  useExtensionCapability,
} from "@shopify/ui-extensions-react/checkout";
import { PartnerFallback } from "./fallback";

extension("purchase.thank-you.block.render", (root, api) => {
  function App() {
    const [offers, setOffers] = useState([]);
    const [idx, setIdx] = useState(0);

    // Extract customer email from Shopify checkout session
    const email = useEmail();
    const canTrack = useExtensionCapability("network_access");

    // Extract first name from email (or use Shopify's buyer identity)
    const firstName = email?.split("@")[0] || "";

    useEffect(() => {
      if (!email) return;

      // Fetch offers from Falcon OData API
      fetch(
        `/api/odata?placementId=YOUR_PLACEMENT_ID&sessionId=${email}&at.email=${email}`,
      )
        .then((r) => r.json())
        .then((data) => {
          setOffers(data.offers || []);
        })
        .catch((error) => {
          console.error("Failed to fetch offers:", error);
        });
    }, [email]);

    // Track when user clicks the primary CTA
    const handleClickOffer = () => {
      if (canTrack && offers[idx]) {
        // Send tracking event
        fetch("https://your-tracking-api.com/click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            offerId: offers[idx].bannerId,
            offerTitle: offers[idx].title,
          }),
        }).catch((e) => console.error("Tracking failed:", e));
      }
    };

    // Track when user declines and advance to next offer
    const handleDecline = () => {
      if (canTrack && offers[idx]) {
        // Send tracking event
        fetch("https://your-tracking-api.com/decline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            offerId: offers[idx].bannerId,
          }),
        }).catch((e) => console.error("Tracking failed:", e));
      }

      // Move to next offer
      setIdx((prev) => prev + 1);
    };

    // Don't render if no offers available
    if (!offers.length) return null;

    return (
      <PartnerFallback
        extensionTarget="purchase.thank-you.block.render"
        activeOffer={offers[idx]}
        clickOffer={handleClickOffer}
        handleNoThanks={handleDecline}
        firstName={firstName}
        reachedEndOfOffers={idx >= offers.length}
        templateData={{ privacyUrl: "https://brand.com/privacy" }}
      />
    );
  }

  root.appendChild(<App />);
});
```

### Component Source Code

The complete Fallback Template component implementation:

```jsx
import {
  Link,
  Text,
  View,
  BlockStack,
  Heading,
  Button,
  InlineStack,
  Grid,
  Image,
  Style,
} from "@shopify/ui-extensions-react/checkout";

const PFTextEnum = {
  CTA: "REDEEM",
  DECLINE: "No thanks",
  PRIVACY: "Privacy Policy",
  TERMS: "Terms & Conditions",
  DISCLAIMER: "Disclaimer",
  PURCHASE_THANKS: "Thank you for your purchase!",
};
const PFExtensionTargetEnum = {
  PURCHASE_THANK_YOU: "purchase.thank-you.block.render",
  ORDER_STATUS: "customer-account.order-status.block.render",
  ORDER_INDEX_ANNOUNCEMENT: "customer-account.order-index.announcement.render",
};
const PFViewportEnum = {
  DESKTOP: "desktop",
  MOBILE: "mobile",
};

/**
 * Returns responsive display values for mobile and desktop.
 *@paramdefaultDisplay - default display for mobile
 */
const getPFResponsiveDisplay = (defaultDisplay = "block") => ({
  mobile: Style.default(defaultDisplay).when(
    { viewportInlineSize: { min: "extraSmall" } },
    "none",
  ),
  desktop: Style.default("none").when(
    { viewportInlineSize: { min: "extraSmall" } },
    "auto",
  ),
});

/**
 * Renders footer metadata for template offers, including a privacy policy link.
 */
const PFFooter = ({ templateData }) => {
  if (!templateData) return null;
  const { privacyUrl } = templateData || {};
  return (
    <View padding="none" inlineAlignment="end">
      <Text size="small">
        <Link to={privacyUrl} external appearance="info">
          {PFTextEnum.PRIVACY}
        </Link>
      </Text>
    </View>
  );
};

/**
 * Renders the header section of a fallback offer template.
 * Includes thank-you message (on specific extension targets),
 * offer title, and additional header text.
 */
const PFHeader = ({ extensionTarget, offer, firstName }) => {
  const { title, header } = offer || {};
  const isThankYouPage =
    extensionTarget === PFExtensionTargetEnum.PURCHASE_THANK_YOU;
  if (!isThankYouPage && !title && !header) return null;
  return (
    <BlockStack spacing="tight" padding="none" blockAlignment="start">
      {isThankYouPage && (
        <Heading size="large">
          {firstName
            ? `${firstName},${PFTextEnum.PURCHASE_THANKS.toLowerCase()}`
            : PFTextEnum.PURCHASE_THANKS}
        </Heading>
      )}

      {title && (
        <Heading size="large" emphasis="bold" padding="none">
          {title.toUpperCase()}
        </Heading>
      )}

      {header && (
        <Heading size="medium" emphasis="bold" padding="none">
          {header}
        </Heading>
      )}
    </BlockStack>
  );
};

/**
 * Renders Redeem / No Thanks buttons for an offer.
 * Automatically handles mobile and desktop layouts.
 */
const PFOfferActions = ({ offer, onClickOffer, onNoThanks }) => {
  const { mobile, desktop } = getPFResponsiveDisplay();
  const { declineButtonText, ctaText, clickUrl } = offer || {};
  const CTA = ctaText || PFTextEnum.CTA;
  const DECLINE = declineButtonText || PFTextEnum.DECLINE;
  /** Shared decline button */
  const DeclineButton = (size) => (
    <Button kind="plain" size="medium" onPress={onNoThanks}>
      <Text size={size}>{DECLINE}</Text>
    </Button>
  );
  /** Shared CTA button */
  const CtaButton = (
    <Button kind="primary" appearance="accent">
      <View padding={["none", "loose"]}>
        <Text size="medium">{CTA}</Text>
      </View>
    </Button>
  );
  /** Wrapper that avoids<Link> duplication */
  const renderCta = (children) => (
    <Link external onPress={onClickOffer} appearance="accent" to={clickUrl}>
      {children}
    </Link>
  );
  return (
    <>
      {/* Desktop view */}
      <InlineStack
        display={desktop}
        inlineAlignment="start"
        blockAlignment="center"
        gap="none"
        padding="none"
      >
        {renderCta(CtaButton)}
        {DeclineButton("small")}
      </InlineStack>

      {/* Mobile view */}
      <BlockStack
        display={mobile}
        padding={["none", "none"]}
        maxInlineSize="fill"
      >
        {renderCta(
          <BlockStack padding="none" maxInlineSize="fill">
            {CtaButton}
          </BlockStack>,
        )}

        {DeclineButton("medium")}
      </BlockStack>
    </>
  );
};

/**
 * Renders description text (split by newlines) and optional legal URLs.
 */
const PFOfferDescription = ({ offer }) => {
  const { description, termsUrl, disclaimerUrl } = offer;
  const lines = description ? description.split("\n") : [];
  const extraLinks = [
    { url: termsUrl, label: PFTextEnum.TERMS },
    { url: disclaimerUrl, label: PFTextEnum.DISCLAIMER },
  ];
  return (
    <BlockStack spacing="extraTight" padding="none" blockAlignment="start">
      {lines?.map((line, idx) => (
        <Text key={idx} size="medium">
          {line}
        </Text>
      ))}

      {extraLinks.map(
        ({ url, label }) =>
          url && (
            <Link key={label} to={url} external>
              <Text>{label}</Text>
            </Link>
          ),
      )}
    </BlockStack>
  );
};

const MAX_MOB_IMG_W = 150;
const PFOfferIcon = ({ offer, viewport }) => {
  const { iconSvg, icon } = offer;
  const iconSrc = iconSvg || icon?.url;
  if (!iconSrc) return null;
  const { mobile, desktop } = getPFResponsiveDisplay();
  const isMobile = viewport === PFViewportEnum.MOBILE;
  return (
    <View
      display={isMobile ? mobile : desktop}
      padding="none"
      blockAlignment="center"
    >
      <Grid inlineAlignment="center" columns={[MAX_MOB_IMG_W]}>
        <Image source={iconSrc} fit="contain" />
      </Grid>
    </View>
  );
};

export function PartnerFallback({
  extensionTarget,
  activeOffer,
  clickOffer,
  handleNoThanks,
  firstName = "",
  reachedEndOfOffers,
  templateData,
}) {
  if (reachedEndOfOffers) return null;
  return (
    <View
      border="base"
      borderWidth="base"
      cornerRadius="base"
      background="base"
      overflow="hidden"
    >
      <BlockStack spacing="base" padding="loose">
        <BlockStack spacing="base" padding="none">
          {/* Header */}
          <PFHeader
            extensionTarget={extensionTarget}
            offer={activeOffer}
            firstName={firstName}
          />

          {/* Main grid layout */}
          <Grid
            blockAlignment="center"
            padding="none"
            spacing="base"
            columns={Style.default("100%").when(
              { viewportInlineSize: { min: "extraSmall" } },
              ["60%", "fill"],
            )}
          >
            {/* Left column (icon + description) */}
            <BlockStack spacing="base" padding="none" blockAlignment="start">
              <PFOfferIcon
                offer={activeOffer}
                viewport={PFViewportEnum.MOBILE}
              />

              <PFOfferDescription offer={activeOffer} />
            </BlockStack>

            {/* Right column (desktop icon) */}
            <PFOfferIcon
              offer={activeOffer}
              viewport={PFViewportEnum.DESKTOP}
            />
          </Grid>
        </BlockStack>

        {/* Actions */}
        <PFOfferActions
          offer={activeOffer}
          onClickOffer={clickOffer}
          onNoThanks={handleNoThanks}
        />

        {/* Footer */}
        <PFFooter templateData={templateData} />
      </BlockStack>
    </View>
  );
}
```

### Comparison: Fallback vs Adjustable Template

| Feature                  | Fallback Template | Adjustable Template   |
| ------------------------ | ----------------- | --------------------- |
| Configuration Parameters | 1 (privacyUrl)    | 84 full customization |
| Setup Complexity         | Minimal           | Moderate              |
| Visual Customization     | Fixed design      | Fully customizable    |
| Mobile Responsive        | Built-in          | Configurable          |
| Layout Options           | Fixed grid        | Flexible grid         |
| Typography Control       | Fixed             | Full control          |
| Button Styling           | Fixed             | Full control          |
| Icon Positioning         | Fixed             | 5 positions + custom  |
| Best For                 | Quick integration | Brand-specific needs  |

---

## Complete Integration Example

Here’s a complete workflow for integrating a store:

```bash
#!/bin/bash

BASE_URL="https://pr-api.falconlabs.us"
PLATFORM_TOKEN="plat_1234567890abcdef1234567890abcdef"

# Step 1: Create Publisher
echo "Step 1: Creating publisher..."
PUBLISHER_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/publishers" \
  -H "Authorization: Bearer${PLATFORM_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Fashion Store",
    "contactName": "John Doe",
    "contactEmail": "john@myfashionstore.com",
    "contactPhone": "+1-555-0123"
  }')

# Extract keys
PUBLIC_KEY=$(echo $PUBLISHER_RESPONSE | jq -r '.data.publicKeys[0]')
PRIVATE_KEY=$(echo $PUBLISHER_RESPONSE | jq -r '.data.privateKeys[0].bearer')

echo "Public Key:$PUBLIC_KEY"
echo "Private Key:$PRIVATE_KEY"

# Step 2: Create Site
echo ""
echo "Step 2: Creating site..."
SITE_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/site" \
  -H "Authorization: Bearer${PRIVATE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Fashion Store",
    "domain": "myfashionstore.com",
    "status": "active"
  }')

SITE_ID=$(echo $SITE_RESPONSE | jq -r '.data.id')
echo "Site ID:$SITE_ID"

# Step 3: Create Placement
echo ""
echo "Step 3: Creating placement..."
PLACEMENT_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/placements" \
  -H "Authorization: Bearer${PRIVATE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Thank You Page Ad",
    "siteId": "'${SITE_ID}'",
    "pageType": "THANK_YOU_PAGE",
    "isLiveMode": false
  }')

PLACEMENT_ID=$(echo $PLACEMENT_RESPONSE | jq -r '.data.id')
echo "Placement ID:$PLACEMENT_ID"

# Step 4: Test fetching offers
echo ""
echo "Step 4: Testing offer retrieval..."
curl -s -X GET "${BASE_URL}/api/odata?placementId=${PLACEMENT_ID}&sessionId=test_session_123&count=4" \
  -H "Authorization: Bearer${PUBLIC_KEY}" | jq '.'

echo ""
echo "Integration complete!"
echo "Public Key:$PUBLIC_KEY"
echo "Private Key:$PRIVATE_KEY"
echo "Placement ID:$PLACEMENT_ID"
```

---

## Error Handling Reference

### **Error Response Format**

All API errors follow a standardized response structure:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "value",
    "additionalInfo": "..."
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "req_abc123xyz"
}
```

**Response Fields:**

- `error`: Human-readable error message describing what went wrong
- `code`: Machine-readable error code (see table below)
- `details`: Optional object with additional error context (only in development, omitted in production for security)
- `timestamp`: ISO 8601 timestamp when the error occurred
- `requestId`: Optional request identifier for debugging and support

### Common HTTP Status Codes

| HTTP Status | Error Code                    | Description                                             | Common Causes                                                                           |
| ----------- | ----------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 400         | `VALIDATION_FAILED`           | Request validation failed                               | Multiple validation errors; see response `details` array for field-level messages.      |
| 400         | `MISSING_REQUIRED_FIELD`      | A required field was not provided.                      | Required parameter was omitted or empty.                                                |
| 400         | `INVALID_FIELD_VALUE`         | Invalid field value                                     | Enum value not in allowed list, wrong data type, or format (e.g. email, category name). |
| 400         | `INVALID_JSON`                | The request body is not valid JSON.                     | Malformed JSON or syntax error in request body.                                         |
| 400         | `INVALID_PAYLOAD`             | The payload structure is invalid.                       | Web-hook or request payload does not match expected structure.                          |
| 401         | `UNAUTHORIZED`                | Invalid or missing auth token                           | Expired token, wrong token type                                                         |
| 401         | `INVALID_TOKEN`               | The authentication token is invalid.                    | Token expired, malformed, or revoked.                                                   |
| 401         | `MISSING_TOKEN`               | No authorization token was provided.                    | No `Authorization: Bearer` … header in request.                                         |
| 401         | `INVALID_SIGNATURE`           | Web-hook signature verification failed.                 | Invalid HMAC signature or wrong web-hook secret.                                        |
| 403         | `INSUFFICIENT_PERMISSIONS`    | The token does not have permission for this operation.  | Using public key for management operations, or wrong token type.                        |
| 403         | `SITE_INACTIVE`               | The site is inactive.                                   | Attempting operations on a deactivated site.                                            |
| 404         | `RESOURCE_NOT_FOUND`          | The requested resource was not found.                   | Invalid ID, resource deleted, or resource belongs to another publisher.                 |
| 404         | `PLACEMENT_NOT_FOUND`         | The requested placement was not found.                  | Invalid placement ID or placement was deleted.                                          |
| 409         | `RESOURCE_CONFLICT`           | A resource with this value already exists.              | Duplicate email, name already taken, or unique constraint violation.                    |
| 429         | `RATE_LIMIT_EXCEEDED`         | Rate limit for this token was exceeded.                 | Too many requests in the time window; use Retry-After before retrying.                  |
| 500         | `INTERNAL_ERROR`              | An unexpected internal server error occurred.           | Unexpected error or database failure; contact support with timestamp and requestId.     |
| 500         | `DATABASE_ERROR`              | A database operation failed.                            | Database connection issue or query failure.                                             |
| 500         | `ATOMIC_OPERATION_FAILED`     | A multi-step operation failed partway.                  | Transaction rollback or partial failure.                                                |
| 500         | `SERVICE_AUTH_NOT_CONFIGURED` | Service authentication is not configured on the server. | Backend misconfiguration; contact support.                                              |

---

## Best Practices

### 1. Secure Key Storage

- Store **Platform Token**, **Public Key**, and **Private Key** securely
- Never expose keys in client-side code or public repositories
- Use environment variables or secure configuration management
- Rotate keys periodically for security

### 2. Error Handling

- Implement proper error handling for all API calls
- Log errors for debugging but avoid exposing sensitive information
- Provide user-friendly error messages
- Implement retry logic with exponential backoff for transient errors

### 3. Session Management

- Generate a unique `sessionId` for each customer session
- Use consistent session IDs across multiple API calls
- Include customer and order data for better targeting

### 4. Testing

- Always test in **test mode** (`isLiveMode: false`) before going live
- Verify ad display and tracking are working correctly
- Test error scenarios and edge cases
- Use the sandbox environment if available

### 5. Performance

- Cache placement IDs and publisher keys to reduce API calls
- Implement proper loading states in your UI
- Consider lazy loading the SDK to improve page load times
- Monitor rate limit headers and adjust request frequency

### 6. Customer Data & Privacy

- Only collect and pass customer data with proper consent
- Follow privacy regulations (GDPR, CCPA, etc.)
- Use customer data parameters to improve ad targeting
- Provide clear privacy policies and opt-out mechanisms

### 7. Monitoring & Analytics

- Track API response times and error rates
- Monitor rate limit consumption
- Set up alerts for critical errors
- Review reporting data regularly to optimize performance

---

## Frequently Asked Questions

### Q: What’s the difference between public and private keys?

**A**: The **public key** is used exclusively for fetching offers via the OData API (customer-facing operations). The **private key** is used for all management operations (creating sites, placements, accessing reports). Never expose the private key in client-side code.

### Q: Can I use the same placement for multiple pages?

**A**: No, create separate placements for each page type (thank you page, order status page, etc.). Each placement has specific configuration and tracking.

### Q: What happens when an offer is clicked?

**A**: When a customer clicks an offer, they are redirected to the `clickUrl` provided in the offer object. This URL includes tracking parameters for attribution.

### Q: How do I customize the appearance of offers?

**A**: For Shopify integrations, use the Adjustable Template component with the 84 configuration parameters. For other platforms, implement your own rendering using the offer data from the OData API.

### Q: How long are offers valid?

**A**: Offers returned from the OData API should be displayed immediately. Cache duration is managed internally by the system.

### Q: What should I do if I hit rate limits?

**A**: Implement exponential backoff for retries, cache data where possible, and monitor the `X-RateLimit-*` headers. If you consistently hit limits, contact support to discuss increasing your limits.

### Q: Can I create publishers on behalf of my merchants?

**A**: Yes, that’s the intended use case. Use your platform token to create publisher accounts for each merchant on your platform.

### Q: Do I need to implement impression tracking?

**A**: Yes, call the `beaconUrl` when an offer is displayed to track impressions. This is critical for accurate reporting and campaign optimization.

---

_Last Updated: January 2026Version: 2.0_
