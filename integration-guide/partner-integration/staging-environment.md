---
title: "Staging Environment"
---

## Staging Environment

### Environment URLs

- **Staging**: `https://staging-pr-api.falconlabs.us`
- **Production**: `https://pr-api.falconlabs.us`

> Critical: All development and testing MUST happen on the staging environment to avoid polluting production metrics. Never test with production URLs during development.

### Service API Keys

- **Staging Service API Key**: Provided separately by Falcon integration team
- **Production Service API Key**: Provided after successful staging integration review

Contact the Falcon integration team to receive your staging credentials before beginning development.

### Web SDK Script URLs

If you're using one of the Web SDKs ([Overlay](/integration-guide/overlay), [Embedded](/integration-guide/embedded), [Unified](/integration-guide/unified), [Google Ad Manager](/integration-guide/gam)) rather than calling OData directly, load the staging build while testing:

| SDK | Production | Staging |
| --- | --- | --- |
| Overlay | `https://d6y5cd3imay52.cloudfront.net/sdk/v1/falcon-sdk.js` | `https://d6y5cd3imay52.cloudfront.net/sdk/staging/falcon-sdk.js` |
| Embedded | `https://d6y5cd3imay52.cloudfront.net/sdk/v1/embedded-sdk.js` | `https://d6y5cd3imay52.cloudfront.net/sdk/staging/embedded-sdk.js` |
| Unified | `https://d6y5cd3imay52.cloudfront.net/sdk/v1/unified-sdk.js` | `https://d6y5cd3imay52.cloudfront.net/sdk/staging/unified-sdk.js` |
| Google Ad Manager | `https://d6y5cd3imay52.cloudfront.net/sdk/v1/falcon-gam-sdk.js` | `https://d6y5cd3imay52.cloudfront.net/sdk/staging/falcon-gam-sdk.js` |

> The Overlay SDK also has a legacy raw-S3 link (`https://falconlabs.s3.us-east-2.amazonaws.com/sdk/falcon-sdk.js`, production only, no staging equivalent) kept for existing integrations. New integrations should use the CloudFront URL above, which has a staging counterpart and sits behind the CDN.

### Technical Requirements

- HTTPS-capable server for API calls
- Ability to securely store authentication tokens
- Support for making REST API requests with JSON payloads
