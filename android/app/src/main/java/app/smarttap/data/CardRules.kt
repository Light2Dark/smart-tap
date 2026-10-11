package app.smarttap.data

const val TITLE_ERROR = "Give the card a title, up to 80 characters."
const val DESTINATION_ERROR = "The destination has to be an https link."

private val TITLE_LENGTH = 1..80

/** The prefilled destination on a new card. It does not count as an edit. */
const val NEW_DESTINATION = "https://"

fun titleError(title: String): String? = if (title.trim().length !in TITLE_LENGTH) TITLE_ERROR else null

fun destinationError(destination: String): String? =
    if (httpsDestination(destination) == null) DESTINATION_ERROR else null

fun cardDraftError(
    title: String,
    destination: String,
): String? = titleError(title) ?: destinationError(destination)

fun httpsDestination(value: String): String? {
    val trimmed = value.trim()
    return try {
        if (java.net.URL(trimmed).protocol == "https") trimmed else null
    } catch (_: Exception) {
        null
    }
}

data class CardFormDraft(
    val dirty: Boolean,
    val canSave: Boolean,
)

fun editDestinationDraft(
    current: String,
    saved: String,
): CardFormDraft {
    val dirty = current.trim() != saved.trim()
    return CardFormDraft(dirty = dirty, canSave = dirty && destinationError(current) == null)
}

fun newCardFormDraft(
    title: String,
    destination: String,
): CardFormDraft {
    val dirty = title.isNotEmpty() || destination.trim() != NEW_DESTINATION
    return CardFormDraft(dirty = dirty, canSave = dirty && cardDraftError(title, destination) == null)
}
