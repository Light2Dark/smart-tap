package app.smarttap.ui

// The printed plate in pixels. Keep in step with lib/card-design.ts on the web.
private const val PLATE_WIDTH = 2024f
private const val PLATE_HEIGHT = 1276f
private const val BACK_QR_SIDE = 960f
private const val BACK_QR_TOP = 72f
private const val BACK_CAPTION_GAP = 36f

internal const val CARD_RATIO = PLATE_WIDTH / PLATE_HEIGHT

/** QR position and size on the back, as fractions of the card's width or height. */
internal const val BACK_QR_X = (PLATE_WIDTH - BACK_QR_SIDE) / 2f / PLATE_WIDTH
internal const val BACK_QR_Y = BACK_QR_TOP / PLATE_HEIGHT
internal const val BACK_QR_HEIGHT = BACK_QR_SIDE / PLATE_HEIGHT
internal const val BACK_CAPTION_Y = (BACK_QR_TOP + BACK_QR_SIDE + BACK_CAPTION_GAP) / PLATE_HEIGHT
