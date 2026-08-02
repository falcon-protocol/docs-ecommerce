Pass user and order data via `attributes` for revenue attribution, offer targeting, and personalization. All values are strings.

| Attribute | Priority | Description | Format |
| --- | --- | --- | --- |
| `orderId` | Required | Unique order/transaction identifier. Links the offer impression back to a specific purchase for revenue attribution | String, no special characters (`#`, `@`, `.`, spaces) |
| `hashedEmail` | Required\* | Customer email, hashed on your end before it's passed in | SHA-256 hex, lowercase, 64 characters |
| `email` | Required\* | Customer email, plain text. The SDK hashes it in the browser (same SHA-256 algorithm) before anything is sent — nothing leaves the page in the clear | Valid email string |
| `category` | Optional | Order or product category | String |
| `subcategory` | Optional | Order or product subcategory | String |
| `amount` | Recommended | Order total | Numeric string (e.g. `"99.99"`) |
| `currency` | Optional | Currency code | ISO 4217 (e.g. `"USD"`, `"EUR"`) |
| `country` | Optional | Customer country | ISO 3166-1 alpha-2 (e.g. `"US"`, `"GB"`) |
| `language` | Optional | Customer language | ISO 639-1 (e.g. `"en"`, `"fr"`) |
| `firstname` | Recommended | Customer first name | String |
| `lastname` | Recommended | Customer last name | String |
| `hashedPhone` | Optional | Customer phone, hashed on your end before it's passed in | SHA-256 hex, lowercase, 64 characters |
| `mobile` | Optional | Customer phone, plain text. Hashed in the browser the same way as `email` | String |
| `age` | Optional | Customer age | Numeric string |
| `gender` | Optional | Customer gender | String |
| `billingzipcode` | Optional | Billing ZIP or postal code | String |
| `billingaddress1` | Optional | Billing address line 1 | String |
| `billingaddress2` | Optional | Billing address line 2 | String |
| `cartItems` | Optional | Cart contents | JSON string |
| `paymenttype` | Optional | Payment method (e.g. `"credit_card"`, `"paypal"`) | String |
| `ccbin` | Optional | First 6 digits of the credit card number (BIN) | String |
| `confirmationref` | Optional | Merchant/seller name, or your own internal confirmation reference if separate from `orderId`. Displayed in the offer headline on some templates | String |

\* Pass either `hashedEmail` or `email`, not both. If both are present, `hashedEmail` takes priority. Without one of them (or `orderId`), the SDK still loads and displays offers, but there's nothing to match the impression back to the order, so attribution won't work — this isn't enforced as a hard error, so it's easy to miss during testing.

**Hashed fields:** `hashedEmail` and `hashedPhone` use `trim → lowercase → SHA-256`. Uppercase hex or un-trimmed input will not validate and gets silently dropped rather than erroring, so double check the format before sending.

**Not attributes:** IP address and User-Agent are read automatically from the browser request. State and city are resolved server-side from the visitor's IP, there's no attribute for either. `country` above is only needed if you want to override what's detected (for example, billing country differs from shipping country).
