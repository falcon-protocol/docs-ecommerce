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
