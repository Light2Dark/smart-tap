package app.smarttap

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import androidx.core.content.ContextCompat
import app.smarttap.data.isLocalNetworkHost
import com.clerk.api.Clerk
import com.clerk.api.network.model.error.firstMessage
import com.clerk.api.network.serialization.ClerkResult
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import java.net.URL

sealed interface Session {
    data object Starting : Session

    data object SignedOut : Session

    data class SignedIn(
        val userId: String,
    ) : Session
}

fun clerkSession(): Flow<Session> =
    combine(Clerk.isInitialized, Clerk.userFlow) { isInitialized, user ->
        when {
            !isInitialized -> Session.Starting
            user == null -> Session.SignedOut
            else -> Session.SignedIn(user.id)
        }
    }

suspend fun clerkToken(): String? =
    when (val result = Clerk.auth.getToken()) {
        is ClerkResult.Success -> {
            result.value
        }

        is ClerkResult.Failure -> {
            Log.e(
                "SmartTap",
                "getToken failed code=${result.code} type=${result.errorType} " +
                    "error=${result.error?.firstMessage()} throwable=${result.throwable}",
            )
            null
        }
    }

/** Android 17, the first release that asks before an app reaches a LAN address. */
private const val LOCAL_NETWORK_PERMISSION_SDK = 37

private val apiHostIsLocalNetwork =
    runCatching { isLocalNetworkHost(URL(BuildConfig.API_BASE_URL).host) }.getOrDefault(false)

/** The permission that lets the app reach the API host, on releases that have it. */
val localNetworkPermission: String? =
    if (Build.VERSION.SDK_INT >= LOCAL_NETWORK_PERMISSION_SDK) Manifest.permission.ACCESS_LOCAL_NETWORK else null

fun localNetworkBlocked(context: Context): Boolean {
    val permission = localNetworkPermission ?: return false
    return apiHostIsLocalNetwork &&
        ContextCompat.checkSelfPermission(context, permission) != PackageManager.PERMISSION_GRANTED
}
