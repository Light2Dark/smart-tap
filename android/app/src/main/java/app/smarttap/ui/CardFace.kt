package app.smarttap.ui

import android.graphics.BitmapFactory
import android.util.LruCache
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.URL

private val cardColors =
    listOf(
        Color(0xFF1B3A4B),
        Color(0xFF3D2B1F),
        Color(0xFF1F3D2B),
        Color(0xFF2C2C54),
        Color(0xFF4A2C2A),
        Color(0xFF14342B),
    )

private val cardShape = RoundedCornerShape(18.dp)

@Composable
fun CardFace(
    title: String,
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    titleStyle: TextStyle? = null,
    imageUrl: String? = null,
    imageAlignment: Alignment = Alignment.Center,
) {
    val bitmap = rememberCardBitmap(imageUrl)
    val frame =
        modifier
            .shadow(4.dp, cardShape)
            .clip(cardShape)
            .then(
                if (onClick == null) {
                    Modifier
                } else {
                    Modifier.clickable(role = Role.Button, onClick = onClick)
                },
            )
    if (bitmap != null) {
        Image(
            bitmap = bitmap,
            contentDescription = title,
            modifier = frame,
            contentScale = ContentScale.Crop,
            alignment = imageAlignment,
        )
    } else {
        Column(
            modifier =
                frame
                    .background(cardColors[title.lowercase().hashCode().mod(cardColors.size)])
                    .padding(horizontal = 20.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.SpaceBetween,
        ) {
            Text(
                "NFC card",
                color = Color.White.copy(alpha = 0.72f),
                style = MaterialTheme.typography.labelLarge,
            )
            Text(
                title,
                color = Color.White,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                style = titleStyle ?: MaterialTheme.typography.headlineSmall,
            )
        }
    }
}

/**
 * Signed links change on every refresh, so entries are keyed by the storage path and
 * remember which link they came from. A newer link still shows the old art until it loads.
 */
internal object CardBitmapCache {
    private class Entry(
        val url: String,
        val bitmap: ImageBitmap,
    )

    private val entries = LruCache<String, Entry>(24)

    internal fun pathOf(url: String) = url.substringBefore('?')

    fun peek(url: String): ImageBitmap? = entries.get(pathOf(url))?.bitmap

    fun isFresh(url: String) = entries.get(pathOf(url))?.url == url

    fun put(
        url: String,
        bitmap: ImageBitmap,
    ) {
        entries.put(pathOf(url), Entry(url, bitmap))
    }
}

@Composable
internal fun rememberCardBitmap(imageUrl: String?): ImageBitmap? {
    var bitmap by remember(imageUrl) {
        mutableStateOf(imageUrl?.takeIf { it.isNotBlank() }?.let(CardBitmapCache::peek))
    }
    LaunchedEffect(imageUrl) {
        if (imageUrl.isNullOrBlank()) {
            bitmap = null
            return@LaunchedEffect
        }
        if (CardBitmapCache.isFresh(imageUrl)) {
            return@LaunchedEffect
        }
        val loaded =
            withContext(Dispatchers.IO) {
                runCatching {
                    URL(imageUrl).openStream().use { stream ->
                        BitmapFactory.decodeStream(stream)?.asImageBitmap()
                    }
                }.getOrNull()
            }
        if (loaded != null) {
            CardBitmapCache.put(imageUrl, loaded)
            bitmap = loaded
        }
    }
    return bitmap
}
