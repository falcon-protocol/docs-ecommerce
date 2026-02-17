# Embedded Web Integration

## Overview

The Falcon SDK supports **embedded mode**, which renders promotional content directly within a container on your webpage, rather than as a fullscreen overlay. This allows for seamless integration of offers within your existing page layout (e.g., order confirmation pages, account dashboards, checkout flows).

## Quick Integration Guide

### Step 1: Get Your SDK Key

Contact your Falcon Labs account manager to obtain your unique SDK key and placement ID.

### Step 2: Add the SDK Script

Add the Falcon embedded SDK script to your HTML page:

```html
<head>
  <title>Your Website</title>
  <script src="https://d6y5cd3imay52.cloudfront.net/sdk/v1/embedded-sdk.js"></script>
</head>
```

### Step 3: Create HTML Container

Add a container element where the promotional content will render:

```html
<div id="falcon-ads-container" style="width: 580px; height: 260px;"></div>
```

**Recommended dimensions:**

- **Desktop:** 580px × 260px (minimum)
- **Mobile:** 479px × 400px (minimum)

### Step 4: Initialize with Single API Call

Use `FalconAds.init()` method to initialize and display perks in one call:

```javascript
FalconAds.init({
  apiKey: "YOUR_API_KEY",
  containerId: "falcon-ads-container",
  placementId: "YOUR_PLACEMENT_ID",
});
```

That's it! The SDK will automatically:

- Initialize with your API key
- Find the container element
- Load available perks
- Display them if available

## Complete Integration Example

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Falcon Ads - Embedded Integration</title>
    <script src="https://d6y5cd3imay52.cloudfront.net/sdk/v1/embedded-sdk.js"></script>
    <style>
      .perks-container {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 2px;
        margin: 20px auto;
        height: 260px;
        width: 580px;
        background: #f9f9f9;
      }

      @media (max-width: 768px) {
        .perks-container {
          width: 100%;
          max-width: 479px;
          height: 400px;
        }
      }
    </style>
  </head>
  <body>
    <h1>Order Confirmation</h1>
    <p>
      Thank you for your order! Here are some exclusive offers just for you:
    </p>

    <!-- Promotional content container -->
    <div id="falcon-ads-container" class="perks-container"></div>

    <p>Continue shopping or explore more products below...</p>

    <script>
      // Initialize Falcon Ads with a single call
      FalconAds.init({
        apiKey: "YOUR_API_KEY",
        containerId: "falcon-ads-container",
        placementId: "YOUR_PLACEMENT_ID",
      });
    </script>
  </body>
