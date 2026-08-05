---
title: "Advanced: Custom Attributes"
---

# Advanced: Custom Attributes

`at.pubSub1`, `at.pubSub2`, and `at.pubSub3` are optional, free-form pass-through attributes you can append to the [OData ad-serving request](/integration-guide/publisher-integration/odata-api) (`GET /api/odata`) to capture your own dimensions — the kinds of things you may want to break your traffic down by, or that give Falcon additional signal to help understand and optimize it over time. Typical uses are an audience segment or persona, an affiliate ID, a traffic source, or a campaign ID. You decide what each slot means.

They are **pass-through only.** Falcon does not use them for offer targeting, ranking, or any real-time decisioning on the request, and does not treat them as PII.

## Parameters

- `at.pubSub1` (string, max 100 characters): Opaque, partner-defined custom attribute
- `at.pubSub2` (string, max 100 characters): Opaque, partner-defined custom attribute
- `at.pubSub3` (string, max 100 characters): Opaque, partner-defined custom attribute

## Rules

- **All optional and independent.** Send any subset (for example just `at.pubSub1`), or none.
- **Max 100 characters.** Longer values are silently truncated to 100 characters — they are not rejected.
- **Empty values are ignored.** An empty string is treated as absent; nothing is stored.
- **Use the canonical camelCase name.** The key is case-insensitive (`at.pubSub1`, `at.pubsub1`, and `at.PUBSUB1` all map to the same field), but send the documented `at.pubSub1` form.
- **Only indexes 1, 2, and 3 are recognized.** Other indexes such as `at.pubSub4` are ignored.
- **Send each parameter once, as a single value.** If the same parameter is repeated (parsed as an array), it is ignored.
- **No validation errors.** Oversized, empty, repeated, or out-of-range values never fail the request — they are silently normalized or dropped, and nothing about these parameters can cause a non-2xx response.

## Example Request

```bash
curl -X GET "https://pr-api.falconlabs.us/api/odata?placementId=clx4d5e6f7g8h9i0j1k2l3m4n&sessionId=session_abc123&at.email=customer@example.com&at.orderid=ORDER-12345&at.pubSub1=campaign-42&at.pubSub2=source-fb&at.pubSub3=segment-vip" \
  -H "Authorization: Bearer pub_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
```

Values are opaque strings you choose. URL-encode them like any query parameter (for example, a space becomes `%20`).

## Availability

These attributes are captured with the request for your own segmentation and to give Falcon additional signal. They are **not** exposed through the Reporting API. If you have a dimension you'd like to break traffic down by, talk to your Falcon contact so we can plan for it.
