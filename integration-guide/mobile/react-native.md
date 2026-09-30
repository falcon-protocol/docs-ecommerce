---
title: "React Native / Expo Integration"
---

# React Native / Expo Integration

Display Falcon Perks in a React Native or Expo app using [`react-native-webview`](https://github.com/react-native-webview/react-native-webview). This is the same Falcon page our iOS and Android SDKs render, so you get the same offers and layouts. No native SDK or native module is required, and it works in Expo Go.

## Requirements

- `react-native-webview` (tested with 13.16, the version Expo SDK 57 ships, on React Native 0.86)
- `expo-web-browser` (optional, recommended: opens offers in an in-app browser)
- A Falcon API key and placement ID

## Quick Start

### 1. Install

::: code-group

```bash [Expo]
npx expo install react-native-webview expo-web-browser
```

```bash [React Native CLI]
npm install react-native-webview expo-web-browser
cd ios && pod install
```

:::

::: tip
`expo-web-browser` works in bare React Native apps once [Expo modules](https://docs.expo.dev/bare/installing-expo-modules/) are installed. If you would rather not add it, replace `WebBrowser.openBrowserAsync(url)` below with `Linking.openURL(url)`, which opens the system browser.
:::

### 2. Add the `FalconPlacement` component

Copy this component into your app, for example as `falcon-placement.tsx`:

```tsx
import * as WebBrowser from 'expo-web-browser';
import { useMemo, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { WebView } from 'react-native-webview';

import type { StyleProp, ViewStyle } from 'react-native';
import type {
  ShouldStartLoadRequest,
  WebViewMessageEvent,
} from 'react-native-webview/lib/WebViewTypes';

export type FalconEvent = {
  type: 'event';
  name: 'loaded' | 'resize' | 'viewable' | 'click' | 'close' | 'error' | string;
  data: Record<string, unknown> | null;
};

type Props = {
  apiKey: string;
  placement: string;
  /** Falcon host. Defaults to production. */
  host?: string;
  /** Inline, auto-height unit instead of a full-screen one. */
  embedded?: boolean;
  isSandbox?: boolean;
  /** `at.*` targeting attributes, without the `at.` prefix. */
  attributes?: Record<string, string>;
  style?: StyleProp<ViewStyle>;
  /** Every bridge event, for analytics or logging. */
  onEvent?: (event: FalconEvent) => void;
  /** Every URL handed to the system, for logging. */
  onOpen?: (url: string) => void;
  /** The unit asked to be dismissed (close button or last decline). */
  onClose?: () => void;
};

/** A tap can reach the host twice (see onShouldStartLoadWithRequest); open it once. */
const DUPLICATE_WINDOW_MS = 1000;

function newSessionId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function FalconPlacement({
  apiKey,
  placement,
  host = 'https://pr.falconlabs.us',
  embedded = false,
  isSandbox = false,
  attributes,
  style,
  onEvent,
  onOpen,
  onClose,
}: Props) {
  const [height, setHeight] = useState(0);
  const lastOpened = useRef<{ url: string; at: number } | null>(null);

  // Keyed on the attributes' contents, not the object: an inline `{ email }`
  // is a new object on every render, and a new URL reloads the placement.
  const attributesKey = JSON.stringify(attributes ?? {});

  const uri = useMemo(() => {
    const params = new URLSearchParams({
      apiKey,
      placement,
      sessionId: newSessionId(), // one per placement load
    });
    if (embedded) params.set('mode', 'embedded');
    if (isSandbox) params.set('isSandbox', 'true');
    Object.entries(JSON.parse(attributesKey) as Record<string, string>).forEach(
      ([key, value]) => params.set(`at.${key}`, value),
    );
    return `${host}/ui/webview?${params.toString()}`;
  }, [apiKey, placement, host, embedded, isSandbox, attributesKey]);

  const openExternally = (url: string) => {
    const now = Date.now();
    const last = lastOpened.current;
    if (last && last.url === url && now - last.at < DUPLICATE_WINDOW_MS) return;
    lastOpened.current = { url, at: now };
    onOpen?.(url);

    if (/^https?:/i.test(url)) {
      WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url));
    } else {
      // market://, intent://, itms-apps:// ... from app-install offers
      Linking.openURL(url).catch(() => {});
    }
  };

  const onMessage = (e: WebViewMessageEvent) => {
    let event: FalconEvent;
    try {
      event = JSON.parse(e.nativeEvent.data) as FalconEvent;
    } catch {
      return;
    }
    if (event.type !== 'event') return;
    onEvent?.(event);

    if (event.name === 'resize' && embedded) {
      setHeight(Number(event.data?.height) || 0);
    }
    if (event.name === 'close') onClose?.();
    // `click` is informational: the URL itself arrives through onOpenWindow.
  };

  const onShouldStartLoadWithRequest = (req: ShouldStartLoadRequest) => {
    // Subframes (tracking pixels) and the unit's own pages load normally.
    if (req.isTopFrame === false) return true;
    if (req.url === host || req.url.startsWith(`${host}/`)) return true;
    if (req.url === 'about:blank') return true;
    // Anything else would replace the unit inside your app: send it out
    // instead. On iOS this follows the onOpenWindow for the same tap, which
    // the duplicate check absorbs.
    openExternally(req.url);
    return false;
  };

  return (
    <WebView
      source={{ uri }}
      // Transparent in embedded mode so the unit sits on your screen's background.
      style={[
        embedded ? { height, backgroundColor: 'transparent' } : { flex: 1 },
        style,
      ]}
      incognito
      originWhitelist={['*']}
      onMessage={onMessage}
      onOpenWindow={(e) => openExternally(e.nativeEvent.targetUrl)}
      onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
      scrollEnabled={!embedded}
    />
  );
}
```

### 3. Show a placement

**Inline (embedded).** The unit sizes itself to its content, with a transparent background:

```tsx
import { ScrollView } from 'react-native';
import { FalconPlacement } from './falcon-placement';

export function OrderConfirmationScreen() {
  return (
    <ScrollView>
      {/* ...your screen content... */}
      <FalconPlacement
        apiKey="YOUR_API_KEY"
        placement="YOUR_PLACEMENT_ID"
        embedded
        attributes={{ email: 'user@example.com', orderId: 'ORD-123' }}
      />
    </ScrollView>
  );
}
```

**Full-screen.** For example, in a modal:

```tsx
import { Modal, SafeAreaView } from 'react-native';
import { FalconPlacement } from './falcon-placement';

export function PerksModal({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <SafeAreaView style={{ flex: 1 }}>
        <FalconPlacement
          apiKey="YOUR_API_KEY"
          placement="YOUR_PLACEMENT_ID"
          onClose={onDismiss}
        />
      </SafeAreaView>
    </Modal>
  );
}
```

Pass `isSandbox` while testing, and remove it before you release.

## Events

The Falcon page posts JSON messages to `window.ReactNativeWebView.postMessage`. They arrive in the WebView's `onMessage` handler, which `FalconPlacement` exposes as `onEvent`:

```json
{
  "type": "event",
  "name": "EVENT_NAME",
  "data": { ... }
}
```

| Event | When | Data |
| --- | --- | --- |
| `loaded` | Offers are rendered and visible | `null` |
| `resize` | The unit's content height changed (embedded mode) | `{ "height": 185 }` |
| `viewable` | More than 50% of the unit was on screen for 1 second (embedded mode, fired once) | `null` |
| `click` | The user tapped an offer | `{ "index": 0, "clickUrl": "https://..." }` |
| `close` | The user closed the unit, or declined the last offer | `{ "index": 0, "closeType": ... }` |
| `error` | The placement could not load (embedded mode) | `{ "message": "..." }` |

In embedded mode, `resize` with `{ "height": 0 }` and no `loaded` means there are no offers to show for this user. `FalconPlacement` collapses to zero height, so nothing is left on screen.

## Opening offers

The Falcon page opens offer and legal links with `window.open`. `FalconPlacement` handles that in `onOpenWindow` and opens the URL in an in-app browser. On iOS, the same tap also reaches `onShouldStartLoadWithRequest` a moment later, so the component opens a repeat of the same URL within one second only once.

::: warning Open offers from `onOpenWindow`, not from the `click` event
The `click` event tells you a tap happened (use it for analytics). The URL itself also arrives through `onOpenWindow`, so opening from both would open every offer twice and record two clicks.

Keep the `onOpenWindow` handler. Without it, `react-native-webview` loads offers in a hidden WebView on Android, where the user sees nothing, and in place of the unit on iOS.
:::

`onShouldStartLoadWithRequest` keeps the WebView on the Falcon host. Anything else is handed to the system rather than replacing the unit inside your app. This includes app-install offers that redirect to `market://`, `intent://` or `itms-apps://` links, which `Linking.openURL` sends to the Play Store or App Store.

## Custom Attributes

Pass targeting attributes with the `attributes` prop, without the `at.` prefix. `FalconPlacement` adds them to the URL as `at.*` parameters:

```tsx
<FalconPlacement
  apiKey="YOUR_API_KEY"
  placement="YOUR_PLACEMENT_ID"
  attributes={{
    email: 'user@example.com',
    firstname: 'John',
    orderId: 'ORD-123',
    amount: '99.99',
    country: 'US',
  }}
/>
```

See the [overview](/integration-guide/mobile/overview#custom-attributes) for the full list of supported attributes.

## Debugging

- **iOS:** set `webviewDebuggingEnabled` on the `WebView`, then open Safari > Develop > your device.
- **Android:** set `webviewDebuggingEnabled`, open `chrome://inspect` in Chrome on your computer, and click **inspect** under your app.
- Log `onEvent` and `onOpen` while integrating. One tap on an offer should give exactly one `click` event and one open.
