# Soft bundles 

Soft bundles are a light coupling intergration whereby bundle participants can
gain from the distribution and converion benefits without needing to create
dependencies on payments and entitlement management.

::: tip What you will learn on this page
- What a soft bundle is 
- How they work on the Falcon protocol
:::


## What is a soft bundle
A soft bundle is where a customer is offered a bundle deal of two or more
applications but payment for these applications is handled by each bundle
participant independently. Typically the merchant apps in the bundle (those
being sold by the reseller) will offer the user a discount or deal on a
subscription in their own app which is exclusive to the bundle reseller.

### Lifecycle sequence
- Merchant apps in the bundle define special deal pricing only available to the
  resller
- The reseller merchandises this special pricing as part of a subscription
  bundle in their app. The customer will only receive this special pricing after
  subscribing to the resllers apps.
- Upon subscription the customer is granted deal access to the merchant app and
  is directed to authenticate with the merchant app and receive their discounted
  plan.

  
### Entitlement Management
In a soft bundle the consumer purchases their subscription directly from each
merchant present in the bundle. The deal pricing is granted typically by way of
coupons. As such there is no need to integrate with the Entitlement API for
managing user access state. There is still the requirement however of sending
the Falcon Protocol a callback upon user activation and subscription to register
the activation of the user as a customer. 

# Lack of Contingent Benefit
Contingent benefits are one of the primary inducements to keep a user
subscribed. This is the retentive power of super bundles. In soft bundles
however there is no contingent inducement/benefit. 
