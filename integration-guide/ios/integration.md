# iOS Integration

This page covers the native **FalconSDK** Swift package (recommended). For the
manual WebView integration see the
[iOS WebView guide](/integration-guide/mobile/ios).

## Requirements

- iOS 14.0 or later
- Xcode 16 or later

## Install via Swift Package Manager

1. In Xcode, choose **File > Add Package Dependencies…**
2. Enter the repository URL:
   ```
   https://github.com/falcon-protocol/falcon-ios-sdk.git
   ```
3. Under **Dependency Rule**, select **Up to Next Major Version**.
4. Add the `FalconSDK` library to your app target.

## Initialize

Call `Falcon.initSdk(apiKey:)` once at app launch, before any placement is
executed. The recommended place is `application(_:didFinishLaunchingWithOptions:)`
in your `AppDelegate`.

```swift
import UIKit
import FalconSDK

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        Falcon.initSdk(apiKey: "YOUR_API_KEY")
        return true
    }
}
```

Contact your Falcon Labs account manager to obtain your API key.

## Add an Inline Placement

The `FalconEmbeddedView` is a `UIView` subclass that renders a placement inside
a `WKWebView` and automatically updates its own height constraint to match the
rendered content.

### Storyboard

1. Drag a plain **View** onto your scene.
2. In the **Identity Inspector** set the **Custom Class** to `FalconEmbeddedView`
   and the **Module** to `FalconSDK`.
3. Add **top**, **leading**, and **trailing** constraints to position the view.
4. Add a **height** constraint and set its constant to `0`. The SDK updates this
   constraint automatically once the placement content is rendered.

### Programmatic

```swift
let embeddedView = FalconEmbeddedView()
embeddedView.translatesAutoresizingMaskIntoConstraints = false
view.addSubview(embeddedView)

NSLayoutConstraint.activate([
    embeddedView.topAnchor.constraint(equalTo: someAnchor),
    embeddedView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
    embeddedView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
    embeddedView.heightAnchor.constraint(equalToConstant: 0),
])
```

The height constraint constant starts at `0` and is updated by the SDK when
content loads.

## Execute

Call `Falcon.execute` to load and render a placement. Pass the `FalconEmbeddedView`
you wired up above along with an attributes dictionary describing the user and
the desired placement.

```swift
import UIKit
import FalconSDK

class OrderStatusViewController: UIViewController {

    @IBOutlet weak var embeddedView: FalconEmbeddedView!

    override func viewDidLoad() {
        super.viewDidLoad()

        let attributes: [String: Any] = [
            "user_details": [
                "email": "user@example.com",
                "first_name": "Jane",
                "last_name": "Smith"
            ],
            "placement_details": [
                "layout_id": "APP_NATIVE_ESSENTIAL_0.1",
                "view": "ORDER_STATUS"
            ]
        ]

        Falcon.execute(attributes: attributes, placement: .inline(embeddedView))
    }
}
```

## Sandbox Mode

Pass `isSandbox: true` while developing and testing. Set it to `false` (the
default) before releasing to production.

```swift
Falcon.execute(
    attributes: attributes,
    placement: .inline(embeddedView),
    isSandbox: true   // development only
)
```

## Add an Overlay Placement

An overlay placement presents the Falcon offer as a **full-screen modal that the
SDK presents itself** — there is no view to add to your layout and no
`FalconEmbeddedView` to wire up. Pass `.overlay` as the placement and call
`Falcon.execute` from any action, such as a button tap. The web content owns
dismissal: the modal closes when the user closes the offer.

Callbacks (`onLoad`, `onUnload`, `onError`) and per-placement events
(`.placementInteractive`, `.placementCompleted`, `.placementFailure`) behave
exactly as they do for an inline placement.

### UIKit

Call `Falcon.execute` from a button action (or any other event handler):

```swift
@IBAction func showOffer(_ sender: UIButton) {
    Falcon.execute(
        attributes: attributes,
        placement: .overlay,
        onLoad: {
            print("overlay loaded")
        },
        onUnload: {
            print("overlay dismissed")
        },
        onError: { error in
            print("overlay error: \(error)")
        }
    )
}
```

### SwiftUI

Call `Falcon.execute` inside a button action — no wrapper view is required:

```swift
Button("Show offer") {
    Falcon.execute(
        attributes: attributes,
        placement: .overlay,
        onLoad: { print("overlay loaded") },
        onUnload: { print("overlay dismissed") },
        onError: { error in print("overlay error: \(error)") }
    )
}
```

The SDK locates the frontmost view controller automatically and presents the
full-screen modal. If no presenter is available, `onError` is called with
`FalconError.placementLoadError`.

