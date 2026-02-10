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
