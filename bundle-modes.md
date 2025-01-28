# Bundle Modes

| Property        |              Soft                        |       Super                     |
| ------------- | :----------------------------------------- | :------------------------------ |
| definition      | Consumer pays each merchant separately | Consumer pays one merchant in the bundle|
| discounting      | Non-contingent. Each merchant grants their own discount| Contingent. All discounts tied together|
| technical requirements    |  remittance API, Bundle data API| Entitlement API, remittance API, Bundle data API|
| consumer flow    |  Consumer receives acitvation links for each app in the bundle and subscribes separtely| Consumer subscribes once through bundle publisher and gains access to all merchants|
| entitlement integration     |  Subscription activation notices| Full consumer lifecyle notices|
| escrow flow     |  Commissions paid to bundle publsher | Commissions paid to bundle publisher and revenues paid to merchants|

## Super bundles 

Super bundles are a tighly coupled packaging of subscription apps, that bring
additional value propositions for app businesses beyond soft bundles.


### What is a super bundle
A super bundle is where a customer is offered a bundle of subscription apps for
a single price and payment. The customer makes one payment for the entire bundle
through the reseller app and is provided access to all apps in the bundle. The
subscription offer here is _**contingent**_ meaning; should the user unsubscribe
from the bundle they will lose priviledged access to all apps in the bundle and
must subscribe to each app individually to maintain access.

### Lifecycle sequence
- Merchant apps in the bundle define special deal pricing only available to the
  resller
- The reseller merchandises this special pricing as part of a subscription
  bundle in their app. The customer will make one subscription payment to the
  reseller application. 
- When the customer subscribes to the bundle, the reseller will report this
  subscription event to the Falcon protocol. 
- The Falcon protocol will instruct each merchant app in the
  bundle to provision access via an entitlement to the customer. The merchant
  app will continue to validate entitlements with the Falcon protocol to
  maintain the correct state.

### Contingent Benefits
In a contingent offer the discount incentives a consumer receives are contingent
on them maintaining their subscription to the bundle. This is a powerful
inducement to keep a user subscribed and a key reason super bundling drives long
term retention. 

### Contingent coupons
It is possible to create a contingent incentive without the need for a super
bundle integration. 

In the contingent coupon scenario, the consumer is offered a discount on all
apps in the bundle if they subscribe to all apps in the bundle. This is
administered via special coupon codes. All merchants in the bundle must still
integrate with the Falcon Protocol to manage the contingent benefits via the
coupons. But for payments each merchant will handle their own payment processing
directly with the consumer.

### Entitlement Management
In a super bundle both the bundle publisher and merchant must integrate with the
Falcon Protocol Entitlement API. This is to ensure that the consumer lifecycle
is maintained with state across all members of the bundle.


## Soft bundles 
Soft bundles are a light coupling intergration whereby bundle participants can
gain from the distribution and converion benefits without needing to create
dependencies on payments and entitlement management.


### What is a soft bundle
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

### Lack of Contingent Benefit
Contingent benefits are one of the primary inducements to keep a user
subscribed. This is the retentive power of super bundles. In soft bundles
however there is no contingent inducement/benefit. 
