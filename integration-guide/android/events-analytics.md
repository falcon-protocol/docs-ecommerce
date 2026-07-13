# Forwarding Events to Analytics

Map the Falcon Android SDK's callbacks and events to your product-analytics
tool (Mixpanel, Amplitude, Segment, and similar). There are two kinds of hooks:
**callbacks** you pass to `Falcon.execute(...)` (scoped to that one call), and
**events** you subscribe to with `Falcon.events(layoutId)` (scoped to a
`layout_id`). All of them fire on the main thread.

::: tip
The callbacks carry no payload (only `onError` receives an `Exception`). Attach
analytics properties from your own call-site context — the `layout_id` /
`view` you passed in `placement_details`, plus anything else you track.
:::

## Wiring example

The examples below use Mixpanel; any analytics SDK works the same way.

```kotlin
Falcon.execute(
    attributes = attributes,
    placement  = FalconPlacement.Inline(falconView),
    onLoad     = { mixpanel.track("falcon_placement_loaded", props) },
    onUnload   = { mixpanel.track("falcon_placement_unloaded", props) },
    onError    = { error ->
        mixpanel.track("falcon_placement_error", props + ("error" to error.toString()))
    },
    onShouldShowLoadingIndicator = { mixpanel.track("falcon_placement_requested", props) },
    onShouldHideLoadingIndicator = { mixpanel.track("falcon_placement_settled", props) },
)

Falcon.events(layoutId) { event ->
    when (event) {
        is FalconEvent.PlacementInteractive ->
            mixpanel.track("falcon_placement_viewable", props)
        is FalconEvent.PlacementCompleted ->
            mixpanel.track("falcon_placement_completed", props)
        is FalconEvent.PlacementFailure ->
            mixpanel.track("falcon_placement_failed", props + ("error" to event.error.toString()))
    }
}
```

## Callbacks (per `Falcon.execute` call)

| SDK hook | When it fires | Suggested event | Suggested properties |
|---|---|---|---|
| `onShouldShowLoadingIndicator` | Immediately when `execute` begins, before any network activity | `falcon_placement_requested` | `layout_id`, `view`, `sandbox` |
| `onLoad` | Once, when the placement has rendered content (the web layer signals loaded, or reports a height above 0) | `falcon_placement_loaded` | `layout_id`, `view`, `sandbox` |
| `onShouldHideLoadingIndicator` | Once, when the placement settles: loaded, no offers to show (no-fill), or failed | `falcon_placement_settled` (optional) | `layout_id`, `view`. Tip: "settled without loaded" = no-fill, since no-fill fires neither `onLoad` nor `onError` |
| `onError` | The placement cannot be shown (`InitNotCalled` or `PlacementLoadError`). At most once per `execute` call; note it can also fire after `onLoad` if the web layer reports a late error | `falcon_placement_error` | `layout_id`, `view`, `error` (string) |
| `onUnload` | The placement finished and was removed from the UI: the inline unit completed and collapsed | `falcon_placement_unloaded` | `layout_id`, `view` |

## Events (per `layout_id`, via `Falcon.events`)

| SDK event | When it fires | Suggested event | Suggested properties |
|---|---|---|---|
| `PlacementInteractive` | More than 50% of the placement has been visible for at least 1 second. At most once per `execute` | `falcon_placement_viewable` | `layout_id` |
| `PlacementCompleted` | The user engaged with the placement and it was removed from the UI (fires together with `onUnload`) | `falcon_placement_completed` | `layout_id` |
| `PlacementFailure` | The placement failed to load; carries the error (fires together with `onError`) | `falcon_placement_failed` | `layout_id`, `error` (string) |

## There is no `PlacementClosed` — what to use for a "close" event

Falcon's event stream has **three** cases. There is deliberately no
`PlacementClosed`:

- **Inline (embedded) unit:** it sits in your layout and cannot be dismissed by
  the user — there is nothing to close, so an ad-closed analytics event has
  **no source** for the inline unit. The user simply scrolls past it.
- **Overlay (full-screen) unit:** available on iOS today and planned for the
  Android SDK. Its dismissal is observable — it surfaces as `onUnload` and
  `PlacementCompleted`. When the overlay reaches Android, map an analytics
  "close" event from `onUnload` on your overlay `execute` call.

## Avoiding double counting

Two pairs fire together by design: `onUnload` + `PlacementCompleted`, and
`onError` + `PlacementFailure`. Forward **one side of each pair** to your
analytics tool (we suggest the events stream for completion/failure, callbacks
for load/settle), or you will count those moments twice.

## Recommended shared properties

Include on every Falcon event you forward: `layout_id`, `view`, `sandbox`
(bool), `sdk_platform: "Android"`, and your own session/user ids. For the SDK
version, forward the dependency version you ship
(`us.falconlabs:falcon:<version>`).
