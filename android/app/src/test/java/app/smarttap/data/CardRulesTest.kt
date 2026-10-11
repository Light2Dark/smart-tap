package app.smarttap.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class CardRulesTest {
    @Test
    fun newCardRequiresATitleAndHttpsLink() {
        assertNull(cardDraftError("GitHub", "https://github.com/Light2Dark"))
        assertEquals(
            "Give the card a title, up to 80 characters.",
            cardDraftError("  ", "https://example.com"),
        )
        assertEquals(
            "The destination has to be an https link.",
            cardDraftError("Notes", "http://example.com"),
        )
    }

    @Test
    fun saveStaysOffUntilTheDraftChanges() {
        val same = editDestinationDraft("https://github.com/Light2Dark", "https://github.com/Light2Dark")
        assertFalse(same.dirty)
        assertFalse(same.canSave)

        val spaced = editDestinationDraft("  https://github.com/Light2Dark  ", "https://github.com/Light2Dark")
        assertFalse(spaced.dirty)

        val changed = editDestinationDraft("https://example.com", "https://github.com/Light2Dark")
        assertTrue(changed.dirty)
        assertTrue(changed.canSave)

        val invalid = editDestinationDraft("http://example.com", "https://github.com/Light2Dark")
        assertTrue(invalid.dirty)
        assertFalse(invalid.canSave)
    }

    @Test
    fun aNewCardCanSaveOnlyAfterARealDraft() {
        val empty = newCardFormDraft("", "https://")
        assertFalse(empty.dirty)
        assertFalse(empty.canSave)

        val ready = newCardFormDraft("Calendar", "https://calendar.google.com")
        assertTrue(ready.dirty)
        assertTrue(ready.canSave)
    }

    @Test
    fun titleAndDestinationAreCheckedSeparately() {
        assertNull(titleError("  Notes  "))
        assertEquals(TITLE_ERROR, titleError("x".repeat(81)))
        assertNull(destinationError(" https://example.com "))
        assertEquals(DESTINATION_ERROR, destinationError("not a link"))
        assertEquals("https://example.com", httpsDestination("  https://example.com  "))
        assertNull(httpsDestination("ftp://example.com"))
    }
}
