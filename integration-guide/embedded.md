# Falcon SDK - Embedded Template Integration Documentation

## Overview

The Falcon SDK now supports embedded promotional content that renders directly within your webpage container, rather than as a fullscreen overlay. This allows for seamless integration of promotional offers within your existing page layout.

## Quick Integration Guide

### Step 1: Include the SDK

Add the Falcon SDK script to your HTML page:

```html
<head>
  <title>Falcon Ecommerce</title>
  <script src="https://falconlabs.s3.us-east-2.amazonaws.com/sdk/falcon-sdk.js"></script>
</head>
```

### Step 2: Create HTML Container

Add a container element where the promotional content will be displayed:

```html
<div
  id="embedded-target"
  style="width: 580px; height: 260px; border: 1px solid #ccc;"
></div>
```

### Step 3: Initialize and Configure

Initialize the SDK and create an embedded instance:

```javascript
(async function () {
  // Initialize SDK with your API key
  await FalconSDK.init("YOUR_API_KEY");

  // Create embedded perks instance
  const embeddedInstance = FalconSDK.createEmbeddedPerksInstance(
    "YOUR_PLACEMENT_ID",
    {
      containerElement: "#embedded-target", // CSS selector or HTMLElement
      attributes: {
        email: "user@example.com",
        firstname: "John",
        lastname: "Doe",
        //...
      },
    }
  );

  // Set up event callbacks (optional)
  embeddedInstance.addReadyCallback((isReady) => {
    console.log("Content ready:", isReady);
  });

  embeddedInstance.addClickCallback((data) => {
    console.log("User clicked offer:", data);
  });

  // Load and display promotional content
  const result = await embeddedInstance.loadPerks();
  if (result.isReady) {
    embeddedInstance.show();
  }
})();
```

## Complete Working Example

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Falcon SDK Embedded Integration</title>
    <script src="https://falconlabs.s3.us-east-2.amazonaws.com/sdk/falcon-sdk.js"></script>
    <style>
      .promo-container {
        border: 1px solid #ccc;
        padding: 2px;
        margin: 20px auto;
        height: 260px;
        width: 580px;
        background: #f5f5f5;
      }
    </style>
  </head>
  <body>
    <h1>Your Website Content</h1>

    <!-- Promotional content container -->
    <div id="embedded-target" class="promo-container"></div>

    <!-- Control buttons (optional) -->
    <button onclick="window.embeddedInstance.show()">Show Offers</button>
    <button onclick="window.embeddedInstance.hide()">Hide Offers</button>

    <script>
      (async function () {
        await FalconSDK.init("YOUR_API_KEY");

        window.embeddedInstance = FalconSDK.createEmbeddedPerksInstance(
          "YOUR_PLACEMENT_ID",
          {
            containerElement: "#embedded-target",
            attributes: {
              email: "user@example.com",
              firstname: "John",
              lastname: "Doe",
            },
          }
        );

        // Set up callbacks
        window.embeddedInstance.addReadyCallback((isReady) => {
          console.log("Ready state changed:", isReady);
        });

        window.embeddedInstance.addClickCallback((data) => {
          console.log("Offer clicked:", data);
        });

        // Load content
        const result = await window.embeddedInstance.loadPerks();
        console.log("Load result:", result);
      })();
    </script>
  </body>
</html>
```

## API Reference

### Initialization Methods

#### `FalconSDK.init(apiKey: string)`

Initializes the SDK with your API key. Must be called before creating instances.

#### `FalconSDK.createEmbeddedPerksInstance(placementId: string, options: EmbeddedOptions)`

Creates an embedded promotional content instance.

### Event Callbacks

#### `addReadyCallback(callback: (isReady: boolean) => void)`

Registers a callback that fires when content ready state changes.

#### `addClickCallback(callback: (data: {index: number, offer: object}) => void)`

Registers a callback that fires when user clicks on promotional content.

#### `addCloseCallback(callback: () => void)`

Registers a callback that fires when promotional content is closed/hidden.

## Configuration Options

### ShowOptions

```typescript
{
  title?: string;     // Optional: Override promotional title
  subtitle?: string;  // Optional: Override promotional subtitle
}
```

### UserAttributes

Available targeting attributes for personalization:

```typescript
{
  email?: string;
  firstname?: string;
  lastname?: string;
  confirmationref?: string;
  billingzipcode?: string;
  amount?: string;
  paymenttype?: string;
  ccbin?: string;
  mobile?: string;
  country?: string;
  language?: string;
  currency?: string;
  billingaddress1?: string;
  billingaddress2?: string;
  age?: string;
  gender?: string;
  cartItems?: string;
  orderid?: string;
}
```

## Best Practices

### Container Sizing

- Provide explicit width and height for the container element
- Recommended minimum size: 580px × 260px for Desktop and 479px x 400px for Mobile view.
- Ensure container is visible when `show()` is called

### Cleanup

Call `destroy()` when removing embedded content to prevent memory leaks:

```javascript
// When removing the promotional content
embeddedInstance.destroy();
```

## Integration Requirements

1. **API Key**: Obtain your API key from Falcon Labs
2. **Placement ID**: Get your placement ID from the Falcon dashboard
3. **Container Element**: Provide a target container in your HTML
4. **User Attributes**: Pass relevant user data for personalized offers

## Support

For technical support or questions about the embedded SDK integration, please contact Falcon Labs support team.