</html>
```

## API Reference

### `FalconAds.init(config: FalconAdsConfig): void`

Initializes and displays embedded promotional content with a single method call.

**Parameters:**

```javascript
FalconAds.init({
  apiKey: "YOUR_API_KEY", // Required: Your Falcon API key
  containerId: "falcon-ads-container", // Required: ID of container element
  placementId: "YOUR_PLACEMENT_ID", // Required: Your placement ID
});
```

**What it does:**

1. Initializes the Falcon SDK with your API key
2. Finds the container element by ID
3. Loads available promotional offers
4. Automatically displays offers if available
5. Handles errors gracefully (won't break your page)

**Error Handling:**

The SDK handles errors internally and logs them to console:

- `[FalconAds] Container not found: "{id}"` - Container element doesn't exist
- `[FalconAds] Authentication failed` - Invalid API key or placement ID
- `[FalconAds] Connection failed` - Network connectivity issues
- `[FalconAds] Init failed` - General initialization error

**Important Notes:**

- Container must exist in the DOM before calling `init()`
- If no offers are available, the container remains empty (no error)
- The method is fire-and-forget (no return value or callbacks)
- Multiple calls with different placements will work, but avoid duplicate placement IDs

## Configuration

### `FalconAdsConfig`

The configuration object passed to `FalconAds.init()`:

```typescript
interface FalconAdsConfig {
  apiKey: string; // Your Falcon API key (required)
  containerId: string; // HTML element ID for the container (required)
  placementId: string; // Your placement ID from Falcon (required)
  attributes?: object; // Order/customer data (optional)
}
```

**Example:**

```javascript
FalconAds.init({
  apiKey: "abc123xyz",
  containerId: "falcon-ads-container",
  placementId: "placement_xyz789",
});
```

## Passing Order Attributes

You can pass order and customer data via the `attributes` field. These attributes are used for personalization, analytics, and offer targeting.

```javascript
FalconAds.init({
  apiKey: "YOUR_API_KEY",
  containerId: "falcon-ads-container",
  placementId: "YOUR_PLACEMENT_ID",
  attributes: {
    orderId: "ORD-123456",
    email: "customer@example.com",
    amount: "99.99",
    currency: "USD",
    firstname: "John",
    lastname: "Doe",
    country: "US",
    language: "en",
    billingzipcode: "10001",
  },
});
```

### Attribute Reference

| Attribute        | Priority    | Description             | Format                                          |
| ---------------- | ----------- | ----------------------- | ----------------------------------------------- |
| `orderId`        | Required    | Unique order identifier | String, no special characters (#, @, ., spaces) |
| `email`          | Required    | Customer email          | Valid email string                              |
| `amount`         | Recommended | Order total             | Numeric string (e.g. `"99.99"`)                 |
| `firstname`      | Recommended | Customer first name     | String                                          |
| `lastname`       | Recommended | Customer last name      | String                                          |
| `currency`       | Optional    | Currency code           | ISO 4217 (e.g. `"USD"`, `"EUR"`)                |
| `country`        | Optional    | Customer country        | ISO 3166-1 alpha-2 (e.g. `"US"`, `"GB"`)        |
| `language`       | Optional    | Customer language       | ISO 639-1 (e.g. `"en"`, `"fr"`)                 |
| `billingzipcode` | Optional    | Billing zip/postal code | String                                          |

> **Note:** All attribute values must be strings. The `attributes` field is optional — the SDK works without it, but passing attributes enables better offer targeting and analytics.

## Error Handling

The `FalconAds.init()` method handles errors internally and will not break your page. Errors are logged to the browser console for debugging.

**No try-catch needed** - the SDK fails gracefully:

```javascript
// This is safe - won't throw errors or break your page
FalconAds.init({
  apiKey: "YOUR_API_KEY",
  containerId: "falcon-ads-container",
  placementId: "YOUR_PLACEMENT_ID",
});
```

**Error messages in console:**

```text
[FalconAds] Container not found: "falcon-ads-container"
→ The container element with this ID doesn't exist in the DOM

[FalconAds] Authentication failed: Invalid API key or placement ID
→ Check your credentials with Falcon Labs

[FalconAds] Connection failed: Unable to establish connection
→ Network connectivity issue or server unavailable

[FalconAds] Init failed: [error details]
→ General initialization error (check console for details)
```

## Best Practices

### 1. Container Sizing

Provide explicit dimensions for optimal display:

```css
/* Desktop */
#falcon-ads-container {
  width: 580px;
  height: 260px;
}

/* Mobile */
@media (max-width: 768px) {
  #falcon-ads-container {
    width: 100%;
    max-width: 479px;
    height: 400px;
  }
}
```

**Recommended minimum sizes:**

- Desktop: 580px × 260px
- Mobile: 479px × 400px

### 2. Container Must Exist Before Initialization

Ensure the container element is in the DOM before calling `FalconAds.init()`:

```html
<!-- ✅ Good: Container exists before script -->
<div id="falcon-ads-container"></div>
<script src="https://d6y5cd3imay52.cloudfront.net/sdk/v1/embedded-sdk.js"></script>
<script>
  FalconAds.init({
    apiKey: "YOUR_API_KEY",
    containerId: "falcon-ads-container",
    placementId: "YOUR_PLACEMENT_ID",
  });
</script>

<!-- ❌ Bad: Script runs before container exists -->
<script>
  FalconAds.init({
    /* ... */
  });
</script>
<div id="falcon-ads-container"></div>
```

### 3. Place Script Near Closing `</body>` Tag

For best performance, place the SDK script and initialization at the bottom of your page:

```html
<body>
  <!-- Your page content -->
  <div id="falcon-ads-container"></div>

  <!-- SDK at the end -->
  <script src="https://d6y5cd3imay52.cloudfront.net/sdk/v1/embedded-sdk.js"></script>
  <script>
    FalconAds.init({
      /* ... */
    });
  </script>
