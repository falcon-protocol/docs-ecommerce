# Flutter Integration

The Falcon Flutter SDK supports both iOS and Android applications.

## Download the latest SDK

To integrate the Falcon SDK into your Flutter project, add the package to your
project:

```bash
flutter pub add falcon_sdk
```

## Add the SDK Key

1. Contact your Falcon Labs account manager to get your SDK key.
2. Self serve [<span style="color: green; font-weight:bold; ">coming
   soon</span>]

## Import SDK

```dart
import 'package:falcon_sdk/falcon_sdk.dart';
```

## Initialize the Falcon SDK

Initialize the Falcon SDK with the initialization configuration object. Do this
at startup. This maximizes the time the SDK can take to cache Perks, which
results in a better user experience.

```dart
await FalconSDK.init('YOUR_SDK_KEY');
```

Once the SDK is loaded you are ready to call any of its method to surface Perk
offerings in your application.

## Create Placement

Placements are the containers that hold Perks. They are used to group Perks
together based on their business logic. For example, you may have a Placement
for "New Subscribers" and another for "Lapsed Subscribers". Each placement has a
unique ID that you will use to display Perks in your app.

```dart
final instance = FalconSDK.createPerksInstance("YOUR_PLACEMENT_ID");
```

After instantiating a Placement, you can then load perks into it to be presented
to your subscribers.

## Load Perks

Load the Perks into the Placement. This will fetch the Perks from the Falcon

```dart
final isReady = await instance.loadPerks();
```

## Showing Perks

Once the Perks are loaded, you can present the perk unit to your subscribers.

```dart
if (isReady) {
  instance.show(context);
}
```

## Handle lifecycle events

To handle the lifecycle events of the Perks unit, you can implement the
`PerksDelegate` protocol. The most important is the `onReadyChange` method,
which is called when the Perks are loaded and ready to be shown.

```dart
instance.setDelegate(PerksDelegate(
  onReadyChange: (bool isReady) {
    // Perks are ready to be shown
  },
  onClick: (int index) {
    // User has clicked to redeem one of the promotions and navigated outside the app to the perk providers page.
  },
  onOpen: () {
    // Perks unit has been opened
  },
  onClose: () {
    // Perks unit has been closed
  },
));
```
