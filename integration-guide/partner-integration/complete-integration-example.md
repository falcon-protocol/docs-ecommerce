## Complete Integration Example

Here’s a complete workflow for integrating a store:

```bash
#!/bin/bash

BASE_URL="https://pr-api.falconlabs.us"
PLATFORM_TOKEN="plat_1234567890abcdef1234567890abcdef"

# Step 1: Create Publisher
echo "Step 1: Creating publisher..."
PUBLISHER_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/publishers" \
  -H "Authorization: Bearer${PLATFORM_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Fashion Store",
    "contactName": "John Doe",
    "contactEmail": "john@myfashionstore.com",
    "contactPhone": "+1-555-0123"
  }')

# Extract keys
PUBLIC_KEY=$(echo $PUBLISHER_RESPONSE | jq -r '.data.publicKeys[0]')
PRIVATE_KEY=$(echo $PUBLISHER_RESPONSE | jq -r '.data.privateKeys[0].bearer')

echo "Public Key:$PUBLIC_KEY"
echo "Private Key:$PRIVATE_KEY"

# Step 2: Create Site
echo ""
echo "Step 2: Creating site..."
SITE_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/site" \
  -H "Authorization: Bearer${PRIVATE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Fashion Store",
    "domain": "myfashionstore.com",
    "status": "active"
  }')

SITE_ID=$(echo $SITE_RESPONSE | jq -r '.data.id')
echo "Site ID:$SITE_ID"

# Step 3: Create Placement
echo ""
echo "Step 3: Creating placement..."
PLACEMENT_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/placements" \
  -H "Authorization: Bearer${PRIVATE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Thank You Page Ad",
    "siteId": "'${SITE_ID}'",
    "pageType": "THANK_YOU_PAGE",
    "isLiveMode": false
  }')

PLACEMENT_ID=$(echo $PLACEMENT_RESPONSE | jq -r '.data.id')
echo "Placement ID:$PLACEMENT_ID"

# Step 4: Test fetching offers
echo ""
echo "Step 4: Testing offer retrieval..."
curl -s -X GET "${BASE_URL}/api/odata?placementId=${PLACEMENT_ID}&sessionId=test_session_123&count=4" \
  -H "Authorization: Bearer${PUBLIC_KEY}" | jq '.'

echo ""
echo "Integration complete!"
echo "Public Key:$PUBLIC_KEY"
echo "Private Key:$PRIVATE_KEY"
echo "Placement ID:$PLACEMENT_ID"
```
