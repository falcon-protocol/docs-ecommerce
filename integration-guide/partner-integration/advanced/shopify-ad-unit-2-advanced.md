---
title: "Shopify Partner SDK 2.0 Advanced Features"
---

# Shopify Partner SDK 2.0 Advanced Features

Optional features of the [Shopify Ad Unit (2.0)](../shopify-ad-unit-2) that most integrations don't need. The base integration — mounting `FalconOffers`, identifying the shopper, and denying fields with `deny` — is covered in the main guide. Reach for a page here only when the default behaviour isn't what you want.

## Allowlisting shopper fields

By default the unit sends what Shopify gives it, and [`deny`](../shopify-ad-unit-2#denying-shopper-fields) drops the fields you name. An **allowlist** flips that model: you name the only shopper fields Falcon may collect, and everything else is dropped. It's the same filtering, stated the other way round.

- **`deny`** — *everything except these.* Drop the named fields, send the rest.
- **`allow`** — *only these.* Keep the named fields, drop everything else.

Both are optional, both take the same field names, and both filter on the page before anything leaves it. Most partners are well served by `deny`; use `allow` when you'd rather state exactly what you share.

### The `allow` prop

```tsx
<FalconOffers
  publicKey={publicKey}
  placementId={placementId}
  allow={['email', 'country']}
/>
```

`allow` accepts the same fields as `deny`:

| Field                                       | What it is                 |
| ------------------------------------------- | -------------------------- |
| `email`                                     | Shopper email              |
| `phoneNumber`                               | Shopper phone              |
| `customerId`                                | Shopify customer id        |
| `firstName`, `lastName`                     | Shopper name               |
| `billingAddress`                            | Both billing address lines |
| `city`, `billingZipcode`, `shippingZipcode` | City and postal codes      |
| `country`, `provinceCode`                   | Country and region         |

The example above sends the shopper's email and country, and nothing else about the shopper.

### `allow` wins over `deny`

Set both and `allow` is the only one that applies — `deny` is ignored entirely. Pick one model and pass that prop alone; passing both is never what you want.

### Defaults and the empty array

The behaviour turns on which prop you pass, and `allow={[]}` is deliberately distinct from leaving `allow` off:

| What you pass        | What Falcon collects                    |
| -------------------- | --------------------------------------- |
| Neither prop         | Everything Shopify provides.            |
| `deny` only          | Everything except the fields you named. |
| `allow` set          | Only the fields you named.              |
| `allow={[]}` (empty) | No shopper fields at all.               |

Omitting `allow` and passing `allow={[]}` are not the same: an empty array is a deliberate "collect none of the shopper fields," while leaving the prop off falls back to `deny`.

### Why choose an allowlist

The real difference shows up over time. When Falcon adds a new shopper field to the SDK:

- Under **`deny`**, that new field is collected automatically — it reaches you the moment you sync the templates, unless you add it to your deny list.
- Under **`allow`**, that new field is **not** collected until you add it yourself.

So an allowlist is the stricter, no-surprises choice: collection can never widen without a change on your side. A denylist is the lighter-touch default that keeps up with the SDK on its own. Choose based on which of those two behaviours you want.

### What `allow` does not affect

`allow` governs the raw shopper fields only. Two things travel regardless of whether you set it:

- The **order facts** the main guide lists as always-sent (order id, amount, currency, language, and the cart line items). They're what lets the unit run and none of them identify the shopper, so no field list can remove them.
- The **`identity` hashes** (`hashedEmail`, `hashedPhone`). They come from you directly; `allow` and `deny` act on the raw values the unit reads from Shopify, not on the hashes you pass. See [Identifying the shopper](../shopify-ad-unit-2#identifying-the-shopper) for how hashes and raw values combine.

The hashes are sent **only when you pass them**. The SDK computes no hashes itself — the Shopify sandbox has no Web Crypto — so if you leave `hashedEmail` out of `identity`, no email hash is sent, regardless of `allow`. There's nothing to "allow": a hash exists on the request only because you put it there.

This is what makes `allow` and `identity` work together. You can decline to allow the raw `email` and still have Falcon recognise a returning shopper, as long as you pass `hashedEmail` in `identity`. Conversely, if you allow neither the raw `email` nor pass its hash, Falcon receives nothing for that identifier and treats the order as a new shopper.

### Recommended configurations

Two starting points cover most allowlist integrations.

**Full targeting** — allow every shopper field the SDK can collect. This sends the same data as passing no prop at all, but states it explicitly, so you keep the allowlist's guarantee that nothing new is ever collected without a change on your side. Start here if you want the richest offers and the most reliable returning-shopper recognition.

```tsx
<FalconOffers
  publicKey={publicKey}
  placementId={placementId}
  allow={[
    'email',
    'phoneNumber',
    'customerId',
    'firstName',
    'lastName',
    'billingAddress',
    'city',
    'billingZipcode',
    'shippingZipcode',
    'country',
    'provinceCode',
  ]}
/>
```

**Hashed identifiers only** — drop the raw `email` and `phoneNumber` from the allowlist and pass their hashes in `identity` instead. The raw contact details never leave the page, but Falcon still recognises a returning shopper from the hashes, and every other field stays available for targeting.

```tsx
<FalconOffers
  publicKey={publicKey}
  placementId={placementId}
  allow={[
    'customerId',
    'firstName',
    'lastName',
    'billingAddress',
    'city',
    'billingZipcode',
    'shippingZipcode',
    'country',
    'provinceCode',
  ]}
  identity={{
    hashedEmail: sha256(normalizeEmail(email)),
    hashedPhone: sha256(normalizePhone(phone)),
  }}
/>
```

`email` and `phoneNumber` are left out of `allow`, so the unit never reads or sends the raw values; the hashes you pass in `identity` are what carry identity instead. See [Identifying the shopper](../shopify-ad-unit-2#identifying-the-shopper) for the exact normalization and hashing rules your hashes must follow. If you also want to withhold the Shopify `customerId`, drop it from the list too — it has no hashed equivalent, so leaving it out removes it entirely.

### Switching from `deny` to `allow`

If you're already running with `deny`, moving to an allowlist is a one-line swap:

1. List the fields you currently **keep** — everything from the table above that isn't in your `deny` array.
2. Pass those in `allow`.
3. Remove the `deny` prop.

```tsx
// Before — deny everything sensitive, keep the rest
<FalconOffers publicKey={publicKey} placementId={placementId}
  deny={['phoneNumber', 'customerId', 'lastName', 'billingAddress']} />

// After — name only what you send
<FalconOffers publicKey={publicKey} placementId={placementId}
  allow={['email', 'firstName', 'city', 'billingZipcode', 'shippingZipcode', 'country', 'provinceCode']} />
```

Both lists ignore names they don't recognise, so a typo or a retired field name is dropped silently rather than breaking your checkout — but it also means a misspelled field simply won't be collected, so check your list against the table above.
