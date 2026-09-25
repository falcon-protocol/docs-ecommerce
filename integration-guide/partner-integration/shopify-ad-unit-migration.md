---
title: "Migrating to Shopify Ad Unit 2.0"
---

# Migrating to Shopify Ad Unit 2.0

This guide is for partners already running a 1.x integration. For a first-time setup, read [Shopify Ad Unit (2.0)](./shopify-ad-unit-2) instead.

Delete from your code:

- The offers request (`/api/odata`), the session id, `js-sha256` and the hashed identifiers.
- `FeatureManagementProvider`, its `userContext`, `storage`, `extensionTarget`, `apiEndpoint`, `loadingElement` and `disableClientImpressions`.
- `Renderer` and every prop you passed it: `offers`, `activeOffer`, `activeOfferIndex`, `reachedEndOfOffers`, `clickOffer`, `handleNoThanks`, `onOverlayDismissed`, `onRestartOffers`, `siteImages`, `withOverlayTrigger`, `templateId`, `templateData`, `extensionTarget`, `firstName`, `email`, `language`.
- Your carousel state and the `<s-query-container>` around the unit.
- Any import of `skeleton.tsx`.
- `shopify.d.ts`, `useStorage` and `useExtensionEditor`.

What is left is the mount itself:

```tsx
// 1.x — your wrapper owned the payload, the request and the carousel
const payload = useFalconPayload();
const { offers, templateData, templateId } = useFalconApi(payload, sessionId);
const [activeOfferIndex, setActiveOfferIndex] = useState(0);

<FeatureManagementProvider publicKey={key} userContext={ctx} storage={storage} ...>
  <s-query-container>
    <Renderer
      offers={offers}
      activeOfferIndex={activeOfferIndex}
      clickOffer={clickOffer}
      handleNoThanks={handleNoThanks}
      templateId={templateId}
      templateData={templateData}
      ...
    />
  </s-query-container>
</FeatureManagementProvider>

// 2.0 — all of the above
<FalconOffers publicKey={key} placementId={placementId} />
```

Two things to check after the swap:

- **Impressions.** The unit now counts every showing itself. If you also fire an impression server-side, you will count each one twice. Drop your own and read the `impression` event from `onEvent` instead.
- **Session ids.** The format changed, and nothing on your side depends on it. Sessions from before the migration simply look different in reports.