## Style

Override the visual appearance of a placement by passing a `FalconStyle` value.
All fields are optional; omit a field to keep the placement's built-in default.

| Field | Type | If omitted |
|---|---|---|
| `widgetBackgroundColor` | `UIColor?` | server default (typically `.clear`) |
| `slotBackgroundColor` | `UIColor?` | server default (typically `.white`) |
| `slotPadding` | `Int?` | server default |
| `acceptButtonBackgroundColor` | `UIColor?` | server default (typically `#008363`) |
| `acceptButtonTextColor` | `UIColor?` | server default (typically `.white`) |
| `promoCodeBackgroundColor` | `UIColor?` | server default (typically `#2DA784`) |
| `fontFamily` | `String?` | server default (typically Roboto) |

```swift
let style = FalconStyle(
    widgetBackgroundColor: .clear,
    slotBackgroundColor: .white,
    acceptButtonBackgroundColor: UIColor(red: 0, green: 0.514, blue: 0.388, alpha: 1),
    acceptButtonTextColor: .white,
    promoCodeBackgroundColor: UIColor(red: 0.176, green: 0.655, blue: 0.518, alpha: 1),
    fontFamily: "Roboto"
)

Falcon.execute(
    attributes: attributes,
    placement: .inline(embeddedView),
    style: style
)
```

## Callbacks

All callbacks are dispatched on the **main thread** and are safe to use for UI
updates.

| Callback | Description |
|---|---|
| `onLoad` | Called once when the placement has rendered content. |
| `onUnload` | Called when the placement is removed from the UI. |
| `onError` | Called with a `FalconError` when the placement cannot be shown. |
| `onShouldShowLoadingIndicator` | Called immediately when `execute` begins — show your loading UI now. |
| `onShouldHideLoadingIndicator` | Called once the placement has settled (loaded or determined no-fill) — hide your loading UI. |

```swift
Falcon.execute(
    attributes: attributes,
    placement: .inline(embeddedView),
    onLoad: {
        print("placement loaded")
    },
    onUnload: {
        print("placement unloaded")
    },
    onError: { error in
        print("placement error: \(error)")
    },
    onShouldShowLoadingIndicator: {
        mySpinner.startAnimating()
    },
    onShouldHideLoadingIndicator: {
        mySpinner.stopAnimating()
    }
)
```

### Errors

| Case | Meaning |
|---|---|
| `FalconError.initNotCalled` | `Falcon.execute` was called before `Falcon.initSdk`. |
| `FalconError.placementLoadError` | The placement failed to load from the Falcon backend. |

## Events

Subscribe to lifecycle events for a specific placement via
`Falcon.events(layoutId:handler:)`. Pass the same `layout_id` string you include
in the attributes dictionary.

```swift
Falcon.events(layoutId: "APP_NATIVE_ESSENTIAL_0.1") { event in
    switch event {
    case .placementInteractive:
        print("placement is interactive")
    case .placementCompleted:
        print("placement completed")
    case .placementFailure(let error):
        print("placement failed: \(error)")
    }
}
```

| Event | Description |
|---|---|
| `.placementInteractive` | More than 50% of the placement has been visible on screen for at least 1 second. Fired at most once per `execute` call. |
| `.placementCompleted` | The placement was engaged with and removed from the UI. |
| `.placementFailure(Error)` | The placement failed to load. |

## SwiftUI

`FalconEmbeddedSwiftUIView` is a SwiftUI-native wrapper around
`FalconEmbeddedView`. It sizes itself automatically using the same
height-constraint mechanism.

```swift
import SwiftUI
import FalconSDK

struct OrderStatusView: View {

    let attributes: [String: Any] = [
        "user_details": [
            "email": "user@example.com",
            "first_name": "Jane",
            "last_name": "Smith"
        ],
        "placement_details": [
            "layout_id": "APP_NATIVE_ESSENTIAL_0.1",
            "view": "ORDER_STATUS"
        ]
    ]

    var body: some View {
        VStack {
            FalconEmbeddedSwiftUIView(
                attributes: attributes,
                style: nil,
                onLoad: { print("loaded") },
                onUnload: { print("unloaded") },
                onError: { error in print("error: \(error)") },
                onShouldShowLoadingIndicator: { print("show loading") },
                onShouldHideLoadingIndicator: { print("hide loading") },
                isSandbox: false
            )
        }
    }
}
```

## Configuration

Pass a `FalconConfig` to `Falcon.initSdk(apiKey:config:)` to supply a placement
mapping. Your account manager will provide the mapping values specific to your
integration.

