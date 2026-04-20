> **Prerequisite: Private Key.** This API requires the publisher's **Private Key**. Retrieve it from your Falcon account representative, or — if you're a partner creating publishers programmatically — from the API response returned at publisher creation.
>
> Pass it as a bearer token on every request:
>
> ```text
> Authorization: Bearer priv_1234567890abcdef...
> ```
>
> The Private Key authorizes all reporting and management operations. **Never expose it in client-side code.**
