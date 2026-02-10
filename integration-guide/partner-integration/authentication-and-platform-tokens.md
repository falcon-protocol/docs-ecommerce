## Authentication & Platform Tokens

### Platform Token Overview

Platform tokens are used **ONLY** to create publisher accounts on behalf of merchants. They are not used to fetch promotional offers.

**Authentication Flow:**

1. **Use Platform Token** → Create a new publisher account
2. **Receive Two Keys** from publisher creation:
   - **Public Key** - Used ONLY for fetching promotional offers (OData API)
   - **Private Key** - Used for ALL management operations (creating sites, placements, accessing reports)

> Critical: Platform tokens create publishers. Public keys fetch offers. Private keys manage everything else. Do not confuse these three distinct authentication tokens.

### Using Authentication Tokens

**Platform Token** (Publisher creation only):

```
Authorization: Bearer plat_1234567890abcdef1234567890abcdef
```

**Public Key** (Fetching offers only):

```
Authorization: Bearer pub_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

**Private Key** (Sites, placements, reporting):

```
Authorization: Bearer priv_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```