</body>
```

### 4. Use Unique Container IDs

Each placement should have its own unique container:

```html
<!-- ✅ Good: Unique IDs -->
<div id="falcon-checkout-offers"></div>
<div id="falcon-thankyou-offers"></div>

<script>
  FalconAds.init({
    apiKey: "YOUR_API_KEY",
    containerId: "falcon-checkout-offers",
    placementId: "PLACEMENT_1",
  });

  FalconAds.init({
    apiKey: "YOUR_API_KEY",
    containerId: "falcon-thankyou-offers",
    placementId: "PLACEMENT_2",
  });
</script>
```

## Troubleshooting

### Perks don't display

**Check the following:**

1. **Container element exists:**

   ```javascript
   // Open browser console and run:
   document.getElementById("falcon-ads-container");
   // Should return the HTML element, not null
   ```

2. **Container has dimensions:**

   ```javascript
   // Check container size:
   const container = document.getElementById("falcon-ads-container");
   console.log(container.offsetWidth, container.offsetHeight);
   // Should be greater than 0
   ```

3. **Check console for errors:**

   Open your browser's developer console (F12) and look for messages starting with `[FalconAds]`

4. **Verify SDK script loaded:**

   ```javascript
   // In browser console:
   typeof FalconAds;
   // Should return "object", not "undefined"
   ```

### Common Issues and Solutions

#### "Container not found" error

**Problem:** `[FalconAds] Container not found: "falcon-ads-container"`

**Solution:**

- Verify the container ID matches exactly (case-sensitive)
- Ensure container exists before calling `FalconAds.init()`
- Check for typos in the ID

```html
<!-- Make sure these match -->
<div id="falcon-ads-container"></div>
<script>
  FalconAds.init({
    containerId: "falcon-ads-container", // Must match exactly
  });
</script>
```

#### "Authentication failed" error

**Problem:** `[FalconAds] Authentication failed: Invalid API key or placement ID`

**Solution:**

- Verify your API key with Falcon Labs
- Confirm placement ID is correct
- Check for extra spaces or typos in credentials

#### SDK script doesn't load

**Problem:** `Uncaught ReferenceError: FalconAds is not defined`

**Solution:**

- Verify the script URL is correct
- Check browser network tab for 404 or network errors
- Ensure script loads before calling `FalconAds.init()`

```html
<!-- ✅ Correct order -->
<script src="https://d6y5cd3imay52.cloudfront.net/sdk/v1/embedded-sdk.js"></script>
<script>
  FalconAds.init({
    /* ... */
  });
</script>
```

#### No offers display (no error)

**This is normal behavior** - it means:

- The SDK initialized successfully
- No promotional offers are available for this user/placement at this time
- The container remains empty (not an error)

**What to do:**

- Verify with Falcon Labs that offers are configured for your placement
- Check if offers have geographic or other targeting restrictions
- Test with different user scenarios

## Integration Checklist

Before going live, verify:

- [ ] Embedded SDK script tag added to HTML (`embedded-sdk.js`)
- [ ] Container element exists with unique ID
- [ ] Container has explicit width and height dimensions
- [ ] `FalconAds.init()` called with correct API key
- [ ] Placement ID is correct
- [ ] Container exists in DOM **before** calling `FalconAds.init()`
- [ ] No console errors in browser developer tools
- [ ] Container displays correctly on desktop (580px × 260px minimum)
- [ ] Container displays correctly on mobile (479px × 400px minimum)
- [ ] Tested on major browsers (Chrome, Firefox, Safari, Edge)
- [ ] Page loads without errors when no offers are available

## Additional Features

Need more control over the integration? The SDK also supports an advanced API with:

- Custom user attributes for personalization
- Event callbacks (ready, click, close)
- Manual control over loading and display timing
- Programmatic show/hide control
- Support for dynamic content updates

**Contact your Falcon Labs account manager** to learn about advanced integration options.

## Support

For technical support or questions about the embedded SDK integration:

- **Contact:** Your Falcon Labs account manager
- **Documentation:** This guide

**Need your API key or placement ID?** Contact your Falcon Labs account manager.
