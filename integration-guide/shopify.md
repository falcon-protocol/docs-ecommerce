---
title: "Shopify Integration docs"
---

# Shopify Integration docs

## Installing Falcon Shopify Widget

Enhance your Shopify store by seamlessly integrating our advertising widget. The setup is quick and consists of two core steps.
To get started:

1. Install our [Shopify app](https://apps.shopify.com/falcon-cross-sell)
2. Contact your Falcon Support at [Support@falconlabs.us](mailto:Support@falconlabs.us) to get your SDK key
3. Implement your SDK and Placement key

Thats it you are ready!

## What the app sends with each ad request

The Falcon blocks pass the order data Shopify exposes on the Thank You and Order Status pages (order id, amount, currency, language, country, the hashed customer identifiers) and the order's line items as `at.lineItems`, a JSON array with one entry per product (variant and product ids, SKU, variant title, vendor, product type, quantity, line total and currency). Line items power product-aware offer targeting; nothing else needs to be configured on your side.
