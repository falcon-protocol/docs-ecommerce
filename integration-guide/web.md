# Web Integration

## Manually load the script tag

To install by script, add the falcon-sdk.js ES Module as a script to the `<head>`
element of your HTML. This allows any newly created Falcon objects to be
globally accessible in your code.

Add the following line to your HTML file:

```html
<head>
  <title>Falcon Ecommerce</title>
  <script src="https://falconlabs.s3.us-east-2.amazonaws.com/sdk/falcon-sdk.js"></script>
</head>
```

## Add the SDK Key

1. Contact your Falcon Labs account manager to get your SDK key.
2. Self serve [<span style="color: green; font-weight:bold; ">coming
   soon</span>]

## Initialize the Falcon SDK

Initialize the Falcon SDK with the SDK key.

```javascript
FalconSDK.initSDK(key: "YOUR_SDK_KEY")
```

Once the SDK is loaded you are ready to call any of its method to surface Perk
offerings in your application.

## Create Placement

Placements are the containers that hold Perks. They are used to group Perks
together based on their business logic. For example, you may have a Placement
for "New Subscribers" and another for "Lapsed Subscribers". Each placement has a
unique ID that you will use to display Perks in your app.

```typescript
interface UserAttributes {
   orderid?: string;
   email?: string;
   firstname?: string;
   lastname?: string;
   confirmationref?: string;
   billingzipcode?: string;
   amount?: string;
   paymenttype?: string;
   ccbin?: string;
   mobile?: string;
   country?: string;
   language?: string;
   currency?: string;
   billingaddress1?: string;
   billingaddress2?: string;
   age?: string;
   gender?: string;
   cartItems?: string;
}
interface InstanceOptions {
  attributes?: InstanceOptions;
}

const perksInstance = FalconSDK.createPerksInstance(
  "YOUR_PLACEMENT_ID",
  {
    attributes: {},
  } as InstanceOptions,
);
```

### Options

Options are additional context data that you can provide per placement.

After instantiating a Placement, you can then load perks into it to be presented
to your subscribers.

## Load Perks

Load the Perks into the Placement. This will fetch the Perks from the Falcon

```typescript
perksInstance.loadPerks();
```

## Showing Perks

Once the Perks are loaded, you can present the perk unit to your subscribers.

```typescript
interface ShowOptions {
   title?: string;
   subtitle?: string;
};
perksInstance.show({} as ShowOptions);
```

## Handling Perk lifecycle events

To handle the lifecycle events of the Perks unit, you can implement the
available callbacks. The most important is the `addReadyCallback` method, which
is called when the Perks are loaded and ready to be shown.

```typescript
perksInstance.addReadyCallback((isReady) => {
  // Perks are ready to be shown
});
perksInstance.addClickCallback((data) => {
  // User has clicked to redeem one of the promotions and navigated outside the app to the perk providers page.
});
```

## Full Example

```html
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <title>Title</title>
  <script src="https://falconlabs.s3.us-east-2.amazonaws.com/sdk/falcon-sdk.js"></script>
  <script>
    (async function () {
      await FalconSDK.init('YOUR_SDK_KEY');

      window.perksInstance = FalconSDK.createPerksInstance('YOUR_PLACEMENT_ID', {
        attributes: {
          email: "test@test.com",
          firstname: "John",
          lastname: "Doe",
        }
      });

      console.log("perksInstance", window.perksInstance);

      window.perksInstance.addReadyCallback((isReady) => {
        console.log('ready callback:', isReady);
      });
      window.perksInstance.addClickCallback((data) => {
        console.log('link Clicked', data);
      });

      let answer = await window.perksInstance.loadPerks()
      console.log("answer", answer);
      console.log('is Ready:', window.perksInstance.isReady());
    })();
  </script>
</head>

<body>
  <h2>Test</h2>
  <button onclick="window.perksInstance.loadPerks()">Load Perks</button>
  <button onclick="window.perksInstance.show()">Show</button>
  <button onclick="window.perksInstance.hide()">Hide</button>
  <button onclick="window.perksInstance.destroy()">Destroy</button>
</body>

</html>
```
