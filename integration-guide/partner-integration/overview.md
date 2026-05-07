# Falcon Partner Integration Guide

## Overview

This guide provides comprehensive instructions for integrating Falcon's promotional ad unit system into your platform. Falcon enables partners to display targeted promotional offers to customers at key moments in their journey (thank you pages, order status pages, etc.).

Before you begin, review the [Prerequisites](./prerequisites) for the credentials and access you'll need. All initial development and testing should happen against the [Staging Environment](./staging-environment), which is meant for verifying your integration end-to-end without polluting production metrics — production credentials are issued only after a successful staging review.

A partner integration has two parts: standing up the entity hierarchy that represents your portfolio, and then serving ads against it.

### 1. Setting up the entity hierarchy

Falcon's data model is hierarchical. You'll create three entities in succession, each via its own API:

- **Publishers** represent the companies in your portfolio that can host advertisements (typically a merchant or store owner). Create them via the [Publishers API](./publishers-api).
- **Sites** represent unique domains or stores within a publisher's portfolio. In many cases a publisher will only have a single site, but the model supports multiple. Create them via the [Sites API](./sites-api).
- **Placements** represent unique pages or opportunities within a site where ads can be served — for example, the thank you page or the order status page. Create them via the [Placements API](./placements-api).

Each API is leveraged to build its corresponding object in order: publisher → site(s) under that publisher → placement(s) under each site.

### 2. Serving ads

Once you've created placements under the sites and publishers you want to display ads for, the last step is actually serving the ads. The right approach depends on how much control you have over the surface.

#### Embedded Web SDK (recommended)

On any surface where you have full control over the rendered HTML, we highly recommend leveraging our [Embedded Web SDK](/integration-guide/embedded). Drop it in with the public token and the `placementId` you generated in the steps above, and the SDK handles fetching, rendering, impression tracking, and click handling for you.

#### Shopify checkout

Within the Shopify world there are restrictions on the types of components that can render in the Checkout Flow, so the standard Embedded SDK isn't usable there. For those surfaces we maintain GitHub repos for both React and Preact git submodules that you can import into your codebase and leverage to do all the heavy lifting of generating the look and feel, managing the carousel, wrapping the components in click URLs, and firing impressions.

- [Shopify Ad Unit (React)](./shopify-ad-unit-react)
- [Shopify Ad Unit (Preact)](./shopify-ad-unit-preact)

#### Direct OData integration

Alternatively, you can directly leverage [OData API](./odata-api) requests to get the offer responses that feed our ad units and customize the look and feel yourself. If you go this route, two additional pieces of the integration become your responsibility:

- Fire off **impression events** that let Falcon know when ads are viewed — see the [Impression API](./impression-api) docs.
- Wrap the ads themselves in the **click URLs** returned on the OData response — see the [Click API](./click-api) docs.
