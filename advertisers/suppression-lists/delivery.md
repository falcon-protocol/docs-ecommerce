---
title: "Sending Your List"
description: "How to upload suppression list files to Falcon's S3 bucket: upload location, access setup from your AWS account, file naming, and troubleshooting."
---

# Sending Your List

You deliver suppression list files by uploading them to an Amazon S3 location
that Falcon sets up for you. This page covers where to upload, how to set up
access from your AWS account, how to name your files, and what happens after you
upload.

For what goes inside the files, see the
[File Format Reference](/advertisers/suppression-lists/file-format).

## Upload location

Upload every file to:

```text
s3://<BUCKET>/suppression/<ADVERTISER_ID>/incoming/<file>.csv
```

Upload files directly under your `incoming/` folder. Don't create subfolders.

Falcon deletes uploaded files from the bucket shortly after upload, whether or
not they've been processed. The bucket isn't a backup: keep your own copy of
every file you send.

## Setting up access

You upload from your own AWS account. Falcon creates an IAM role for you in
Falcon's AWS account, and an identity in your account assumes that role to
upload. You manage that identity yourself: its users, credential rotation, and
who has access. Falcon never issues you long-lived access keys.

### Step 1: Create an uploader identity in your AWS account

Create a dedicated IAM role for uploads, for example
`falcon-suppression-uploader`, and run your export job or pipeline as that
role. An IAM user also works.

::: warning Don't name your whole account
Avoid giving Falcon your account root ARN
(`arn:aws:iam::<ACCOUNT_ID>:root`). That lets anyone in your account with
`sts:AssumeRole` permission upload to your list.
:::

Cross-account access has to be allowed on both sides, so your uploader identity
needs permission in your account to assume Falcon's role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": "<ROLE_ARN>"
    }
  ]
}
```

You can add this policy after Step 3, once you have `<ROLE_ARN>`.

### Step 2: Send Falcon the ARN of your uploader identity

Send your Falcon contact the ARN of the identity from Step 1, for example:

```text
arn:aws:iam::111122223333:role/falcon-suppression-uploader
```

An AWS account ID and an ARN aren't secret, so email is fine.

Falcon's role trusts only this exact identity. If you later delete and recreate
it, or want to upload from a different identity, tell Falcon first. See
[Troubleshooting](#troubleshooting).

### Step 3: Receive your access details from Falcon

| Item | Description |
| --- | --- |
| `<ROLE_ARN>` | The Falcon role your identity assumes. |
| `<EXTERNAL_ID>` | Must be passed on every assume-role call. Treat it as confidential. Falcon sends it over a secure channel, not plain email or Slack. |
| `<BUCKET>` | The name of the S3 bucket you upload to. |
| Region | `us-east-2` |
| `<ADVERTISER_ID>` | Your Falcon advertiser ID. It's part of your upload path. |

### Step 4: Configure your tools

With the AWS CLI, add a profile to `~/.aws/config`:

```ini
[profile falcon-suppression]
role_arn = <ROLE_ARN>
external_id = <EXTERNAL_ID>
source_profile = <YOUR_PROFILE>
region = us-east-2
```

Set `source_profile` to the profile that holds credentials for your uploader
identity from Step 1. If your code already runs on AWS as that role, replace
`source_profile` with `credential_source`:

| Where your code runs | Setting |
| --- | --- |
| Amazon EC2 | `credential_source = Ec2InstanceMetadata` |
| Amazon ECS | `credential_source = EcsContainer` |
| AWS Lambda | `credential_source = Environment` |

Then upload with the profile:

```bash
aws s3 cp 2026-11-09T1500Z-full.csv \
  s3://<BUCKET>/suppression/<ADVERTISER_ID>/incoming/2026-11-09T1500Z-full.csv \
  --profile falcon-suppression
```

Upload each file with `aws s3 cp`. `aws s3 sync` doesn't work, because it needs
to list the bucket.

#### Python (boto3)

boto3 reads the same profile, assumes the role with your external ID, and
refreshes the session automatically:

```python
import boto3

s3 = boto3.Session(profile_name="falcon-suppression").client("s3")

s3.upload_file(
    "2026-11-09T1500Z-full.csv",
    "<BUCKET>",
    "suppression/<ADVERTISER_ID>/incoming/2026-11-09T1500Z-full.csv",
)
```

Assume-role sessions last 1 hour, and a large upload can take longer. Use a
profile or another refreshing credential provider like the example above,
rather than calling `assume_role` once and reusing the keys it returns.

Upload each file as-is: **don't compress it**, and don't set encryption or ACL
options. See [File names](#file-names) and [Troubleshooting](#troubleshooting).

### Step 5: Send a test upload

Upload a small test file and tell your Falcon contact its name. Falcon confirms
that it arrived.

Make the test file a diff, with a header row and a few `add` rows for real
customer hashes, for example `2026-11-24T1200Z-test.diff.csv`. See
[Diff](/advertisers/suppression-lists/file-format#diff) for the format.

::: warning Don't send a test as a full list
A test file whose name ends in `.csv` but not `.diff.csv` is a full list, and it
replaces your whole list with the few hashes it contains.
:::

### What your access allows

Your role can **upload files** to your `incoming/` folder and nothing else. It
can't list, download, or delete files, and it can't write anywhere else in the
bucket. This means:

- You can't check whether a file has been processed. Ask your Falcon contact.
- You can't remove a file after you upload it. Ask your Falcon contact.
- Commands such as `aws s3 ls` on the bucket return `AccessDenied`. This is
  expected.

## File names

### Use a new name for every upload

Give every upload a new, unique name. Uploading to a name that's already in
use replaces that file.

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

## Troubleshooting

| Problem | Cause and fix |
| --- | --- |
| `AccessDenied` when assuming the role | Check three things: the external ID is correct; the calling identity is the exact ARN you sent Falcon; and your own account grants that identity `sts:AssumeRole` on `<ROLE_ARN>` ([Step 1](#step-1-create-an-uploader-identity-in-your-aws-account)). |
| Assume-role stopped working after you recreated your uploader role | Falcon's trust is tied to the original role, even if the new one has the same name. Tell your Falcon contact so they can update it. Do the same before switching to a different identity. |
| Assume-role fails when the call includes session tags or a source identity | Falcon's role doesn't allow either, so don't pass them. Some AWS IAM Identity Center (SSO) setups add a source identity automatically. If assume-role fails only from those sessions, use the dedicated uploader role from Step 1. |
| Upload fails when setting encryption or ACL options | Don't pass options such as `--sse aws:kms`, `--sse-c`, or `--acl public-read`. The bucket encrypts every file automatically, uploads with KMS or customer-provided keys are rejected, and ACLs are disabled. |
| `aws s3 sync` fails | `sync` needs to list the bucket, which your role can't do. Upload each file with `aws s3 cp`. |
| `AccessDenied` on upload | Usually the path. Upload under exactly `suppression/<ADVERTISER_ID>/incoming/`. |
| `aws s3 ls` returns `AccessDenied` | Expected. Your role can only upload. |
