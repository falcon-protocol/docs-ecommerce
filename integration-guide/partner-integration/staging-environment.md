## Staging Environment

### Environment URLs

- **Staging**: `https://staging-pr-api.falconlabs.us`
- **Production**: `https://pr-api.falconlabs.us`

> Critical: All development and testing MUST happen on the staging environment to avoid polluting production metrics. Never test with production URLs during development.

### Service API Keys

- **Staging Service API Key**: Provided separately by Falcon integration team
- **Production Service API Key**: Provided after successful staging integration review

Contact the Falcon integration team to receive your staging credentials before beginning development.

### Technical Requirements

- HTTPS-capable server for API calls
- Ability to securely store authentication tokens
- Support for making REST API requests with JSON payloads
