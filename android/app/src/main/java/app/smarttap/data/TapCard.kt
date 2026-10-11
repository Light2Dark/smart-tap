package app.smarttap.data

data class TapCard(
    val id: Long,
    val title: String,
    val destinationUrl: String,
    val publicId: String,
    val imageUrl: String? = null,
    val backImageUrl: String? = null,
)
