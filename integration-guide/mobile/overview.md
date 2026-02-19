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
