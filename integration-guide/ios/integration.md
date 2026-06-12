# iOS Integration

## Requirements

- iOS 14.0 or later
- Xcode 16 or later

## Install via Swift Package Manager

1. In Xcode, choose **File > Add Package Dependencies…**
2. Enter the repository URL:
   ```
   https://github.com/falcon-labs/falcon-ios-sdk.git
   ```
3. Under **Dependency Rule**, select **Up to Next Major Version**.
4. Add the `Falcon` library to your app target.

## Initialize

Call `Falcon.initSdk(apiKey:)` once at app launch, before any placement is
executed. The recommended place is `application(_:didFinishLaunchingWithOptions:)`
in your `AppDelegate`.

```swift
import UIKit
import Falcon

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
   and the **Module** to `Falcon`.
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
import Falcon

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

## Style

Override the visual appearance of a placement by passing a `FalconStyle` value.
All fields are optional; omit a field to keep the placement's built-in default.

| Field | Type | Default |
|---|---|---|
| `widgetBackgroundColor` | `UIColor?` | `.clear` |
| `slotBackgroundColor` | `UIColor?` | `.white` |
| `slotPadding` | `Int?` | — |
| `acceptButtonBackgroundColor` | `UIColor?` | `#008363` |
| `acceptButtonTextColor` | `UIColor?` | `.white` |
| `promoCodeBackgroundColor` | `UIColor?` | `#2DA784` |
| `fontFamily` | `String?` | Roboto |

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
| `onLoad` | Called once when the placement has rendered content and become visible. |
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
import Falcon

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
                config: FalconConfig(),
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
provided the raw `view` value is used as the placement id.
