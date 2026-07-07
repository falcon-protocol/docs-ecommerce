# Android Integration

This page covers the native **Falcon Android SDK** (recommended). For the
manual WebView integration see the
[Android WebView guide](/integration-guide/mobile/android).

## Requirements

- `minSdk` 24 (Android 7.0) or above
- The SDK declares `android.permission.INTERNET` in its own manifest; the
  manifest merger adds it to your app automatically.
- Call all `Falcon` methods on the **main thread**; all callbacks are delivered
  on the main thread.

## Install via Gradle

The SDK is published to **Maven Central** (`us.falconlabs:falcon`) — no extra repository
block is needed:

```kotlin
// settings.gradle.kts
dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
    }
}

// app/build.gradle.kts
dependencies {
    implementation("us.falconlabs:falcon:1.1.0")
}
```

::: tip Upgrading from 1.0.0
Versions up to 1.0.0 were served from a raw-URL Maven repo
(`https://raw.githubusercontent.com/falcon-protocol/falcon-android-sdk/main/repo`). That repo
remains available as a byte-identical mirror of Central, so existing builds keep working — but
new integrations should use Maven Central alone.
:::

The SDK's runtime dependencies (`androidx.browser` for Chrome Custom Tabs, and
Compose UI/foundation via the Compose BOM) are resolved transitively — you do
not need to declare them yourself.

