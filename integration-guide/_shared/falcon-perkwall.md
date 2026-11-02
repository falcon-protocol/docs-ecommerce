## Falcon PerkWall

### Overview

PerkWall is a perks page that shows up to 10 curated offers at once: one featured offer on top and a grid of offer cards below it. Falcon hosts it, fills it and tracks it, and it carries your branding: your logo, your colours and your page title.

Users open it from a single entry point in your app or site, such as a button in your app or a link in your menu. They see every offer on one screen and claim the one that fits.

[See a live example →](https://www.falconlabs.com/falcon-demos/perkwall/hosted)

### Why turn this on

- **More value for your members.** A perks page gives members, subscribers and loyal customers another reason to stay.
- **Revenue from your most engaged users.** People who open the wall are there to browse offers, so they claim at a higher rate than they do with offers shown one at a time.
- **No new ad slot.** One entry point opens a full page of offers.
- **Little to no build.** Falcon hosts the page and handles offers, ranking, tracking and optimization.

### What the integration involves

PerkWall is a placement template, so it uses the same identifiers and integration paths you already know. Falcon configures your placement to use PerkWall; you choose how users reach it.

| Option | Best for | What you build |
| --- | --- | --- |
| Hosted page | Mobile apps, member or rewards sections | Open a Falcon-hosted URL in a webview or browser |
| Embedded block | Websites using the Falcon Web SDK | The standard embedded integration |

> **Before you begin:** Ask your account manager to set up a PerkWall placement. You'll receive a `placementId` and a `publicApiKey`, the same pair used by every other Falcon placement.

### What it looks like

- **Header band:** your page title (for example, "Exclusive perks for members"), an optional icon and a banner image.
- **Featured offer:** one large offer card with a call to action and an optional badge such as "Recommended".
- **Offer grid:** up to nine more offer cards, each showing the advertiser's name, the offer title and a **Claim offer** button. On most phones the grid shows two columns.
- **Page shape only:** your logo in a header bar and a footer.

Every card always renders. When an offer has no image, the card shows the advertiser's logo on a coloured tile instead, so nothing appears blank.

### Option 1: Hosted page

Falcon hosts PerkWall as a full page. Load it the same way as any hosted placement: follow the [Webview Placement](/integration-guide/partner-rewards-integration-hosted-webview-placement) guide using your PerkWall `placementId`.

Everything in that guide applies here, including:

- passing a fresh `sessionId` each time the page opens
- opening offers in a native in-app browser with `nativeClick=1` (recommended)
- handing app-install links (`market://`, `itms-apps://`) to the OS
- the optional in-unit close control (`hostClose`)

> **Keep users in your app:** Open PerkWall in an in-app webview rather than the system browser. Users stay inside your app, and they come back when they close it. Offers opened from a webview have performed significantly better than offers opened in an external browser.

**Back link:** When the page is opened from another page, it shows a back link in the header. When it's opened in a fresh tab or webview, with nowhere to go back to, the link stays hidden.

### Option 2: Embedded on your page

On the web, PerkWall can sit directly inside your page as an offer block (header band, featured offer and grid, without the page header and footer). Use the standard [Embedded](/integration-guide/embedded) integration with your PerkWall `placementId`. Falcon sets the template on the placement.

### Branding

Send these to your account manager. Falcon applies them to your placement, and changes go live without a release on your side.

| Setting | What it controls |
| --- | --- |
| Page title | The line in the header band, e.g. "Exclusive offers for members" |
| Icon | The small icon beside the title (optional) |
| Banner image | The header band image. Recommended size 1000×250. Phones crop to the centre, so keep important content in the middle |
| Brand colour | The featured offer's button, plus the header and footer bars on the full page. Text switches between black and white automatically to stay readable |
| Logo | Your logo in the page header (full page only) |
| Page background | The page colour in light theme (full page only) |
| Featured badge | A small label on the featured offer, such as "Recommended" (optional) |

> **Dark theme:** PerkWall follows your app's or site's theme. In the dark theme it uses a dark surface automatically.

### Offers and tracking

- PerkWall requests 10 offers. You don't set an offer count.
- Offers are curated and ranked by Falcon, and the best-performing offers are shown first.
- Impressions, clicks and conversions are tracked on Falcon's side. You don't need tracking code for the hosted page or the embedded block.
- Results appear in your regular reporting and the [Reporting API](/integration-guide/reporting-api).

### Summary

1. Ask your account manager for a PerkWall placement and send your branding.
2. Choose an entry point: a hosted page or an embedded block.
3. **Hosted page:** load the URL by following the [Webview Placement](/integration-guide/partner-rewards-integration-hosted-webview-placement) guide.
4. **Embedded:** use the standard [Embedded](/integration-guide/embedded) integration.
5. Falcon handles offers, ranking and tracking.
