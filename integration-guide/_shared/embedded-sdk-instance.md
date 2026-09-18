# Embedded SDK — Manual Instance Control (Advanced)

> **Advanced / optional.** Most embedded integrations only need the standard `FalconAds.init()` call described in [Embedded Web Integration](/integration-guide/embedded). Use this page when your page needs to control the ad unit's lifecycle itself — above all, when the same page can be opened more than once and the unit has to be torn down and recreated.

## Overview

`FalconAds.init()` is a wrapper. It creates an ad-unit instance internally, loads offers, shows them, and returns nothing. That is everything a normal page needs, but it means your code never holds the instance, so it cannot hide it, reload it, or tear it down.

The same SDK also exposes the instance directly through `FalconSDK.createEmbeddedPerksInstance()`. You perform the same steps yourself and keep the instance, which gives you `show()`, `hide()`, `destroy()`, and the lifecycle callbacks.

## When to use it

Use manual control when you need to:

- **Re-render the unit on a page the visitor can open more than once** (a single-page app route, a drawer, a tab). Each placement allows one live instance at a time, so the old one must be destroyed before a new one is created.
- Decide yourself when the unit appears, instead of showing it as soon as offers load.
- Hide the unit in response to something on your page.
- Pre-warm the iframe before you know whether you will show offers.

For a plain page that renders the unit once, stay on `FalconAds.init()`.

## Use a different script

Manual control lives in the **Overlay** SDK script, not the Embedded one. The global is `FalconSDK`, not `FalconAds`.

| Environment | Script |
| --- | --- |
| Production | `https://d6y5cd3imay52.cloudfront.net/sdk/v1/falcon-sdk.js` |
| Staging | `https://d6y5cd3imay52.cloudfront.net/sdk/staging/falcon-sdk.js` |

Load one bundle, not both. See [Staging Environment](/integration-guide/partner-integration/staging-environment) for the full URL reference.

## Quick start

```html
<div id="falcon-ads-container"></div>
<script src="https://d6y5cd3imay52.cloudfront.net/sdk/v1/falcon-sdk.js"></script>
<script>
  let instance = null;

  // Once per page load. A second call rejects with `SDK initialized`.
  const falconReady = FalconSDK.init("YOUR_API_KEY");

  async function renderFalconAd() {
    await falconReady;

    // Tear down a previous unit before creating a new one for the same placement.
    if (instance) {
      instance.destroy();
      instance = null;
    }

    instance = FalconSDK.createEmbeddedPerksInstance("YOUR_PLACEMENT_ID", {
      containerElement: "#falcon-ads-container",
      height: "auto",
    });

    try {
      const { isReady } = await instance.loadPerks();

      if (isReady) {
        instance.show();
      }
    } catch (error) {
      console.error("Falcon ad failed to load:", error);
    }
  }

  renderFalconAd().catch((error) => {
    console.error("Falcon ad failed to load:", error);
  });
</script>
```

## Lifecycle

The five steps, in order:

1. **`FalconSDK.init(apiKey)`** — once per page load. A second call rejects with `SDK initialized`.
2. **`createEmbeddedPerksInstance(placementId, options)`** — creates the instance and claims the placement ID.
3. **`await instance.loadPerks()`** — fetches offers. Resolves with `{ isReady }`.
4. **`instance.show()`** — renders the unit. Call it only when `isReady` is `true`.
5. **`instance.destroy()`** — releases the placement ID and removes the unit from the page.

A destroyed instance cannot be restarted. To show the unit again, create a new instance.

`loadPerks()` is also the step you return to. Offers go stale after `hide()` and after they expire, and in both cases `show()` will throw until you load a fresh set.

## API reference

### `FalconSDK.init(apiKey: string): Promise<void>`

Stores your API key for the page. Call it once, before creating any instance. Creating an instance without it throws `SDK not initialized`.

The key is fixed for the life of the page. A second `init()` rejects with `SDK initialized` and changes nothing, so a later call with a **different** key is silently ignored and every instance keeps using the first one. Ignoring that rejection is safe only when the key is the same.

### `FalconSDK.createEmbeddedPerksInstance(placementId, options?)`

