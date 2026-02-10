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
