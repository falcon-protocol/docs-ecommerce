# iOS Integration

## Download the latest SDK

You have three options for integrating the SDK into your project

- [CocoaPods](#cocoapods)
- [Manual integration](/integration-guide/ios/manual)
- [Swift Package Manager (Coming soon)](#)

The SDK requires the minimum iOS deployment target to be `iOS 13.0` or above. It
also requires Xcode version `15` or above.

To receive release updates, subscribe to the Falcon Labs iOS SDK GitHub
repository.

## CocoaPods

**Coming Soon**

<!-- To integrate the Falcon Labs SDK through CocoaPods:

Add the following line to your Podfile:

```ruby
pod 'FalconSDK'
```

Run the following on the command line:

```bash
pod install --repo-update
``` -->

## Add the SDK Key

1. Contact your Falcon Labs account manager to get your SDK key.
2. Self serve [<span style="color: green; font-weight:bold; ">coming
   soon</span>]

## Import SDK
```swift
import FalconSDK
```

## Initialize the Falcon SDK

Initialize the Falcon SDK with the initialization configuration object. Do this
at startup. This maximizes the time the SDK can take to cache Perks, which
results in a better user experience.

```swift
FLSdk.initSDK(key: "YOUR_SDK_KEY") { result in
    switch result {
    case .success:
        // Start using the SDK
    case let .failure(error):
        // Handle error
    }
}
```

Once the SDK is loaded you are ready to call any of its method to surface Perk
offerings in your application.

## Create Placement

Placements are the containers that hold Perks. They are used to group Perks
together based on their business logic. For example, you may have a Placement
for "New Subscribers" and another for "Lapsed Subscribers". Each placement has a
unique ID that you will use to display Perks in your app.

```swift
let instance = try FLSdk.createPerksInstance(placement: "YOUR_PLACEMENT_ID")
```

After instantiating a Placement, you can then load perks into it to be presented
to your subscribers.

## Load Perks
Load the Perks into the Placement. This will fetch the Perks from the Falcon

```swift
instance.loadPerks { result in
  switch result {
  case .success:
      // Perks are ready to be shown
  case let .failure(error):
      // Handle error. Reload to try again.
  }
}
```

## Showing Perks
Once the Perks are loaded, you can present the perk unit to your subscribers.
```swift
instance.show { result in
  switch result {
  case .success:
      // Perks are shown
  case let .failure(error):
      // Handle error.
  }
}
```

## Handling Perk lifecycle events
To handle the lifecycle events of the Perks unit, you can implement the 
`PerksDelegate` protocol. The most important is the `didReadyChange` method,
which is called when the Perks are loaded and ready to be shown.

```swift
class DelegateListener: FLPerksDelegate {
    
    func didClick(index: Int) {
        // User has clicked to redeem one of the promotions and navigated outside the app to the perk providers page.
    }
    
    func didReadyChange(isReady: Bool) {
        // The Perks are loaded and ready to be shown
    }
    
    func didOpen() {
        // The Perks unit has been opened
    }
    
    func didClose() {
        // The Perks unit has been closed
    }
}

// Register the delegate to the placement instance
instance.setDelegate(DelegateListener())
```