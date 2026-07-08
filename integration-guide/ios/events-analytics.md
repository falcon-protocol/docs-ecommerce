# Forwarding Events to Analytics

Map FalconSDK's callbacks and events to your product-analytics tool (Mixpanel,
Amplitude, Segment, and similar). There are two kinds of hooks: **callbacks**
you pass to `Falcon.execute(...)` (scoped to that one call), and **events** you
subscribe to with `Falcon.events(layoutId:)` (scoped to a `layout_id`). All of
them fire on the main thread.

::: tip
The callbacks carry no payload (only `onError` receives an `Error`). Attach
analytics properties from your own call-site context — the `layout_id` /
`view` you passed in `placement_details`, plus anything else you track.
:::

## Wiring example

The examples below use Mixpanel; any analytics SDK works the same way.

```swift
Falcon.execute(
    attributes: attributes,
    placement: .inline(embeddedView),
    onLoad: { Mixpanel.track("falcon_placement_loaded", props) },
    onUnload: { Mixpanel.track("falcon_placement_unloaded", props) },
    onError: { error in
        Mixpanel.track("falcon_placement_error",
                       props.merging(["error": "\(error)"]) { $1 })
    },
    onShouldShowLoadingIndicator: { Mixpanel.track("falcon_placement_requested", props) },
    onShouldHideLoadingIndicator: { Mixpanel.track("falcon_placement_settled", props) }
)

Falcon.events(layoutId: layoutId) { event in
    switch event {
    case .placementInteractive:
        Mixpanel.track("falcon_placement_viewable", props)
    case .placementCompleted:
        Mixpanel.track("falcon_placement_completed", props)
    case .placementFailure(let error):
        Mixpanel.track("falcon_placement_failed",
                       props.merging(["error": "\(error)"]) { $1 })
    }
}
```

## Callbacks (per `Falcon.execute` call)

| SDK hook | When it fires | Suggested event | Suggested properties |
|---|---|---|---|
| `onShouldShowLoadingIndicator` | Immediately when `execute` begins, before any network activity | `falcon_placement_requested` | `layout_id`, `view`, `sandbox` |
| `onLoad` | Once, when the placement has rendered content (the web layer signals loaded, or reports a height above 0) | `falcon_placement_loaded` | `layout_id`, `view`, `sandbox` |
| `onShouldHideLoadingIndicator` | Once, when the placement settles: loaded, no offers to show (no-fill), or failed | `falcon_placement_settled` (optional) | `layout_id`, `view`. Tip: "settled without loaded" = no-fill, since no-fill fires neither `onLoad` nor `onError` |
| `onError` | The placement cannot be shown (`initNotCalled` or `placementLoadError`). Note it can also fire after `onLoad` if the web layer reports a late error | `falcon_placement_error` | `layout_id`, `view`, `error` (string) |
| `onUnload` | The placement finished and was removed from the UI. Inline: the unit completed and collapsed. Overlay: the full-screen unit was dismissed | `falcon_placement_unloaded` | `layout_id`, `view`, `placement_type` (`inline` / `overlay`) |

## Events (per `layout_id`, via `Falcon.events`)

| SDK event | When it fires | Suggested event | Suggested properties |
|---|---|---|---|
| `.placementInteractive` | More than 50% of the placement has been visible for at least 1 second. At most once per `execute` | `falcon_placement_viewable` | `layout_id` |
| `.placementCompleted` | The user engaged with the placement and it was removed from the UI (fires together with `onUnload`) | `falcon_placement_completed` | `layout_id` |
| `.placementFailure(Error)` | The placement failed to load (fires together with `onError`) | `falcon_placement_failed` | `layout_id`, `error` (string) |

## There is no `placementClosed` — what to use for a "close" event

Falcon's event stream has **three** cases. There is deliberately no
`placementClosed`:

- **Inline (embedded) unit:** it sits in your layout and cannot be dismissed by
  the user — there is nothing to close, so an ad-closed analytics event has
  **no source** for the inline unit.
- **Overlay (full-screen) unit:** dismissal is observable — it surfaces as
  `onUnload` and `.placementCompleted`. If you want an analytics "close" event
  for the overlay, map it from `onUnload` on your overlay `execute` call.

## Avoiding double counting

Two pairs fire together by design: `onUnload` + `.placementCompleted`, and
`onError` + `.placementFailure`. Forward **one side of each pair** to your
analytics tool (we suggest the events stream for completion/failure, callbacks
for load/settle), or you will count those moments twice.

## Recommended shared properties

Include on every Falcon event you forward: `layout_id`, `view`, `sandbox`
(bool), `sdk_platform: "iOS"`, and your own session/user ids. The SDK version
is available as `Falcon.version` if you want it as a property.
