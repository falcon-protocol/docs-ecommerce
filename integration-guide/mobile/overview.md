# Mobile Integration

Falcon Perks can be displayed in native iOS and Android apps using a **WebView**. Your app loads a Falcon-hosted page inside a WebView, and communication between the WebView and your native code happens through a JavaScript bridge.

## How it works

1. Your app opens a `WKWebView` (iOS) or `WebView` (Android) pointing to the Falcon WebView URL
2. The Falcon UI loads and displays perks inside the WebView
3. User interactions (clicks, closes) are sent from the WebView to your native app via a JavaScript bridge
4. Your native code handles these events (e.g., opening click URLs in the system browser)

## WebView URL

```
https://promo.falconlabs.us/ui/webview?placement=PLACEMENT_ID&apiKey=API_KEY&sessionId=SESSION_ID
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `placement` | Yes | Your placement ID |
| `apiKey` | Yes | Your Falcon API key |
| `sessionId` | Yes | A unique session identifier (e.g., UUID). Generate a new one per session. |

## Bridge Protocol

The WebView communicates with your native app by sending JSON messages through platform-specific bridges:

- **iOS**: `window.webkit.messageHandlers.iosNativeListener.postMessage(message)`
- **Android**: `window.Android.postMessage(JSON.stringify(message))`

### Message format

All messages follow this structure:

```json
{
  "type": "event",
  "name": "EVENT_NAME",
  "data": { ... }
}
```

### Events

| Event | Description | Data |
|-------|-------------|------|
| `click` | User clicked a perk offer | `{ "index": 0, "clickUrl": "https://..." }` |
| `close` | User closed the perks view | `{ "index": 0, "closeType": "..." }` |

When you receive a `click` event, open the `clickUrl` in the system browser or an in-app browser (e.g., `SFSafariViewController` on iOS, `CustomTabsIntent` on Android).

## Custom Attributes

You can pass user and order attributes to improve offer targeting and personalization. Attributes are passed as `at.*` query parameters on the WebView URL:

```
https://promo.falconlabs.us/ui/webview?placement=PLACEMENT_ID&apiKey=API_KEY&sessionId=SESSION_ID&at.email=user@example.com&at.firstname=John&at.country=US&at.orderId=ORD-123&at.amount=99.99
```

| Parameter | Description |
|-----------|-------------|
| `at.email` | Customer email |
| `at.firstname` | First name |
| `at.lastname` | Last name |
| `at.orderId` | Order/transaction ID |
| `at.amount` | Order total (e.g. "99.99") |
| `at.country` | ISO country code (e.g. "US") |
| `at.language` | ISO language code (e.g. "en") |
| `at.currency` | ISO currency code (e.g. "USD") |
| `at.confirmationref` | Merchant/seller name (shown in headline) |
| `at.billingzipcode` | Billing ZIP code |
| `at.paymenttype` | Payment method (e.g. "credit_card") |
| `at.ccbin` | Credit card BIN (first 6 digits) |
| `at.mobile` | Phone number |
| `at.billingaddress1` | Billing address line 1 |
| `at.billingaddress2` | Billing address line 2 |
| `at.age` | Customer age |
| `at.gender` | Customer gender |
| `at.cartItems` | Cart items (JSON string) |

> **Note:** The more attributes you provide, the better the offer targeting and personalization.

## Event Lifecycle

Understanding the full lifecycle of events helps you integrate correctly:

1. **Load** - Your app loads the WebView URL. The page calls the `/odata` endpoint to fetch offers for this placement.
2. **Impression** - When offers are displayed to the user, an impression is automatically tracked (beacon pixel).
3. **Click** - When the user clicks an offer, a `click` event is sent to your native app via the bridge. The `clickUrl` in the event data is a tracking URL that redirects to the advertiser's page. Your app should open this URL in the system browser (not inside the WebView).
4. **Close** - When the user closes the offers view, a `close` event is sent to your native app via the bridge.

> **Note:** Impression tracking happens automatically inside the WebView. Click and close events are sent to your native app so you can handle navigation and cleanup.

## Platform Guides

- [iOS Integration](/integration-guide/mobile/ios) - Swift + WKWebView
- [Android Integration](/integration-guide/mobile/android) - Kotlin + WebView

## Requirements

| Platform | Minimum Version |
|----------|----------------|
| iOS | 15.0+ |
| Android | API 24 (Android 7.0)+ |

## Credentials

Contact your Falcon Labs account manager to get your API key and placement ID.
