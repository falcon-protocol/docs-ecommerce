---
title: "File Format Reference"
description: "CSV format for Falcon suppression list files: hashing rules, full lists, diffs, examples, and validation."
---

# File Format Reference

Suppression list files are CSV files of hashed customer emails. This page covers
the hashing rules, the two file types, and how Falcon validates each file.

For where and how to upload files, see
[Sending Your List](/advertisers/suppression-lists/delivery).

## CSV basics

| Rule | Detail |
| --- | --- |
| Format | CSV, comma-delimited. |
| Encoding | UTF-8. A byte order mark (BOM) is fine. |
| Header row | Optional. See [Header row](#header-row). |
| Blank lines | Skipped. |
| Whitespace | Leading and trailing spaces in each cell are trimmed. |
| Quotes | Allowed around values. |
| Extra columns | Ignored. |
| Compression | **Not supported.** Compressed files are never processed. |
| Maximum size | 40 GiB, roughly 500 million hashes. |

## Hashing emails

Column 1 of every row is the SHA-256 hash of the customer's email, as 64
hexadecimal characters:

```text
sha256(lowercase(trim(email)))
```

1. **Trim** leading and trailing whitespace.
2. **Lowercase** the whole address.
3. **Hash** the result with SHA-256, encoded as UTF-8.
4. **Write** the digest as 64 hex characters. Lowercase hex is standard;
   uppercase is accepted.

::: warning Don't normalize emails any further
Don't remove dots from Gmail addresses, strip `+tags`, or apply any other
normalization. Falcon hashes shopper emails with exactly the steps above, so
any extra change stops your hashes from matching.
:::

For example, `Shopper@Example.com` with surrounding spaces becomes `shopper@example.com`, which
hashes to:

```text
a85e9ca18f34935ab9b0381b25bfad2455444112b0149270fd88e3da172fe196
```

### Shell

Hash a single email to check your pipeline against:

```bash
printf '%s' '  Shopper@Example.com ' \
  | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' \
  | tr '[:upper:]' '[:lower:]' \
  | shasum -a 256 \
  | cut -d' ' -f1
# a85e9ca18f34935ab9b0381b25bfad2455444112b0149270fd88e3da172fe196
```

On Linux, `sha256sum` works in place of `shasum -a 256`.

### Python

Turn a file of emails, one per line, into a full list:

```python
import hashlib
import sys


def hash_email(email: str) -> str:
    return hashlib.sha256(email.strip().lower().encode("utf-8")).hexdigest()


# Usage: python hash_emails.py emails.txt > 2026-11-09T1500Z-full.csv
with open(sys.argv[1], encoding="utf-8") as emails:
    for line in emails:
        if line.strip():
            print(hash_email(line))
```

### JavaScript (Node.js)

Turn a file of emails, one per line, into a full list:

```js
const crypto = require("node:crypto");
const fs = require("node:fs");
const readline = require("node:readline");

function hashEmail(email) {
  return crypto
    .createHash("sha256")
    .update(email.trim().toLowerCase(), "utf8")
    .digest("hex");
}

// Usage: node hash-emails.js emails.txt > 2026-11-09T1500Z-full.csv
const lines = readline.createInterface({
  input: fs.createReadStream(process.argv[2], "utf8"),
});
lines.on("line", (line) => {
  if (line.trim()) console.log(hashEmail(line));
});
```

## Header row

A header row is optional. Falcon treats the first row as a header when its first
cell isn't 64 hex characters, and skips it. Every other row is data.

## Full list

A full list is any file whose name ends in `.csv` but not `.diff.csv`.

- One hash per row, in column 1.
- Your list becomes exactly the distinct valid hashes in the file. Duplicates
  are fine.
- **Every hash not in the file is removed from your list.**

Without a header:

```csv
a85e9ca18f34935ab9b0381b25bfad2455444112b0149270fd88e3da172fe196
86e0b9e56c17cc4d12387e1949b85053fbe73bc3ce5a1188713a9d300cc6133d
0789f8247c276dd379e7823e988153dd720955c459a90a7a949209d8874ddcba
```

With a header:

```csv
email_sha256
a85e9ca18f34935ab9b0381b25bfad2455444112b0149270fd88e3da172fe196
86e0b9e56c17cc4d12387e1949b85053fbe73bc3ce5a1188713a9d300cc6133d
0789f8247c276dd379e7823e988153dd720955c459a90a7a949209d8874ddcba
```

::: danger A short full list replaces your whole list
There's no safeguard against a truncated full list. If an export stops halfway
and the file still contains at least one valid row, it replaces your entire
list, and every customer missing from it stops being suppressed. Check the row
count before you upload a full list, and use diffs for incremental changes.
:::

## Diff

A diff is any file whose name ends in `.diff.csv`. It changes individual
hashes and leaves the rest of your list as it is.

- Column 1 is the hash.
- Column 2 is the action: `add` or `remove`. Case doesn't matter.
- Adding a hash that's already on your list, or removing one that isn't, does
  nothing and isn't an error.
- If the same hash appears with both `add` and `remove` in one file, `remove`
  wins.

Without a header:

```csv
22e7ba7a5786d8fb02a3b39893ae2176a995d052f816741a37e747565de7f45d,add
0789f8247c276dd379e7823e988153dd720955c459a90a7a949209d8874ddcba,remove
```

With a header:

```csv
email_sha256,action
22e7ba7a5786d8fb02a3b39893ae2176a995d052f816741a37e747565de7f45d,add
0789f8247c276dd379e7823e988153dd720955c459a90a7a949209d8874ddcba,remove
```

## Validation

Falcon validates each file before applying it. A row is invalid when its hash
isn't 64 hex characters or, in a diff, when its action isn't `add` or `remove`.

| Condition | Result |
| --- | --- |
| Up to 0.1% of rows are invalid | The invalid rows are skipped and the rest of the file is applied. For example, a 1,000,000-row file can have up to 1,000 invalid rows. |
| More than 0.1% of rows are invalid | **The whole file is rejected.** |
| The file has no data rows, for example only a header | **The whole file is rejected.** |
| A full list has no valid rows | **The whole file is rejected.** |
| The file is larger than 40 GiB | **The whole file is rejected.** |
| The file name doesn't end in `.csv`, or the file is zero bytes | The file is ignored and never processed. |

When a file is rejected, **nothing changes**: your list stays exactly as it was.
To fix it, upload a corrected file under a new name and tell your Falcon
contact so they can remove the rejected one. See
[After you upload](/advertisers/suppression-lists/delivery#after-you-upload).