```swift
let config = FalconConfig(
    placementMapping: [
        "ORDER_STATUS": "your-falcon-placement-id"
    ]
)

Falcon.initSdk(apiKey: "YOUR_API_KEY", config: config)
```

The `placementMapping` dictionary maps the `view` (or `layout_id`) values in
your attributes dictionary to Falcon placement identifiers. When no mapping is
provided the raw `view` value is used as the placement id. Keys are looked up
in order: `"<layout_id>/<view>"` → `"<view>"` → `"<layout_id>"` → raw `view`
value as fallback.

## Privacy

FalconSDK 1.1.0 and later ships an Apple privacy manifest
(`PrivacyInfo.xcprivacy`) inside the package. Xcode discovers it automatically
and includes it in your app's privacy report when you archive — no extra setup
is required.

**What the manifest declares:**

| Declaration | Value |
|---|---|
| Tracking (`NSPrivacyTracking`) | `false`. FalconSDK does not link user data from your app with data from other companies' apps or websites, and does not share data with data brokers. |
| Collected data | Email address, name, and purchase history — **only if your app passes them** as attributes to `Falcon.execute`. Each is declared as linked to the user's identity, **not** used for tracking, with the purpose "third-party advertising" (displaying promotional offers). |
| Required-reason APIs | None. The SDK does not use UserDefaults, file timestamps, system uptime, disk space, or keyboard APIs. |

**App Store submission.** In your app's privacy nutrition label, declare email,
name, and purchase history as shared with Falcon only if your integration
actually passes those attributes. No App Tracking Transparency (ATT) prompt is
required for FalconSDK.

## Diagnostics

FalconSDK 1.3.0 and later adds observability so you (and Falcon Labs) can see
**why** a placement failed instead of only a generic error. It works through
three channels. This is purely additive — the existing `onError` callback and
`FalconError` cases are unchanged.

### Host delegate (opt-in)

Set `Falcon.diagnosticsDelegate` once at launch to receive a `FalconDiagnostic`
for every SDK failure. Route it into Sentry, Datadog, or your own logging. The
delegate is unset by default, and setting it changes nothing else about the
SDK's behavior.

```swift
import FalconSDK

class MyDiagnosticsHandler: FalconDiagnosticsDelegate {
    func falconDidEncounter(_ diagnostic: FalconDiagnostic) {
        // diagnostic.code     — FalconDiagnosticCode (granular reason)
        // diagnostic.message  — human-readable description (local only)
        // diagnostic.placement, diagnostic.layoutId — routing context
        MyErrorTracker.capture(diagnostic.code.rawValue)
    }
}

// In your AppDelegate or app init:
Falcon.diagnosticsDelegate = MyDiagnosticsHandler()
```

`FalconDiagnosticCode` cases:

| Code | When |
|---|---|
| `initNotCalled` | `execute` called before `initSdk` |
| `attributeMappingFailed` | attributes did not resolve to a placement |
| `urlConstructionFailed` | the webview URL could not be built |
| `webviewNavigationFailed` | `WKWebView` navigation error |
| `webviewProvisionalNavigationFailed` | `WKWebView` provisional navigation error |
| `bridgeReportedError` | the JS bridge posted an `error` event |
| `noPresenter` | an overlay found no frontmost view controller |

### Error beacons

On failure the SDK also POSTs a small, PII-free diagnostic to Falcon Labs so we
can spot integration issues proactively. Beacons are **on by default**. To
disable them (e.g. for privacy-sensitive environments):

```swift
Falcon.initSdk(
    apiKey: "YOUR_API_KEY",
    config: FalconConfig(diagnosticBeaconsEnabled: false)
)
```

A beacon contains **no user data** — no user attributes, email, API key, or
free-form message text. It carries only:
`{ sdkv, code, placement, layoutId, platform, ts }`. Beacons are
fire-and-forget and silently drop on network failure.

> **Important:** the `placement` and `layoutId` fields come from your
> `placement_details.view` and `placement_details.layout_id`. Because they are
> sent in diagnostics, **do not put user data in `view` or `layout_id`**. (Each
> is capped at 128 characters.)

### System log

Diagnostics are also written to the Apple unified log under subsystem
`us.falconlabs.FalconSDK` (category `diagnostics`). In **Console.app**, filter
by that subsystem to see them. The diagnostic `code` is logged publicly; the
human-readable `message` stays on-device.

## SDK Version

From 1.1.0 the SDK exposes its version as a public constant. Include it in
support requests and diagnostic logs.

```swift
print("FalconSDK \(Falcon.version)")  // e.g. "1.1.0"
```
