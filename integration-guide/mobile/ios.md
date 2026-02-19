# iOS Integration

Display Falcon Perks in your iOS app using `WKWebView`. No native SDK download required.

## Requirements

- iOS 15.0+
- Xcode 15+
- A Falcon API key and placement ID

## Quick Start

### 1. Create the WebView

Set up a `WKWebView` with the `iosNativeListener` message handler:

```swift
import WebKit

class FalconPerksViewController: UIViewController, WKScriptMessageHandler {

    private var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()

        let contentController = WKUserContentController()
        contentController.add(self, name: "iosNativeListener")

        let config = WKWebViewConfiguration()
        config.userContentController = contentController

        webView = WKWebView(frame: view.bounds, configuration: config)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(webView)

        // Enable Safari Web Inspector for debugging (iOS 16.4+)
        if #available(iOS 16.4, *) {
            webView.isInspectable = true
        }
    }
}
```

### 2. Load the Falcon WebView URL

```swift
func loadPerks(apiKey: String, placementId: String) {
    let sessionId = UUID().uuidString
    let urlString = "https://promo.falconlabs.us/ui/webview"
        + "?placement=\(placementId)"
        + "&apiKey=\(apiKey)"
        + "&sessionId=\(sessionId)"

    if let url = URL(string: urlString) {
        webView.load(URLRequest(url: url))
    }
}
```

### 3. Handle bridge messages

Implement `WKScriptMessageHandler` to receive events from the WebView:

```swift
func userContentController(
    _ userContentController: WKUserContentController,
    didReceive message: WKScriptMessage
) {
    guard message.name == "iosNativeListener",
          let body = message.body as? [String: Any],
          let type = body["type"] as? String,
          let name = body["name"] as? String else { return }

    if type == "event" && name == "click" {
        if let data = body["data"] as? [String: Any],
           let clickUrl = data["clickUrl"] as? String,
           let url = URL(string: clickUrl) {
            // Open in SFSafariViewController or system browser
            UIApplication.shared.open(url)
        }
    }

    if type == "event" && name == "close" {
        // User closed the perks view
        dismiss(animated: true)
    }
}
```

## Complete Example

Here is a complete, self-contained view controller:

```swift
import UIKit
import WebKit
import SafariServices

class FalconPerksViewController: UIViewController,
    WKScriptMessageHandler, WKNavigationDelegate {

    private var webView: WKWebView!
    private let apiKey: String
    private let placementId: String

    init(apiKey: String, placementId: String) {
        self.apiKey = apiKey
        self.placementId = placementId
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) { fatalError() }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .white

        // Configure WebView with bridge
        let contentController = WKUserContentController()
        contentController.add(self, name: "iosNativeListener")

        let config = WKWebViewConfiguration()
        config.userContentController = contentController
        config.allowsInlineMediaPlayback = true

        webView = WKWebView(frame: view.bounds, configuration: config)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        webView.navigationDelegate = self
        view.addSubview(webView)

        if #available(iOS 16.4, *) {
            webView.isInspectable = true
        }

        // Load perks
        let sessionId = UUID().uuidString
        let urlString = "https://promo.falconlabs.us/ui/webview"
            + "?placement=\(placementId)"
            + "&apiKey=\(apiKey)"
            + "&sessionId=\(sessionId)"

        if let url = URL(string: urlString) {
            webView.load(URLRequest(url: url))
        }
    }

    // MARK: - WKScriptMessageHandler

    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        guard message.name == "iosNativeListener",
              let body = message.body as? [String: Any],
              let type = body["type"] as? String,
              let name = body["name"] as? String,
              type == "event" else { return }

        let data = body["data"] as? [String: Any]

        switch name {
        case "click":
            if let clickUrl = data?["clickUrl"] as? String,
               let url = URL(string: clickUrl) {
                let safari = SFSafariViewController(url: url)
                present(safari, animated: true)
            }
        case "close":
            dismiss(animated: true)
        default:
            break
        }
    }

    // MARK: - WKNavigationDelegate

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!,
                 withError error: Error) {
        print("WebView error: \(error.localizedDescription)")
    }
}
```

**Usage from your app:**

```swift
let perksVC = FalconPerksViewController(
    apiKey: "YOUR_API_KEY",
    placementId: "YOUR_PLACEMENT_ID"
)
present(perksVC, animated: true)
```

## Presentation Options

You can present the perks view controller however you like:

- **Modal** (full screen): `present(perksVC, animated: true)`
- **Push**: `navigationController?.pushViewController(perksVC, animated: true)`
- **Sheet** (iOS 15+): Set `perksVC.sheetPresentationController` detents
- **Child view controller**: Add as a child VC in a portion of your screen

## SwiftUI

Wrap the view controller in a `UIViewControllerRepresentable`:

```swift
import SwiftUI

struct FalconPerksView: UIViewControllerRepresentable {
    let apiKey: String
    let placementId: String

    func makeUIViewController(context: Context) -> FalconPerksViewController {
        FalconPerksViewController(apiKey: apiKey, placementId: placementId)
    }

    func updateUIViewController(_ uiViewController: FalconPerksViewController,
                                context: Context) {}
}

// Usage in SwiftUI:
// FalconPerksView(apiKey: "YOUR_API_KEY", placementId: "YOUR_PLACEMENT_ID")
```

## Debugging

1. Enable Safari Web Inspector: the code above sets `webView.isInspectable = true` on iOS 16.4+
2. Open Safari on your Mac, go to **Develop** menu, select your simulator/device
3. You can inspect the WebView DOM, console logs, and network requests

## Info.plist (for local development)

If testing against a local development server over HTTP, add this to your `Info.plist`:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsLocalNetworking</key>
    <true/>
</dict>
```
