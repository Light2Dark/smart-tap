package app.smarttap.ui

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.content.pm.PackageManager
import android.view.WindowManager
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.core.graphics.createBitmap
import androidx.core.graphics.set
import app.smarttap.BuildConfig
import app.smarttap.data.TapCard
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.qrcode.QRCodeWriter

@Composable
fun CardScreen(
    card: TapCard,
    onClose: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    DisposableEffect(card.id) {
        val window = context.findActivity()?.window
        window?.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        onDispose { window?.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON) }
    }
    val canTap =
        context.packageManager.hasSystemFeature(PackageManager.FEATURE_NFC_HOST_CARD_EMULATION)
    val pagerState = rememberPagerState(pageCount = { 2 })
    val tapUrl = "${BuildConfig.TAP_ORIGIN}/t/${card.publicId}"

    Box(
        modifier =
            modifier
                .fillMaxSize()
                .windowInsetsPadding(WindowInsets.safeDrawing),
    ) {
        HorizontalPager(
            state = pagerState,
            modifier = Modifier.fillMaxSize(),
        ) { page ->
            if (page == 0) {
                BoxWithConstraints(
                    modifier =
                        Modifier
                            .fillMaxSize()
                            .padding(start = 16.dp, top = 8.dp, end = 16.dp, bottom = 40.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    val cardWidth = minOf(maxWidth, maxHeight * CARD_RATIO)
                    CardFace(
                        title = card.title,
                        imageUrl = card.imageUrl,
                        modifier = Modifier.width(cardWidth).aspectRatio(CARD_RATIO),
                        titleStyle = MaterialTheme.typography.headlineLarge,
                    )
                }
            } else {
                CardBack(
                    tapUrl = tapUrl,
                    title = card.title,
                    destinationUrl = card.destinationUrl,
                    backImageUrl = card.backImageUrl,
                )
            }
        }
        IconButton(
            onClick = onClose,
            modifier = Modifier.align(Alignment.TopEnd),
        ) {
            Icon(Icons.Filled.Close, contentDescription = "Close")
        }
        Column(
            modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 4.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Row(horizontalArrangement = Arrangement.Center) {
                repeat(2) { index ->
                    Box(
                        modifier =
                            Modifier
                                .padding(horizontal = 4.dp)
                                .size(8.dp)
                                .background(
                                    color =
                                        if (pagerState.currentPage == index) {
                                            MaterialTheme.colorScheme.onSurface
                                        } else {
                                            MaterialTheme.colorScheme.onSurface.copy(alpha = 0.28f)
                                        },
                                    shape = CircleShape,
                                ),
                    )
                }
            }
            Text(
                text =
                    when {
                        pagerState.currentPage == 1 -> "Swipe back to the card."
                        canTap -> "This card is sharing. Close it to stop. Swipe for a QR code."
                        else -> "This phone can't share by tap. Swipe for a QR code."
                    },
                modifier = Modifier.padding(top = 4.dp, start = 24.dp, end = 24.dp),
                textAlign = TextAlign.Center,
                style = MaterialTheme.typography.bodySmall,
            )
        }
    }
}

@Composable
private fun CardBack(
    tapUrl: String,
    title: String,
    destinationUrl: String,
    backImageUrl: String?,
) {
    val backImage = rememberCardBitmap(backImageUrl)
    val qr = remember(tapUrl) { qrBitmap(tapUrl) }
    BoxWithConstraints(
        modifier =
            Modifier
                .fillMaxSize()
                .padding(start = 16.dp, top = 8.dp, end = 16.dp, bottom = 40.dp),
        contentAlignment = Alignment.Center,
    ) {
        val cardWidth = minOf(maxWidth, maxHeight * CARD_RATIO)
        val cardHeight = cardWidth / CARD_RATIO
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                modifier =
                    Modifier
                        .width(cardWidth)
                        .height(cardHeight)
                        .clip(RoundedCornerShape(18.dp)),
            ) {
                if (backImage != null) {
                    Image(
                        bitmap = backImage,
                        contentDescription = "Back of $title",
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop,
                    )
                } else {
                    Box(modifier = Modifier.fillMaxSize().background(Color(0xFF111111)))
                    Image(
                        bitmap = qr,
                        contentDescription = "QR code for $destinationUrl",
                        modifier =
                            Modifier
                                .offset(
                                    x = cardWidth * BACK_QR_X,
                                    y = cardHeight * BACK_QR_Y,
                                ).size(cardHeight * BACK_QR_HEIGHT),
                    )
                    Text(
                        title,
                        modifier =
                            Modifier
                                .align(Alignment.TopCenter)
                                .padding(top = cardHeight * BACK_CAPTION_Y)
                                .padding(horizontal = 28.dp),
                        color = Color(0xFFF4F1EA),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        textAlign = TextAlign.Center,
                        style = MaterialTheme.typography.titleMedium,
                    )
                }
            }
            Text(
                "Scan this if a tap isn't available.",
                modifier = Modifier.padding(top = 16.dp),
                textAlign = TextAlign.Center,
                style = MaterialTheme.typography.bodyMedium,
            )
        }
    }
}

private const val QR_PIXELS = 512
private const val QR_QUIET_ZONE = 4

private fun qrBitmap(contents: String) =
    QRCodeWriter()
        .encode(
            contents,
            BarcodeFormat.QR_CODE,
            QR_PIXELS,
            QR_PIXELS,
            mapOf(EncodeHintType.MARGIN to QR_QUIET_ZONE),
        ).let { matrix ->
            createBitmap(matrix.width, matrix.height).also { bitmap ->
                for (x in 0 until matrix.width) {
                    for (y in 0 until matrix.height) {
                        bitmap[x, y] =
                            if (matrix.get(x, y)) android.graphics.Color.BLACK else android.graphics.Color.WHITE
                    }
                }
            }
        }.asImageBitmap()

private tailrec fun Context.findActivity(): Activity? =
    when (this) {
        is Activity -> this
        is ContextWrapper -> baseContext.findActivity()
        else -> null
    }
