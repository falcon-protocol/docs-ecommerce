---
title: "Suppression Lists"
description: "Send Falcon a hashed list of your existing customers so your campaigns stop being shown to them."
---

# Suppression Lists

A **suppression list** tells Falcon which shoppers are already your customers,
so your campaigns stop being shown to them. You send Falcon SHA-256 hashes of
your customers' email addresses, and Falcon stops serving your campaigns to any
shopper whose email matches one of those hashes.

::: tip What you will learn on this page

- What a suppression list does and what it covers
- How the setup and delivery process works
- How Falcon protects the data you send
:::

## What a suppression list does

- **It applies to all of your campaigns.** Suppression is per advertiser, not
  per campaign. A shopper on your list doesn't see any of your campaigns on the
  Falcon ads network.
- **It matches on email.** When a publisher includes the shopper's email on an
  ad request, Falcon hashes it the same way you do and checks it against your
  list. Shoppers who aren't identified by email on the request can't be
  matched, so they aren't suppressed.
- **You control the contents.** You can replace the whole list or send
  incremental changes that add and remove customers. See
  [Full lists and diffs](#full-lists-and-diffs).

## How it works

1. **Falcon sets you up.** You receive your advertiser ID, an upload location in
   Amazon S3, and credentials that can write to it.
2. **You upload CSV files.** Each file holds SHA-256 hashes of customer emails.
   See [Sending Your List](/advertisers/suppression-lists/delivery) and the
   [File Format Reference](/advertisers/suppression-lists/file-format).
3. **Falcon processes them.** Falcon checks for new files every 4 hours. Each
   file is validated and applied to ad serving in the run that picks it up.

## Full lists and diffs

You can send two kinds of file:

| Type | File name ends in | Effect |
| --- | --- | --- |
| **Full list** | `.csv` | Replaces your list. Your list becomes exactly the hashes in the file, and **every hash not in the file is removed**. |
| **Diff** | `.diff.csv` | Adds or removes individual hashes. Everything else on your list stays as it is. |

A common pattern is a full list to start, followed by a weekly full list or
daily diffs.

::: warning A full list always replaces your whole list
If a full list is cut short (for example, an export that stopped halfway), the
shorter list still replaces your existing one, and every customer missing from
the file stops being suppressed. Check the row count of a full list before you
upload it, and use diffs for day-to-day changes.
:::

## Timing and freshness

- **Processing cadence.** Falcon checks for new files every 4 hours. A file is
  applied to ad serving in the same run that picks it up. Removals take effect
  on the same schedule as additions.
- **Keep your list fresh.** Falcon flags lists that haven't had a successful
  delivery in 30 days. Send an update at least monthly. A weekly full list or
  daily diffs works well for most advertisers.

## Privacy and security

- **Hashed before it leaves you.** You send SHA-256 hashes, never plain email
  addresses.
- **Never stored as delivered.** Falcon converts each hash into a keyed HMAC
  before storing it. The hashes you send are never stored or transmitted in
  their original form, and the ad-serving system can't reverse the stored
  values.
- **Isolated upload location.** The upload bucket blocks public access and
  encrypts files at rest with server-side encryption (SSE-S3, AES-256). Each
  advertiser's upload location is isolated from every other advertiser's, and
  your credentials can only write to your own location.

For how Falcon handles personal data more generally, see the
[Privacy Policy](/terms/privacy).

## Coverage limits

- **Identified shoppers only.** Suppression only applies when the shopper's
  email is included on the ad request.
- **EU and UK shoppers.** Shoppers in the EU and UK are never suppressed,
  because Falcon removes their identifiers before matching in line with GDPR.
- **Best effort.** If a suppression lookup can't complete, Falcon shows the ad
  rather than blocking it.

## Stopping suppression

To stop suppressing customers, ask your Falcon contact to remove your list.
Falcon stops processing your uploads and deletes your list, and suppression
ends.

Stopping your uploads is **not** enough. Your existing list keeps suppressing
customers until Falcon removes it.

## Next steps

- [Sending Your List](/advertisers/suppression-lists/delivery): credentials,
  upload location, and file naming.
- [File Format Reference](/advertisers/suppression-lists/file-format): CSV
  format, hashing, examples, and validation rules.
