# Reporting API

## Overview

The Reporting API provides analytics and performance data for your placements and sites.

### Base Endpoint

```text
https://pr-api.falconlabs.us/api/report
```

### Authentication

Use the publisher’s **Private Key**:

```text
Authorization: Bearer PUBLISHER_PRIVATE_KEY
```

### Get Performance Report

Retrieves performance metrics for placements or sites.

### Endpoint

```text
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

### Response Format

The endpoint returns a **bare JSON array** of report rows. There is no `data` wrapper and no `summary` object — totals and averages are not computed by the API. Each element of the array is a single row.

The core fields (`date`, `clicks`, `transactions`, `revenue`, `site`, `siteId`) are present on every row. The remaining fields appear only under the conditions noted below.

| Field | Type | Present when | Notes |
| --- | --- | --- | --- |
| `date` | string | Always | Format depends on `breakdownBy` — see below |
| `clicks` | number | Always | Number of clicks on offers |
| `transactions` | number | Always | Event count of requests that resulted in postback/conversion tracking |
| `revenue` | number | Always | Your revenue after Falcon's revenue share, not gross ad revenue. This is the only revenue field returned — see note below |
| `site` | string | Always | Site name |
| `siteId` | string | Always | |
| `placement` | string | On `PLACEMENT` reports | Placement name |
| `placementId` | string | On `PLACEMENT` reports | |
| `country` | string \| null | When grouped by `COUNTRY` | ISO country code, or `null` when unknown |

> **`date` format:** when `breakdownBy` is `NONE` (the default), `date` is the report's start date in `YYYY-MM-DD` form (e.g. `"2024-01-01"`). For any time breakdown (`DAY`, `WEEK`, `MONTH`), `date` is formatted as `DD/MM/YYYY` (e.g. `"15/01/2024"`).

> **`revenue` and your payout:** `revenue` is already net of Falcon's revenue share for your account — it is not gross ad revenue, and no further take rate is deducted from it before payout. It also reflects floor-price protection and, once a month closes, that month's reconciliation against actual advertiser-reported revenue. Because of that reconciliation step, `revenue` for the current (not-yet-closed) month is Falcon's best estimate and may be revised slightly when the month is reconciled; `revenue` for a closed, reconciled month is the final figure your payout for that month is based on.

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

The response is a bare array of row objects:

```json
[
  {
    "date": "15/01/2024",
    "clicks": 85,
    "transactions": 1250,
    "revenue": 450.5,
    "placementId": "clx4d5e6f7g8h9i0j1k2l3m4n",
    "placement": "Thank You Page Placement",
    "siteId": "clx0s1t2e3i4d5x6y7z8",
    "site": "example.com",
    "country": "US"
  },
  {
    "date": "16/01/2024",
    "clicks": 96,
    "transactions": 1420,
    "revenue": 562.75,
    "placementId": "clx4d5e6f7g8h9i0j1k2l3m4n",
    "placement": "Thank You Page Placement",
    "siteId": "clx0s1t2e3i4d5x6y7z8",
    "site": "example.com",
    "country": "US"
  }
]
```

---

#### Click-through rate (CTR)

CTR reporting is not enabled for all accounts. If your account has CTR access, each row will also include a `ctr` field (`number`) — the row's click-through rate, derived from clicks over ad impressions. If your account does not have CTR access, the field is simply omitted from the response.
