package app.smarttap

import android.app.Application
import com.clerk.api.Clerk

class SmartTapApp : Application() {
    override fun onCreate() {
        super.onCreate()
        Clerk.initialize(
            this,
            publishableKey = BuildConfig.CLERK_PUBLISHABLE_KEY,
        )
    }
}
