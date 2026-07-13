---
title: Partner Rewards Integration - Hosted webview placement
description: Falcon Partner Rewards is a hosted page that presents relevant offers to your users after a key moment in your app. It runs inside your webview with no SDK install and no authentication. The placement and key are preconfigured on the Falcon side, so the URL works the moment you load it and you can take it live as is.
---
# Partner Rewards: Webview Integration

## Before you begin

The placement uses two identifiers, both preconfigured on the Falcon side and provided by your Falcon Labs account manager:

| Identifier | Description |
| --- | --- |
| `placementId` | Identifies your specific Partner Rewards placement. |
| `publicApiKey` | Identifies your publisher account. Safe to use in client-side code. |

## Integration

Open the following URL inside your webview:

```
https://pr.falconlabs.us/partners-rewards?placementId=YOUR_PLACEMENT_ID&publicApiKey=YOUR_PUBLIC_API_KEY
```

| Parameter | Required | Description |
| --- | --- | --- |
| `placementId` | Required | Your Falcon placement, provided by Falcon. |
| `publicApiKey` | Required | Your public account key. Safe to use client-side. |

To test before launch, use the same URL on staging (staging credentials are provided separately):

```
https://staging-pr.falconlabs.us/partners-rewards?placementId=YOUR_PLACEMENT_ID&publicApiKey=YOUR_PUBLIC_API_KEY
```

## Webview click handling (required for app-install offers)

A portion of offers are app-install campaigns. Selecting one issues a navigation to a non-http(s) scheme that resolves to the device app store or an app deep link (`market://` on Android, `itms-apps://` on iOS). A webview does not resolve these schemes on its own, so the navigation fails and the user lands on a blank page.

To support them, intercept every navigation request and, when the scheme is anything other than `http` or `https`, hand the URL to the operating system rather than loading it in the webview. The handlers below implement this on each platform. Attribution is unaffected; the store receives the same referrer as a direct launch.

### Android

```kotlin
webView.webViewClient = object : WebViewClient() {
    override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
        val scheme = request.url.scheme?.lowercase()
        if (scheme == "http" || scheme == "https") return false // normal page, let the WebView load it
        return try {
            val intent = if (scheme == "intent")
                Intent.parseUri(request.url.toString(), Intent.URI_INTENT_SCHEME)
            else Intent(Intent.ACTION_VIEW, request.url)
            // Safety: let the OS pick a normal app, never a named internal component.
            intent.addCategory(Intent.CATEGORY_BROWSABLE)
            intent.component = null
            intent.selector = null
            startActivity(intent) // opens Play Store
            true
        } catch (e: ActivityNotFoundException) { false }
    }
}
```

### iOS

```swift
func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
             decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
    if let url = navigationAction.request.url, let s = url.scheme?.lowercased(),
       s != "http", s != "https" {
        UIApplication.shared.open(url) // itms-apps://, app deep links
        decisionHandler(.cancel)
        return
    }
    decisionHandler(.allow)
}
```

## Behavior

- Renders full-screen. Give it a full-height webview so the unit has room to display.
- No close button in the unit. Users dismiss it with a swipe. If you prefer an in-unit close control, refer to the "In-Unit Close Control" section below.
- Tapping an offer opens the advertiser, then the unit advances to the next offer. After the last offer it loops back to the first.
- If `placementId` or `publicApiKey` is missing, the page shows a "missing parameters" message.

## In-unit close control (optional)

By default the unit is dismissed with a swipe. To present a native close affordance, Falcon can render an X button inside the unit that signals your app to dismiss the webview when tapped. This requires a one-time listener on your side, set up as follows.

Register a message handler when you create the webview and dismiss the webview when it receives the close message. Falcon's page invokes the handler when the X is tapped.

### Android

```kotlin
webView.settings.javaScriptEnabled = true
webView.addJavascriptInterface(object {
    @JavascriptInterface
    fun onClose() {
        runOnUiThread { /* dismiss the webview */ }
    }
}, "falconRewards")

// Falcon calls this when the X is tapped:
// window.falconRewards.onClose()
```

### iOS

```swift
// When you create the webview
let config = WKWebViewConfiguration()
config.userContentController.add(self, name: "falconRewards")
let webView = WKWebView(frame: .zero, configuration: config)

// Conform to WKScriptMessageHandler
func userContentController(_ controller: WKUserContentController,
                           didReceive message: WKScriptMessage) {
    guard message.name == "falconRewards" else { return }
    // dismiss the webview
}

// Falcon calls this when the X is tapped:
// window.webkit.messageHandlers.falconRewards.postMessage("close")
```

If you have already added the non-http(s) interception from the section above, the close can instead be delivered as a navigation to `falcon://close`, by adding one `if` line to the existing handler with no message bridge required.

## Optional attributes

To sharpen match rate and payout you can add user or order attributes to the URL, each with an `at.` prefix. URL-encode any special characters.

```
.../partners-rewards?placementId=...&publicApiKey=...&at.country=US&at.email=user%40example.com
```

Full list: https://docs.falconlabs.com/integration-guide/overlay.html#custom-attributes

## Reporting

Impressions, clicks, and conversions are tracked on the Falcon side, with nothing required on your side.
