# Android Integration

Display Falcon Perks in your Android app using `WebView`. No native SDK download required.

## Requirements

- Android API 24+ (Android 7.0)
- A Falcon API key and placement ID

## Quick Start

### 1. Add permissions

In your `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

For local development over HTTP, also add `usesCleartextTraffic`:

```xml
<application
    android:usesCleartextTraffic="true"
    ... >
```

### 2. Create the WebView layout

```xml
<!-- res/layout/activity_perks.xml -->
<WebView
    android:id="@+id/falconWebView"
    android:layout_width="match_parent"
    android:layout_height="match_parent" />
```

### 3. Set up the WebView with the JavaScript bridge

```kotlin
import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import org.json.JSONObject
import java.util.UUID

class PerksActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_perks)

        // Enable Chrome DevTools debugging
        WebView.setWebContentsDebuggingEnabled(true)

        webView = findViewById(R.id.falconWebView)
        webView.apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            webViewClient = WebViewClient()

            // Register the JavaScript bridge
            addJavascriptInterface(FalconBridge(), "Android")
        }
    }

    fun loadPerks(apiKey: String, placementId: String) {
        val sessionId = UUID.randomUUID().toString()
        val url = "https://promo.falconlabs.us/ui/webview" +
            "?placement=$placementId" +
            "&apiKey=$apiKey" +
            "&sessionId=$sessionId"

        webView.loadUrl(url)
    }

    inner class FalconBridge {
        @JavascriptInterface
        fun postMessage(message: String) {
            try {
                val json = JSONObject(message)
                val type = json.optString("type")
                val name = json.optString("name")

                if (type == "event" && name == "click") {
                    val data = json.optJSONObject("data")
                    val clickUrl = data?.optString("clickUrl") ?: ""
                    if (clickUrl.isNotEmpty()) {
                        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(clickUrl)))
                    }
                }

                if (type == "event" && name == "close") {
                    runOnUiThread { finish() }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
```

## Complete Example

Here is a complete activity with the bridge and URL configuration:

```kotlin
import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import org.json.JSONObject
import java.util.UUID

class FalconPerksActivity : AppCompatActivity() {

    companion object {
        private const val EXTRA_API_KEY = "api_key"
        private const val EXTRA_PLACEMENT_ID = "placement_id"

        fun newIntent(context: Context, apiKey: String, placementId: String): Intent {
            return Intent(context, FalconPerksActivity::class.java).apply {
                putExtra(EXTRA_API_KEY, apiKey)
                putExtra(EXTRA_PLACEMENT_ID, placementId)
            }
        }
    }

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        WebView.setWebContentsDebuggingEnabled(true)

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            webViewClient = WebViewClient()
            addJavascriptInterface(FalconBridge(), "Android")
        }
        setContentView(webView)

        val apiKey = intent.getStringExtra(EXTRA_API_KEY) ?: return
        val placementId = intent.getStringExtra(EXTRA_PLACEMENT_ID) ?: return
        val sessionId = UUID.randomUUID().toString()

        val url = "https://promo.falconlabs.us/ui/webview" +
            "?placement=$placementId" +
            "&apiKey=$apiKey" +
            "&sessionId=$sessionId"

        webView.loadUrl(url)
    }

    inner class FalconBridge {
        @JavascriptInterface
        fun postMessage(message: String) {
            try {
                val json = JSONObject(message)
                val type = json.optString("type")
                val name = json.optString("name")
                val data = json.optJSONObject("data")

                when {
                    type == "event" && name == "click" -> {
                        val clickUrl = data?.optString("clickUrl") ?: ""
                        if (clickUrl.isNotEmpty()) {
                            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(clickUrl)))
                        }
                    }
                    type == "event" && name == "close" -> {
                        runOnUiThread { finish() }
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }
}
```

**Usage from your app:**

```kotlin
// Launch the perks screen
val intent = FalconPerksActivity.newIntent(
    context = this,
    apiKey = "YOUR_API_KEY",
    placementId = "YOUR_PLACEMENT_ID"
)
startActivity(intent)
```

## Jetpack Compose

If you're using Compose, wrap the WebView in an `AndroidView`:

```kotlin
@SuppressLint("SetJavaScriptEnabled")
@Composable
fun FalconPerksWebView(apiKey: String, placementId: String) {
    val context = LocalContext.current
    val sessionId = remember { UUID.randomUUID().toString() }
    val url = "https://promo.falconlabs.us/ui/webview" +
        "?placement=$placementId&apiKey=$apiKey&sessionId=$sessionId"

    AndroidView(
        factory = { ctx ->
            WebView(ctx).apply {
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                webViewClient = WebViewClient()

                addJavascriptInterface(object {
                    @JavascriptInterface
                    fun postMessage(message: String) {
                        try {
                            val json = JSONObject(message)
                            val type = json.optString("type")
                            val name = json.optString("name")

                            if (type == "event" && name == "click") {
                                val data = json.optJSONObject("data")
                                val clickUrl = data?.optString("clickUrl") ?: ""
                                if (clickUrl.isNotEmpty()) {
                                    ctx.startActivity(
                                        Intent(Intent.ACTION_VIEW, Uri.parse(clickUrl))
                                    )
                                }
                            }
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                    }
                }, "Android")

                WebView.setWebContentsDebuggingEnabled(true)
                loadUrl(url)
            }
        },
        modifier = Modifier.fillMaxSize()
    )
}
```

## Debugging

1. Enable Chrome DevTools: the code above calls `WebView.setWebContentsDebuggingEnabled(true)`
2. Connect your device/emulator via USB
3. Open `chrome://inspect` in Chrome on your computer
4. Your WebView will appear under "Remote Target" - click "inspect" to open DevTools

## ProGuard

If you use ProGuard/R8, keep the JavaScript interface:

```proguard
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
```