To receive release updates, watch the
[falcon-protocol/falcon-android-sdk](https://github.com/falcon-protocol/falcon-android-sdk)
GitHub repository.

## Initialize

Call `Falcon.initSdk` once at application launch, before any placement is
executed. The recommended place is `Application.onCreate`.

```kotlin
import android.app.Application
import us.falconlabs.falcon.Falcon

class MyApp : Application() {
    override fun onCreate() {
        super.onCreate()
        Falcon.initSdk(this, "YOUR_API_KEY")
    }
}
```

Contact your Falcon Labs account manager to obtain your API key.

## Add an Inline Placement

`FalconEmbeddedView` is a `FrameLayout` subclass that renders a placement
inside a WebView and automatically drives its own height to match the rendered
content.

### XML layout

Add `FalconEmbeddedView` to your layout with `layout_height="0dp"` — the SDK
updates the height once the placement content is rendered:

```xml
<us.falconlabs.falcon.FalconEmbeddedView
    android:id="@+id/falcon_view"
    android:layout_width="match_parent"
    android:layout_height="0dp" />
```

In a vertical `LinearLayout`, `layout_height="0dp"` lets the view size itself
to content. In a `ConstraintLayout`, `0dp` means match-constraint: add
`app:layout_constraintTop_toTopOf`, `app:layout_constraintStart_toStartOf`, and
`app:layout_constraintEnd_toEndOf`, and leave `layout_height="0dp"` so the SDK
can drive the height freely.

### Programmatic

```kotlin
import android.widget.LinearLayout
import us.falconlabs.falcon.FalconEmbeddedView

val falconView = FalconEmbeddedView(context)
val lp = LinearLayout.LayoutParams(
    LinearLayout.LayoutParams.MATCH_PARENT,
    0, // height driven by the SDK
)
container.addView(falconView, lp)
```

The height starts at `0` and is updated by the SDK when content loads.

## Execute

Call `Falcon.execute` to load and render a placement. Pass the
`FalconEmbeddedView` you wired up above along with an attributes map describing
the user and the desired placement.

```kotlin
import us.falconlabs.falcon.Falcon
import us.falconlabs.falcon.FalconPlacement

val attributes = mapOf(
    "user_details" to mapOf(
        "email"      to "user@example.com",
        "first_name" to "Jane",
        "last_name"  to "Smith",
    ),
    "placement_details" to mapOf(
        "layout_id" to "APP_NATIVE_ESSENTIAL_0.1",
        "view"      to "ORDER_STATUS",
    ),
)

Falcon.execute(
    attributes = attributes,
    placement  = FalconPlacement.Inline(falconView),
)
```

## Sandbox Mode

Pass `isSandbox = true` while developing and testing. Set it to `false` (the
default) before releasing to production.

```kotlin
Falcon.execute(
    attributes = attributes,
    placement  = FalconPlacement.Inline(falconView),
    isSandbox  = true,   // development only
)
```

## Style

Override the visual appearance of a placement by passing a `FalconStyle` value.
All fields are optional; omit a field to keep the placement's built-in default.

| Field | Type | If omitted |
|---|---|---|
| `widgetBackgroundColor` | ARGB `@ColorInt` | server default (typically transparent) |
| `slotBackgroundColor` | ARGB `@ColorInt` | server default (typically white) |
| `slotPadding` | `Int` | server default |
| `acceptButtonBackgroundColor` | ARGB `@ColorInt` | server default (typically `#008363`) |
| `acceptButtonTextColor` | ARGB `@ColorInt` | server default (typically white) |
| `promoCodeBackgroundColor` | ARGB `@ColorInt` | server default (typically `#2DA784`) |
| `fontFamily` | `String` | server default (typically Roboto) |

Colour values are standard Android ARGB `@ColorInt` integers (as returned by
`Color.parseColor`, `ContextCompat.getColor`, etc.).

```kotlin
import android.graphics.Color
import us.falconlabs.falcon.FalconStyle

Falcon.execute(
    attributes = attributes,
    placement  = FalconPlacement.Inline(falconView),
    style = FalconStyle(
        widgetBackgroundColor       = 0x00000000.toInt(), // transparent
        slotBackgroundColor         = 0xFFFFFFFF.toInt(), // white
        acceptButtonBackgroundColor = Color.parseColor("#008363"),
        acceptButtonTextColor       = 0xFFFFFFFF.toInt(), // white
        promoCodeBackgroundColor    = Color.parseColor("#2DA784"),
        fontFamily                  = "Roboto",
    ),
)
```

## Callbacks

All callbacks are dispatched on the **main thread** and are safe to use for UI
updates.

| Callback | Description |
|---|---|
| `onLoad` | Called once when the placement has rendered content. |
| `onUnload` | Called when the placement is removed from the UI. |
| `onError` | Called with an `Exception` when the placement cannot be shown. |
| `onShouldShowLoadingIndicator` | Called when the placement begins loading — show your loading UI now. |
| `onShouldHideLoadingIndicator` | Called once the placement has settled (loaded or determined no-fill) — hide your loading UI. |

```kotlin
Falcon.execute(
    attributes = attributes,
    placement  = FalconPlacement.Inline(falconView),
    onLoad = {
        println("placement loaded")
    },
    onUnload = {
        println("placement unloaded")
    },
    onError = { error ->
        println("placement error: $error")
    },
    onShouldShowLoadingIndicator = {
        loadingSpinner.visibility = View.VISIBLE
    },
    onShouldHideLoadingIndicator = {
        loadingSpinner.visibility = View.GONE
    },
)
```

**No-fill behaviour:** when there are no offers to show, the view stays
collapsed at height 0, `onShouldHideLoadingIndicator` is called, and neither
`onLoad` nor `onError` fires.

### Errors

| Case | Meaning |
|---|---|
| `FalconError.InitNotCalled` | `Falcon.execute` was called before `Falcon.initSdk`. |
| `FalconError.PlacementLoadError` | The placement failed to load from the Falcon backend. |

## Events

Subscribe to lifecycle events for a specific placement via `Falcon.events`.
Pass the same `layout_id` string you include in the attributes map.

```kotlin
import us.falconlabs.falcon.Falcon
import us.falconlabs.falcon.FalconEvent

Falcon.events("APP_NATIVE_ESSENTIAL_0.1") { event ->
    when (event) {
        is FalconEvent.PlacementInteractive -> println("placement is interactive")
        is FalconEvent.PlacementCompleted   -> println("placement completed")
        is FalconEvent.PlacementFailure     -> println("placement failed: ${event.error}")
    }
}
```

| Event | Description |
|---|---|
| `PlacementInteractive` | More than 50% of the placement has been visible on screen for at least 1 second. Fired at most once per `execute` call. |
| `PlacementCompleted` | The placement was engaged with and removed from the UI. |
| `PlacementFailure` | The placement failed to load; inspect `event.error` for details. |

Remove the handler when your component is destroyed — handlers retain whatever
they capture (often an Activity) until removed or overwritten:

```kotlin
override fun onDestroy() {
    Falcon.removeEventsHandler("APP_NATIVE_ESSENTIAL_0.1")
    super.onDestroy()
}
```

## Jetpack Compose

`FalconEmbedded` is a composable wrapper around `FalconEmbeddedView`. It sizes
itself automatically using the same height mechanism, and its parameters mirror
`Falcon.execute`.

```kotlin
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import us.falconlabs.falcon.FalconEmbedded

@Composable
fun OrderConfirmationScreen() {
    Column {
        FalconEmbedded(
            attributes = mapOf(
                "user_details" to mapOf(
                    "email"      to "user@example.com",
                    "first_name" to "Jane",
                    "last_name"  to "Smith",
                ),
                "placement_details" to mapOf(
                    "layout_id" to "APP_NATIVE_ESSENTIAL_0.1",
                    "view"      to "ORDER_STATUS",
                ),
            ),
            onLoad    = { println("loaded") },
            onUnload  = { println("unloaded") },
            onError   = { error -> println("error: $error") },
            isSandbox = false,
        )
    }
}
```

Attribute changes after first composition are intentionally ignored. To force a
fresh placement load when attributes change, wrap the composable in `key(...)`
and change the key.

## Configuration

Pass a `FalconConfig` to `Falcon.initSdk` to supply a placement mapping. Your
account manager will provide the mapping values specific to your integration.

```kotlin
import us.falconlabs.falcon.Falcon
import us.falconlabs.falcon.FalconConfig

Falcon.initSdk(
    context = this,
    apiKey  = "YOUR_API_KEY",
    config  = FalconConfig(
        placementMapping = mapOf(
            "ORDER_STATUS" to "your-falcon-placement-id",
        ),
    ),
)
```

The `placementMapping` map resolves the `view` (or `layout_id`) values in your
attributes map to Falcon placement identifiers. When no mapping is provided the
raw `view` value is used as the placement id. Keys are looked up in order:
`"<layout_id>/<view>"` → `"<view>"` → `"<layout_id>"` → raw `view` value as
fallback.

## Notes

- **Link handling:** user taps on placement links open in Chrome Custom Tabs;
  other URL schemes are dispatched as deep links. Clicks are honored only
  within a short window after a genuine user touch on the ad view.
- **Reserved JS interface:** the JavaScript interface name `Android` is used by
  the SDK's bridge inside the placement WebView. Do not register a JavaScript
  interface with this name on the same WebView.
- **R8/ProGuard:** no configuration needed — the AAR ships a consumer rule that
  keeps the SDK's JS-interface methods.
