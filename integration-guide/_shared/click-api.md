## Click API - Recording Ad Clicks

### Overview

The Click API records when a customer clicks a promotional offer and redirects them to the advertiser's destination.

### Endpoint

```text
GET https://pr-api.falconlabs.us/click?...
```

The full URL — including all signed tracking parameters — is returned by the [OData API](./odata-api) as the `clickUrl` field on each offer. **Callers never construct this URL themselves.**

### When to fire

Fire when the customer clicks or taps an offer in your ad unit.

### How to fire

Navigate the user to `clickUrl` and let the client follow the `302` redirect to the advertiser. On the web, the simplest approach is a standard anchor element:

```html
<a :href="offer.clickUrl" target="_blank" rel="noopener noreferrer">Redeem</a>
```

On mobile, open `clickUrl` in the system browser or an in-app browser (e.g., `SFSafariViewController` on iOS, `CustomTabsIntent` on Android) so the redirect is followed.

### Authentication

None. Tracking parameters are signed into the URL itself.

### Response

- **`302 Found`** — redirects to the advertiser destination. Let the client follow the redirect automatically.
