---
title: "Sending Your List"
description: "How to upload suppression list files to Falcon's S3 bucket: credentials, upload location, file naming, and what happens after you upload."
---

# Sending Your List

You deliver suppression list files by uploading them to an Amazon S3 location
that Falcon sets up for you. This page covers the credentials, where to upload,
how to name your files, and what happens after you upload.

For what goes inside the files, see the
[File Format Reference](/advertisers/suppression-lists/file-format).

## What Falcon gives you

| Item | Description |
| --- | --- |
| `<BUCKET>` | The name of the S3 bucket you upload to. |
| `<ADVERTISER_ID>` | Your Falcon advertiser ID. It's part of your upload path. |
| Region | `us-east-2` |
| Credentials | One of the two options under [Credentials](#credentials). |

## Upload location

Upload every file to:

```text
s3://<BUCKET>/suppression/<ADVERTISER_ID>/incoming/<file>.csv
```

Falcon only picks up files directly under your `incoming/` folder.

## Credentials

Falcon issues credentials that can upload to your `incoming/` folder and
nothing else. Choose one of these options with Falcon during onboarding.

### Option 1: Access key pair

Falcon gives you an AWS access key ID and secret access key. Store them in an
AWS CLI profile:

```bash
aws configure --profile falcon-suppression
# AWS Access Key ID:     <ACCESS_KEY_ID>
# AWS Secret Access Key: <SECRET_ACCESS_KEY>
# Default region name:   us-east-2
```

### Option 2: Role assumption (your own AWS account)

If you have your own AWS account, Falcon gives you a role ARN and an external
ID. Your AWS identity assumes that role to upload. With the AWS CLI, add a
profile to `~/.aws/config`:

```ini
[profile falcon-suppression]
role_arn = <ROLE_ARN>
external_id = <EXTERNAL_ID>
source_profile = default
region = us-east-2
```

Set `source_profile` to the profile that holds your own AWS credentials. Tell
Falcon which AWS account or IAM principal will assume the role.

### What the credentials can do

Your credentials can **upload files** to your `incoming/` folder. They can't
list, download, or delete files. This means:

- You can't check whether a file has been processed. Ask your Falcon contact.
- You can't remove a file after you upload it. Ask your Falcon contact.
- Commands such as `aws s3 ls` on the bucket return an access-denied error.
  This is expected.

## Uploading a file

```bash
aws s3 cp 2026-11-09T1500Z-full.csv \
  s3://<BUCKET>/suppression/<ADVERTISER_ID>/incoming/2026-11-09T1500Z-full.csv \
  --profile falcon-suppression
```

Any tool that can write to S3 works, including the AWS SDKs. Upload the file
as-is: **don't compress it**. See [File names](#file-names) for why.

## File names

### Use a new name for every upload

Files are never overwritten. Give every upload a new, unique name.

### Name files so they sort in the order you want them applied

Falcon processes the files in your `incoming/` folder in **alphabetical order
of their names**. If you send a full list and then diffs, the names must sort so
that the full list comes first.

Start each name with a UTC timestamp in a fixed-width format:

```text
2026-11-09T1500Z-full.csv
2026-11-10T0900Z.diff.csv
2026-11-11T0900Z.diff.csv
```

### The extension decides how the file is read

| Name ends in | Treated as |
| --- | --- |
| `.diff.csv` | A diff: adds and removes individual hashes. |
| `.csv` (anything else) | A full list: replaces your whole list. |
| Anything else, such as `.csv.gz`, `.zip`, or `.txt` | **Ignored.** The file is never processed. |

Use a lowercase `.csv` extension. Compressed files aren't supported and are
skipped without an error. Empty (zero-byte) files are skipped too.

### Resending is safe

If you upload a file with exactly the same content as one already processed,
Falcon detects it and skips it. You can safely resend a file.

## After you upload

- **Processing.** Falcon checks for new files every 4 hours and applies each
  file in the run that picks it up.
- **Rejected files.** If a file fails validation, Falcon rejects the whole file
  and your list doesn't change. See
  [Validation](/advertisers/suppression-lists/file-format#validation) for the
  rules. To fix a rejected file:
  1. Upload a corrected file under a **new name**.
  2. Tell your Falcon contact, so they can remove the rejected file.

  A rejected file is retried on every run until Falcon removes it.

## Recommended schedule

- Start with one full list.
- Then send a **weekly full list** or **daily diffs**.
- Send something at least **monthly**. Falcon flags lists that haven't had a
  successful delivery in 30 days.