Returns an embedded ad-unit instance. Throws `Placement "{id}" already in use` if a live instance already holds that placement ID.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `containerElement` | `HTMLElement` or CSS selector string | `document.body` | Where the unit is mounted. The SDK appends its own wrapper inside this element. |
| `height` | `string` | `"100%"` | CSS height of that wrapper. Pass `"auto"` so it follows the offer's own height, which is what `FalconAds.init()` does. |
| `width` | `string` | `"100%"` | CSS width of that wrapper. |
| `attributes` | `object` | none | Order and customer attributes, using bare keys such as `orderId` and `hashedEmail`. See [Passing Order Attributes](/integration-guide/embedded#passing-order-attributes). |

The container must exist in the DOM by the time you call `loadPerks()`, or `initialize()` if you call that first. If the selector matches nothing, the call rejects with `Embedded mount element not found`.

### Instance methods

| Method | Returns | Description |
| --- | --- | --- |
| `loadPerks()` | `Promise<{ isReady: boolean }>` | Fetches offers. `isReady: false` means there is nothing to show for this visitor. |
| `show()` | `void` | Renders the unit. Requires a completed `loadPerks()` with `isReady: true`. |
| `hide()` | `void` | Takes the unit off the page and ends the current load cycle. The instance stays alive and keeps the placement ID, but `show()` will not work again until you call `loadPerks()` for a fresh set of offers. |
| `destroy()` | `void` | Removes the unit, releases the placement ID, and drops all callbacks. The instance cannot be reused afterwards. |
| `initialize()` | `Promise<void>` | Optional. Creates the iframe early so a later `loadPerks()` is faster. `loadPerks()` calls it for you when you skip it. |

Two notes on `show()`:

- **It can be deferred.** When the placement is configured with a display delay, `show()` schedules the render instead of performing it, so nothing is on screen when the call returns. `hide()` does not cancel a pending render; only `destroy()` does.
- **It is a one-shot per load cycle.** After `hide()`, after `destroy()`, and after the offers expire, `show()` throws `Perks not ready`.

One note on `hide()`: it reports the close to the advertiser, the same as a visitor dismissing the unit. Use it when the unit is genuinely finished, not to park it while your page does something else.

### Callbacks

Each one returns a function that removes the listener.

Register `addReadyCallback` **before** `loadPerks()` — the ready state flips during that call, so a callback added afterwards misses the whole cycle. The other four fire when the unit renders, so registering them any time before `show()` is enough.

| Method | Fires when | Payload |
| --- | --- | --- |
| `addShowCallback(cb)` | Offer rendered (impression), once per offer | `{ index, offer }` |
| `addViewCallback(cb)` | Offer viewable (IAB/MRC: ≥50% for ≥1s), once per offer | `{ index, offer, viewedAt, timeToView, viewabilityMethod }` |
| `addClickCallback(cb)` | Visitor clicks an offer | `{ index, offer }` |
| `addCloseCallback(cb)` | Ad unit closed | `{ offer, closeType }` or `null` |
| `addReadyCallback(cb)` | Ready state changes | `boolean` |

```javascript
const stopListening = instance.addClickCallback((data) => {
  myAnalytics.track("falcon_click", data);
});

// later
stopListening();
```

The close payload is `null` when your own code called `hide()` rather than the visitor dismissing the unit, so there is no offer to name. [Embedded SDK Callbacks](/integration-guide/embedded-sdk-callbacks) says `onClose` always carries a context, and that holds for `FalconAds.init()` because nothing there can call `hide()`. On this page you can, so handle `null`.

## TypeScript

Types for the SDK (add once, e.g. in `falcon-sdk.d.ts`):

```typescript
declare const FalconSDK: {
  init(apiKey: string): Promise<void>;
  createEmbeddedPerksInstance(
    placementId: string,
    options?: {
      containerElement?: HTMLElement | string;
      width?: string;
      height?: string;
      attributes?: Record<string, string | undefined>;
    },
  ): EmbeddedPerksInstance;
};

interface EmbeddedPerksInstance {
  loadPerks(): Promise<{ isReady: boolean }>;
  initialize(): Promise<void>;
  show(): void;
  hide(): void;
  destroy(): void;
  addShowCallback(
    cb: (data: { index: number; offer: unknown }) => void,
  ): () => void;
  addViewCallback(
    cb: (data: {
      index: number;
      offer: unknown;
      viewedAt: number;
      timeToView: number | null;
      viewabilityMethod: string;
    }) => void,
  ): () => void;
  addClickCallback(
    cb: (data: { index: number; offer: unknown }) => void,
  ): () => void;
  addCloseCallback(
    cb: (context: { offer: unknown; closeType: string } | null) => void,
  ): () => void;
  addReadyCallback(cb: (isReady: boolean) => void): () => void;
}
```

## Re-rendering on a re-opened page

This is the case manual control exists for. Destroy the previous instance before creating the next one, and destroy on teardown so leaving the page does not leave the placement claimed.

```jsx
import { useEffect, useRef } from "react";

function FalconAd({ placementId, apiKey }) {
  const containerRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      // Already initialized by an earlier mount, which is fine as long as the
      // key has not changed. The key cannot be swapped after the first call.
      await FalconSDK.init(apiKey).catch(() => {});

      if (cancelled) return;

      const instance = FalconSDK.createEmbeddedPerksInstance(placementId, {
        containerElement: containerRef.current,
        height: "auto",
      });
      instanceRef.current = instance;

      try {
        const { isReady } = await instance.loadPerks();

        // Only act if this instance is still the current one. A later mount
        // may already have replaced it, and destroying it then would release
        // the placement out from under the live instance.
        if (instanceRef.current !== instance) return;

        if (cancelled) {
          instance.destroy();
          instanceRef.current = null;
          return;
        }

        if (isReady) {
          instance.show();
        }
      } catch (error) {
        console.error("Falcon ad failed to load:", error);

        if (instanceRef.current === instance) {
          instance.destroy();
          instanceRef.current = null;
        }
      }
    }

    render();

    return () => {
      cancelled = true;
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, [placementId, apiKey]);

  return <div ref={containerRef} />;
}
```

Three details matter here:

- **`destroy()` in the cleanup.** Without it the placement stays claimed and the next mount throws `Placement "{id}" already in use`.
- **The ownership check after every `await`.** `destroy()` releases the placement ID by name, not by instance, so a late continuation that calls `destroy()` would free the claim held by a newer live instance.
- **`init()` runs once per page.** A second call rejects with `SDK initialized`. Ignoring that is safe here because the key is the same one. It does mean the `apiKey` prop cannot actually be changed after the first render.

## Error reference

The SDK reports invalid operations as errors. Some are thrown synchronously and some arrive as a rejected promise, so wrap `loadPerks()` in `try`/`catch` around the `await` rather than relying on a bare `try` block.

| Error | Raised by | Cause |
| --- | --- | --- |
| `SDK not initialized` | `createEmbeddedPerksInstance()`, thrown | An instance was created before `FalconSDK.init()` |
| `SDK initialized` | `init()`, rejected | `init()` was called a second time. Safe to ignore when the key is unchanged |
| `Placement "{id}" already in use` | `createEmbeddedPerksInstance()`, thrown | A live instance already holds this placement ID. Call `destroy()` on it first |
| `Embedded mount element not found` | `loadPerks()` or `initialize()`, rejected | `containerElement` resolved to nothing when the unit tried to mount |
| `Perks not ready` | `show()`, thrown | `show()` ran before `loadPerks()` finished, or after `hide()`, `destroy()`, or the offers expiring |
| `Perks already shown` | `show()` thrown, `loadPerks()` rejected | Called while the unit is visible |
| `Perks loading` | `loadPerks()`, rejected | `loadPerks()` was called while a previous load is still running |

Calling `loadPerks()` on an instance you already destroyed is not in this list because it does not produce an SDK error. It fails with a `TypeError` about `postMessage` on a removed element. Create a new instance instead.

## Best practices

1. **Keep the instance in a variable you control.** Everything on this page depends on still holding it.
2. **Destroy before you create.** One placement ID can have only one live instance.
3. **Destroy when the page or component goes away.** This is what prevents the `already in use` error on the way back.
4. **Check `isReady` before `show()`.** There is not always an offer for a given visitor.
5. **Register `addReadyCallback` before `loadPerks()`.** The ready state changes during that call.
6. **Call `loadPerks()` again before showing again.** The offers you loaded are spent once the unit is hidden or they expire.
7. **Catch what `loadPerks()` rejects with.** A missing container or a failed handshake surfaces there, and an unhandled rejection leaves your page with a silently empty slot.
